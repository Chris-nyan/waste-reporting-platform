-- AlterTable
ALTER TABLE "public"."WasteData" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "pickupDate" TIMESTAMP(3),
ADD COLUMN     "recyclingTechnology" TEXT,
ADD COLUMN     "vehicleType" TEXT;
