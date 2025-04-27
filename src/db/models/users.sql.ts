import { pgTable, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { bytea } from "../byteaType";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity().unique(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  email: varchar("email", { length: 50 }).unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: bytea("password").notNull(),
  salt: bytea("salt").notNull(),
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  }),
});
