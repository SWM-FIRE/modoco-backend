/*
  Warnings:

  - You are about to drop the column `statusQuo` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "statusQuo",
ADD COLUMN     "status_quo" TEXT NOT NULL DEFAULT '';
