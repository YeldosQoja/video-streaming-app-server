CREATE TABLE IF NOT EXISTS "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(60) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"last_updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "categories_id_unique" UNIQUE("id"),
	CONSTRAINT "categories_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" integer GENERATED ALWAYS AS IDENTITY (sequence name "tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(18),
	CONSTRAINT "tags_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "videos_to_tags" (
	"video" integer NOT NULL,
	"tag" integer NOT NULL,
	CONSTRAINT "videos_to_tags_video_tag_pk" PRIMARY KEY("video","tag")
);
--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_parent_comment_comments_id_fk";
--> statement-breakpoint
ALTER TABLE "videos" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "videos_to_playlists" ALTER COLUMN "added_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "category" integer;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "is_for_kids" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "is_age_restricted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "allow_comments" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "allow_downloads" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "last_updated_at" timestamp with time zone NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos_to_tags" ADD CONSTRAINT "videos_to_tags_video_videos_id_fk" FOREIGN KEY ("video") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos_to_tags" ADD CONSTRAINT "videos_to_tags_tag_tags_id_fk" FOREIGN KEY ("tag") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_comments_id_fk" FOREIGN KEY ("parent_comment") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_category_categories_id_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
