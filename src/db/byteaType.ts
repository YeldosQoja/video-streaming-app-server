import { customType } from "drizzle-orm/pg-core";

export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
  toDriver(value) {
    return "\\x" + value.toString("hex");
  },
});
