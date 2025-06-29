ALTER TABLE "comments" RENAME COLUMN "post" TO "video";--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_post_videos_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_video_videos_id_fk" FOREIGN KEY ("video") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
