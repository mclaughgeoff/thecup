-- AlterTable
ALTER TABLE "Match" ADD COLUMN "formatOverrideId" TEXT;

-- CreateIndex
CREATE INDEX "Match_formatOverrideId_idx" ON "Match"("formatOverrideId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_formatOverrideId_fkey" FOREIGN KEY ("formatOverrideId") REFERENCES "Format"("id") ON DELETE SET NULL ON UPDATE CASCADE;
