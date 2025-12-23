import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users.sql.js";
import { categories } from "./categories.sql.js";

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
  category: integer("category").references(() => categories.id, {
    onDelete: "set null",
  }),
  status: varchar("status", { length: 24 }).notNull().default("PROCESSING"),
  isForKids: boolean("is_for_kids").default(false),
  isAgeRestricted: boolean("is_age_restricted").default(false),
  allowComments: boolean("allow_comments").default(true),
  allowDownloads: boolean("allow_downloads").default(false),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
  lastUpdatedAt: timestamp("last_updated_at", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
});
