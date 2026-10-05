import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const setting = await prisma.platformSetting.findFirst({
    where: { key: "PLATFORM_SETTINGS" },
  });

  if (setting && setting.value) {
    const val = typeof setting.value === "string" ? JSON.parse(setting.value) : { ...setting.value };
    val.dpoContactEmail = "support@myjudicial.com";
    await prisma.platformSetting.update({
      where: { id: setting.id },
      data: { value: val },
    });
    console.log("✅ Successfully updated dpoContactEmail to support@myjudicial.com in database");
  } else {
    console.log("No PLATFORM_SETTINGS row found in DB to update.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
