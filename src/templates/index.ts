import type { CultivoTemplate } from "../types";
import mushroomKit from "./mushroom-kit.json";
import mushroomFriendly from "./mushroom-friendly.json";
import mushroomAdvanced from "./mushroom-advanced.json";
import cannabisInterior from "./cannabis-interior.json";
import cannabisExterior from "./cannabis-exterior.json";
import trufas from "./trufas.json";
import cactus from "./cactus.json";
import amanita from "./amanita.json";
import ayahuasca from "./ayahuasca.json";
import dmtMimosa from "./dmt-mimosa.json";
import plantasSuaves from "./plantas-suaves.json";
import fermentHidromiel from "./ferment-hidromiel.json";
import fermentCerveza from "./ferment-cerveza.json";
import fermentSidra from "./ferment-sidra.json";

export const templates: Record<string, CultivoTemplate> = {
  "mushroom-kit": mushroomKit as CultivoTemplate,
  "mushroom-friendly": mushroomFriendly as CultivoTemplate,
  "mushroom-advanced": mushroomAdvanced as CultivoTemplate,
  "cannabis-interior": cannabisInterior as CultivoTemplate,
  "cannabis-exterior": cannabisExterior as CultivoTemplate,
  trufas: trufas as CultivoTemplate,
  cactus: cactus as CultivoTemplate,
  amanita: amanita as CultivoTemplate,
  ayahuasca: ayahuasca as CultivoTemplate,
  "dmt-mimosa": dmtMimosa as CultivoTemplate,
  "plantas-suaves": plantasSuaves as CultivoTemplate,
  "ferment-hidromiel": fermentHidromiel as CultivoTemplate,
  "ferment-cerveza": fermentCerveza as CultivoTemplate,
  "ferment-sidra": fermentSidra as CultivoTemplate,
};

export function getTemplate(id: string): CultivoTemplate | undefined {
  return templates[id];
}

export function listTemplates(): CultivoTemplate[] {
  return Object.values(templates);
}
