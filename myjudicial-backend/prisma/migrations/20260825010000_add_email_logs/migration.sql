-- Add EmailLog table for transactional email outcome tracking

CREATE TYPE "EmailLogStatus" AS ENUM ('SENT', 'FAILED');

CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT,
    "template" TEXT,
    "status" "EmailLogStatus" NOT NULL DEFAULT 'SENT',
    "error" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_logs_sent_at_idx" ON "email_logs"("sent_at");
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");
