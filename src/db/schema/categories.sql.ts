import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey().unique(),
  title: varchar("title", { length: 60 }).notNull().unique(),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
  lastUpdatedAt: timestamp("last_updated_at", {
    mode: "string",
    withTimezone: true,
  }).notNull(),
});
