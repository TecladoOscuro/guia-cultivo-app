import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

interface ConfirmOpts {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ChooseOpts<T extends string> {
  title?: string;
  message: string;
  options: { value: T; label: string; danger?: boolean }[];
  cancelLabel?: string;
}

function mount<T>(render: (resolve: (v: T) => void) => React.ReactNode): Promise<T> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    const cleanup = () => {
      root.unmount();
      container.remove();
    };
    const finish = (v: T) => {
      cleanup();
      resolve(v);
    };
    root.render(render(finish) as React.ReactElement);
  });
}

export function confirmDialog(opts: ConfirmOpts): Promise<boolean> {
  return mount<boolean>((resolve) => (
    <ConfirmModal opts={opts} onResult={resolve} />
  ));
}

export function chooseDialog<T extends string>(opts: ChooseOpts<T>): Promise<T | null> {
  return mount<T | null>((resolve) => (
    <ChooseModal opts={opts} onResult={resolve} />
  ));
}

function ConfirmModal({
  opts,
  onResult,
}: {
  opts: ConfirmOpts;
  onResult: (v: boolean) => void;
}) {
  useEscape(() => onResult(false));
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100]"
      onClick={() => onResult(false)}
    >
      <div
        className="bg-bg-2 border border-border rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {opts.title && (
          <h2 className="text-lg font-bold text-text-bright mb-2">{opts.title}</h2>
        )}
        <p className="text-sm whitespace-pre-line text-text-bright mb-4">
          {opts.message}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onResult(false)}
            className="px-3 py-2 border border-border rounded"
          >
            {opts.cancelLabel ?? "Cancelar"}
          </button>
          <button
            autoFocus
            onClick={() => onResult(true)}
            className={`px-3 py-2 rounded font-bold ${
              opts.danger
                ? "bg-error text-bg"
                : "bg-accent text-bg"
            }`}
          >
            {opts.confirmLabel ?? "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChooseModal<T extends string>({
  opts,
  onResult,
}: {
  opts: ChooseOpts<T>;
  onResult: (v: T | null) => void;
}) {
  useEscape(() => onResult(null));
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100]"
      onClick={() => onResult(null)}
    >
      <div
        className="bg-bg-2 border border-border rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {opts.title && (
          <h2 className="text-lg font-bold text-text-bright mb-2">{opts.title}</h2>
        )}
        <p className="text-sm whitespace-pre-line text-text-bright mb-4">
          {opts.message}
        </p>
        <div className="grid gap-2">
          {opts.options.map((o) => (
            <button
              key={o.value}
              onClick={() => onResult(o.value)}
              className={`px-3 py-2 rounded font-bold text-left ${
                o.danger ? "bg-error text-bg" : "bg-accent text-bg"
              }`}
            >
              {o.label}
            </button>
          ))}
          <button
            onClick={() => onResult(null)}
            className="px-3 py-2 border border-border rounded"
          >
            {opts.cancelLabel ?? "Cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function useEscape(handler: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler]);
}
