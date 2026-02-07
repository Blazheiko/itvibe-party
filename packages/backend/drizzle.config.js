import { defineConfig } from "drizzle-kit";

// Читаем настройки напрямую из переменных окружения
// чтобы избежать проблем с импортом TypeScript модулей
const dbConfig = {
  host: process.env.MYSQL_HOST ?? "127.0.0.1",
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? "root",
  password: process.env.MYSQL_PASSWORD ?? "",
  database: process.env.MYSQL_DB_NAME ?? "cosmetology",
};

export default defineConfig({
  schema: "./src/drizzle/schema/index.ts",
  out: "./src/drizzle/migrations",
  dialect: "mysql",
  dbCredentials: {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    ...(dbConfig.password ? { password: dbConfig.password } : {}),
    database: dbConfig.database,
  },
  migrations: {
    table: "__drizzle_migrations",
    schema: "drizzle",
  },
  verbose: true,
  strict: true,
});
