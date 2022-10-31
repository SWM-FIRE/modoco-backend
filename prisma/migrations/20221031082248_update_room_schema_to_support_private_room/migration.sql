-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "hash" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;
