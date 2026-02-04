import { defineConfig } from "drizzle-kit";

type SSLMode = "require" | "allow" | "prefer" | "verify-full";

export default defineConfig({
  dialect: "postgresql",
  schema: "./dist/db/schema/*",
  dbCredentials: {
    host: process.env["DB_HOST"] || "",
    port: parseInt(process.env["DB_PORT"] || "5432"),
    user: process.env["DB_USER"] || "",
    database: process.env["DB_NAME"] || "",
    password: process.env["DB_PASSWORD"] || "secret",
    ssl: (process.env["DB_SSL"] as SSLMode) || "prefer",
  },
});
