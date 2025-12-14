import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./dist/db/schema/*",
  dbCredentials: {
    url: process.env["DATABASE_URL"] || "",
  },
});
