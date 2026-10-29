import { RWANDA_AUTH_DISTRICTS } from "../search/locations-data";

export const SPOKEN_LANGUAGES = [
  "Kinyarwanda",
  "English",
  "French",
  "Swahili",
] as const;

export const RWANDA_DISTRICTS = RWANDA_AUTH_DISTRICTS.map((d) => d.name);
