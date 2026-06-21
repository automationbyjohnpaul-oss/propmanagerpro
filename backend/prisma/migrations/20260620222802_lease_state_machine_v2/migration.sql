/*
  Warnings:

  - You are about to drop the column `isActive` on the `leases` table. All the data in the column will be lost.
  - You are about to alter the column `monthlyRent` on the `leases` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `securityDeposit` on the `leases` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('PENDING', 'ACTIVE', 'ENDED', 'TERMINATED');

-- AlterTable
ALTER TABLE "leases" DROP COLUMN "isActive",
ADD COLUMN     "status" "LeaseStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "terminatedAt" TIMESTAMP(3),
ADD COLUMN     "terminationReason" TEXT,
ALTER COLUMN "monthlyRent" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "securityDeposit" SET DATA TYPE DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "leases_status_idx" ON "leases"("status");

-- CreateIndex
CREATE INDEX "leases_unitId_status_idx" ON "leases"("unitId", "status");
