// backend/src/services/audit.service.ts
import { prisma } from "../lib/prisma";

// ============================================
// CORE AUDIT LOG FUNCTION
// ============================================

export async function createAuditLog(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  metadata: Record<string, any> = {},
  tx?: any,
) {
  const client = tx || prisma;

  return client.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    },
  });
}

// ============================================
// QUERY FUNCTIONS
// ============================================

export async function getAuditLogs(
  userId: string,
  options?: {
    entity?: string;
    entityId?: string;
    action?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  },
) {
  const where: any = { userId };

  if (options?.entity) where.entity = options.entity;
  if (options?.entityId) where.entityId = options.entityId;
  if (options?.action) where.action = options.action;

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options?.startDate) where.createdAt.gte = options.startDate;
    if (options?.endDate) where.createdAt.lte = options.endDate;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

export async function getAuditLogsForEntity(
  userId: string,
  entity: string,
  entityId: string,
  limit?: number,
) {
  return prisma.auditLog.findMany({
    where: { userId, entity, entityId },
    orderBy: { createdAt: "desc" },
    take: limit || 20,
  });
}

export async function getRecentAuditLogs(userId: string, limit: number = 10) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
