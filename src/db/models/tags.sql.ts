import { index, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const tags = pgTable(
  "tags",
  {
    id: integer("id").generatedAlwaysAsIdentity().unique(),
    name: varchar("name", { length: 18 }).unique().notNull(),
    count: integer("count").default(1).notNull(),
  },
  (t) => ({
    nameIdx: index("tags_name_idx").on(t.name),
  })
);
