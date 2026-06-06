/*
  Warnings:

  - A unique constraint covering the columns `[userId,email]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "tenants_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "tenants_userId_email_key" ON "tenants"("userId", "email");
