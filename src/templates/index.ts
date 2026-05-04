import type { CultivoTemplate } from "../types";
import mushroomKit from "./mushroom-kit.json";
import cannabisInterior from "./cannabis-interior.json";
import trufas from "./trufas.json";
import cactus from "./cactus.json";
import fermentHidromiel from "./ferment-hidromiel.json";

export const templates: Record<string, CultivoTemplate> = {
  "mushroom-kit": mushroomKit as CultivoTemplate,
  "cannabis-interior": cannabisInterior as CultivoTemplate,
  trufas: trufas as CultivoTemplate,
  cactus: cactus as CultivoTemplate,
  "ferment-hidromiel": fermentHidromiel as CultivoTemplate,
};

export function getTemplate(id: string): CultivoTemplate | undefined {
  return templates[id];
}

export function listTemplates(): CultivoTemplate[] {
  return Object.values(templates);
}
