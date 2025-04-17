-- Make userId nullable in Chat table
ALTER TABLE "Chat" ALTER COLUMN "userId" DROP NOT NULL;