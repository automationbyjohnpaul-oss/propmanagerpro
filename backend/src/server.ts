import app from "./app";

const PORT = process.env.PORT || 4000;

console.log("=================================");
console.log("🚀 BOOTING PROP MANAGER PRO");
console.log("=================================");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", PORT);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);

try {
  const server = app.listen(PORT, () => {
    console.log("=================================");
    console.log("🚀 SERVER STARTED SUCCESSFULLY");
    console.log(`📡 Running on port ${PORT}`);
    console.log("=================================");
  });

  server.on("error", (err) => {
    console.error("❌ SERVER ERROR:");
    console.error(err);
  });

  process.on("uncaughtException", (err) => {
    console.error("❌ UNCAUGHT EXCEPTION:");
    console.error(err);
  });

  process.on("unhandledRejection", (err) => {
    console.error("❌ UNHANDLED REJECTION:");
    console.error(err);
  });
} catch (err) {
  console.error("❌ CRITICAL STARTUP FAILURE:");
  console.error(err);
  process.exit(1);
}
