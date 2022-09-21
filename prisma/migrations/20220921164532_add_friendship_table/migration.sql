-- CreateEnum
CREATE TYPE "status" AS ENUM ('PENDING', 'ACCEPTED', 'YOU');

-- CreateTable
CREATE TABLE "friendships" (
    "friendFrom" INTEGER NOT NULL,
    "friendTo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "status" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("friendFrom","friendTo")
);

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friendFrom_fkey" FOREIGN KEY ("friendFrom") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friendTo_fkey" FOREIGN KEY ("friendTo") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE NO ACTION;
