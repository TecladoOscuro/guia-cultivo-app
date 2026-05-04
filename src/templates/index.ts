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
import plantaSalvia from "./planta-salvia.json";
import plantaDamiana from "./planta-damiana.json";
import plantaKava from "./planta-kava.json";
import plantaKanna from "./planta-kanna.json";
import plantaBlueLotus from "./planta-blue-lotus.json";
import plantaWildLettuce from "./planta-wild-lettuce.json";
import plantaSinicuichi from "./planta-sinicuichi.json";
import plantaLupulo from "./planta-lupulo.json";
import plantaCalea from "./planta-calea.json";
import plantaMucuna from "./planta-mucuna.json";
import plantaPasiflora from "./planta-pasiflora.json";
import plantaValeriana from "./planta-valeriana.json";
import plantaAdormideraCal from "./planta-adormidera-cal.json";
import plantaCatnip from "./planta-catnip.json";
import plantaWildDagga from "./planta-wild-dagga.json";
import plantaRudaSiria from "./planta-ruda-siria.json";
import plantaCalamo from "./planta-calamo.json";
import plantaTabacoRustico from "./planta-tabaco-rustico.json";
import plantaLobelia from "./planta-lobelia.json";
import plantaColeus from "./planta-coleus.json";
import plantaSasafras from "./planta-sasafras.json";
import plantaMormonTea from "./planta-mormon-tea.json";
import plantaEscobaCanaria from "./planta-escoba-canaria.json";
import plantaChicalote from "./planta-chicalote.json";
import plantaWoodrose from "./planta-woodrose.json";
import plantaMorningGlory from "./planta-morning-glory.json";
import plantaBeleno from "./planta-beleno.json";
import plantaBelladona from "./planta-belladona.json";
import plantaMandragora from "./planta-mandragora.json";
import plantaDaturaInoxia from "./planta-datura-inoxia.json";
import plantaEstramonio from "./planta-estramonio.json";
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
  "planta-salvia": plantaSalvia as CultivoTemplate,
  "planta-damiana": plantaDamiana as CultivoTemplate,
  "planta-kava": plantaKava as CultivoTemplate,
  "planta-kanna": plantaKanna as CultivoTemplate,
  "planta-blue-lotus": plantaBlueLotus as CultivoTemplate,
  "planta-wild-lettuce": plantaWildLettuce as CultivoTemplate,
  "planta-sinicuichi": plantaSinicuichi as CultivoTemplate,
  "planta-lupulo": plantaLupulo as CultivoTemplate,
  "planta-calea": plantaCalea as CultivoTemplate,
  "planta-mucuna": plantaMucuna as CultivoTemplate,
  "planta-pasiflora": plantaPasiflora as CultivoTemplate,
  "planta-valeriana": plantaValeriana as CultivoTemplate,
  "planta-adormidera-cal": plantaAdormideraCal as CultivoTemplate,
  "planta-catnip": plantaCatnip as CultivoTemplate,
  "planta-wild-dagga": plantaWildDagga as CultivoTemplate,
  "planta-ruda-siria": plantaRudaSiria as CultivoTemplate,
  "planta-calamo": plantaCalamo as CultivoTemplate,
  "planta-tabaco-rustico": plantaTabacoRustico as CultivoTemplate,
  "planta-lobelia": plantaLobelia as CultivoTemplate,
  "planta-coleus": plantaColeus as CultivoTemplate,
  "planta-sasafras": plantaSasafras as CultivoTemplate,
  "planta-mormon-tea": plantaMormonTea as CultivoTemplate,
  "planta-escoba-canaria": plantaEscobaCanaria as CultivoTemplate,
  "planta-chicalote": plantaChicalote as CultivoTemplate,
  "planta-woodrose": plantaWoodrose as CultivoTemplate,
  "planta-morning-glory": plantaMorningGlory as CultivoTemplate,
  "planta-beleno": plantaBeleno as CultivoTemplate,
  "planta-belladona": plantaBelladona as CultivoTemplate,
  "planta-mandragora": plantaMandragora as CultivoTemplate,
  "planta-datura-inoxia": plantaDaturaInoxia as CultivoTemplate,
  "planta-estramonio": plantaEstramonio as CultivoTemplate,
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
