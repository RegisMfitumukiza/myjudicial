import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "../messages");

const LOCALES = ["en", "fr", "rw"];

const NEW_KEYS = {
  en: {
    previousPeriod: "Previous period",
    nextPeriod: "Next period",
    loadingCalendar: "Loading calendar",
  },
  fr: {
    previousPeriod: "Période précédente",
    nextPeriod: "Période suivante",
    loadingCalendar: "Chargement du calendrier",
  },
  rw: {
    previousPeriod: "Igihe cyashize",
    nextPeriod: "Igihe gikurikira",
    loadingCalendar: "Kalendari irimo gutangira",
  },
};

for (const locale of LOCALES) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  if (!data["expertDashboard_calendar"]) data["expertDashboard_calendar"] = {};
  Object.assign(data["expertDashboard_calendar"], NEW_KEYS[locale]);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`[${locale}] Updated calendar keys`);
}
