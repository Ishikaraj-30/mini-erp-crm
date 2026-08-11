import { Role } from "../generated/prisma/enums";

export interface AuthenticatedRequest {
  user?: {
    id: number;
    email: string;
    role: Role;
  };
}