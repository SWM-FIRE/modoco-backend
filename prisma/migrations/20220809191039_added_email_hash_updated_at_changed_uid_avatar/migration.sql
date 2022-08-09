/*
  Warnings:

  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_moderatorId_fkey";

-- DropTable
DROP TABLE "Room";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "uid" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nickname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "avatar" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "rooms" (
    "itemId" SERIAL NOT NULL,
    "moderatorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "tags" TEXT[],
    "total" INTEGER NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "theme" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("itemId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
