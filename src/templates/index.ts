import type { CultivoTemplate } from "../types";
import mushroomKit from "./mushroom-kit.json";

export const templates: Record<string, CultivoTemplate> = {
  "mushroom-kit": mushroomKit as CultivoTemplate,
};

export function getTemplate(id: string): CultivoTemplate | undefined {
  return templates[id];
}

export function listTemplates(): CultivoTemplate[] {
  return Object.values(templates);
}
