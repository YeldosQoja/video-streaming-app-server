ALTER TABLE "posts" RENAME COLUMN "key" TO "storage_key";--> statement-breakpoint
ALTER TABLE "posts" RENAME COLUMN "thumbnail_key" TO "thumbnail_storage_key";--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "public_key" varchar(60) NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_public_key_unique" UNIQUE("public_key");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_storage_key_unique" UNIQUE("storage_key");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_thumbnail_storage_key_unique" UNIQUE("thumbnail_storage_key");