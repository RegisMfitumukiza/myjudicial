/**
 * Authoritative Rwanda Administrative Divisions Dataset
 * 
 * Source: National Institute of Statistics of Rwanda (NISR) standard administrative divisions
 * (Law N° 29/2005 of 23/12/2005 and 2006 Administrative Reform).
 * Includes:
 * - 5 Provinces (Level 1 / Intara / Umujyi wa Kigali)
 * - 30 Districts (Level 2 / Uturere)
 * - 416 Sectors (Level 3 / Imirenge)
 * 
 * Normalized names are lowercased and stripped of accents/special characters for robust search.
 * Representative centroid coordinates are provided for every administrative division.
 */

export interface RawDivision {
  code: string;
  name: string;
  level: "PROVINCE" | "DISTRICT" | "SECTOR";
  parentCode?: string;
  latitude: number;
  longitude: number;
  aliases?: string[];
}

export const RWANDA_PROVINCES: RawDivision[] = [
  { code: "01", name: "Kigali City", level: "PROVINCE", latitude: -1.9441, longitude: 30.0619, aliases: ["Umujyi wa Kigali", "Kigali"] },
  { code: "02", name: "Southern Province", level: "PROVINCE", latitude: -2.3333, longitude: 29.7333, aliases: ["Amajyepfo", "Sud"] },
  { code: "03", name: "Western Province", level: "PROVINCE", latitude: -2.2167, longitude: 29.2500, aliases: ["Iburengerazuba", "Ouest"] },
  { code: "04", name: "Northern Province", level: "PROVINCE", latitude: -1.5000, longitude: 29.9167, aliases: ["Amajyaruguru", "Nord"] },
  { code: "05", name: "Eastern Province", level: "PROVINCE", latitude: -1.8333, longitude: 30.5833, aliases: ["Iburasirazuba", "Est"] },
];

export const RWANDA_DISTRICTS: RawDivision[] = [
  // ── Kigali City (01) ──
  { code: "0101", name: "Nyarugenge", level: "DISTRICT", parentCode: "01", latitude: -1.9540, longitude: 30.0520, aliases: ["Akarere ka Nyarugenge"] },
  { code: "0102", name: "Gasabo", level: "DISTRICT", parentCode: "01", latitude: -1.9356, longitude: 30.1086, aliases: ["Akarere ka Gasabo"] },
  { code: "0103", name: "Kicukiro", level: "DISTRICT", parentCode: "01", latitude: -1.9864, longitude: 30.1019, aliases: ["Akarere ka Kicukiro"] },

  // ── Southern Province (02) ──
  { code: "0201", name: "Nyanza", level: "DISTRICT", parentCode: "02", latitude: -2.3667, longitude: 29.7500, aliases: ["Akarere ka Nyanza"] },
  { code: "0202", name: "Gisagara", level: "DISTRICT", parentCode: "02", latitude: -2.5333, longitude: 29.8333, aliases: ["Akarere ka Gisagara"] },
  { code: "0203", name: "Nyaruguru", level: "DISTRICT", parentCode: "02", latitude: -2.6167, longitude: 29.4333, aliases: ["Akarere ka Nyaruguru"] },
  { code: "0204", name: "Huye", level: "DISTRICT", parentCode: "02", latitude: -2.5833, longitude: 29.7333, aliases: ["Butare", "Akarere ka Huye"] },
  { code: "0205", name: "Nyamagabe", level: "DISTRICT", parentCode: "02", latitude: -2.4833, longitude: 29.5000, aliases: ["Gikongoro", "Akarere ka Nyamagabe"] },
  { code: "0206", name: "Ruhango", level: "DISTRICT", parentCode: "02", latitude: -2.1667, longitude: 29.7833, aliases: ["Akarere ka Ruhango"] },
  { code: "0207", name: "Muhanga", level: "DISTRICT", parentCode: "02", latitude: -2.0833, longitude: 29.7333, aliases: ["Gitarama", "Akarere ka Muhanga"] },
  { code: "0208", name: "Kamonyi", level: "DISTRICT", parentCode: "02", latitude: -2.0833, longitude: 29.8000, aliases: ["Akarere ka Kamonyi"] },

  // ── Western Province (03) ──
  { code: "0301", name: "Karongi", level: "DISTRICT", parentCode: "03", latitude: -2.0000, longitude: 29.3833, aliases: ["Kibuye", "Akarere ka Karongi"] },
  { code: "0302", name: "Rutsiro", level: "DISTRICT", parentCode: "03", latitude: -1.8667, longitude: 29.3333, aliases: ["Akarere ka Rutsiro"] },
  { code: "0303", name: "Rubavu", level: "DISTRICT", parentCode: "03", latitude: -1.6833, longitude: 29.3333, aliases: ["Gisenyi", "Akarere ka Rubavu"] },
  { code: "0304", name: "Nyabihu", level: "DISTRICT", parentCode: "03", latitude: -1.6500, longitude: 29.5000, aliases: ["Akarere ka Nyabihu"] },
  { code: "0305", name: "Ngororero", level: "DISTRICT", parentCode: "03", latitude: -1.7500, longitude: 29.5167, aliases: ["Akarere ka Ngororero"] },
  { code: "0306", name: "Rusizi", level: "DISTRICT", parentCode: "03", latitude: -2.4667, longitude: 28.9000, aliases: ["Cyangugu", "Akarere ka Rusizi"] },
  { code: "0307", name: "Nyamasheke", level: "DISTRICT", parentCode: "03", latitude: -2.3000, longitude: 29.1333, aliases: ["Akarere ka Nyamasheke"] },

  // ── Northern Province (04) ──
  { code: "0401", name: "Rulindo", level: "DISTRICT", parentCode: "04", latitude: -1.7667, longitude: 29.9833, aliases: ["Akarere ka Rulindo"] },
  { code: "0402", name: "Gakenke", level: "DISTRICT", parentCode: "04", latitude: -1.6833, longitude: 29.7833, aliases: ["Akarere ka Gakenke"] },
  { code: "0403", name: "Musanze", level: "DISTRICT", parentCode: "04", latitude: -1.4833, longitude: 29.6333, aliases: ["Ruhengeri", "Akarere ka Musanze"] },
  { code: "0404", name: "Burera", level: "DISTRICT", parentCode: "04", latitude: -1.4833, longitude: 29.8667, aliases: ["Akarere ka Burera"] },
  { code: "0405", name: "Gicumbi", level: "DISTRICT", parentCode: "04", latitude: -1.5833, longitude: 30.1167, aliases: ["Byumba", "Akarere ka Gicumbi"] },

  // ── Eastern Province (05) ──
  { code: "0501", name: "Rwamagana", level: "DISTRICT", parentCode: "05", latitude: -1.9333, longitude: 30.4333, aliases: ["Akarere ka Rwamagana"] },
  { code: "0502", name: "Nyagatare", level: "DISTRICT", parentCode: "05", latitude: -1.3000, longitude: 30.3167, aliases: ["Akarere ka Nyagatare"] },
  { code: "0503", name: "Gatsibo", level: "DISTRICT", parentCode: "05", latitude: -1.5833, longitude: 30.4167, aliases: ["Akarere ka Gatsibo"] },
  { code: "0504", name: "Kayonza", level: "DISTRICT", parentCode: "05", latitude: -1.8833, longitude: 30.6167, aliases: ["Akarere ka Kayonza"] },
  { code: "0505", name: "Kirehe", level: "DISTRICT", parentCode: "05", latitude: -2.2167, longitude: 30.7167, aliases: ["Akarere ka Kirehe"] },
  { code: "0506", name: "Ngoma", level: "DISTRICT", parentCode: "05", latitude: -2.1833, longitude: 30.5167, aliases: ["Kibungo", "Akarere ka Ngoma"] },
  { code: "0507", name: "Bugesera", level: "DISTRICT", parentCode: "05", latitude: -2.2167, longitude: 30.2833, aliases: ["Nyamata", "Akarere ka Bugesera"] },
];

