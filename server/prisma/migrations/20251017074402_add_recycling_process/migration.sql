-- AlterTable
ALTER TABLE "public"."WasteData" ADD COLUMN     "recycledQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING_RECYCLING';

-- CreateTable
CREATE TABLE "public"."RecyclingProcess" (
    "id" TEXT NOT NULL,
    "quantityRecycled" DOUBLE PRECISION NOT NULL,
    "recycledDate" TIMESTAMP(3) NOT NULL,
    "wasteDataId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecyclingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecyclingProcess_wasteDataId_idx" ON "public"."RecyclingProcess"("wasteDataId");

-- AddForeignKey
ALTER TABLE "public"."RecyclingProcess" ADD CONSTRAINT "RecyclingProcess_wasteDataId_fkey" FOREIGN KEY ("wasteDataId") REFERENCES "public"."WasteData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
