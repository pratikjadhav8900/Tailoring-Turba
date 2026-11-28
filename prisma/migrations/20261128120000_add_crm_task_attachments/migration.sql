-- Lets a LeadTask (e.g. a "Send Quotation" request handed to another
-- department) carry uploaded file URLs, same convention as
-- ProductionStageExecution.attachments / GoodsMovement.attachments.
-- Purely additive, defaults to an empty array, zero historical impact.
ALTER TABLE "LeadTask" ADD COLUMN "attachments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
