-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED');

-- CreateTable
CREATE TABLE "ContactUs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactUs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactUs_email_idx" ON "ContactUs"("email");

-- CreateIndex
CREATE INDEX "ContactUs_status_idx" ON "ContactUs"("status");

-- CreateIndex
CREATE INDEX "ContactUs_createdAt_idx" ON "ContactUs"("createdAt");
