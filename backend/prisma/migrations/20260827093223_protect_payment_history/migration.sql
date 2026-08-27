-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_leaseId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_tenantId_fkey";

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
