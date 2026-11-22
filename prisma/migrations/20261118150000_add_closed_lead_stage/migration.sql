-- Add a terminal "Closed" stage, used after a lead is Converted to mark the
-- deal as fully wrapped up (order complete). Purely additive — no data remap needed.
ALTER TYPE "LeadStage" ADD VALUE 'CLOSED';
