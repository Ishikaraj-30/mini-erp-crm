import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./config/prisma.js";
import authRoutes from "./auth/auth.routes.js";
import customerRoutes from "./customers/customer.routes.js";
import productRoutes from "./products/product.routes.js";
import challanRoutes from "./challans/challan.routes.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/challans", challanRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ERP CRM API is running",
  });
});
app.get("/api/db-test", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Database connection successful",
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});