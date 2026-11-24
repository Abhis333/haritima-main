-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "floweringMonths" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "fruitingMonths" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- CreateTable
CREATE TABLE "Trail" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleHi" TEXT,
    "description" TEXT NOT NULL,
    "descriptionHi" TEXT,
    "color" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrailStop" (
    "id" TEXT NOT NULL,
    "trailId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "note" TEXT,
    "noteHi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrailStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantViewDaily" (
    "plantId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlantViewDaily_pkey" PRIMARY KEY ("plantId","day")
);

-- CreateTable
CREATE TABLE "ChatQueryLog" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "plantSlugs" TEXT[],
    "grounded" BOOLEAN NOT NULL,
    "urgent" BOOLEAN NOT NULL,
    "llmUsed" BOOLEAN NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trail_slug_key" ON "Trail"("slug");

-- CreateIndex
CREATE INDEX "TrailStop_trailId_position_idx" ON "TrailStop"("trailId", "position");

-- CreateIndex
CREATE INDEX "PlantViewDaily_day_idx" ON "PlantViewDaily"("day");

-- CreateIndex
CREATE INDEX "ChatQueryLog_createdAt_idx" ON "ChatQueryLog"("createdAt");

-- AddForeignKey
ALTER TABLE "TrailStop" ADD CONSTRAINT "TrailStop_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "Trail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrailStop" ADD CONSTRAINT "TrailStop_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "PlantLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantViewDaily" ADD CONSTRAINT "PlantViewDaily_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

