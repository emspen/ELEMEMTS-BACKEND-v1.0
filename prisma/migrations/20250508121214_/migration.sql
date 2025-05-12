/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Tag` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_categoryId_fkey";

-- DropIndex
DROP INDEX "Tag_categoryId_key";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "categoryId";

-- CreateTable
CREATE TABLE "_CategoryToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CategoryToTag_B_index" ON "_CategoryToTag"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToTag" ADD CONSTRAINT "_CategoryToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToTag" ADD CONSTRAINT "_CategoryToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
