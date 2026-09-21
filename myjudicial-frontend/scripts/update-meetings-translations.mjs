import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "../messages");

const LOCALES = ["en", "fr", "rw"];

const NEW_KEYS = {
  en: { client: "Client" },
  fr: { client: "Client" },
  rw: { client: "Umukiriya" },
};

for (const locale of LOCALES) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  if (!data["expertDashboard_meetings"]) data["expertDashboard_meetings"] = {};
  Object.assign(data["expertDashboard_meetings"], NEW_KEYS[locale]);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`[${locale}] Updated meetings keys`);
}
