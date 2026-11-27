-- CreateEnum
CREATE TYPE "PlaceKind" AS ENUM ('TEMPLE', 'ACADEMIC', 'LIBRARY', 'HOSTEL', 'CANTEEN', 'OFFICE', 'GATE', 'GARDEN', 'HEALTH', 'SPORTS', 'OTHER');

-- CreateTable
CREATE TABLE "CampusPlace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT,
    "kind" "PlaceKind" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "descriptionHi" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isApproximate" BOOLEAN NOT NULL DEFAULT true,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampusPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampusPlace_kind_idx" ON "CampusPlace"("kind");

