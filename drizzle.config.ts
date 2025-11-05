import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./dist/src/db/models",
  dbCredentials: {
    url: process.env["DATABASE_URL"] || "",
  },
});
