ALTER TABLE "posts" RENAME TO "videos";--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT "posts_id_unique";--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT "posts_public_key_unique";--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT "posts_storage_key_unique";--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT "posts_thumbnail_storage_key_unique";--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_post_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT "posts_author_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_post_videos_id_fk" FOREIGN KEY ("post") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_author_users_id_fk" FOREIGN KEY ("author") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_public_key_unique" UNIQUE("public_key");--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_storage_key_unique" UNIQUE("storage_key");--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_thumbnail_storage_key_unique" UNIQUE("thumbnail_storage_key");