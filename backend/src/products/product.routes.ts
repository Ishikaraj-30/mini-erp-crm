import { Router } from "express";
import { prisma } from "../config/prisma";
import { MovementType, Role } from "../generated/prisma/enums";
import {
  authenticate,
  authorize,
  type AuthRequest,
} from "../auth/auth.middleware";

const router = Router();

router.use(authenticate);

// Get products - all authenticated roles can view
router.get("/", async (_req: AuthRequest, res) => {
  try {
    const search =
      typeof _req.query.search === "string"
        ? _req.query.search.trim()
        : "";

    const page = Math.max(Number(_req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(_req.query.limit) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              sku: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              category: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

// Get single product
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        },
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
});

// Create product
router.post(
  "/",
  authorize(Role.ADMIN, Role.WAREHOUSE),
  async (req: AuthRequest, res) => {
    try {
      const {
        name,
        sku,
        category,
        unitPrice,
        currentStock,
        minimumStock,
        warehouseLocation,
      } = req.body;

      if (
        !name ||
        !sku ||
        !category ||
        unitPrice === undefined ||
        !warehouseLocation
      ) {
        res.status(400).json({
          success: false,
          message:
            "Name, SKU, category, unit price and warehouse location are required",
        });
        return;
      }

      const price = Number(unitPrice);
      const stock = Number(currentStock ?? 0);
      const minimum = Number(minimumStock ?? 0);

      if (
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(stock) ||
        stock < 0 ||
        !Number.isInteger(minimum) ||
        minimum < 0
      ) {
        res.status(400).json({
          success: false,
          message:
            "Unit price, stock and minimum stock must contain valid non-negative values",
        });
        return;
      }

      const product = await prisma.$transaction(async (tx) => {
        const createdProduct = await tx.product.create({
          data: {
            name: String(name).trim(),
            sku: String(sku).trim().toUpperCase(),
            category: String(category).trim(),
            unitPrice: price,
            currentStock: stock,
            minimumStock: minimum,
            warehouseLocation: String(warehouseLocation).trim(),
            createdById: req.user!.id,
          },
        });

        if (stock > 0) {
          await tx.stockMovement.create({
            data: {
              productId: createdProduct.id,
              quantity: stock,
              movementType: MovementType.IN,
              reason: "Opening stock",
              createdById: req.user!.id,
            },
          });
        }

        return createdProduct;
      });

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      console.error("Create product error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to create product",
      });
    }
  }
);

// Edit product
router.put(
  "/:id",
  authorize(Role.ADMIN, Role.WAREHOUSE),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
        return;
      }

      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        res.status(404).json({
          success: false,
          message: "Product not found",
        });
        return;
      }

      const {
        name,
        sku,
        category,
        unitPrice,
        minimumStock,
        warehouseLocation,
      } = req.body;

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...(name !== undefined && {
            name: String(name).trim(),
          }),
          ...(sku !== undefined && {
            sku: String(sku).trim().toUpperCase(),
          }),
          ...(category !== undefined && {
            category: String(category).trim(),
          }),
          ...(unitPrice !== undefined && {
            unitPrice: Number(unitPrice),
          }),
          ...(minimumStock !== undefined && {
            minimumStock: Number(minimumStock),
          }),
          ...(warehouseLocation !== undefined && {
            warehouseLocation: String(warehouseLocation).trim(),
          }),
        },
      });

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (error) {
      console.error("Update product error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update product",
      });
    }
  }
);

// Add stock
router.post(
  "/:id/stock",
  authorize(Role.ADMIN, Role.WAREHOUSE),
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const { quantity, movementType, reason } = req.body;

      if (!Number.isInteger(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
        return;
      }

      const qty = Number(quantity);

      if (!Number.isInteger(qty) || qty <= 0) {
        res.status(400).json({
          success: false,
          message: "Quantity must be a positive integer",
        });
        return;
      }

      if (
        movementType !== MovementType.IN &&
        movementType !== MovementType.OUT
      ) {
        res.status(400).json({
          success: false,
          message: "Movement type must be IN or OUT",
        });
        return;
      }

      if (!reason || !String(reason).trim()) {
        res.status(400).json({
          success: false,
          message: "Reason is required",
        });
        return;
      }

      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id },
        });

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        const newStock =
          movementType === MovementType.IN
            ? product.currentStock + qty
            : product.currentStock - qty;

        if (newStock < 0) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        const updatedProduct = await tx.product.update({
          where: { id },
          data: {
            currentStock: newStock,
          },
        });

        const movement = await tx.stockMovement.create({
          data: {
            productId: id,
            quantity: qty,
            movementType,
            reason: String(reason).trim(),
            createdById: req.user!.id,
          },
        });

        return {
          product: updatedProduct,
          movement,
        };
      });

      res.status(200).json({
        success: true,
        message: "Stock updated successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "PRODUCT_NOT_FOUND") {
          res.status(404).json({
            success: false,
            message: "Product not found",
          });
          return;
        }

        if (error.message === "INSUFFICIENT_STOCK") {
          res.status(409).json({
            success: false,
            message: "Insufficient stock. Stock cannot go negative.",
          });
          return;
        }
      }

      console.error("Stock update error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update stock",
      });
    }
  }
);

// Get stock movement history
router.get(
  "/:id/stock-movements",
  async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
        return;
      }

      const movements = await prisma.stockMovement.findMany({
        where: {
          productId: id,
        },
        include: {
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
        data: movements,
      });
    } catch (error) {
      console.error("Get stock movements error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch stock movements",
      });
    }
  }
);

export default router;