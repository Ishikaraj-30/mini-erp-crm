import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { Role } from "./generated/prisma/enums.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const users = [
  {
    name: "System Admin",
    email: "admin@erp.com",
    password: "Admin@123",
    role: Role.ADMIN,
  },
  {
    name: "Sales User",
    email: "sales@erp.com",
    password: "Sales@123",
    role: Role.SALES,
  },
  {
    name: "Warehouse User",
    email: "warehouse@erp.com",
    password: "Warehouse@123",
    role: Role.WAREHOUSE,
  },
  {
    name: "Accounts User",
    email: "accounts@erp.com",
    password: "Accounts@123",
    role: Role.ACCOUNTS,
  },
];

async function main() {
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        name: user.name,
        password: hashedPassword,
        role: user.role,
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    });

    console.log(`Created/updated ${user.role}: ${user.email}`);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });