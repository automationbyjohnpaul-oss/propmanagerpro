import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for tests");
}

const url = new URL(databaseUrl);

if (url.hostname !== "localhost") {
  throw new Error(
    `Refusing to run database tests: database host must be localhost, got ${url.hostname}`
  );
}

// Preserve the local PostgreSQL connection details while forcing
// the database name to the dedicated disposable test database.
url.pathname = "/propmanagerpro_test";

process.env.DATABASE_URL = url.toString();

const testUrl = new URL(process.env.DATABASE_URL);

if (
  testUrl.hostname !== "localhost" ||
  testUrl.pathname !== "/propmanagerpro_test"
) {
  throw new Error(
    "Refusing to run database tests: DATABASE_URL must target localhost/propmanagerpro_test"
  );
}
