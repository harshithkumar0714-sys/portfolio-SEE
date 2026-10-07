import app from "./app.js";
import { prisma } from "./config/database.js";

const port = Number(process.env.PORT ?? 4000);

const server = app.listen(port, () => console.log(`SmartStudy API listening on port ${port}`));

async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
