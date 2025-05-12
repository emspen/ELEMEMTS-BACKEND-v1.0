/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Owner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_ownerId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "ownerId";

-- DropTable
DROP TABLE "Owner";
