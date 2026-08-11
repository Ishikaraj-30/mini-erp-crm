import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { Role } from "../generated/prisma/enums";

interface TokenPayload extends JwtPayload {
  id: number;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      success: false,
      message: "JWT secret is not configured",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (typeof decoded === "string") {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    if (
      typeof decoded.id !== "number" ||
      typeof decoded.email !== "string" ||
      typeof decoded.role !== "string" ||
      !Object.values(Role).includes(decoded.role as Role)
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token payload",
      });
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as Role,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}

export function authorize(...allowedRoles: Role[]) {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
}