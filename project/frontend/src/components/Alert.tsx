export interface Notice {
  text: string;
  ok?: boolean;
}

interface AlertProps {
  notice: Notice | null;
  onClose: () => void;
}

export function Alert({ notice, onClose }: AlertProps) {
  if (!notice) return null;
  return (
    <div className={`alert ${notice.ok ? "ok" : ""}`} role="status" aria-live="polite">
      <span>{notice.text}</span>
      <button aria-label="Fechar aviso" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
