-- AlterTable
ALTER TABLE "users" ADD COLUMN     "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "blog_link" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "github_link" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "groups" TEXT[] DEFAULT ARRAY[]::TEXT[];
