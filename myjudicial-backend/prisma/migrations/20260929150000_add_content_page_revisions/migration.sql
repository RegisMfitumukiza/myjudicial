-- CreateTable
CREATE TABLE "content_page_revisions" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "status" "ContentPageStatus" NOT NULL,
    "effective_date" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "og_image" TEXT,
    "author_id" TEXT,
    "change_type" TEXT NOT NULL DEFAULT 'SAVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_page_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_page_revisions_page_id_created_at_idx" ON "content_page_revisions"("page_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "content_page_revisions" ADD CONSTRAINT "content_page_revisions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "content_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_page_revisions" ADD CONSTRAINT "content_page_revisions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;