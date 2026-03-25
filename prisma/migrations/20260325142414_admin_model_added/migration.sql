/*
  Warnings:

  - You are about to drop the column `latitude` on the `Restaurant` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Restaurant` table. All the data in the column will be lost.
  - Added the required column `city` to the `Restaurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Restaurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `road` to the `Restaurant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" JSONB NOT NULL,
ADD COLUMN     "road" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNumber" TEXT,
    "profilePhoto" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
