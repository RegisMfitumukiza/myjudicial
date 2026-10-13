-- AlterTable
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "documents_category_idx" ON "documents"("category");
