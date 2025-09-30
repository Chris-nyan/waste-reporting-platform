-- AlterTable
ALTER TABLE "public"."WasteData" ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "facilityAddress" TEXT,
ADD COLUMN     "pickupAddress" TEXT,
ADD COLUMN     "wasteCategory" TEXT;
