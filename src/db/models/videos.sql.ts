import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users.sql";

export const videos = pgTable("videos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity().unique(),
  author: integer("author")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  publicKey: varchar("public_key", { length: 60 }).unique().notNull(),
  storageKey: varchar("storage_key", { length: 60 }).unique().notNull(),
  thumbnailStorageKey: varchar("thumbnail_storage_key", {
    length: 60,
  })
    .unique()
    .notNull(),
  title: varchar("title", { length: 60 }).notNull(),
  desc: text("desc"),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }),
});
