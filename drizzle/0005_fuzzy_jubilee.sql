ALTER TABLE "posts" ALTER COLUMN "title" SET DATA TYPE varchar(60);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "author_id" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "thumbnail_url" varchar(120) NOT NULL;