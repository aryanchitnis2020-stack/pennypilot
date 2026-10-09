-- Store each user's PennyPilot frontend state without losing existing records.
ALTER TABLE "User" ADD COLUMN "appData" JSONB;
ALTER TABLE "User" ADD COLUMN "dataVersion" INTEGER NOT NULL DEFAULT 0;
