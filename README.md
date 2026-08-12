Mini ERP and CRM Operations Portal

Overview

The Mini ERP and CRM Operations Portal is a web application for managing core business operations through a role-based portal.

Main Modules

Authentication and role-based access

Dashboard

Customer management

Customer follow-ups

Product and inventory management

Stock movements

Sales challans

Challan status management

Stock validation and reduction

Technology Stack

Frontend: React + TypeScript + Vite

Backend: Node.js + Express + TypeScript

Database: PostgreSQL

ORM: Prisma 7

Authentication: JWT + bcrypt

Validation: Zod

API testing: Postman

Deployment: Render

Repository Structure

mini-erp-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── auth/
│       ├── customers/
│       ├── products/
│       ├── challans/
│       ├── config/
│       ├── seed.ts
│       └── server.ts
└── frontend/
    └── src/

Backend Commands

npm install
npx prisma generate
npm run build
npm start

Development

npm run dev

Database

Set DATABASE_URL in the environment. Prisma migrations are stored under backend/prisma/migrations.

API

The backend exposes the API under /api. The current server includes:

/api/auth

/api/customers

/api/products

/api/challans

/api/health

/api/db-test

Deployment

The backend and frontend are deployed as separate Render services.

Backend:https://mini-erp-crm-cy2h.onrender.com

Frontend:https://mini-erp-crm-frontend-qo5h.onrender.com

Security

Passwords are hashed using bcrypt.

Authentication uses JWT.

Secrets and database credentials are stored as environment variables and should not be committed to Git.
