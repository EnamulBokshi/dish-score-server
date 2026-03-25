/*
  Warnings:

  - Added the required column `createdByUserId` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "createdByUserId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Restaurant_createdByUserId_idx" ON "Restaurant"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
