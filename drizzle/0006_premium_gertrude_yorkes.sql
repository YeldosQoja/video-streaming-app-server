ALTER TABLE "posts" RENAME COLUMN "author_id" TO "author";--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "author" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "posts_author_users_id_fk" FOREIGN KEY ("author") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
