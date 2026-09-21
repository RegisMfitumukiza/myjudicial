/**
 * update-expert-services-translations.mjs
 * Adds expertServices namespace and common.inProgress to en.json, fr.json, and rw.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.join(__dirname, "../messages");

const LOCALES = ["en", "fr", "rw"];

const TRANSLATIONS = {
  common: {
    en: {
      inProgress: "In progress",
    },
    fr: {
      inProgress: "En cours",
    },
    rw: {
      inProgress: "Biri gukorwa",
    },
  },
  expertServices: {
    en: {
      title: "Services & Pricing",
      subtitle: "Manage your consultation services, fees, and delivery methods",
      addService: "Add Service",
      editService: "Edit Service",
      saveService: "Save Service",
      deleteService: "Delete Service",
      noServicesAdded: "No services added yet",
      noServicesDesc: "Create your first legal service to start receiving bookings from clients",
      unverifiedNotice: "Your profile is not yet verified. You can manage services, but they will not be visible to clients until verification is complete.",
      failedToLoad: "Failed to load services. Please try again.",
      confirmDelete: "Are you sure you want to delete this service? This action cannot be undone.",
      serviceDeleted: "Service deleted successfully.",
      active: "Active",
      inactive: "Inactive",
      defaultService: "Default Service",
      serviceName: "Service Name",
      serviceDescription: "Service Description",
      serviceCategory: "Service Category",
      deliveryMethod: "Delivery Method",
      durationMinutes: "Duration (minutes)",
      fee: "Flat Fee",
      validationName: "Name must be at least 2 characters.",
      validationDuration: "Duration must be between 15 and 480 minutes.",
      validationFee: "Fee must be a positive number.",
      category: {
        consultation: "Consultation",
        documentReview: "Document Review",
        contractDrafting: "Contract Drafting",
        courtRepresentation: "Court Representation",
        legalAdvice: "Legal Advice",
        mediation: "Mediation",
        other: "Other",
      },
      deliveryMode: {
        video: "Video Call",
        phone: "Phone Call",
        inPerson: "In-Person",
        email: "Email Consultation",
      },
    },
    fr: {
      title: "Services & Tarification",
      subtitle: "Gérez vos services de consultation, vos honoraires et modes de prestation",
      addService: "Ajouter un service",
      editService: "Modifier le service",
      saveService: "Enregistrer le service",
      deleteService: "Supprimer le service",
      noServicesAdded: "Aucun service ajouté pour le moment",
      noServicesDesc: "Créez votre premier service juridique pour commencer à recevoir des réservations",
      unverifiedNotice: "Votre profil n'est pas encore vérifié. Vous pouvez gérer vos services, mais ils ne seront visibles aux clients qu'une fois la vérification terminée.",
      failedToLoad: "Échec du chargement des services. Veuillez réessayer.",
      confirmDelete: "Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.",
      serviceDeleted: "Service supprimé avec succès.",
      active: "Actif",
      inactive: "Inactif",
      defaultService: "Service par défaut",
      serviceName: "Nom du service",
      serviceDescription: "Description du service",
      serviceCategory: "Catégorie de service",
      deliveryMethod: "Mode de prestation",
      durationMinutes: "Durée (minutes)",
      fee: "Tarif forfaitaire",
      validationName: "Le nom doit comporter au moins 2 caractères.",
      validationDuration: "La durée doit être comprise entre 15 et 480 minutes.",
      validationFee: "Le tarif doit être un montant positif.",
      category: {
        consultation: "Consultation",
        documentReview: "Examen de documents",
        contractDrafting: "Rédaction de contrats",
        courtRepresentation: "Représentation au tribunal",
        legalAdvice: "Conseil juridique",
        mediation: "Médiation",
        other: "Autre",
      },
      deliveryMode: {
        video: "Appel vidéo",
        phone: "Appel téléphonique",
        inPerson: "En personne",
        email: "Consultation par e-mail",
      },
    },
    rw: {
      title: "Serivisi & Ibiciro",
      subtitle: "Genzura serivisi zawe z'inama z'amategeko, ibiciro n'uburyo bwo gutanga ubufasha",
      addService: "Ongeraho Serivisi",
      editService: "Hindura Serivisi",
      saveService: "Bika Serivisi",
      deleteService: "Siba Serivisi",
      noServicesAdded: "Nta serivisi zirongerwaho",
      noServicesDesc: "Kora serivisi yawe y'amategeko ya mbere kugira ngo utangire kwakira ubusabe bw'abakiriya",
      unverifiedNotice: "Konti yawe ntirageragezwa. Urashobora gutunganya serivisi, ariko ntizizagaragara ku bakiriya kugeza igeragezwa rirangiye.",
      failedToLoad: "Gutera serivisi byanze. Ongera ugerageze.",
      confirmDelete: "Uzi neza ko ushaka gusiba iyi serivisi? Iki gikorwa ntigishobora gusubizwa inyuma.",
      serviceDeleted: "Serivisi yasibwe neza.",
      active: "Bikora",
      inactive: "Ntibikora",
      defaultService: "Serivisi y'ibanze",
      serviceName: "Izina rya Serivisi",
      serviceDescription: "Ibisobanuro bya Serivisi",
      serviceCategory: "Icyiciro cya Serivisi",
      deliveryMethod: "Uburyo bwo Gutanga",
      durationMinutes: "Igihe (iminota)",
      fee: "Igiciro cyose hamwe",
      validationName: "Izina rigomba kugira byibuze inyuguti 2.",
      validationDuration: "Igihe kigomba kuba hagati y'iminota 15 na 480.",
      validationFee: "Igiciro kigomba kuba umubare muzima.",
      category: {
        consultation: "Inama z'amategeko",
        documentReview: "Isuzuma ry'inyandiko",
        contractDrafting: "Kwandika amasezerano",
        courtRepresentation: "Guhagararira mu rukiko",
        legalAdvice: "Ubufasha mu by'amategeko",
        mediation: "Ubwumvikane",
        other: "Ikindi",
      },
      deliveryMode: {
        video: "Ihamagara rya Videwo",
        phone: "Ihamagara rya Telefoni",
        inPerson: "Imbonankubone",
        email: "Inama kuri Imeyili",
      },
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

  for (const [namespace, localeMap] of Object.entries(TRANSLATIONS)) {
    const newEntries = localeMap[locale];
    if (!newEntries) continue;

    if (!data[namespace]) {
      data[namespace] = newEntries;
      console.log(`[${locale}] Created namespace: ${namespace}`);
    } else {
      data[namespace] = deepMerge(data[namespace], newEntries);
      console.log(`[${locale}] Merged into namespace: ${namespace}`);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`[${locale}] Successfully saved.`);
}

console.log("Services translations update complete.");
