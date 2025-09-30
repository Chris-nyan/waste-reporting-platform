/*
  Warnings:

  - The `imageUrl` column on the `WasteData` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."WasteData" DROP COLUMN "imageUrl",
ADD COLUMN     "imageUrl" TEXT[];
