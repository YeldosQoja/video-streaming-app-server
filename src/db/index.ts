import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

export const pool = new pg.Pool({
    connectionString: process.env["DATABASE_URL"],
});

export const db = drizzle(pool, {
    schema: {
        casing: "snake_case",
    },
});