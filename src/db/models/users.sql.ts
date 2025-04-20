import { pgTable, integer, varchar, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity().unique(),
    firstName: varchar("first_name", { length: 50 }).notNull(),
    lastName: varchar("last_name", { length: 50 }).notNull(),
    email: varchar("email", { length: 50 }).unique(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    password: varchar("password", { length: 64 }).notNull(),
    salt: varchar("salt", { length: 16 }).notNull(),
    createdAt: timestamp("created_at", { 
        mode: "string",
        withTimezone: true,
    }),
});