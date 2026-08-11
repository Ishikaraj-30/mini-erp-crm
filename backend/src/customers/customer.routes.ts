import { Router } from "express";
import { prisma } from "../config/prisma";
import { Role } from "../generated/prisma/enums";
import {
  authenticate,
  authorize,
  type AuthRequest,
} from "../auth/auth.middleware";

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN, Role.SALES));

router.post("/", async (req: AuthRequest, res) => {
  try {
    const {
      customerName,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    if (
      !customerName ||
      !mobile ||
      !businessName ||
      !customerType ||
      !address
    ) {
      res.status(400).json({
        success: false,
        message:
          "Customer name, mobile, business name, customer type and address are required",
      });
      return;
    }

    const customer = await prisma.customer.create({
      data: {
        customerName: String(customerName).trim(),
        mobile: String(mobile).trim(),
        email: email ? String(email).trim().toLowerCase() : null,
        businessName: String(businessName).trim(),
        gstNumber: gstNumber ? String(gstNumber).trim() : null,
        customerType,
        address: String(address).trim(),
        status: status ?? "LEAD",
        followUpDate: followUpDate
          ? new Date(followUpDate)
          : null,
        notes: notes ? String(notes).trim() : null,
        createdById: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            {
              customerName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              businessName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              mobile: {
                contains: search,
              },
            },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
      return;
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followups: {
          orderBy: {
            createdAt: "desc",
          },
        },
        challans: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
      return;
    }

    const {
      customerName,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(customerName !== undefined && {
          customerName: String(customerName).trim(),
        }),
        ...(mobile !== undefined && {
          mobile: String(mobile).trim(),
        }),
        ...(email !== undefined && {
          email: email ? String(email).trim().toLowerCase() : null,
        }),
        ...(businessName !== undefined && {
          businessName: String(businessName).trim(),
        }),
        ...(gstNumber !== undefined && {
          gstNumber: gstNumber ? String(gstNumber).trim() : null,
        }),
        ...(customerType !== undefined && {
          customerType,
        }),
        ...(address !== undefined && {
          address: String(address).trim(),
        }),
        ...(status !== undefined && {
          status,
        }),
        ...(followUpDate !== undefined && {
          followUpDate: followUpDate
            ? new Date(followUpDate)
            : null,
        }),
        ...(notes !== undefined && {
          notes: notes ? String(notes).trim() : null,
        }),
      },
    });

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
});

router.post("/:id/followups", async (req: AuthRequest, res) => {
  try {
    const customerId = Number(req.params.id);
    const { note, followUpDate } = req.body;

    if (!Number.isInteger(customerId)) {
      res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
      return;
    }

    if (!note || !String(note).trim()) {
      res.status(400).json({
        success: false,
        message: "Follow-up note is required",
      });
      return;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: "Customer not found",
      });
      return;
    }

    const followup = await prisma.customerFollowup.create({
      data: {
        customerId,
        note: String(note).trim(),
        followUpDate: followUpDate
          ? new Date(followUpDate)
          : null,
        createdById: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Follow-up added successfully",
      data: followup,
    });
  } catch (error) {
    console.error("Create follow-up error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add follow-up",
    });
  }
});

export default router;