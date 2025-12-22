-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "popFile" TEXT,
ADD COLUMN     "popFileName" TEXT,
ADD COLUMN     "popRejectionReason" TEXT,
ADD COLUMN     "popUploadedAt" TIMESTAMP(3),
ADD COLUMN     "popVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "popVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "popVerifiedBy" TEXT;
