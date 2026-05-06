// Core types compartidos

export type EventType =
  | "milestone"
  | "watering"
  | "feeding"
  | "monitoring"
  | "harvest"
  | "preparation"
  | "session";

export type EventStatus =
  | "pending"
  | "done"
  | "skipped"
  | "missed"
  | "in_progress";

export type CultivationStatus =
  | "planning"
  | "active"
  | "completed"
  | "aborted";

export type StockCategory =
  | "semilla"
  | "esqueje"
  | "sustrato"
  | "equipo"
  | "nutriente"
  | "fungible"
  | "kit";

export type ShoppingCategory = "esencial" | "importante" | "util";

export type ShoppingStatus = "pending" | "purchased" | "skipped";

export type PrepStatus = "pending" | "done" | "skipped";

export type ReservationStatus = "reserved" | "consumed" | "released";

// === Template ===

export interface ConsumableUsage {
  stockKey: string;
  qty: number;
  unit: string;
  trigger: "once" | "per_event" | "per_phase";
  refEventId?: string;
  refPhase?: string;
  description?: string;
}

export interface ShoppingItemTemplate {
  key: string;
  name: string;
  qty: number;
  unit: string;
  category: ShoppingCategory;
  approxPrice?: string;
  source?: "internet" | "tienda_fisica";
  notes?: string;
  wikiPhase?: string;
  scaleQuantity?: boolean;
}

export interface ConsumableUsage {
  stockKey: string;
  qty: number;
  unit: string;
  trigger: "once" | "per_event" | "per_phase";
  refEventId?: string;
  refPhase?: string;
  description?: string;
  scaleQuantity?: boolean;
}

export interface ChecklistItemTemplate {
  id: string;
  title: string;
  description?: string;
  blocking: boolean;
  estimatedMinutes?: number;
}

export interface PhaseTemplate {
  id: string;
  name: string;
  emoji: string;
  startDayOffset: number;
  endDayOffset: number;
  wikiPhase?: string;
}

export interface EventTemplate {
  id: string;
  title: string;
  emoji: string;
  type: EventType;
  offsetDays: number;
  durationMin: number;
  description: string;
  checklistInline?: string[];
  expectedSignals?: string[];
  warningIf?: string[];
  consumes?: ConsumableUsage[];
  wikiPhase?: string;
  notify: boolean;
}

export interface RecurringTask {
  id: string;
  title: string;
  emoji: string;
  type: EventType;
  startDayOffset: number;
  endDayOffset: number;
  cadence: { everyDays: number; volumeMl?: string; notes?: string };
  description?: string;
  consumes?: ConsumableUsage[];
  wikiPhase?: string;
  notify: boolean;
}

export interface CultivoTemplate {
  id: string;
  name: string;
  emoji: string;
  version: number;
  totalDuration: { days: number };
  wikiBase?: string;
  theme?: { primary: string; bg?: string };
  phases: PhaseTemplate[];
  events: EventTemplate[];
  recurringTasks: RecurringTask[];
  shoppingList: ShoppingItemTemplate[];
  prepChecklist: ChecklistItemTemplate[];
  consumables: ConsumableUsage[];
  harvestable?: boolean;
  harvestType?: string;
  produces?: { kind: string; unit: string };
  category: "planta" | "hongo" | "fermento" | "etnobotanica" | "toxicas";
}

// === Persisted ===

export interface Cultivation {
  id?: number;
  templateId: string;
  name: string;
  startDate: Date;
  status: CultivationStatus;
  scale?: number;
  notes?: string;
  customParams?: Record<string, unknown>;
  createdAt: Date;
  endedAt?: Date;
}

export interface AppEvent {
  id?: number;
  cultivationId: number;
  templateEventId?: string;
  scheduledDate: Date;
  originalDate?: Date;
  title: string;
  description: string;
  emoji: string;
  type: EventType;
  status: EventStatus;
  notes?: string;
  completedAt?: Date;
  consumesReservationIds?: number[];
  wikiUrl?: string;
  notify: boolean;
}

export interface Stock {
  id?: number;
  key: string;
  name: string;
  category: StockCategory;
  qty: number;
  unit: string;
  expiresAt?: Date;
  costPaid?: number;
  vendor?: string;
  addedAt: Date;
  notes?: string;
}

export interface StockReservation {
  id?: number;
  stockKey: string;
  cultivationId: number;
  eventId?: number;
  qty: number;
  unit: string;
  status: ReservationStatus;
  createdAt: Date;
  consumedAt?: Date;
}

export interface ShoppingItem {
  id?: number;
  cultivationId?: number;
  itemKey: string;
  name: string;
  qty: number;
  unit: string;
  category: ShoppingCategory;
  approxPrice?: string;
  source?: "internet" | "tienda_fisica";
  notes?: string;
  status: ShoppingStatus;
  purchasedAt?: Date;
  costPaid?: number;
  addedAt: Date;
  wikiUrl?: string;
}

export interface PrepChecklistItem {
  id?: number;
  cultivationId: number;
  templateChecklistId: string;
  title: string;
  description?: string;
  blocking: boolean;
  estimatedMinutes?: number;
  status: PrepStatus;
  completedAt?: Date;
}

export interface JournalEntry {
  id?: number;
  cultivationId: number;
  date: Date;
  photoBlob?: Blob;
  note: string;
  observations?: { key: string; value: string }[];
  mood?: number;
}

export interface Harvest {
  id?: number;
  cultivationId: number;
  date: Date;
  type: string;
  weightWet?: number;
  weightDry?: number;
  quality?: number;
  notes?: string;
  productEntryId?: number;
}

export interface ProductEntry {
  id?: number;
  harvestId: number;
  cultivationId: number;
  kind: string;
  qty: number;
  unit: string;
  peakUntil?: Date;
  openedAt?: Date;
  depletedAt?: Date;
  notes?: string;
}

export interface Session {
  id?: number;
  productId: number;
  date: Date;
  dose: number;
  doseUnit: string;
  method: string;
  durationMin?: number;
  setting?: string;
  notesPre?: string;
  notesPost?: string;
  rating?: number;
  toleranceWindowDays: number;
}

export interface Genetics {
  id?: number;
  kind: "semilla" | "esqueje" | "esporada" | "scoby" | "levadura";
  name: string;
  vendor?: string;
  lineage?: string;
  acquiredAt: Date;
  expiresAt?: Date;
  history?: { cultivationId: number; outcome: string }[];
  notes?: string;
}

export interface History {
  id?: number;
  cultivationId?: number;
  eventId?: number;
  action: string;
  payload: unknown;
  timestamp: Date;
}

export interface Setting {
  key: string;
  value: unknown;
}
