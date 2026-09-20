-- CreateTable
CREATE TABLE "payment_create_requests" (
    "userId" TEXT NOT NULL,
    "requestKey" UUID NOT NULL,
    "fingerprintVersion" INTEGER NOT NULL,
    "requestFingerprint" VARCHAR(64) NOT NULL,
    "paymentId" TEXT,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_create_requests_pkey" PRIMARY KEY ("userId","requestKey")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_create_requests_paymentId_key" ON "payment_create_requests"("paymentId");

-- AddForeignKey
ALTER TABLE "payment_create_requests" ADD CONSTRAINT "payment_create_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_create_requests" ADD CONSTRAINT "payment_create_requests_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
