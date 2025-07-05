import { relations } from "drizzle-orm";
import { users } from "./users.sql.js";
import { videos } from "./videos.sql.js";
import { videosToPlaylists } from "./videosToPlaylists.sql.js";
import { playlists } from "./playlists.sql.js";
import { comments } from "./comments.sql.js";

export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ many }) => ({
  comments: many(comments),
  videosToPlaylists: many(videosToPlaylists),
}));

export const playlistsRelations = relations(playlists, ({ many }) => ({
  videosToPlaylists: many(videosToPlaylists),
}));

export const videosToPlaylistsRelations = relations(
  videosToPlaylists,
  ({ one }) => ({
    video: one(videos, {
      fields: [videosToPlaylists.video],
      references: [videos.id],
    }),
    playlist: one(playlists, {
      fields: [videosToPlaylists.playlist],
      references: [playlists.id],
    }),
  })
);
