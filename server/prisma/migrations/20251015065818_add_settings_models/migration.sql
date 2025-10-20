/*
  Warnings:

  - You are about to drop the column `facilityAddress` on the `WasteData` table. All the data in the column will be lost.
  - You are about to drop the column `pickupAddress` on the `WasteData` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleType` on the `WasteData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."WasteData" DROP COLUMN "facilityAddress",
DROP COLUMN "pickupAddress",
DROP COLUMN "vehicleType",
ADD COLUMN     "facilityId" TEXT,
ADD COLUMN     "pickupLocationId" TEXT,
ADD COLUMN     "vehicleTypeId" TEXT;

-- CreateTable
CREATE TABLE "public"."Facility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullAddress" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PickupLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullAddress" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "PickupLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehicleType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Facility_tenantId_idx" ON "public"."Facility"("tenantId");

-- CreateIndex
CREATE INDEX "PickupLocation_tenantId_idx" ON "public"."PickupLocation"("tenantId");

-- CreateIndex
CREATE INDEX "VehicleType_tenantId_idx" ON "public"."VehicleType"("tenantId");

-- AddForeignKey
ALTER TABLE "public"."WasteData" ADD CONSTRAINT "WasteData_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "public"."PickupLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteData" ADD CONSTRAINT "WasteData_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteData" ADD CONSTRAINT "WasteData_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "public"."VehicleType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Facility" ADD CONSTRAINT "Facility_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PickupLocation" ADD CONSTRAINT "PickupLocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VehicleType" ADD CONSTRAINT "VehicleType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
