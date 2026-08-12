export type Role =
  | "ADMIN"
  | "SALES"
  | "WAREHOUSE"
  | "ACCOUNTS";

export type CustomerType =
  | "RETAIL"
  | "WHOLESALE"
  | "DISTRIBUTOR";

export type CustomerStatus =
  | "LEAD"
  | "ACTIVE"
  | "INACTIVE";

export interface Customer {
  id: number;
  customerName: string;
  mobile: string;
  email: string | null;
  businessName: string;
  gstNumber: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: number | null;
}

export interface CustomerFollowup {
  id: number;
  customerId: number;
  note: string;
  followUpDate: string | null;
  createdById: number;
  createdAt: string;
}

export interface CustomerChallan {
  id: number;
  challanNumber: string;
  totalQuantity: number;
  status: string;
  createdAt: string;
}

export interface CustomerDetails extends Customer {
  followups: CustomerFollowup[];
  challans: CustomerChallan[];
}

export type MovementType = "IN" | "OUT";

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: string | number;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
  createdAt: string;
  updatedAt: string;
  createdById: number | null;
}

export interface StockMovement {
  id: number;
  productId: number;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdById: number;
  createdAt: string;
  createdBy?: {
    id: number;
    name: string;
    role: Role;
  };
}