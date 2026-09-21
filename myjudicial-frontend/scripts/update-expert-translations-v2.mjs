/**
 * update-expert-translations-v2.mjs
 * Adds expertDashboard_compliance namespace and other missing keys
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "../messages");

const LOCALES = ["en", "fr", "rw"];

/** Keys to add per locale */
const NEW_KEYS = {
  /** Compliance page namespace */
  expertDashboard_compliance: {
    en: {
      title: "Compliance & Credentials",
      subtitle: "Monitor your verification status and credential validity",
      uploadDocuments: "Upload Documents",
      loadError: "Failed to load compliance data. Please try again.",
      criticalTitle: "Critical",
      criticalDesc: "Requires immediate action",
      warningsTitle: "Warnings",
      warningsDesc: "Due within the next 30 days",
      compliantTitle: "Compliant",
      compliantDesc: "All obligations up to date",
      credentialsTitle: "Expert Credentials",
      credentialsExpiry: "Credentials Expiry",
      daysUntilExpiry: "Days Until Expiry",
      lastVerification: "Last Verification",
      rejectionReason: "Rejection Reason",
      expired: "Expired",
      daysRemaining: "{days} days",
      statusExpired: "Expired",
      statusSuspended: "Suspended",
      statusDraft: "Draft",
      statusPendingReview: "Pending Review",
      statusCompliant: "Compliant",
      statusRejected: "Rejected",
      actionRequired: "Action Required",
      actionExpiredDesc: "Your credentials have expired. Upload renewed documents to restore your account.",
      actionSuspendedDesc: "Your account has been suspended. Contact support or upload updated verification documents.",
      uploadNewDocuments: "Upload New Documents",
    },
    fr: {
      title: "Conformité & Accréditations",
      subtitle: "Surveillez votre statut de vérification et la validité de vos accréditations",
      uploadDocuments: "Téléverser les documents",
      loadError: "Échec du chargement des données de conformité. Veuillez réessayer.",
      criticalTitle: "Critique",
      criticalDesc: "Nécessite une action immédiate",
      warningsTitle: "Avertissements",
      warningsDesc: "Échéance dans les 30 prochains jours",
      compliantTitle: "Conforme",
      compliantDesc: "Toutes les obligations sont à jour",
      credentialsTitle: "Accréditations d'expert",
      credentialsExpiry: "Expiration des accréditations",
      daysUntilExpiry: "Jours jusqu'à l'expiration",
      lastVerification: "Dernière vérification",
      rejectionReason: "Motif de rejet",
      expired: "Expiré",
      daysRemaining: "{days} jours",
      statusExpired: "Expiré",
      statusSuspended: "Suspendu",
      statusDraft: "Brouillon",
      statusPendingReview: "En cours d'examen",
      statusCompliant: "Conforme",
      statusRejected: "Rejeté",
      actionRequired: "Action requise",
      actionExpiredDesc: "Vos accréditations ont expiré. Téléversez des documents renouvelés pour restaurer votre compte.",
      actionSuspendedDesc: "Votre compte a été suspendu. Contactez le support ou téléversez des documents de vérification mis à jour.",
      uploadNewDocuments: "Téléverser de nouveaux documents",
    },
    rw: {
      title: "Ubujurire & Impamyabumenyi",
      subtitle: "Genzura intera y'igeragezwa ryawe n'igihe cy'impamyabumenyi zawe",
      uploadDocuments: "Tanga Inyandiko",
      loadError: "Gutera amakuru y'ubujurire byanze. Ongera ugerageze.",
      criticalTitle: "Byihutirwa",
      criticalDesc: "Bisabwa gufata ingamba vuba",
      warningsTitle: "Ibyitonderwa",
      warningsDesc: "Birangira mu minsi 30 iri imbere",
      compliantTitle: "Bujuje",
      compliantDesc: "Inshingano zose zuzuwe",
      credentialsTitle: "Impamyabumenyi z'inzobere",
      credentialsExpiry: "Irangira ry'impamyabumenyi",
      daysUntilExpiry: "Iminsi isigaye",
      lastVerification: "Igeragezwa rya nyuma",
      rejectionReason: "Impamvu yo kwangwa",
      expired: "Yarangiye",
      daysRemaining: "Iminsi {days}",
      statusExpired: "Yarangiye",
      statusSuspended: "Hagaritswe",
      statusDraft: "Inyandikomvugo",
      statusPendingReview: "Itegerezwa isuzumwa",
      statusCompliant: "Bujuje",
      statusRejected: "Yanzwe",
      actionRequired: "Ingamba Bisabwa",
      actionExpiredDesc: "Impamyabumenyi zawe zarangiye. Tanga inyandiko nshya kugira ngo konti yawe izasubizwe.",
      actionSuspendedDesc: "Konti yawe hagaritswe. Vugana n'inkunga cyangwa tanga inyandiko zivugurura.",
      uploadNewDocuments: "Tanga Inyandiko Nshya",
    },
  },

  /** Earnings page - add paymentsDisabled key */
  expertDashboard_earnings: {
    en: {
      paymentsDisabled: "Payments are currently disabled on the platform. Earnings and payouts will appear here once payments are re-enabled.",
      failedToLoad: "Failed to load earnings data. Please try again.",
    },
    fr: {
      paymentsDisabled: "Les paiements sont actuellement désactivés sur la plateforme. Les gains et versements apparaîtront ici une fois les paiements réactivés.",
      failedToLoad: "Échec du chargement des données de gains. Veuillez réessayer.",
    },
    rw: {
      paymentsDisabled: "Kwishyura guhagaritswe ku mbuga. Inyungu n'ubwishyu bizagaragara hano ubwishyura busubizwe.",
      failedToLoad: "Gutera amakuru y'inyungu byanze. Ongera ugerageze.",
    },
  },

  /** Profile page - active sessions localization */
  expertDashboard_profile: {
    en: {
      bioField: "Bio",
      saveLanguageBtn: "Save Language Preference",
      saveNotifsBtn: "Save Notification Preferences",
    },
    fr: {
      bioField: "Biographie",
      saveLanguageBtn: "Enregistrer la préférence de langue",
      saveNotifsBtn: "Enregistrer les préférences de notification",
    },
    rw: {
      bioField: "Amagambo y'ubwisanzure",
      saveLanguageBtn: "Bika itegeko ry'ururimi",
      saveNotifsBtn: "Bika ibiteganyo by'imenyesha",
    },
  },
};

function deepMerge(target, source) {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value) && typeof result[key] === "object") {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

for (const locale of LOCALES) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  for (const [namespace, localeMap] of Object.entries(NEW_KEYS)) {
    const newEntries = localeMap[locale];
    if (!newEntries) continue;

    if (!data[namespace]) {
      data[namespace] = newEntries;
      console.log(`[${locale}] Created namespace: ${namespace}`);
    } else {
      // Merge — only add missing keys
      let added = 0;
      for (const [key, value] of Object.entries(newEntries)) {
        if (!(key in data[namespace])) {
          data[namespace][key] = value;
          added++;
        }
      }
      if (added > 0) console.log(`[${locale}] Added ${added} keys to ${namespace}`);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`[${locale}] Saved.`);
}

console.log("Done.");
