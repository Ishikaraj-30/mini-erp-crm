import { Role } from "../generated/prisma/enums.js";

export interface AuthenticatedRequest {
  user?: {
    id: number;
    email: string;
    role: Role;
  };
}