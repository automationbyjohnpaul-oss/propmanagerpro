import { Request, Response } from "express";
import {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  archiveTenant,
  restoreTenant,
} from "../services/tenant.service";
import { createAuditLog } from "../services/audit.service";
import { asyncHandler } from "../middleware/asyncHandler";
import { prisma } from "../lib/prisma";

// ============================================
// HELPERS
// ============================================

function getUserId(req: Request): string {
  return (req as any).userId;
}

function createError(message: string, statusCode: number) {
  const err = new Error(message) as any;
  err.statusCode = statusCode;
  return err;
}

// ============================================
// GET TENANTS
// ============================================
export const getTenants = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const tenants = await getAllTenants(userId);
  return res.status(200).json(tenants);
});

// ============================================
// GET SINGLE TENANT
// ============================================
export const getTenant = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const tenant = await getTenantById(req.params.id as string, userId);

  if (!tenant) {
    throw createError("Tenant not found", 404);
  }

  return res.status(200).json(tenant);
});

// ============================================
// CREATE TENANT
// ============================================
export const createTenantHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const tenant = await createTenant(req.body, userId);

    await createAuditLog(userId, "CREATE_TENANT", "Tenant", tenant.id, {
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email,
      phone: tenant.phone,
    });

    return res.status(201).json(tenant);
  },
);

// ============================================
// UPDATE TENANT
// ============================================
export const updateTenantHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const tenantId = req.params.id as string;

    const existingTenant = await getTenantById(tenantId, userId);

    if (!existingTenant) {
      throw createError("Tenant not found", 404);
    }

    const tenant = await updateTenant(tenantId, userId, req.body);

    await createAuditLog(userId, "UPDATE_TENANT", "Tenant", tenant.id, {
      updatedFields: Object.keys(req.body),
      previousData: {
        firstName: existingTenant.firstName,
        lastName: existingTenant.lastName,
        email: existingTenant.email,
        phone: existingTenant.phone,
      },
      newData: {
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email,
        phone: tenant.phone,
      },
    });

    return res.status(200).json(tenant);
  },
);

// ============================================
// DELETE TENANT (Soft Delete)
// ============================================
export const deleteTenantHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const tenantId = req.params.id as string;

    const existingTenant = await getTenantById(tenantId, userId);

    if (!existingTenant) {
      throw createError("Tenant not found", 404);
    }

    // Check if tenant has active leases
    const activeLease = await prisma.lease.findFirst({
      where: {
        tenantId: tenantId,
        isActive: true,
        endDate: { gt: new Date() },
      },
    });

    if (activeLease) {
      throw createError("Cannot delete tenant with active lease", 409);
    }

    await deleteTenant(tenantId, userId);

    await createAuditLog(userId, "DELETE_TENANT", "Tenant", existingTenant.id, {
      firstName: existingTenant.firstName,
      lastName: existingTenant.lastName,
      email: existingTenant.email,
      phone: existingTenant.phone,
      deletedAt: new Date().toISOString(),
    });

    return res.status(204).send();
  },
);

// ============================================
// ARCHIVE TENANT (Soft Delete)
// ============================================
export const archiveTenantHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const tenantId = req.params.id as string;

    const existingTenant = await getTenantById(tenantId, userId);

    if (!existingTenant) {
      throw createError("Tenant not found", 404);
    }

    // Check for active leases
    const activeLease = await prisma.lease.findFirst({
      where: {
        tenantId: tenantId,
        isActive: true,
        endDate: { gt: new Date() },
      },
    });

    if (activeLease) {
      throw createError(
        "Cannot archive tenant with active lease. End lease first.",
        409,
      );
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { deletedAt: new Date() },
    });

    await createAuditLog(userId, "ARCHIVE_TENANT", "Tenant", tenantId, {
      firstName: existingTenant.firstName,
      lastName: existingTenant.lastName,
      email: existingTenant.email,
      phone: existingTenant.phone,
      archivedAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true });
  },
);

// ============================================
// RESTORE TENANT
// ============================================
export const restoreTenantHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const tenantId = req.params.id as string;

    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, userId, deletedAt: { not: null } },
    });

    if (!tenant) {
      throw createError("Archived tenant not found", 404);
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { deletedAt: null },
    });

    const restored = await getTenantById(tenantId, userId);

    await createAuditLog(userId, "RESTORE_TENANT", "Tenant", tenantId, {
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email,
      phone: tenant.phone,
      restoredAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, tenant: restored });
  },
);
