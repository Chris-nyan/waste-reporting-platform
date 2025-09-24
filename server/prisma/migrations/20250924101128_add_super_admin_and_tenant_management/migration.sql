-- CreateEnum
CREATE TYPE "public"."TenantStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELED');

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "public"."Tenant" ADD COLUMN     "status" "public"."TenantStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "tenantId" DROP NOT NULL;
