CREATE TABLE IF NOT EXISTS "playlists" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "playlists_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(60) NOT NULL,
	"desc" varchar(180),
	"thumbnail_storage_key" varchar(60) NOT NULL,
	"author" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"last_updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "playlists_id_unique" UNIQUE("id"),
	CONSTRAINT "playlists_thumbnail_storage_key_unique" UNIQUE("thumbnail_storage_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "videos_to_playlists" (
	"video" integer NOT NULL,
	"playlist" integer NOT NULL,
	"added_at" timestamp with time zone,
	CONSTRAINT "videos_to_playlists_video_playlist_pk" PRIMARY KEY("video","playlist")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playlists" ADD CONSTRAINT "playlists_author_users_id_fk" FOREIGN KEY ("author") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos_to_playlists" ADD CONSTRAINT "videos_to_playlists_video_videos_id_fk" FOREIGN KEY ("video") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos_to_playlists" ADD CONSTRAINT "videos_to_playlists_playlist_playlists_id_fk" FOREIGN KEY ("playlist") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
