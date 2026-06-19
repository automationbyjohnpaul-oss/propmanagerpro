/*
  Warnings:

  - You are about to drop the column `entityType` on the `audit_logs` table. All the data in the column will be lost.
  - Added the required column `entity` to the `audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "audit_logs_entityType_entityId_idx";

-- DropIndex
DROP INDEX "audit_logs_userId_idx";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "entityType",
ADD COLUMN     "entity" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
