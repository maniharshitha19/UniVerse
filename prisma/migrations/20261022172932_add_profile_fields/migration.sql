-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "projectLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "year" INTEGER;
