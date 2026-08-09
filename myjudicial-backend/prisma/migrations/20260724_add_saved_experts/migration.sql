-- CreateTable
CREATE TABLE "saved_experts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expert_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_experts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_experts_user_id_expert_id_key" ON "saved_experts"("user_id", "expert_id");

-- CreateIndex
CREATE INDEX "saved_experts_user_id_idx" ON "saved_experts"("user_id");

-- CreateIndex
CREATE INDEX "saved_experts_expert_id_idx" ON "saved_experts"("expert_id");

-- AddForeignKey
ALTER TABLE "saved_experts" ADD CONSTRAINT "saved_experts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_experts" ADD CONSTRAINT "saved_experts_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "experts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
