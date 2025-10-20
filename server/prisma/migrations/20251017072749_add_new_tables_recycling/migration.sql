/*
  Warnings:

  - You are about to drop the `WasteData` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."WasteEntryStatus" AS ENUM ('PENDING', 'PARTIALLY_RECYCLED', 'COMPLETED');

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
CREATE TABLE "public"."WasteEntry" (
    "id" TEXT NOT NULL,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "wasteTypeId" TEXT NOT NULL,
    "initialQuantity" DOUBLE PRECISION NOT NULL,
    "recycledQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingQuantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "status" "public"."WasteEntryStatus" NOT NULL DEFAULT 'PENDING',
    "pickupLocationId" TEXT,
    "vehicleTypeId" TEXT,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WasteEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecyclingProcess" (
    "id" TEXT NOT NULL,
    "processedQuantity" DOUBLE PRECISION NOT NULL,
    "recycledDate" TIMESTAMP(3) NOT NULL,
    "recyclingTechnologyId" TEXT,
    "facilityId" TEXT,
    "distanceKm" DOUBLE PRECISION,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "wasteEntryId" TEXT NOT NULL,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecyclingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WasteEntry_clientId_idx" ON "public"."WasteEntry"("clientId");

-- CreateIndex
CREATE INDEX "RecyclingProcess_wasteEntryId_idx" ON "public"."RecyclingProcess"("wasteEntryId");

-- AddForeignKey
ALTER TABLE "public"."WasteEntry" ADD CONSTRAINT "WasteEntry_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "public"."WasteType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteEntry" ADD CONSTRAINT "WasteEntry_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "public"."PickupLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteEntry" ADD CONSTRAINT "WasteEntry_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "public"."VehicleType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteEntry" ADD CONSTRAINT "WasteEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteEntry" ADD CONSTRAINT "WasteEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecyclingProcess" ADD CONSTRAINT "RecyclingProcess_recyclingTechnologyId_fkey" FOREIGN KEY ("recyclingTechnologyId") REFERENCES "public"."RecyclingTechnology"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecyclingProcess" ADD CONSTRAINT "RecyclingProcess_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecyclingProcess" ADD CONSTRAINT "RecyclingProcess_wasteEntryId_fkey" FOREIGN KEY ("wasteEntryId") REFERENCES "public"."WasteEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecyclingProcess" ADD CONSTRAINT "RecyclingProcess_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
