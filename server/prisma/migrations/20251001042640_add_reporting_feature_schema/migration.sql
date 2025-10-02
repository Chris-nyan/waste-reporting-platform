/*
  Warnings:

  - You are about to drop the column `avoidedEmissions` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `pickupDate` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `recyclingTechnology` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleType` on the `Report` table. All the data in the column will be lost.
  - Added the required column `emissionsAvoided` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalWeightRecycled` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Report" DROP COLUMN "avoidedEmissions",
DROP COLUMN "createdAt",
DROP COLUMN "pickupDate",
DROP COLUMN "recyclingTechnology",
DROP COLUMN "vehicleType",
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "emissionsAvoided" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "includedWasteTypes" TEXT[],
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "reportTitle" TEXT NOT NULL DEFAULT 'Waste Management & Sustainability Report',
ADD COLUMN     "totalWeightRecycled" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "public"."ReportQuestion" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,

    CONSTRAINT "ReportQuestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ReportQuestion" ADD CONSTRAINT "ReportQuestion_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
