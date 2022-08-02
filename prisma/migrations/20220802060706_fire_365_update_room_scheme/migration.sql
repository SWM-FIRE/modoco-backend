/*
  Warnings:

  - Added the required column `theme` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "theme" TEXT NOT NULL,
ALTER COLUMN "current" SET DEFAULT 0;
