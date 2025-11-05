import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./dist/db/models",
  dbCredentials: {
    url: process.env["DATABASE_URL"] || "",
  },
});
