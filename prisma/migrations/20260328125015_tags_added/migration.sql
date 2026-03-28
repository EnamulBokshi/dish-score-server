/*
  Warnings:

  - You are about to drop the `DishTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DishTag" DROP CONSTRAINT "DishTag_dishId_fkey";

-- DropForeignKey
ALTER TABLE "DishTag" DROP CONSTRAINT "DishTag_tagId_fkey";

-- AlterTable
ALTER TABLE "Dish" ADD COLUMN     "ingredients" TEXT[],
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "DishTag";

-- DropTable
DROP TABLE "Tag";
