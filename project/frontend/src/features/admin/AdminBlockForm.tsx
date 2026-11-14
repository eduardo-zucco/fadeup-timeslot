import { useEffect, useState } from "react";
import { ApiError } from "@/shared/api";
import { createAdminBooking, getAdminSlots } from "@/shared/endpoints";
import { clock, shiftDate, today } from "@/shared/format";

const DURATIONS = [15, 30, 45, 60, 90, 120];

interface BlockFormProps {
  initialDate: string;
  onBack: () => void;
  onCreated: (date: string) => void;
  onNotice: (text: string, ok?: boolean) => void;
  onForbidden: () => void;
}

export function AdminBlockForm({
  initialDate,
  onBack,
  onCreated,
  onNotice,
  onForbidden,
}: BlockFormProps) {
  const safeDate = initialDate >= today() && initialDate <= shiftDate(today(), 90) ? initialDate : today();
  const [name, setName] = useState("");
  const [date, setDate] = useState(safeDate);
  const [duration, setDuration] = useState(30);
  const [slots, setSlots] = useState<number[] | null>(null);
  const [start, setStart] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setSlots(null);
    setStart("");
    setHint("");
    getAdminSlots(date, duration)
      .then((result) => {
        if (!active) return;
        setSlots(result.slots);
        setHint(
          result.slots.length
            ? "Apenas horários livres para a duração escolhida."
            : "Sem intervalos livres. Escolha outra data ou duração.",
        );
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          onForbidden();
          return;
        }
        setSlots([]);
        setHint(err instanceof Error ? err.message : "Horários indisponíveis.");
      });
    return () => {
      active = false;
    };
  }, [date, duration, onForbidden]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (start === "") return;
    setBusy(true);
    try {
      await createAdminBooking({
        kind: "block",
        name,
        date,
        start: Number(start),
        duration,
      });
      onCreated(date);
      onNotice("Intervalo bloqueado.", true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onForbidden();
        return;
      }
      onNotice(err instanceof Error ? err.message : "Não foi possível bloquear.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="content-panel form-panel">
      <h2 id="section-title">Bloquear um intervalo</h2>
      <p className="sub">
        Escolha uma pausa entre os horários livres. O intervalo ficará indisponível para reservas.
      </p>
      <form onSubmit={submit}>
        <label className="field">
          Motivo
          <input
            minLength={2}
            maxLength={80}
            required
            placeholder="Ex.: pausa para almoço"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label className="field">
            Data
            <input
              type="date"
              min={today()}
              max={shiftDate(today(), 90)}
              value={date}
              required
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="field">
            Duração
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {DURATIONS.map((v) => (
                <option key={v} value={v}>
                  {v} minutos
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          Início
          <select
            required
            disabled={!slots || slots.length === 0}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          >
            <option value="">{slots === null ? "Buscando horários…" : "Selecione o início"}</option>
            {(slots ?? []).map((value) => (
              <option key={value} value={value}>
                {clock(value)}
              </option>
            ))}
          </select>
          <span className="hint" aria-live="polite">
            {hint}
          </span>
        </label>
        <div className="actions">
          <button type="button" className="secondary" onClick={onBack}>
            Voltar à agenda
          </button>
          <button className="primary" type="submit" disabled={start === "" || busy} aria-busy={busy}>
            Criar bloqueio
          </button>
        </div>
      </form>
    </section>
  );
}
