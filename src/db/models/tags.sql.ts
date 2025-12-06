import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const tags = pgTable("tags", {
    id: integer("id").generatedAlwaysAsIdentity().unique(),
    name: varchar("name", { length: 18 }),
})