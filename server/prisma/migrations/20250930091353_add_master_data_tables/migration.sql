/*
  Warnings:

  - You are about to drop the column `recyclingTechnology` on the `WasteData` table. All the data in the column will be lost.
  - You are about to drop the column `wasteCategory` on the `WasteData` table. All the data in the column will be lost.
  - You are about to drop the column `wasteType` on the `WasteData` table. All the data in the column will be lost.
  - Added the required column `wasteTypeId` to the `WasteData` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `unit` on the `WasteData` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."WasteData" DROP COLUMN "recyclingTechnology",
DROP COLUMN "wasteCategory",
DROP COLUMN "wasteType",
ADD COLUMN     "recyclingTechnologyId" TEXT,
ADD COLUMN     "wasteTypeId" TEXT NOT NULL,
DROP COLUMN "unit",
ADD COLUMN     "unit" TEXT NOT NULL,
ALTER COLUMN "imageUrl" SET DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "public"."WasteCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "WasteCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WasteType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "WasteType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecyclingTechnology" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RecyclingTechnology_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WasteCategory_name_key" ON "public"."WasteCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RecyclingTechnology_name_key" ON "public"."RecyclingTechnology"("name");

-- AddForeignKey
ALTER TABLE "public"."WasteType" ADD CONSTRAINT "WasteType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."WasteCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteData" ADD CONSTRAINT "WasteData_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "public"."WasteType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WasteData" ADD CONSTRAINT "WasteData_recyclingTechnologyId_fkey" FOREIGN KEY ("recyclingTechnologyId") REFERENCES "public"."RecyclingTechnology"("id") ON DELETE SET NULL ON UPDATE CASCADE;
