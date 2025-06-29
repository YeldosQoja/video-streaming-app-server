import { relations } from "drizzle-orm";
import { users } from "./users.sql";
import { videos } from "./videos.sql";

export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
}));
