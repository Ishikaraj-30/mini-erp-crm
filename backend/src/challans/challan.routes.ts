import { Router } from "express";
import { prisma } from "../config/prisma.js";
import {
  ChallanStatus,
  MovementType,
  Role,
} from "../generated/prisma/enums.js";
import {
  authenticate,
  authorize,
  type AuthRequest,
} from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate);

/*
  CREATE CHALLAN DRAFT

  POST /api/challans

  This only creates the challan.
  Stock is NOT reduced here.
*/
router.post(
  "/",
  authorize(Role.ADMIN, Role.SALES),
  async (req: AuthRequest, res) => {
    try {
      const { customerId, items } = req.body;

      if (!customerId || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: "Customer and at least one product are required",
        });
        return;
      }

      const customer = await prisma.customer.findUnique({
        where: {
          id: Number(customerId),
        },
      });

      if (!customer) {
        res.status(404).json({
          success: false,
          message: "Customer not found",
        });
        return;
      }

      /*
        Get all products from the database.
        We do this instead of trusting product names/prices
        sent by the frontend.
      */
      const productIds = items.map((item) => Number(item.productId));

      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
      });

      if (products.length !== productIds.length) {
        res.status(400).json({
          success: false,
          message: "One or more products were not found",
        });
        return;
      }

      const challanNumber = `CH-${Date.now()}`;

      let totalQuantity = 0;

      const challanItems = items.map((item) => {
        const product = products.find(
          (p) => p.id === Number(item.productId)
        );

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        const quantity = Number(item.quantity);

        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new Error("INVALID_QUANTITY");
        }

        totalQuantity += quantity;

        return {
          productId: product.id,
          productNameSnapshot: product.name,
          skuSnapshot: product.sku,
          unitPriceSnapshot: product.unitPrice,
          quantity,
        };
      });

      const challan = await prisma.challan.create({
        data: {
          challanNumber,
          customerId: Number(customerId),
          totalQuantity,
          status: ChallanStatus.DRAFT,
          createdById: req.user!.id,
          items: {
            create: challanItems,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Challan draft created successfully",
        data: challan,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "PRODUCT_NOT_FOUND") {
          res.status(400).json({
            success: false,
            message: "One or more products were not found",
          });
          return;
        }

        if (error.message === "INVALID_QUANTITY") {
          res.status(400).json({
            success: false,
            message: "Quantity must be a positive integer",
          });
          return;
        }
      }

      console.error("Create challan error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to create challan",
      });
    }
  }
);

/*
  GET ALL CHALLANS

  GET /api/challans
*/
router.get(
  "/",
  authorize(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS),
  async (_req: AuthRequest, res) => {
    try {
      const challans = await prisma.challan.findMany({
        include: {
          customer: true,
          items: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({
        success: true,
        data: challans,
      });
    } catch (error) {
      console.error("Get challans error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch challans",
      });
    }
  }
);

/*
  GET SINGLE CHALLAN

  GET /api/challans/:id
*/
router.get(
  "/:id",
  authorize(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid challan ID",
        });
        return;
      }

      const challan = await prisma.challan.findUnique({
        where: {
          id,
        },
        include: {
          customer: true,
          items: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      if (!challan) {
        res.status(404).json({
          success: false,
          message: "Challan not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: challan,
      });
    } catch (error) {
      console.error("Get challan error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch challan",
      });
    }
  }
);

/*
  CONFIRM CHALLAN

  POST /api/challans/:id/confirm

  IMPORTANT:
  Everything happens inside ONE database transaction.

  1. Check challan
  2. Check stock for every item
  3. Reduce stock
  4. Create OUT movement
  5. Mark challan CONFIRMED

  If anything fails, the transaction rolls back.
*/
router.post(
  "/:id/confirm",
  authorize(Role.ADMIN, Role.SALES),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid challan ID",
        });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        const challan = await tx.challan.findUnique({
          where: {
            id,
          },
          include: {
            items: true,
          },
        });

        if (!challan) {
          throw new Error("CHALLAN_NOT_FOUND");
        }

        if (challan.status !== ChallanStatus.DRAFT) {
          throw new Error("CHALLAN_NOT_DRAFT");
        }

        /*
          FIRST PASS:
          Check ALL products before changing anything.
        */
        const products = [];

        for (const item of challan.items) {
          const product = await tx.product.findUnique({
            where: {
              id: item.productId,
            },
          });

          if (!product) {
            throw new Error(
              `PRODUCT_NOT_FOUND:${item.productId}`
            );
          }

          if (product.currentStock < item.quantity) {
            throw new Error(
              `INSUFFICIENT_STOCK:${product.name}:${product.currentStock}:${item.quantity}`
            );
          }

          products.push({
            product,
            quantity: item.quantity,
          });
        }

        /*
          SECOND PASS:
          Now that ALL stock has been verified,
          reduce stock and create movement logs.
        */
        for (const item of products) {
          const newStock =
            item.product.currentStock - item.quantity;

          await tx.product.update({
            where: {
              id: item.product.id,
            },
            data: {
              currentStock: newStock,
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.product.id,
              quantity: item.quantity,
              movementType: MovementType.OUT,
              reason: `Sales challan ${challan.challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }

        /*
          Finally mark the challan as confirmed.
        */
        const confirmedChallan = await tx.challan.update({
          where: {
            id,
          },
          data: {
            status: ChallanStatus.CONFIRMED,
          },
          include: {
            customer: true,
            items: true,
          },
        });

        return confirmedChallan;
      });

      res.status(200).json({
        success: true,
        message: "Challan confirmed successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "CHALLAN_NOT_FOUND") {
          res.status(404).json({
            success: false,
            message: "Challan not found",
          });
          return;
        }

        if (error.message === "CHALLAN_NOT_DRAFT") {
          res.status(409).json({
            success: false,
            message: "Only draft challans can be confirmed",
          });
          return;
        }

        if (error.message.startsWith("PRODUCT_NOT_FOUND:")) {
          res.status(400).json({
            success: false,
            message: "A product in this challan no longer exists",
          });
          return;
        }

        if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
          const parts = error.message.split(":");

          res.status(409).json({
            success: false,
            message: `Insufficient stock for ${parts[1]}. Available: ${parts[2]}, Required: ${parts[3]}`,
          });
          return;
        }
      }

      console.error("Confirm challan error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to confirm challan",
      });
    }
  }
);

export default router;