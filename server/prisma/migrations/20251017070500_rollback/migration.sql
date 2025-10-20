/*
  Warnings:

  - You are about to drop the `RecyclingProcess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WasteLot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."RecyclingProcess" DROP CONSTRAINT "RecyclingProcess_facilityId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RecyclingProcess" DROP CONSTRAINT "RecyclingProcess_processedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."RecyclingProcess" DROP CONSTRAINT "RecyclingProcess_recyclingTechnologyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RecyclingProcess" DROP CONSTRAINT "RecyclingProcess_wasteLotId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WasteLot" DROP CONSTRAINT "WasteLot_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WasteLot" DROP CONSTRAINT "WasteLot_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."WasteLot" DROP CONSTRAINT "WasteLot_pickupLocationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WasteLot" DROP CONSTRAINT "WasteLot_vehicleTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WasteLot" DROP CONSTRAINT "WasteLot_wasteTypeId_fkey";

-- DropTable
DROP TABLE "public"."RecyclingProcess";

-- DropTable
DROP TABLE "public"."WasteLot";

-- CreateTable
CREATE TABLE "public"."WasteData" (
    "id" TEXT NOT NULL,
    "wasteTypeId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "recycledDate" TIMESTAMP(3) NOT NULL,
    "recyclingTechnologyId" TEXT,
    "pickupLocationId" TEXT,
    "facilityId" TEXT,
    "vehicleTypeId" TEXT,
    "distanceKm" DOUBLE PRECISION,
    "pickupDate" TIMESTAMP(3),
    "imageUrl" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "WasteData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WasteData_clientId_idx" ON "public"."WasteData"("clientId");

-- AddForeignKey
ALTER TABLE "public"."WasteData" ADD CONSTRAINT "WasteData_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "public"."WasteType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteData" ADD CONSTRAINT "WasteData_recyclingTechnologyId_fkey" FOREIGN KEY ("recyclingTechnologyId") REFERENCES "public"."RecyclingTechnology"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteData" ADD CONSTRAINT "WasteData_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "public"."PickupLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteData" ADD CONSTRAINT "WasteData_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteData" ADD CONSTRAINT "WasteData_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "public"."VehicleType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteData" ADD CONSTRAINT "WasteData_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteData" ADD CONSTRAINT "WasteData_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
