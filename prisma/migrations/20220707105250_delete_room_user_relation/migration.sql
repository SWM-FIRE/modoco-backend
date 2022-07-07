/*
  Warnings:

  - You are about to drop the column `userId` on the `Room` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_userId_fkey";

-- DropIndex
DROP INDEX "Room_userId_key";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "userId";
