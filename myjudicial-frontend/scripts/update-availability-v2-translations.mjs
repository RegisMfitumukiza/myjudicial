/**
 * update-availability-v2-translations.mjs
 * Adds v2-specific keys to expertDashboard_availability namespace
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "../messages");

const NEW_KEYS = {
  en: {
    calendarTitle: "Availability Calendar",
    calendarSubtitle: "Set your weekly schedule with multiple time blocks per day",
    templates: "Templates",
    saveSchedule: "Save Schedule",
    totalHoursWeek: "Total Hours/Week",
    availableDays: "Available Days",
    timeBlocks: "Time Blocks",
    infoAlert: "Click a day to add or edit time blocks. You can have multiple blocks per day (e.g., morning and afternoon).",
    adjustSettings: "Adjust buffer time and other settings",
    noTimeBlocks: "No time blocks. Click + to add one.",
    copyToWeek: "Copy to all days",
    copiedToWeek: "Copied {day} to all days",
    blockSingular: "block",
    blockPlural: "blocks",
    addTimeBlockTitle: "Add Time Block",
    startTimeLabel: "Start Time",
    endTimeLabel: "End Time",
    endBeforeStartError: "End time must be after start time",
    addBlockBtn: "Add Block",
    applyTemplateTitle: "Apply Template",
    applyTemplateDesc: "Choose a pre-configured schedule template",
    templateLabel: "Template",
    templateReplaceNotice: "This will replace your current schedule with the selected template.",
    applyTemplateBtn: "Apply Template",
    cancel: "Cancel",
    templateApplied: "Template applied",
    removeBlock: "Remove time block",
    templateStandard: "Standard 9-5",
    templatePartTime: "Part-time (Mon/Wed/Fri)",
    templateEvening: "Evening hours (6pm-9pm)",
    templateWeekend: "Weekend only",
    templateLunchBreak: "With lunch break (9-12, 2-5)",
    loadErrorV2: "Failed to load availability",
    loadErrorV2Desc: "There was an error loading your schedule",
  },
  fr: {
    calendarTitle: "Calendrier de Disponibilité",
    calendarSubtitle: "Définissez votre emploi du temps hebdomadaire avec plusieurs plages horaires par jour",
    templates: "Modèles",
    saveSchedule: "Enregistrer le planning",
    totalHoursWeek: "Total Heures/Semaine",
    availableDays: "Jours Disponibles",
    timeBlocks: "Plages Horaires",
    infoAlert: "Cliquez sur un jour pour ajouter ou modifier des plages horaires. Vous pouvez avoir plusieurs plages par jour.",
    adjustSettings: "Ajuster le temps tampon et d'autres paramètres",
    noTimeBlocks: "Aucune plage horaire. Cliquez sur + pour en ajouter une.",
    copyToWeek: "Copier sur tous les jours",
    copiedToWeek: "{day} copié sur tous les jours",
    blockSingular: "plage",
    blockPlural: "plages",
    addTimeBlockTitle: "Ajouter une Plage Horaire",
    startTimeLabel: "Heure de Début",
    endTimeLabel: "Heure de Fin",
    endBeforeStartError: "L'heure de fin doit être après l'heure de début",
    addBlockBtn: "Ajouter la Plage",
    applyTemplateTitle: "Appliquer un Modèle",
    applyTemplateDesc: "Choisissez un modèle de planning préconfigurée",
    templateLabel: "Modèle",
    templateReplaceNotice: "Cela remplacera votre planning actuel par le modèle sélectionné.",
    applyTemplateBtn: "Appliquer le Modèle",
    cancel: "Annuler",
    templateApplied: "Modèle appliqué",
    removeBlock: "Supprimer la plage horaire",
    templateStandard: "Standard 9h-17h",
    templatePartTime: "Temps partiel (Lun/Mer/Ven)",
    templateEvening: "Horaires du soir (18h-21h)",
    templateWeekend: "Week-end uniquement",
    templateLunchBreak: "Avec pause déjeuner (9h-12h, 14h-17h)",
    loadErrorV2: "Impossible de charger les disponibilités",
    loadErrorV2Desc: "Une erreur s'est produite lors du chargement de votre planning",
  },
  rw: {
    calendarTitle: "Kalendari y'Igihe Kirimo",
    calendarSubtitle: "Shiraho gahunda yawe y'icyumweru hamwe n'amasaha menshi ku munsi",
    templates: "Ibikoresho by'Icyitegererezo",
    saveSchedule: "Bika Gahunda",
    totalHoursWeek: "Amasaha Yose/Icyumweru",
    availableDays: "Iminsi Irimo",
    timeBlocks: "Ibice by'Igihe",
    infoAlert: "Kanda ku munsi wongera cyangwa uhindure ibice by'igihe. Urashobora kugira ibice byinshi ku munsi.",
    adjustSettings: "Hindura igihe cyo gutegereza n'indi igenamiterere",
    noTimeBlocks: "Nta gice cy'igihe. Kanda + ongeraho kimwe.",
    copyToWeek: "Gukoporora ku minsi yose",
    copiedToWeek: "{day} gukoporowye ku minsi yose",
    blockSingular: "igice",
    blockPlural: "ibice",
    addTimeBlockTitle: "Ongeraho Igice cy'Igihe",
    startTimeLabel: "Igihe cyo Gutangira",
    endTimeLabel: "Igihe cyo Guhagarara",
    endBeforeStartError: "Igihe cyo guhagarara kigomba kuba nyuma y'igihe cyo gutangira",
    addBlockBtn: "Ongeraho Igice",
    applyTemplateTitle: "Shyira mu Bikorwa Icyitegererezo",
    applyTemplateDesc: "Hitamo icyitegererezo cy'igahunda yateguwe mbere",
    templateLabel: "Icyitegererezo",
    templateReplaceNotice: "Iki gizasimbuza gahunda yawe ya none n'icyitegererezo wahisemo.",
    applyTemplateBtn: "Shyira mu Bikorwa Icyitegererezo",
    cancel: "Reka",
    templateApplied: "Icyitegererezo cyashyizwe mu bikorwa",
    removeBlock: "Siba igice cy'igihe",
    templateStandard: "Gahunda Isanzwe 9h-17h",
    templatePartTime: "Igihe gito (Kwa/Kur/Gwe)",
    templateEvening: "Amasaha ya nimugoroba (18h-21h)",
    templateWeekend: "Iherezo ry'icyumweru gusa",
    templateLunchBreak: "Hamwe n'ikiruhuko cy'ibyakurya (9h-12h, 14h-17h)",
    loadErrorV2: "Gutera gahunda y'igihe byanze",
    loadErrorV2Desc: "Habaye ikosa mu gutura gahunda yawe",
  },
};

const LOCALES = ["en", "fr", "rw"];

for (const locale of LOCALES) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  if (!data["expertDashboard_availability"]) {
    data["expertDashboard_availability"] = {};
  }
  Object.assign(data["expertDashboard_availability"], NEW_KEYS[locale]);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`[${locale}] Updated expertDashboard_availability with v2 keys.`);
}

console.log("Done.");
