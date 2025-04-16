ALTER TABLE "User" ADD COLUMN "resetToken" varchar(64);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "resetTokenExpiry" timestamp;