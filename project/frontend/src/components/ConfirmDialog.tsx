import { useEffect, useRef, useState } from "react";

interface ConfirmDialogProps {
  text: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({ text, onConfirm, onClose }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      ref.current?.close();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) {
          ref.current?.close();
          onClose();
        }
      }}
    >
      <h2 id="dialog-title">{text}</h2>
      <p className="sub" id="dialog-description">
        Esta ação libera o horário para outra pessoa. O registro permanece no histórico.
      </p>
      <div id="dialog-error" role="alert">
        {error}
      </div>
      <div className="actions">
        <button
          className="secondary"
          autoFocus
          disabled={busy}
          onClick={() => {
            ref.current?.close();
            onClose();
          }}
        >
          Manter reserva
        </button>
        <button className="primary" disabled={busy} aria-busy={busy} onClick={confirm}>
          Confirmar cancelamento
        </button>
      </div>
    </dialog>
  );
}
