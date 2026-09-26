-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('CLASSICAL_AYURVEDIC_TEXT', 'GOVERNMENT_PUBLICATION', 'UNIVERSITY_PUBLICATION', 'BOTANICAL_REFERENCE', 'RESEARCH_PUBLICATION');

-- CreateEnum
CREATE TYPE "PlantType" AS ENUM ('TREE', 'SHRUB', 'HERB', 'CLIMBER', 'GRASS', 'SUCCULENT', 'OTHER');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('AVAILABLE', 'SEASONAL', 'LIMITED', 'NOT_ON_CAMPUS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "hindiName" TEXT,
    "sanskritName" TEXT,
    "otherNames" TEXT[],
    "family" TEXT,
    "plantType" "PlantType" NOT NULL DEFAULT 'OTHER',
    "availability" "Availability" NOT NULL DEFAULT 'AVAILABLE',
    "description" TEXT NOT NULL,
    "descriptionHi" TEXT,
    "ayurvedicProperties" TEXT,
    "traditionalUses" TEXT[],
    "traditionalUsesHi" TEXT[],
    "plantParts" TEXT[],
    "preparation" TEXT,
    "cultivation" TEXT,
    "precautions" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantLocation" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isApproximate" BOOLEAN NOT NULL DEFAULT true,
    "campusArea" TEXT NOT NULL,
    "locationDescription" TEXT,
    "landmark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AyurvedicReference" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "textName" TEXT NOT NULL,
    "author" TEXT,
    "chapter" TEXT,
    "section" TEXT,
    "verse" TEXT,
    "citation" TEXT NOT NULL,
    "referenceUrl" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AyurvedicReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantBenefit" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "concern" TEXT NOT NULL,
    "concernHi" TEXT,
    "description" TEXT NOT NULL,
    "plantPart" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mantra" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sanskritText" TEXT NOT NULL,
    "transliteration" TEXT,
    "hindiTranslation" TEXT NOT NULL,
    "englishTranslation" TEXT NOT NULL,
    "meaning" TEXT,
    "source" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "category" TEXT NOT NULL,
    "audioUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mantra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "plantId" TEXT,
    "referenceId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "_PlantToPlantCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PlantToPlantCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PlantCategory_slug_key" ON "PlantCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Plant_slug_key" ON "Plant"("slug");

-- CreateIndex
CREATE INDEX "Plant_commonName_idx" ON "Plant"("commonName");

-- CreateIndex
CREATE INDEX "Plant_scientificName_idx" ON "Plant"("scientificName");

-- CreateIndex
CREATE INDEX "PlantLocation_plantId_idx" ON "PlantLocation"("plantId");

-- CreateIndex
CREATE INDEX "PlantLocation_campusArea_idx" ON "PlantLocation"("campusArea");

-- CreateIndex
CREATE INDEX "AyurvedicReference_plantId_verificationStatus_idx" ON "AyurvedicReference"("plantId", "verificationStatus");

-- CreateIndex
CREATE INDEX "PlantBenefit_concern_idx" ON "PlantBenefit"("concern");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_idx" ON "ChatMessage"("conversationId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_plantId_idx" ON "KnowledgeDocument"("plantId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_createdAt_idx" ON "AuditLog"("entity", "createdAt");

-- CreateIndex
CREATE INDEX "_PlantToPlantCategory_B_index" ON "_PlantToPlantCategory"("B");

-- AddForeignKey
ALTER TABLE "PlantLocation" ADD CONSTRAINT "PlantLocation_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AyurvedicReference" ADD CONSTRAINT "AyurvedicReference_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantBenefit" ADD CONSTRAINT "PlantBenefit_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantBenefit" ADD CONSTRAINT "PlantBenefit_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "AyurvedicReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlantToPlantCategory" ADD CONSTRAINT "_PlantToPlantCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlantToPlantCategory" ADD CONSTRAINT "_PlantToPlantCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "PlantCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
