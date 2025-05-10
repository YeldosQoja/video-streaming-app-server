import { relations } from "drizzle-orm";
import { users } from "./users.sql";
import { posts } from "./posts.sql";

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));
