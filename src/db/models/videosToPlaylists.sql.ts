import { integer, pgTable, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { videos } from "./videos.sql";
import { playlists } from "./playlists.sql";

export const videosToPlaylists = pgTable(
  "videos_to_playlists",
  {
    video: integer("video")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    playlist: integer("playlist")
      .references(() => playlists.id, { onDelete: "cascade" })
      .notNull(),
    addedAt: timestamp("added_at", {
      mode: "string",
      withTimezone: true,
    }),
  },
  (table) => ({
    cpk: primaryKey({
      columns: [table.video, table.playlist],
    }),
  })
);
