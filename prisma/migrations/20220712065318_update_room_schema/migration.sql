/*
  Warnings:

  - The primary key for the `Room` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Room` table. All the data in the column will be lost.
  - Added the required column `moderatorId` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" DROP CONSTRAINT "Room_pkey",
DROP COLUMN "id",
DROP COLUMN "image",
DROP COLUMN "name",
ADD COLUMN     "details" TEXT,
ADD COLUMN     "itemId" SERIAL NOT NULL,
ADD COLUMN     "moderatorId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD CONSTRAINT "Room_pkey" PRIMARY KEY ("itemId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
