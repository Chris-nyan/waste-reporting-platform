/*
  Warnings:

  - You are about to drop the `WasteData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."WasteData" DROP CONSTRAINT "WasteData_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WasteData" DROP CONSTRAINT "WasteData_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."WasteData" DROP CONSTRAINT "WasteData_facilityId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WasteData" DROP CONSTRAINT "WasteData_pickupLocationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WasteData" DROP CONSTRAINT "WasteData_recyclingTechnologyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WasteData" DROP CONSTRAINT "WasteData_vehicleTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WasteData" DROP CONSTRAINT "WasteData_wasteTypeId_fkey";

-- DropTable
DROP TABLE "public"."WasteData";

-- CreateTable
CREATE TABLE "public"."WasteLot" (
    "id" TEXT NOT NULL,
    "initialQuantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "recycledQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING_RECYCLING',
    "pickupDate" TIMESTAMP(3),
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "wasteTypeId" TEXT NOT NULL,
    "pickupLocationId" TEXT,
    "vehicleTypeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WasteLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecyclingProcess" (
    "id" TEXT NOT NULL,
    "quantityRecycled" DOUBLE PRECISION NOT NULL,
    "recycledDate" TIMESTAMP(3) NOT NULL,
    "transportDistanceKm" DOUBLE PRECISION,
    "wasteLotId" TEXT NOT NULL,
    "processedById" TEXT NOT NULL,
    "recyclingTechnologyId" TEXT,
    "facilityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecyclingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WasteLot_clientId_idx" ON "public"."WasteLot"("clientId");

-- CreateIndex
CREATE INDEX "RecyclingProcess_wasteLotId_idx" ON "public"."RecyclingProcess"("wasteLotId");

-- AddForeignKey
ALTER TABLE "public"."WasteLot" ADD CONSTRAINT "WasteLot_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteLot" ADD CONSTRAINT "WasteLot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteLot" ADD CONSTRAINT "WasteLot_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "public"."WasteType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteLot" ADD CONSTRAINT "WasteLot_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "public"."PickupLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteLot" ADD CONSTRAINT "WasteLot_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "public"."VehicleType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecyclingProcess" ADD CONSTRAINT "RecyclingProcess_wasteLotId_fkey" FOREIGN KEY ("wasteLotId") REFERENCES "public"."WasteLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecyclingProcess" ADD CONSTRAINT "RecyclingProcess_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecyclingProcess" ADD CONSTRAINT "RecyclingProcess_recyclingTechnologyId_fkey" FOREIGN KEY ("recyclingTechnologyId") REFERENCES "public"."RecyclingTechnology"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecyclingProcess" ADD CONSTRAINT "RecyclingProcess_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;
