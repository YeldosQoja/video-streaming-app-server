import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users.sql";

export const posts = pgTable("posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity().unique(),
  author: integer("author")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 120 }).notNull(),
  title: varchar("title", { length: 60 }).notNull(),
  desc: text("desc"),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }),
});
