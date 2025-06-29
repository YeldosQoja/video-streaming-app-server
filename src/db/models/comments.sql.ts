import {
  foreignKey,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.sql";
import { videos } from "./videos.sql";

export const comments = pgTable(
  "comments",
  {
    id: integer("id").unique().generatedAlwaysAsIdentity().primaryKey(),
    author: integer("author")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    video: integer("video")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    parentComment: integer("parent_comment"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => ({
    cfk: foreignKey({
      columns: [table.parentComment],
      foreignColumns: [table.id],
    }),
  })
);
