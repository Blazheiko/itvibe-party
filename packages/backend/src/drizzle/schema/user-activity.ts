import {
  mysqlTable,
  bigint,
  varchar,
  text,
  int,
  date,
  datetime,
  index,
} from "drizzle-orm/mysql-core";

// User Activity Table - отслеживание активности уникальных пользователей за сутки
export const userActivity = mysqlTable("user_activity", {
  id: bigint("id", { mode: "bigint", unsigned: true })
    .primaryKey()
    .autoincrement(),
  token: varchar("token", { length: 255 }).notNull(),
  userAgent: text("user_agent").notNull(),
  ip: varchar("ip", { length: 45 }).notNull(),
  countClick: int("count_click").notNull().default(0),
  clickBooking: int("click_booking").notNull().default(0),
  date: date("date").notNull(),
  referer: varchar("referer", { length: 512 }),
  path: varchar("path", { length: 512 }).notNull(),
  deviceType: varchar("device_type", { length: 50 }),
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  createdAt: datetime("created_at").notNull().default(new Date()),
  updatedAt: datetime("updated_at")
    .notNull()
    .default(new Date())
    .$onUpdate(() => new Date()),
});

// Индексы для таблицы user_activity
export const userActivityDateIdx = index("date_idx").on(userActivity.date);
export const userActivityTokenIdx = index("token_idx").on(userActivity.token);
export const userActivityDateTokenIdx = index("date_token_idx").on(
  userActivity.date,
  userActivity.token
);
export const userActivityIpIdx = index("ip_idx").on(userActivity.ip);
