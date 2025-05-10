import { relations } from "drizzle-orm";
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
  authorId: integer("author_id"),
  thumbnailUrl: varchar("thumbnail_url", { length: 120 }).notNull(),
  title: varchar("title", { length: 60 }).notNull(),
  desc: text("desc"),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
