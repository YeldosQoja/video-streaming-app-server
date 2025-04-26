import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  desc: text("desc"),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }),
});
