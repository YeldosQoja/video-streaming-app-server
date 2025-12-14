import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users.sql.js";

export const playlists = pgTable("playlists", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey().unique(),
  title: varchar("title", { length: 60 }).notNull(),
  desc: varchar("desc", { length: 180 }),
  thumbnailStorageKey: varchar("thumbnail_storage_key", {
    length: 60,
  })
    .unique()
    .notNull(),
  author: integer("author")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
  lastUpdatedAt: timestamp("last_updated_at", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
});