export const RWANDA_SECTORS: RawDivision[] = [
  // ── Nyarugenge District (0101) ──
  { code: "010101", name: "Gitega", level: "SECTOR", parentCode: "0101", latitude: -1.9500, longitude: 30.0550 },
  { code: "010102", name: "Kanyinya", level: "SECTOR", parentCode: "0101", latitude: -1.9167, longitude: 30.0167 },
  { code: "010103", name: "Kigali", level: "SECTOR", parentCode: "0101", latitude: -1.9441, longitude: 30.0333 },
  { code: "010104", name: "Kimisagara", level: "SECTOR", parentCode: "0101", latitude: -1.9583, longitude: 30.0417 },
  { code: "010105", name: "Mageragere", level: "SECTOR", parentCode: "0101", latitude: -2.0167, longitude: 30.0167 },
  { code: "010106", name: "Muhima", level: "SECTOR", parentCode: "0101", latitude: -1.9550, longitude: 30.0600 },
  { code: "010107", name: "Nyakabanda", level: "SECTOR", parentCode: "0101", latitude: -1.9700, longitude: 30.0450 },
  { code: "010108", name: "Nyamirambo", level: "SECTOR", parentCode: "0101", latitude: -1.9800, longitude: 30.0400, aliases: ["Biryogo"] },
  { code: "010109", name: "Nyarugenge", level: "SECTOR", parentCode: "0101", latitude: -1.9500, longitude: 30.0600, aliases: ["Downtown Kigali", "City Center"] },
  { code: "010110", name: "Rwezamenyo", level: "SECTOR", parentCode: "0101", latitude: -1.9667, longitude: 30.0500 },

  // ── Gasabo District (0102) ──
  { code: "010201", name: "Bumbogo", level: "SECTOR", parentCode: "0102", latitude: -1.8833, longitude: 30.1333 },
  { code: "010202", name: "Gatsata", level: "SECTOR", parentCode: "0102", latitude: -1.9250, longitude: 30.0450, aliases: ["Gatsata Sector"] },
  { code: "010203", name: "Gikomero", level: "SECTOR", parentCode: "0102", latitude: -1.8500, longitude: 30.1600 },
  { code: "010204", name: "Gisozi", level: "SECTOR", parentCode: "0102", latitude: -1.9050, longitude: 30.0750 },
  { code: "010205", name: "Jabana", level: "SECTOR", parentCode: "0102", latitude: -1.8800, longitude: 30.1400 },
  { code: "010206", name: "Jali", level: "SECTOR", parentCode: "0102", latitude: -1.8833, longitude: 30.0500 },
  { code: "010207", name: "Kacyiru", level: "SECTOR", parentCode: "0102", latitude: -1.9350, longitude: 30.0900 },
  { code: "010208", name: "Kimihurura", level: "SECTOR", parentCode: "0102", latitude: -1.9500, longitude: 30.0800 },
  { code: "010209", name: "Kimironko", level: "SECTOR", parentCode: "0102", latitude: -1.9365, longitude: 30.1301, aliases: ["Kimironko Sector", "Kibagabaga"] },
  { code: "010210", name: "Kinyinya", level: "SECTOR", parentCode: "0102", latitude: -1.9100, longitude: 30.0900, aliases: ["Gasharu", "Kagugu"] },
  { code: "010211", name: "Ndera", level: "SECTOR", parentCode: "0102", latitude: -1.9000, longitude: 30.1700 },
  { code: "010212", name: "Nduba", level: "SECTOR", parentCode: "0102", latitude: -1.8500, longitude: 30.1000 },
  { code: "010213", name: "Remera", level: "SECTOR", parentCode: "0102", latitude: -1.9500, longitude: 30.1100, aliases: ["Gishushu"] },
  { code: "010214", name: "Rusororo", level: "SECTOR", parentCode: "0102", latitude: -1.8700, longitude: 30.1300, aliases: ["Kabuga"] },
  { code: "010215", name: "Rutunga", level: "SECTOR", parentCode: "0102", latitude: -1.8000, longitude: 30.1667 },

  // ── Kicukiro District (0103) ──
  { code: "010301", name: "Gahanga", level: "SECTOR", parentCode: "0103", latitude: -2.0600, longitude: 30.0900 },
  { code: "010302", name: "Gatenga", level: "SECTOR", parentCode: "0103", latitude: -1.9950, longitude: 30.0950 },
  { code: "010303", name: "Gikondo", level: "SECTOR", parentCode: "0103", latitude: -1.9700, longitude: 30.0750 },
  { code: "010304", name: "Kagarama", level: "SECTOR", parentCode: "0103", latitude: -1.9900, longitude: 30.1200 },
  { code: "010305", name: "Kanombe", level: "SECTOR", parentCode: "0103", latitude: -1.9772, longitude: 30.1472, aliases: ["Busanza"] },
  { code: "010306", name: "Kicukiro", level: "SECTOR", parentCode: "0103", latitude: -1.9800, longitude: 30.1000 },
  { code: "010307", name: "Kigarama", level: "SECTOR", parentCode: "0103", latitude: -2.0050, longitude: 30.1150 },
  { code: "010308", name: "Masaka", level: "SECTOR", parentCode: "0103", latitude: -2.0300, longitude: 30.0900 },
  { code: "010309", name: "Niboye", level: "SECTOR", parentCode: "0103", latitude: -2.0100, longitude: 30.1000 },
  { code: "010310", name: "Nyarugunga", level: "SECTOR", parentCode: "0103", latitude: -1.9800, longitude: 30.1500 },

  // ── Nyanza District (0201) ──
  { code: "020101", name: "Busasamana", level: "SECTOR", parentCode: "0201", latitude: -2.3500, longitude: 29.7500 },
  { code: "020102", name: "Busoro", level: "SECTOR", parentCode: "0201", latitude: -2.3167, longitude: 29.8500 },
  { code: "020103", name: "Cyabakamyi", level: "SECTOR", parentCode: "0201", latitude: -2.3667, longitude: 29.6500 },
  { code: "020104", name: "Kibilizi", level: "SECTOR", parentCode: "0201", latitude: -2.4000, longitude: 29.7167 },
  { code: "020105", name: "Kigoma", level: "SECTOR", parentCode: "0201", latitude: -2.3833, longitude: 29.8000 },
  { code: "020106", name: "Mukingo", level: "SECTOR", parentCode: "0201", latitude: -2.4167, longitude: 29.7500 },
  { code: "020107", name: "Muyira", level: "SECTOR", parentCode: "0201", latitude: -2.3500, longitude: 29.8667 },
  { code: "020108", name: "Ntyazo", level: "SECTOR", parentCode: "0201", latitude: -2.4000, longitude: 29.9000 },
  { code: "020109", name: "Nyagisozi", level: "SECTOR", parentCode: "0201", latitude: -2.4333, longitude: 29.6833 },
  { code: "020110", name: "Rwabicuma", level: "SECTOR", parentCode: "0201", latitude: -2.3167, longitude: 29.7000 },

  // ── Gisagara District (0202) ──
  { code: "020201", name: "Gikonko", level: "SECTOR", parentCode: "0202", latitude: -2.4833, longitude: 29.8667 },
  { code: "020202", name: "Gishubi", level: "SECTOR", parentCode: "0202", latitude: -2.4500, longitude: 29.9000 },
  { code: "020203", name: "Kansi", level: "SECTOR", parentCode: "0202", latitude: -2.5667, longitude: 29.7833 },
  { code: "020204", name: "Kibilizi", level: "SECTOR", parentCode: "0202", latitude: -2.5500, longitude: 29.8167 },
  { code: "020205", name: "Kigembe", level: "SECTOR", parentCode: "0202", latitude: -2.6333, longitude: 29.8500 },
  { code: "020206", name: "Mamba", level: "SECTOR", parentCode: "0202", latitude: -2.5000, longitude: 29.9500 },
  { code: "020207", name: "Muganza", level: "SECTOR", parentCode: "0202", latitude: -2.6167, longitude: 29.7833 },
  { code: "020208", name: "Mugombwa", level: "SECTOR", parentCode: "0202", latitude: -2.6500, longitude: 29.8000 },
  { code: "020209", name: "Mukindo", level: "SECTOR", parentCode: "0202", latitude: -2.5833, longitude: 29.8833 },
  { code: "020210", name: "Musha", level: "SECTOR", parentCode: "0202", latitude: -2.5167, longitude: 29.8500 },
  { code: "020211", name: "Ndora", level: "SECTOR", parentCode: "0202", latitude: -2.5333, longitude: 29.8333 },
  { code: "020212", name: "Nyanza", level: "SECTOR", parentCode: "0202", latitude: -2.5500, longitude: 29.9333 },
  { code: "020213", name: "Save", level: "SECTOR", parentCode: "0202", latitude: -2.5500, longitude: 29.7667 },

  // ── Nyaruguru District (0203) ──
  { code: "020301", name: "Busanze", level: "SECTOR", parentCode: "0203", latitude: -2.6833, longitude: 29.4500 },
  { code: "020302", name: "Cyahinda", level: "SECTOR", parentCode: "0203", latitude: -2.6333, longitude: 29.5167 },
  { code: "020303", name: "Kibeho", level: "SECTOR", parentCode: "0203", latitude: -2.6500, longitude: 29.5500 },
  { code: "020304", name: "Kivu", level: "SECTOR", parentCode: "0203", latitude: -2.6167, longitude: 29.3500 },
  { code: "020305", name: "Mata", level: "SECTOR", parentCode: "0203", latitude: -2.5667, longitude: 29.5000 },
  { code: "020306", name: "Muganza", level: "SECTOR", parentCode: "0203", latitude: -2.6000, longitude: 29.4000 },
  { code: "020307", name: "Munini", level: "SECTOR", parentCode: "0203", latitude: -2.6333, longitude: 29.4833 },
  { code: "020308", name: "Ngera", level: "SECTOR", parentCode: "0203", latitude: -2.6500, longitude: 29.6000 },
  { code: "020309", name: "Ngoma", level: "SECTOR", parentCode: "0203", latitude: -2.6833, longitude: 29.5667 },
  { code: "020310", name: "Nyabimata", level: "SECTOR", parentCode: "0203", latitude: -2.6500, longitude: 29.3833 },
  { code: "020311", name: "Nyagisozi", level: "SECTOR", parentCode: "0203", latitude: -2.6000, longitude: 29.5667 },
  { code: "020312", name: "Ruheru", level: "SECTOR", parentCode: "0203", latitude: -2.7167, longitude: 29.4667 },
  { code: "020313", name: "Ruramba", level: "SECTOR", parentCode: "0203", latitude: -2.5500, longitude: 29.4500 },
  { code: "020314", name: "Rusenge", level: "SECTOR", parentCode: "0203", latitude: -2.5833, longitude: 29.5333 },

  // ── Huye District (0204) ──
  { code: "020401", name: "Gishamvu", level: "SECTOR", parentCode: "0204", latitude: -2.6500, longitude: 29.7000 },
  { code: "020402", name: "Huye", level: "SECTOR", parentCode: "0204", latitude: -2.5500, longitude: 29.6833 },
  { code: "020403", name: "Karama", level: "SECTOR", parentCode: "0204", latitude: -2.5167, longitude: 29.6500 },
  { code: "020404", name: "Kigoma", level: "SECTOR", parentCode: "0204", latitude: -2.4833, longitude: 29.7000 },
  { code: "020405", name: "Kinazi", level: "SECTOR", parentCode: "0204", latitude: -2.4500, longitude: 29.7333 },
  { code: "020406", name: "Maraba", level: "SECTOR", parentCode: "0204", latitude: -2.5667, longitude: 29.6333 },
  { code: "020407", name: "Mbazi", level: "SECTOR", parentCode: "0204", latitude: -2.5333, longitude: 29.7167 },
  { code: "020408", name: "Mukura", level: "SECTOR", parentCode: "0204", latitude: -2.6000, longitude: 29.7167 },
  { code: "020409", name: "Ngoma", level: "SECTOR", parentCode: "0204", latitude: -2.6000, longitude: 29.7333, aliases: ["Butare Ville", "Huye Town"] },
  { code: "020410", name: "Ruhashya", level: "SECTOR", parentCode: "0204", latitude: -2.4833, longitude: 29.6667 },
  { code: "020411", name: "Rusatira", level: "SECTOR", parentCode: "0204", latitude: -2.4500, longitude: 29.7667 },
  { code: "020412", name: "Rwaniro", level: "SECTOR", parentCode: "0204", latitude: -2.6333, longitude: 29.6667 },
  { code: "020413", name: "Simbi", level: "SECTOR", parentCode: "0204", latitude: -2.5167, longitude: 29.6833 },
  { code: "020414", name: "Tumba", level: "SECTOR", parentCode: "0204", latitude: -2.6167, longitude: 29.7500 },

  // ── Nyamagabe District (0205) ──
  { code: "020501", name: "Buruhukiro", level: "SECTOR", parentCode: "0205", latitude: -2.4167, longitude: 29.4167 },
  { code: "020502", name: "Cyanika", level: "SECTOR", parentCode: "0205", latitude: -2.4833, longitude: 29.5667 },
  { code: "020503", name: "Gatare", level: "SECTOR", parentCode: "0205", latitude: -2.4000, longitude: 29.3500 },
  { code: "020504", name: "Kaduha", level: "SECTOR", parentCode: "0205", latitude: -2.3667, longitude: 29.5167 },
  { code: "020505", name: "Kamegeli", level: "SECTOR", parentCode: "0205", latitude: -2.4167, longitude: 29.5667 },
  { code: "020506", name: "Kibirizi", level: "SECTOR", parentCode: "0205", latitude: -2.4833, longitude: 29.5833 },
  { code: "020507", name: "Kibumbwe", level: "SECTOR", parentCode: "0205", latitude: -2.4333, longitude: 29.5000 },
  { code: "020508", name: "Kitabi", level: "SECTOR", parentCode: "0205", latitude: -2.5333, longitude: 29.4333 },
  { code: "020509", name: "Musebeya", level: "SECTOR", parentCode: "0205", latitude: -2.3500, longitude: 29.4500 },
  { code: "020510", name: "Mushubi", level: "SECTOR", parentCode: "0205", latitude: -2.3500, longitude: 29.3833 },
  { code: "020511", name: "Nkomane", level: "SECTOR", parentCode: "0205", latitude: -2.4000, longitude: 29.4667 },
  { code: "020512", name: "Gasaka", level: "SECTOR", parentCode: "0205", latitude: -2.4833, longitude: 29.5000, aliases: ["Nyamagabe Town"] },
  { code: "020513", name: "Mugano", level: "SECTOR", parentCode: "0205", latitude: -2.4500, longitude: 29.5167 },
  { code: "020514", name: "Musange", level: "SECTOR", parentCode: "0205", latitude: -2.3833, longitude: 29.5333 },
  { code: "020516", name: "Tare", level: "SECTOR", parentCode: "0205", latitude: -2.4833, longitude: 29.4667 },
  { code: "020517", name: "Uwinkingi", level: "SECTOR", parentCode: "0205", latitude: -2.4833, longitude: 29.3833 },
  { code: "020518", name: "Mbazi", level: "SECTOR", parentCode: "0205", latitude: -2.4333, longitude: 29.5333 },

  // ── Ruhango District (0206) ──
  { code: "020601", name: "Bweramana", level: "SECTOR", parentCode: "0206", latitude: -2.2167, longitude: 29.6833 },
  { code: "020602", name: "Byimana", level: "SECTOR", parentCode: "0206", latitude: -2.1500, longitude: 29.7500 },
  { code: "020603", name: "Kabagali", level: "SECTOR", parentCode: "0206", latitude: -2.1000, longitude: 29.6500 },
  { code: "020604", name: "Kinazi", level: "SECTOR", parentCode: "0206", latitude: -2.2167, longitude: 29.8500 },
  { code: "020605", name: "Kinihira", level: "SECTOR", parentCode: "0206", latitude: -2.1167, longitude: 29.7000 },
  { code: "020606", name: "Mbuye", level: "SECTOR", parentCode: "0206", latitude: -2.2000, longitude: 29.8000 },
  { code: "020607", name: "Mwendo", level: "SECTOR", parentCode: "0206", latitude: -2.1500, longitude: 29.6333 },
  { code: "020608", name: "Ntongwe", level: "SECTOR", parentCode: "0206", latitude: -2.2500, longitude: 29.8167 },
  { code: "020609", name: "Ruhango", level: "SECTOR", parentCode: "0206", latitude: -2.1667, longitude: 29.7833, aliases: ["Ruhango Town"] },

  // ── Muhanga District (0207) ──
  { code: "020701", name: "Cyeza", level: "SECTOR", parentCode: "0207", latitude: -2.0333, longitude: 29.7667 },
  { code: "020702", name: "Kabacuzi", level: "SECTOR", parentCode: "0207", latitude: -1.9833, longitude: 29.6500 },
  { code: "020703", name: "Kibangu", level: "SECTOR", parentCode: "0207", latitude: -1.9500, longitude: 29.6833 },
  { code: "020704", name: "Kiyumba", level: "SECTOR", parentCode: "0207", latitude: -1.9833, longitude: 29.7167 },
  { code: "020705", name: "Muhanga", level: "SECTOR", parentCode: "0207", latitude: -2.0667, longitude: 29.7167 },
  { code: "020706", name: "Mushishiro", level: "SECTOR", parentCode: "0207", latitude: -2.0667, longitude: 29.6500 },
  { code: "020707", name: "Nyabinoni", level: "SECTOR", parentCode: "0207", latitude: -1.9167, longitude: 29.6500 },
  { code: "020708", name: "Nyamabuye", level: "SECTOR", parentCode: "0207", latitude: -2.0833, longitude: 29.7500, aliases: ["Gitarama Town"] },
  { code: "020709", name: "Nyarusange", level: "SECTOR", parentCode: "0207", latitude: -2.1167, longitude: 29.6833 },
  { code: "020710", name: "Rongi", level: "SECTOR", parentCode: "0207", latitude: -1.9167, longitude: 29.7167 },
  { code: "020711", name: "Rugendabari", level: "SECTOR", parentCode: "0207", latitude: -2.0167, longitude: 29.6333 },
  { code: "020712", name: "Shyogwe", level: "SECTOR", parentCode: "0207", latitude: -2.1167, longitude: 29.7500 },

  // ── Kamonyi District (0208) ──
  { code: "020801", name: "Gacurabwenge", level: "SECTOR", parentCode: "0208", latitude: -2.0333, longitude: 29.8500 },
  { code: "020802", name: "Karama", level: "SECTOR", parentCode: "0208", latitude: -2.1500, longitude: 29.9000 },
  { code: "020803", name: "Kayenzi", level: "SECTOR", parentCode: "0208", latitude: -1.9667, longitude: 29.8333 },
  { code: "020804", name: "Kayumbu", level: "SECTOR", parentCode: "0208", latitude: -2.1167, longitude: 29.8500 },
  { code: "020805", name: "Mugina", level: "SECTOR", parentCode: "0208", latitude: -2.1000, longitude: 29.9167 },
  { code: "020806", name: "Musambira", level: "SECTOR", parentCode: "0208", latitude: -2.0667, longitude: 29.8333 },
  { code: "020807", name: "Ngamba", level: "SECTOR", parentCode: "0208", latitude: -1.9833, longitude: 29.8167 },
  { code: "020808", name: "Nyamiyaga", level: "SECTOR", parentCode: "0208", latitude: -2.1500, longitude: 29.8667 },
  { code: "020809", name: "Nyarubaka", level: "SECTOR", parentCode: "0208", latitude: -2.0833, longitude: 29.8833 },
  { code: "020810", name: "Rugarika", level: "SECTOR", parentCode: "0208", latitude: -1.9833, longitude: 29.9167 },
  { code: "020811", name: "Rukoma", level: "SECTOR", parentCode: "0208", latitude: -2.0167, longitude: 29.8333 },
  { code: "020812", name: "Runda", level: "SECTOR", parentCode: "0208", latitude: -1.9833, longitude: 29.9667 },

  // ── Karongi District (0301) ──
  { code: "030101", name: "Bwishyura", level: "SECTOR", parentCode: "0301", latitude: -2.0667, longitude: 29.3500, aliases: ["Kibuye Town"] },
  { code: "030102", name: "Gishyita", level: "SECTOR", parentCode: "0301", latitude: -2.1500, longitude: 29.3167 },
  { code: "030103", name: "Gishari", level: "SECTOR", parentCode: "0301", latitude: -2.0000, longitude: 29.4333 },
  { code: "030104", name: "Gitesi", level: "SECTOR", parentCode: "0301", latitude: -2.1000, longitude: 29.4000 },
  { code: "030105", name: "Mubuga", level: "SECTOR", parentCode: "0301", latitude: -2.1167, longitude: 29.3333 },
  { code: "030106", name: "Murambi", level: "SECTOR", parentCode: "0301", latitude: -2.0500, longitude: 29.4167 },
  { code: "030107", name: "Murundi", level: "SECTOR", parentCode: "0301", latitude: -1.9667, longitude: 29.4000 },
  { code: "030108", name: "Mutuntu", level: "SECTOR", parentCode: "0301", latitude: -2.1833, longitude: 29.4000 },
  { code: "030109", name: "Rubengera", level: "SECTOR", parentCode: "0301", latitude: -2.0167, longitude: 29.4500 },
  { code: "030110", name: "Rugabano", level: "SECTOR", parentCode: "0301", latitude: -2.0667, longitude: 29.4833 },
  { code: "030111", name: "Ruganda", level: "SECTOR", parentCode: "0301", latitude: -1.9833, longitude: 29.4500 },
  { code: "030112", name: "Rwankuba", level: "SECTOR", parentCode: "0301", latitude: -2.1167, longitude: 29.4500 },
  { code: "030113", name: "Twumba", level: "SECTOR", parentCode: "0301", latitude: -2.1833, longitude: 29.3667 },

  // ── Rutsiro District (0302) ──
  { code: "030201", name: "Boneza", level: "SECTOR", parentCode: "0302", latitude: -1.9167, longitude: 29.2833 },
  { code: "030202", name: "Gihango", level: "SECTOR", parentCode: "0302", latitude: -1.8833, longitude: 29.3167 },
  { code: "030203", name: "Kigeyo", level: "SECTOR", parentCode: "0302", latitude: -1.8500, longitude: 29.3500 },
  { code: "030204", name: "Kivumu", level: "SECTOR", parentCode: "0302", latitude: -1.8667, longitude: 29.4000 },
  { code: "030205", name: "Manihira", level: "SECTOR", parentCode: "0302", latitude: -1.9333, longitude: 29.4333 },
  { code: "030206", name: "Mukura", level: "SECTOR", parentCode: "0302", latitude: -1.9833, longitude: 29.4833 },
  { code: "030207", name: "Murunda", level: "SECTOR", parentCode: "0302", latitude: -1.9000, longitude: 29.3833 },
  { code: "030208", name: "Musasa", level: "SECTOR", parentCode: "0302", latitude: -1.8333, longitude: 29.3167 },
  { code: "030209", name: "Mushonyi", level: "SECTOR", parentCode: "0302", latitude: -1.8167, longitude: 29.2833 },
  { code: "030210", name: "Mushubati", level: "SECTOR", parentCode: "0302", latitude: -1.9167, longitude: 29.3500 },
  { code: "030211", name: "Nyabirasi", level: "SECTOR", parentCode: "0302", latitude: -1.7833, longitude: 29.3500 },
  { code: "030212", name: "Ruhango", level: "SECTOR", parentCode: "0302", latitude: -1.8167, longitude: 29.3833 },
  { code: "030213", name: "Rusebeya", level: "SECTOR", parentCode: "0302", latitude: -1.9500, longitude: 29.4167 },

  // ── Rubavu District (0303) ──
  { code: "030301", name: "Bugeshi", level: "SECTOR", parentCode: "0303", latitude: -1.5667, longitude: 29.3667 },
  { code: "030302", name: "Busasamana", level: "SECTOR", parentCode: "0303", latitude: -1.5833, longitude: 29.3833 },
  { code: "030303", name: "Cyanzarwe", level: "SECTOR", parentCode: "0303", latitude: -1.6333, longitude: 29.3833 },
  { code: "030304", name: "Gisenyi", level: "SECTOR", parentCode: "0303", latitude: -1.7000, longitude: 29.2500, aliases: ["Gisenyi Town", "Rubavu Border"] },
  { code: "030305", name: "Kanama", level: "SECTOR", parentCode: "0303", latitude: -1.7000, longitude: 29.4000 },
  { code: "030306", name: "Kanzenze", level: "SECTOR", parentCode: "0303", latitude: -1.6667, longitude: 29.4333 },
  { code: "030307", name: "Mudende", level: "SECTOR", parentCode: "0303", latitude: -1.6167, longitude: 29.4167 },
  { code: "030308", name: "Nyakiriba", level: "SECTOR", parentCode: "0303", latitude: -1.7000, longitude: 29.3500 },
  { code: "030309", name: "Nyamyumba", level: "SECTOR", parentCode: "0303", latitude: -1.7500, longitude: 29.2833, aliases: ["Brasserie"] },
  { code: "030310", name: "Nyundo", level: "SECTOR", parentCode: "0303", latitude: -1.6833, longitude: 29.3333 },
  { code: "030311", name: "Rubavu", level: "SECTOR", parentCode: "0303", latitude: -1.6833, longitude: 29.3000 },
  { code: "030312", name: "Rugerero", level: "SECTOR", parentCode: "0303", latitude: -1.7000, longitude: 29.3167 },

  // ── Nyabihu District (0304) ──
  { code: "030401", name: "Bigogwe", level: "SECTOR", parentCode: "0304", latitude: -1.6167, longitude: 29.4500 },
  { code: "030402", name: "Jenda", level: "SECTOR", parentCode: "0304", latitude: -1.6000, longitude: 29.4833 },
  { code: "030403", name: "Jomba", level: "SECTOR", parentCode: "0304", latitude: -1.6500, longitude: 29.4667 },
  { code: "030404", name: "Kabatwa", level: "SECTOR", parentCode: "0304", latitude: -1.5833, longitude: 29.4500 },
  { code: "030405", name: "Karago", level: "SECTOR", parentCode: "0304", latitude: -1.6667, longitude: 29.5333 },
  { code: "030406", name: "Kintobo", level: "SECTOR", parentCode: "0304", latitude: -1.6833, longitude: 29.4833 },
  { code: "030407", name: "Mukamira", level: "SECTOR", parentCode: "0304", latitude: -1.6000, longitude: 29.5500 },
  { code: "030408", name: "Muringa", level: "SECTOR", parentCode: "0304", latitude: -1.7000, longitude: 29.5333 },
  { code: "030409", name: "Rambura", level: "SECTOR", parentCode: "0304", latitude: -1.7167, longitude: 29.5000 },
  { code: "030410", name: "Rugera", level: "SECTOR", parentCode: "0304", latitude: -1.7333, longitude: 29.4667 },
  { code: "030411", name: "Rurembo", level: "SECTOR", parentCode: "0304", latitude: -1.7167, longitude: 29.4333 },
  { code: "030412", name: "Shyira", level: "SECTOR", parentCode: "0304", latitude: -1.6500, longitude: 29.6000 },

  // ── Ngororero District (0305) ──
  { code: "030501", name: "Bwira", level: "SECTOR", parentCode: "0305", latitude: -1.8667, longitude: 29.5833 },
  { code: "030502", name: "Gatumba", level: "SECTOR", parentCode: "0305", latitude: -1.8500, longitude: 29.5500 },
  { code: "030503", name: "Hindiro", level: "SECTOR", parentCode: "0305", latitude: -1.8000, longitude: 29.5000 },
  { code: "030504", name: "Kabaya", level: "SECTOR", parentCode: "0305", latitude: -1.7500, longitude: 29.5500 },
  { code: "030505", name: "Kageyo", level: "SECTOR", parentCode: "0305", latitude: -1.7833, longitude: 29.5833 },
  { code: "030506", name: "Kavumu", level: "SECTOR", parentCode: "0305", latitude: -1.8333, longitude: 29.5833 },
  { code: "030507", name: "Matyazo", level: "SECTOR", parentCode: "0305", latitude: -1.7833, longitude: 29.4833 },
  { code: "030508", name: "Muhanda", level: "SECTOR", parentCode: "0305", latitude: -1.8333, longitude: 29.6167 },
  { code: "030509", name: "Muhororo", level: "SECTOR", parentCode: "0305", latitude: -1.8167, longitude: 29.5500 },
  { code: "030510", name: "Ndaro", level: "SECTOR", parentCode: "0305", latitude: -1.8167, longitude: 29.4667 },
  { code: "030511", name: "Ngororero", level: "SECTOR", parentCode: "0305", latitude: -1.7500, longitude: 29.5167 },
  { code: "030512", name: "Nyange", level: "SECTOR", parentCode: "0305", latitude: -1.7833, longitude: 29.5333 },
  { code: "030513", name: "Sovu", level: "SECTOR", parentCode: "0305", latitude: -1.8000, longitude: 29.6333 },

  // ── Rusizi District (0306) ──
  { code: "030601", name: "Bugarama", level: "SECTOR", parentCode: "0306", latitude: -2.6833, longitude: 29.0000 },
  { code: "030602", name: "Butare", level: "SECTOR", parentCode: "0306", latitude: -2.5833, longitude: 29.0167 },
  { code: "030603", name: "Bweyeye", level: "SECTOR", parentCode: "0306", latitude: -2.6333, longitude: 29.1500 },
  { code: "030604", name: "Gashonga", level: "SECTOR", parentCode: "0306", latitude: -2.5500, longitude: 28.9833 },
  { code: "030605", name: "Giheke", level: "SECTOR", parentCode: "0306", latitude: -2.4333, longitude: 28.9500 },
  { code: "030606", name: "Gihundwe", level: "SECTOR", parentCode: "0306", latitude: -2.4833, longitude: 28.8833 },
  { code: "030607", name: "Gikundamvura", level: "SECTOR", parentCode: "0306", latitude: -2.6333, longitude: 29.0833 },
  { code: "030608", name: "Gitambi", level: "SECTOR", parentCode: "0306", latitude: -2.6000, longitude: 29.0500 },
  { code: "030609", name: "Kamembe", level: "SECTOR", parentCode: "0306", latitude: -2.4667, longitude: 28.9000, aliases: ["Cyangugu Town", "Rusizi Border"] },
  { code: "030610", name: "Muganza", level: "SECTOR", parentCode: "0306", latitude: -2.6667, longitude: 28.9833 },
  { code: "030611", name: "Mururu", level: "SECTOR", parentCode: "0306", latitude: -2.4667, longitude: 28.8667 },
  { code: "030612", name: "Nkanka", level: "SECTOR", parentCode: "0306", latitude: -2.4500, longitude: 28.9167 },
  { code: "030613", name: "Nkombo", level: "SECTOR", parentCode: "0306", latitude: -2.4333, longitude: 28.8500, aliases: ["Nkombo Island"] },
  { code: "030614", name: "Nkungu", level: "SECTOR", parentCode: "0306", latitude: -2.5500, longitude: 28.9167 },
  { code: "030615", name: "Nyakabuye", level: "SECTOR", parentCode: "0306", latitude: -2.6167, longitude: 28.9667 },
  { code: "030616", name: "Nyakarenzo", level: "SECTOR", parentCode: "0306", latitude: -2.5667, longitude: 28.9333 },
  { code: "030617", name: "Nzahaha", level: "SECTOR", parentCode: "0306", latitude: -2.5333, longitude: 28.9500 },
  { code: "030618", name: "Rwimbogo", level: "SECTOR", parentCode: "0306", latitude: -2.6333, longitude: 28.9333 },

  // ── Nyamasheke District (0307) ──
  { code: "030701", name: "Bushekeri", level: "SECTOR", parentCode: "0307", latitude: -2.3500, longitude: 29.1833 },
  { code: "030702", name: "Bushenge", level: "SECTOR", parentCode: "0307", latitude: -2.3833, longitude: 29.0833 },
  { code: "030703", name: "Cyato", level: "SECTOR", parentCode: "0307", latitude: -2.4000, longitude: 29.2167 },
  { code: "030704", name: "Gihombo", level: "SECTOR", parentCode: "0307", latitude: -2.2500, longitude: 29.2167 },
  { code: "030705", name: "Kagano", level: "SECTOR", parentCode: "0307", latitude: -2.3167, longitude: 29.1333, aliases: ["Nyamasheke Town"] },
  { code: "030706", name: "Kanjongo", level: "SECTOR", parentCode: "0307", latitude: -2.3000, longitude: 29.1500 },
  { code: "030707", name: "Karambi", level: "SECTOR", parentCode: "0307", latitude: -2.3667, longitude: 29.2500 },
  { code: "030708", name: "Karengera", level: "SECTOR", parentCode: "0307", latitude: -2.4167, longitude: 29.0667 },
  { code: "030709", name: "Kirimbi", level: "SECTOR", parentCode: "0307", latitude: -2.2667, longitude: 29.1667 },
  { code: "030710", name: "Macuba", level: "SECTOR", parentCode: "0307", latitude: -2.2833, longitude: 29.2000 },
  { code: "030711", name: "Mahembe", level: "SECTOR", parentCode: "0307", latitude: -2.2167, longitude: 29.2000 },
  { code: "030712", name: "Nyabitekeri", level: "SECTOR", parentCode: "0307", latitude: -2.4167, longitude: 29.0000 },
  { code: "030713", name: "Rangiro", level: "SECTOR", parentCode: "0307", latitude: -2.4500, longitude: 29.2000 },
  { code: "030714", name: "Ruharambuga", level: "SECTOR", parentCode: "0307", latitude: -2.4333, longitude: 29.1000 },
  { code: "030715", name: "Shangi", level: "SECTOR", parentCode: "0307", latitude: -2.4000, longitude: 29.0333 },

  // ── Rulindo District (0401) ──
  { code: "040101", name: "Base", level: "SECTOR", parentCode: "0401", latitude: -1.6833, longitude: 29.9500 },
  { code: "040102", name: "Burega", level: "SECTOR", parentCode: "0401", latitude: -1.7500, longitude: 29.9333 },
  { code: "040103", name: "Bushoki", level: "SECTOR", parentCode: "0401", latitude: -1.7667, longitude: 29.9833 },
  { code: "040104", name: "Buyoga", level: "SECTOR", parentCode: "0401", latitude: -1.7333, longitude: 30.0500 },
  { code: "040105", name: "Cyinzuzi", level: "SECTOR", parentCode: "0401", latitude: -1.7833, longitude: 29.9333 },
  { code: "040106", name: "Cyungo", level: "SECTOR", parentCode: "0401", latitude: -1.7000, longitude: 30.0000 },
  { code: "040107", name: "Kinihira", level: "SECTOR", parentCode: "0401", latitude: -1.6667, longitude: 30.0333 },
  { code: "040108", name: "Kisaro", level: "SECTOR", parentCode: "0401", latitude: -1.7000, longitude: 30.0833 },
  { code: "040109", name: "Masoro", level: "SECTOR", parentCode: "0401", latitude: -1.7500, longitude: 30.0833 },
  { code: "040110", name: "Mbogo", level: "SECTOR", parentCode: "0401", latitude: -1.8000, longitude: 30.0333 },
  { code: "040111", name: "Murambi", level: "SECTOR", parentCode: "0401", latitude: -1.7833, longitude: 30.0833 },
  { code: "040112", name: "Ngoma", level: "SECTOR", parentCode: "0401", latitude: -1.8333, longitude: 30.0167 },
  { code: "040113", name: "Ntarabana", level: "SECTOR", parentCode: "0401", latitude: -1.7833, longitude: 29.9833 },
  { code: "040114", name: "Rukozo", level: "SECTOR", parentCode: "0401", latitude: -1.6833, longitude: 30.0000 },
  { code: "040115", name: "Rusiga", level: "SECTOR", parentCode: "0401", latitude: -1.8000, longitude: 29.9500 },
  { code: "040116", name: "Shyorongi", level: "SECTOR", parentCode: "0401", latitude: -1.8667, longitude: 29.9833 },
  { code: "040117", name: "Tumba", level: "SECTOR", parentCode: "0401", latitude: -1.7167, longitude: 29.9833 },

  // ── Gakenke District (0402) ──
  { code: "040201", name: "Busengo", level: "SECTOR", parentCode: "0402", latitude: -1.6167, longitude: 29.7500 },
  { code: "040202", name: "Coko", level: "SECTOR", parentCode: "0402", latitude: -1.7333, longitude: 29.7333 },
  { code: "040203", name: "Cyabingo", level: "SECTOR", parentCode: "0402", latitude: -1.6000, longitude: 29.7333 },
  { code: "040204", name: "Gakenke", level: "SECTOR", parentCode: "0402", latitude: -1.6833, longitude: 29.7833, aliases: ["Gakenke Town"] },
  { code: "040205", name: "Gashenyi", level: "SECTOR", parentCode: "0402", latitude: -1.6500, longitude: 29.7833 },
  { code: "040206", name: "Mugunga", level: "SECTOR", parentCode: "0402", latitude: -1.6333, longitude: 29.7833 },
  { code: "040207", name: "Janja", level: "SECTOR", parentCode: "0402", latitude: -1.6167, longitude: 29.7167 },
  { code: "040208", name: "Kamubuga", level: "SECTOR", parentCode: "0402", latitude: -1.6500, longitude: 29.8167 },
  { code: "040209", name: "Karambo", level: "SECTOR", parentCode: "0402", latitude: -1.6833, longitude: 29.8333 },
  { code: "040210", name: "Kivuruga", level: "SECTOR", parentCode: "0402", latitude: -1.6167, longitude: 29.8000 },
  { code: "040211", name: "Mataba", level: "SECTOR", parentCode: "0402", latitude: -1.6833, longitude: 29.7167 },
  { code: "040212", name: "Minazi", level: "SECTOR", parentCode: "0402", latitude: -1.7333, longitude: 29.8000 },
  { code: "040213", name: "Muhondo", level: "SECTOR", parentCode: "0402", latitude: -1.7667, longitude: 29.8167 },
  { code: "040214", name: "Muyongwe", level: "SECTOR", parentCode: "0402", latitude: -1.6167, longitude: 29.8333 },
  { code: "040215", name: "Muzo", level: "SECTOR", parentCode: "0402", latitude: -1.7167, longitude: 29.7667 },
  { code: "040216", name: "Nemba", level: "SECTOR", parentCode: "0402", latitude: -1.6667, longitude: 29.7667 },
  { code: "040217", name: "Ruli", level: "SECTOR", parentCode: "0402", latitude: -1.7500, longitude: 29.7667 },
  { code: "040218", name: "Rusasa", level: "SECTOR", parentCode: "0402", latitude: -1.7167, longitude: 29.7167 },
  { code: "040219", name: "Rushashi", level: "SECTOR", parentCode: "0402", latitude: -1.7667, longitude: 29.7333 },

  // ── Musanze District (0403) ──
  { code: "040301", name: "Busogo", level: "SECTOR", parentCode: "0403", latitude: -1.5500, longitude: 29.5500 },
  { code: "040302", name: "Cyuve", level: "SECTOR", parentCode: "0403", latitude: -1.4833, longitude: 29.6667 },
  { code: "040303", name: "Gacaca", level: "SECTOR", parentCode: "0403", latitude: -1.5000, longitude: 29.5833 },
  { code: "040304", name: "Gashaki", level: "SECTOR", parentCode: "0403", latitude: -1.5167, longitude: 29.6833 },
  { code: "040305", name: "Gataraga", level: "SECTOR", parentCode: "0403", latitude: -1.5333, longitude: 29.5833 },
  { code: "040306", name: "Kimonyi", level: "SECTOR", parentCode: "0403", latitude: -1.5167, longitude: 29.6167 },
  { code: "040307", name: "Kinigi", level: "SECTOR", parentCode: "0403", latitude: -1.4500, longitude: 29.5833, aliases: ["Volcanoes Park"] },
  { code: "040308", name: "Muhoza", level: "SECTOR", parentCode: "0403", latitude: -1.5000, longitude: 29.6333, aliases: ["Ruhengeri Town", "Musanze Town"] },
  { code: "040309", name: "Muko", level: "SECTOR", parentCode: "0403", latitude: -1.5333, longitude: 29.6333 },
  { code: "040310", name: "Musanze", level: "SECTOR", parentCode: "0403", latitude: -1.4667, longitude: 29.6167 },
  { code: "040311", name: "Nkotsi", level: "SECTOR", parentCode: "0403", latitude: -1.5333, longitude: 29.6167 },
  { code: "040312", name: "Nyange", level: "SECTOR", parentCode: "0403", latitude: -1.4500, longitude: 29.5500 },
  { code: "040313", name: "Remera", level: "SECTOR", parentCode: "0403", latitude: -1.5500, longitude: 29.6500 },
  { code: "040314", name: "Rwaza", level: "SECTOR", parentCode: "0403", latitude: -1.5333, longitude: 29.6667 },
  { code: "040315", name: "Shingiro", level: "SECTOR", parentCode: "0403", latitude: -1.4500, longitude: 29.5167 },

  // ── Burera District (0404) ──
  { code: "040401", name: "Bungwe", level: "SECTOR", parentCode: "0404", latitude: -1.4500, longitude: 29.9167 },
  { code: "040402", name: "Butaro", level: "SECTOR", parentCode: "0404", latitude: -1.4167, longitude: 29.8333, aliases: ["Butaro Hospital"] },
  { code: "040403", name: "Cyanika", level: "SECTOR", parentCode: "0404", latitude: -1.3833, longitude: 29.7333, aliases: ["Cyanika Border"] },
  { code: "040404", name: "Cyeru", level: "SECTOR", parentCode: "0404", latitude: -1.4667, longitude: 29.8167 },
  { code: "040405", name: "Gahunga", level: "SECTOR", parentCode: "0404", latitude: -1.4167, longitude: 29.7500 },
  { code: "040406", name: "Gatebe", level: "SECTOR", parentCode: "0404", latitude: -1.4333, longitude: 29.9500 },
  { code: "040407", name: "Gitovu", level: "SECTOR", parentCode: "0404", latitude: -1.4833, longitude: 29.9000 },
  { code: "040408", name: "Kagogo", level: "SECTOR", parentCode: "0404", latitude: -1.4000, longitude: 29.8000 },
  { code: "040409", name: "Kinoni", level: "SECTOR", parentCode: "0404", latitude: -1.4667, longitude: 29.7667 },
  { code: "040410", name: "Kinyababa", level: "SECTOR", parentCode: "0404", latitude: -1.3833, longitude: 29.8500 },
  { code: "040411", name: "Kivuye", level: "SECTOR", parentCode: "0404", latitude: -1.4333, longitude: 29.8833 },
  { code: "040412", name: "Nemba", level: "SECTOR", parentCode: "0404", latitude: -1.5167, longitude: 29.8167 },
  { code: "040413", name: "Rugarama", level: "SECTOR", parentCode: "0404", latitude: -1.4333, longitude: 29.7667 },
  { code: "040414", name: "Rugendabari", level: "SECTOR", parentCode: "0404", latitude: -1.4833, longitude: 29.8500 },
  { code: "040415", name: "Ruhundi", level: "SECTOR", parentCode: "0404", latitude: -1.4667, longitude: 29.8667 },
  { code: "040416", name: "Rusarabuye", level: "SECTOR", parentCode: "0404", latitude: -1.4500, longitude: 29.8000 },
  { code: "040417", name: "Rwerere", level: "SECTOR", parentCode: "0404", latitude: -1.4333, longitude: 29.8500 },

  // ── Gicumbi District (0405) ──
  { code: "040501", name: "Bukamba", level: "SECTOR", parentCode: "0405", latitude: -1.5333, longitude: 30.0667 },
  { code: "040502", name: "Bwisige", level: "SECTOR", parentCode: "0405", latitude: -1.5500, longitude: 30.2000 },
  { code: "040503", name: "Byumba", level: "SECTOR", parentCode: "0405", latitude: -1.5833, longitude: 30.0667, aliases: ["Byumba Town"] },
  { code: "040504", name: "Cyumba", level: "SECTOR", parentCode: "0405", latitude: -1.4833, longitude: 30.0500 },
  { code: "040505", name: "Giti", level: "SECTOR", parentCode: "0405", latitude: -1.6833, longitude: 30.1333 },
  { code: "040506", name: "Kaniga", level: "SECTOR", parentCode: "0405", latitude: -1.4500, longitude: 30.0833, aliases: ["Gatuna Border"] },
  { code: "040507", name: "Manyagiro", level: "SECTOR", parentCode: "0405", latitude: -1.4833, longitude: 30.1000 },
  { code: "040508", name: "Miyove", level: "SECTOR", parentCode: "0405", latitude: -1.5333, longitude: 30.1500 },
  { code: "040509", name: "Kageyo", level: "SECTOR", parentCode: "0405", latitude: -1.6000, longitude: 30.0833 },
  { code: "040510", name: "Mukarange", level: "SECTOR", parentCode: "0405", latitude: -1.5167, longitude: 30.2167 },
  { code: "040511", name: "Muko", level: "SECTOR", parentCode: "0405", latitude: -1.6333, longitude: 30.1500 },
  { code: "040512", name: "Mutete", level: "SECTOR", parentCode: "0405", latitude: -1.6500, longitude: 30.1833 },
  { code: "040513", name: "Nyamiyaga", level: "SECTOR", parentCode: "0405", latitude: -1.5667, longitude: 30.1167 },
  { code: "040514", name: "Nyankenke", level: "SECTOR", parentCode: "0405", latitude: -1.6500, longitude: 30.0500 },
  { code: "040515", name: "Rubaya", level: "SECTOR", parentCode: "0405", latitude: -1.4667, longitude: 30.0333 },
  { code: "040516", name: "Rukomo", level: "SECTOR", parentCode: "0405", latitude: -1.5500, longitude: 30.1500 },
  { code: "040517", name: "Rushaki", level: "SECTOR", parentCode: "0405", latitude: -1.4833, longitude: 30.1667 },
  { code: "040518", name: "Rutare", level: "SECTOR", parentCode: "0405", latitude: -1.6833, longitude: 30.1000 },
  { code: "040519", name: "Ruvune", level: "SECTOR", parentCode: "0405", latitude: -1.5833, longitude: 30.1833 },
  { code: "040520", name: "Rwamiko", level: "SECTOR", parentCode: "0405", latitude: -1.6500, longitude: 30.1167 },
  { code: "040521", name: "Shangasha", level: "SECTOR", parentCode: "0405", latitude: -1.4833, longitude: 30.1333 },

  // ── Rwamagana District (0501) ──
  { code: "050101", name: "Fumbwe", level: "SECTOR", parentCode: "0501", latitude: -1.8667, longitude: 30.3333 },
  { code: "050102", name: "Gahengeri", level: "SECTOR", parentCode: "0501", latitude: -1.9167, longitude: 30.3333 },
  { code: "050103", name: "Gishari", level: "SECTOR", parentCode: "0501", latitude: -1.9500, longitude: 30.4000 },
  { code: "050104", name: "Karenge", level: "SECTOR", parentCode: "0501", latitude: -2.0167, longitude: 30.3500 },
  { code: "050105", name: "Kigabiro", level: "SECTOR", parentCode: "0501", latitude: -1.9500, longitude: 30.4333, aliases: ["Rwamagana Town"] },
  { code: "050106", name: "Muhazi", level: "SECTOR", parentCode: "0501", latitude: -1.9000, longitude: 30.4167, aliases: ["Lake Muhazi"] },
  { code: "050107", name: "Munyaga", level: "SECTOR", parentCode: "0501", latitude: -1.9667, longitude: 30.4667 },
  { code: "050108", name: "Munyiginya", level: "SECTOR", parentCode: "0501", latitude: -1.9167, longitude: 30.4500 },
  { code: "050109", name: "Musha", level: "SECTOR", parentCode: "0501", latitude: -1.9167, longitude: 30.3833 },
  { code: "050110", name: "Muyumbu", level: "SECTOR", parentCode: "0501", latitude: -1.9500, longitude: 30.2833 },
  { code: "050111", name: "Mwulire", level: "SECTOR", parentCode: "0501", latitude: -1.9833, longitude: 30.4000 },
  { code: "050112", name: "Nyakariro", level: "SECTOR", parentCode: "0501", latitude: -2.0167, longitude: 30.3000 },
  { code: "050113", name: "Nzige", level: "SECTOR", parentCode: "0501", latitude: -2.0000, longitude: 30.3667 },
  { code: "050114", name: "Rubona", level: "SECTOR", parentCode: "0501", latitude: -1.9667, longitude: 30.5000 },

  // ── Nyagatare District (0502) ──
  { code: "050201", name: "Gatunda", level: "SECTOR", parentCode: "0502", latitude: -1.3333, longitude: 30.2500 },
  { code: "050202", name: "Karama", level: "SECTOR", parentCode: "0502", latitude: -1.3667, longitude: 30.3333 },
  { code: "050203", name: "Karangazi", level: "SECTOR", parentCode: "0502", latitude: -1.5000, longitude: 30.4667 },
  { code: "050204", name: "Katabagemu", level: "SECTOR", parentCode: "0502", latitude: -1.4167, longitude: 30.3833 },
  { code: "050205", name: "Kiyombe", level: "SECTOR", parentCode: "0502", latitude: -1.3333, longitude: 30.1667 },
  { code: "050206", name: "Matimba", level: "SECTOR", parentCode: "0502", latitude: -1.2500, longitude: 30.4000, aliases: ["Kagitumba Border"] },
  { code: "050207", name: "Mimuri", level: "SECTOR", parentCode: "0502", latitude: -1.3667, longitude: 30.2833 },
  { code: "050208", name: "Mukama", level: "SECTOR", parentCode: "0502", latitude: -1.3333, longitude: 30.2000 },
  { code: "050209", name: "Musheli", level: "SECTOR", parentCode: "0502", latitude: -1.3000, longitude: 30.3667 },
  { code: "050210", name: "Nyagatare", level: "SECTOR", parentCode: "0502", latitude: -1.3000, longitude: 30.3167, aliases: ["Nyagatare Town"] },
  { code: "050211", name: "Rukomo", level: "SECTOR", parentCode: "0502", latitude: -1.4167, longitude: 30.2500 },
  { code: "050212", name: "Rwempasha", level: "SECTOR", parentCode: "0502", latitude: -1.2667, longitude: 30.3333 },
  { code: "050213", name: "Rwimiyaga", level: "SECTOR", parentCode: "0502", latitude: -1.4500, longitude: 30.4167 },
  { code: "050214", name: "Tabagwe", level: "SECTOR", parentCode: "0502", latitude: -1.2833, longitude: 30.2833 },

  // ── Gatsibo District (0503) ──
  { code: "050301", name: "Gasange", level: "SECTOR", parentCode: "0503", latitude: -1.6833, longitude: 30.3167 },
  { code: "050302", name: "Gatsibo", level: "SECTOR", parentCode: "0503", latitude: -1.5833, longitude: 30.4167 },
  { code: "050303", name: "Gitoki", level: "SECTOR", parentCode: "0503", latitude: -1.6167, longitude: 30.4500 },
  { code: "050304", name: "Kabarore", level: "SECTOR", parentCode: "0503", latitude: -1.5667, longitude: 30.3833, aliases: ["Gatsibo Town"] },
  { code: "050305", name: "Kageyo", level: "SECTOR", parentCode: "0503", latitude: -1.6333, longitude: 30.3833 },
  { code: "050306", name: "Kiramuruzi", level: "SECTOR", parentCode: "0503", latitude: -1.7000, longitude: 30.4667 },
  { code: "050307", name: "Kiziguro", level: "SECTOR", parentCode: "0503", latitude: -1.7167, longitude: 30.4333 },
  { code: "050308", name: "Muhura", level: "SECTOR", parentCode: "0503", latitude: -1.6833, longitude: 30.3500 },
  { code: "050309", name: "Murambi", level: "SECTOR", parentCode: "0503", latitude: -1.7333, longitude: 30.4000 },
  { code: "050310", name: "Ngarama", level: "SECTOR", parentCode: "0503", latitude: -1.5167, longitude: 30.3167 },
  { code: "050311", name: "Nyagihanga", level: "SECTOR", parentCode: "0503", latitude: -1.4833, longitude: 30.3667 },
  { code: "050312", name: "Remera", level: "SECTOR", parentCode: "0503", latitude: -1.6500, longitude: 30.4167 },
  { code: "050313", name: "Rugarama", level: "SECTOR", parentCode: "0503", latitude: -1.6000, longitude: 30.3333 },
  { code: "050314", name: "Rwimbogo", level: "SECTOR", parentCode: "0503", latitude: -1.6500, longitude: 30.5000 },

  // ── Kayonza District (0504) ──
  { code: "050401", name: "Gahini", level: "SECTOR", parentCode: "0504", latitude: -1.8333, longitude: 30.4833, aliases: ["Lake Muhazi East"] },
  { code: "050402", name: "Kabare", level: "SECTOR", parentCode: "0504", latitude: -1.9500, longitude: 30.6167 },
  { code: "050403", name: "Kabarondo", level: "SECTOR", parentCode: "0504", latitude: -1.9833, longitude: 30.5667 },
  { code: "050404", name: "Mukarange", level: "SECTOR", parentCode: "0504", latitude: -1.8833, longitude: 30.6167, aliases: ["Kayonza Town"] },
  { code: "050405", name: "Murama", level: "SECTOR", parentCode: "0504", latitude: -1.9333, longitude: 30.5500 },
  { code: "050406", name: "Murundi", level: "SECTOR", parentCode: "0504", latitude: -1.7833, longitude: 30.6500 },
  { code: "050407", name: "Mwiri", level: "SECTOR", parentCode: "0504", latitude: -1.8500, longitude: 30.6833 },
  { code: "050408", name: "Ndego", level: "SECTOR", parentCode: "0504", latitude: -1.8833, longitude: 30.7833, aliases: ["Akagera South"] },
  { code: "050409", name: "Nyamirama", level: "SECTOR", parentCode: "0504", latitude: -1.9667, longitude: 30.5167 },
  { code: "050410", name: "Rukara", level: "SECTOR", parentCode: "0504", latitude: -1.8000, longitude: 30.5500 },
  { code: "050411", name: "Ruramira", level: "SECTOR", parentCode: "0504", latitude: -1.9667, longitude: 30.6500 },
  { code: "050412", name: "Rwinkwavu", level: "SECTOR", parentCode: "0504", latitude: -1.9500, longitude: 30.6833 },

  // ── Kirehe District (0505) ──
  { code: "050501", name: "Gahara", level: "SECTOR", parentCode: "0505", latitude: -2.3167, longitude: 30.6833 },
  { code: "050502", name: "Gatore", level: "SECTOR", parentCode: "0505", latitude: -2.2333, longitude: 30.6667 },
  { code: "050503", name: "Kigarama", level: "SECTOR", parentCode: "0505", latitude: -2.2500, longitude: 30.6167 },
  { code: "050504", name: "Kigina", level: "SECTOR", parentCode: "0505", latitude: -2.2833, longitude: 30.7500 },
  { code: "050505", name: "Kirehe", level: "SECTOR", parentCode: "0505", latitude: -2.2667, longitude: 30.7167, aliases: ["Nyakarambi"] },
  { code: "050506", name: "Mahama", level: "SECTOR", parentCode: "0505", latitude: -2.2833, longitude: 30.8667 },
  { code: "050507", name: "Mpanga", level: "SECTOR", parentCode: "0505", latitude: -2.3500, longitude: 30.8167 },
  { code: "050508", name: "Musaza", level: "SECTOR", parentCode: "0505", latitude: -2.2500, longitude: 30.7833 },
  { code: "050509", name: "Mushikiri", level: "SECTOR", parentCode: "0505", latitude: -2.2000, longitude: 30.7500 },
  { code: "050510", name: "Nasho", level: "SECTOR", parentCode: "0505", latitude: -2.1500, longitude: 30.7000 },
  { code: "050511", name: "Nyamugari", level: "SECTOR", parentCode: "0505", latitude: -2.2333, longitude: 30.7833 },
  { code: "050512", name: "Nyarubuye", level: "SECTOR", parentCode: "0505", latitude: -2.1833, longitude: 30.7833, aliases: ["Rusumo Border"] },

  // ── Ngoma District (0506) ──
  { code: "050601", name: "Gashanda", level: "SECTOR", parentCode: "0506", latitude: -2.1500, longitude: 30.4667 },
  { code: "050602", name: "Jarama", level: "SECTOR", parentCode: "0506", latitude: -2.2833, longitude: 30.4833 },
  { code: "050603", name: "Karembo", level: "SECTOR", parentCode: "0506", latitude: -2.2000, longitude: 30.4333 },
  { code: "050604", name: "Kazo", level: "SECTOR", parentCode: "0506", latitude: -2.1833, longitude: 30.4500 },
  { code: "050605", name: "Kibungo", level: "SECTOR", parentCode: "0506", latitude: -2.1667, longitude: 30.5500, aliases: ["Kibungo Town", "Ngoma Town"] },
  { code: "050606", name: "Mugesera", level: "SECTOR", parentCode: "0506", latitude: -2.1167, longitude: 30.3333, aliases: ["Lake Mugesera"] },
  { code: "050607", name: "Murama", level: "SECTOR", parentCode: "0506", latitude: -2.2000, longitude: 30.4833 },
  { code: "050608", name: "Mutenderi", level: "SECTOR", parentCode: "0506", latitude: -2.2333, longitude: 30.5667 },
  { code: "050609", name: "Remera", level: "SECTOR", parentCode: "0506", latitude: -2.1833, longitude: 30.5500 },
  { code: "050610", name: "Rukira", level: "SECTOR", parentCode: "0506", latitude: -2.1167, longitude: 30.5500 },
  { code: "050611", name: "Rukumberi", level: "SECTOR", parentCode: "0506", latitude: -2.2667, longitude: 30.4167 },
  { code: "050612", name: "Rurenge", level: "SECTOR", parentCode: "0506", latitude: -2.2000, longitude: 30.5167 },
  { code: "050613", name: "Sake", level: "SECTOR", parentCode: "0506", latitude: -2.2500, longitude: 30.3833, aliases: ["Lake Sake"] },
  { code: "050614", name: "Zaza", level: "SECTOR", parentCode: "0506", latitude: -2.2167, longitude: 30.4500 },

  // ── Bugesera District (0507) ──
  { code: "050701", name: "Gashora", level: "SECTOR", parentCode: "0507", latitude: -2.2333, longitude: 30.2500 },
  { code: "050702", name: "Juru", level: "SECTOR", parentCode: "0507", latitude: -2.1833, longitude: 30.2167 },
  { code: "050703", name: "Kamabuye", level: "SECTOR", parentCode: "0507", latitude: -2.3667, longitude: 30.2667 },
  { code: "050704", name: "Mareba", level: "SECTOR", parentCode: "0507", latitude: -2.1500, longitude: 30.1500 },
  { code: "050705", name: "Mayange", level: "SECTOR", parentCode: "0507", latitude: -2.1833, longitude: 30.1333 },
  { code: "050706", name: "Musenyi", level: "SECTOR", parentCode: "0507", latitude: -2.1667, longitude: 30.0833 },
  { code: "050707", name: "Mwogo", level: "SECTOR", parentCode: "0507", latitude: -2.1000, longitude: 30.1667 },
  { code: "050708", name: "Ngeruka", level: "SECTOR", parentCode: "0507", latitude: -2.3167, longitude: 30.1833 },
  { code: "050709", name: "Ntarama", level: "SECTOR", parentCode: "0507", latitude: -2.1000, longitude: 30.1000 },
  { code: "050710", name: "Nyamata", level: "SECTOR", parentCode: "0507", latitude: -2.1500, longitude: 30.0833, aliases: ["Nyamata Town", "Bugesera Airport"] },
  { code: "050711", name: "Nyarugenge", level: "SECTOR", parentCode: "0507", latitude: -2.2333, longitude: 30.1667 },
  { code: "050712", name: "Rilima", level: "SECTOR", parentCode: "0507", latitude: -2.1833, longitude: 30.2333 },
  { code: "050713", name: "Ruhuha", level: "SECTOR", parentCode: "0507", latitude: -2.3333, longitude: 30.2000 },
  { code: "050714", name: "Rweru", level: "SECTOR", parentCode: "0507", latitude: -2.3667, longitude: 30.3333, aliases: ["Lake Rweru"] },
  { code: "050715", name: "Shyara", level: "SECTOR", parentCode: "0507", latitude: -2.2500, longitude: 30.0833 },
];

/**
 * Normalizes text for resilient administrative search
 */
export function normalizeAdminName(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\b(district|akarere|sector|umurenge|ville|city|province|intara|ka|ya|of|the|de)\b/gi, "")
    .replace(/[^a-z0-9]/g, "") // Keep alphanumeric only
    .trim();
}

/**
 * All divisions combined (5 Provinces + 30 Districts + 416 Sectors = 451 authoritative records)
 */
export const ALL_RWANDA_DIVISIONS: RawDivision[] = [
  ...RWANDA_PROVINCES,
  ...RWANDA_DISTRICTS,
  ...RWANDA_SECTORS,
];
