CREATE TABLE IF NOT EXISTS "posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(120) NOT NULL,
	"desc" text,
	"created_at" timestamp with time zone,
	CONSTRAINT "posts_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "salt" varchar(16) NOT NULL;