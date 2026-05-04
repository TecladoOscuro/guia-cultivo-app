// Side-effect: registra Temporal en globalThis para Safari iOS (no nativo).
// Debe importarse ANTES que cualquier módulo que use Temporal (Schedule-X, etc).
import { Temporal } from "@js-temporal/polyfill";

const g = globalThis as unknown as { Temporal?: typeof Temporal };
if (!g.Temporal) {
  g.Temporal = Temporal;
}
