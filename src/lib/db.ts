import Dexie, { type EntityTable } from "dexie";
import type {
  Cultivation,
  AppEvent,
  Stock,
  StockReservation,
  ShoppingItem,
  PrepChecklistItem,
  JournalEntry,
  Harvest,
  ProductEntry,
  Session,
  Genetics,
  History,
  Setting,
} from "../types";

class GuiaCultivoDB extends Dexie {
  cultivations!: EntityTable<Cultivation, "id">;
  events!: EntityTable<AppEvent, "id">;
  stock!: EntityTable<Stock, "id">;
  stockReservations!: EntityTable<StockReservation, "id">;
  shoppingList!: EntityTable<ShoppingItem, "id">;
  prepChecklists!: EntityTable<PrepChecklistItem, "id">;
  journal!: EntityTable<JournalEntry, "id">;
  harvests!: EntityTable<Harvest, "id">;
  product!: EntityTable<ProductEntry, "id">;
  sessions!: EntityTable<Session, "id">;
  genetics!: EntityTable<Genetics, "id">;
  history!: EntityTable<History, "id">;
  settings!: EntityTable<Setting, "key">;

  constructor() {
    super("GuiaCultivoDB");
    this.version(1).stores({
      cultivations: "++id, templateId, status, startDate, createdAt",
      events: "++id, cultivationId, scheduledDate, status, type",
      stock: "++id, &key, category, addedAt",
      stockReservations: "++id, stockKey, cultivationId, status",
      shoppingList: "++id, cultivationId, itemKey, status",
      prepChecklists: "++id, cultivationId, status",
      journal: "++id, cultivationId, date",
      harvests: "++id, cultivationId, date",
      product: "++id, harvestId, cultivationId, kind",
      sessions: "++id, productId, date",
      genetics: "++id, kind, name",
      history: "++id, cultivationId, eventId, timestamp",
      settings: "&key",
    });
  }
}

export const db = new GuiaCultivoDB();
