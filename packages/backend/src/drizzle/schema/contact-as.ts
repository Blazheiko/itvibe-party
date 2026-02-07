import {
  mysqlTable,
  bigint,
  varchar,
  text,
  datetime,
} from "drizzle-orm/mysql-core";

// Contact As Table
export const contactAs = mysqlTable("contact_as", {
  id: bigint("id", { mode: "bigint", unsigned: true })
    .primaryKey()
    .autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  message: text("message").notNull(),
  createdAt: datetime("created_at").notNull().default(new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .default(new Date())
    .$onUpdate(() => new Date()),
});
