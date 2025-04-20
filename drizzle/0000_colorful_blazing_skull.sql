CREATE TABLE IF NOT EXISTS "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"username" varchar(50),
	"created_at" timestamp with time zone,
	CONSTRAINT "users_id_unique" UNIQUE("id")
);
