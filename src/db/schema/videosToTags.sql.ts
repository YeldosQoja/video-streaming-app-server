import { integer, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { videos } from "./videos.sql.js";
import { tags } from "./tags.sql.js";

export const videosToTags = pgTable(
  "videos_to_tags",
  {
    video: integer("video")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    tag: integer("tag")
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => ({
    cpk: primaryKey({
      columns: [table.video, table.tag],
    }),
  })
);
