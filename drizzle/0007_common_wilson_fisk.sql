ALTER TABLE "posts" RENAME COLUMN "thumbnail_url" TO "thumbnail_key";--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "thumbnail_key" SET DATA TYPE varchar(60);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "key" varchar(60) NOT NULL;