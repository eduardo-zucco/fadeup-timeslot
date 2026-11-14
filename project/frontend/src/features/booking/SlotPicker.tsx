import { useEffect, useState } from "react";
import { clock } from "@/shared/format";
import { ApiError } from "@/shared/api";
import { LoadingState } from "@/components/Spinner";

const PERIODS: [number, number, string][] = [
  [0, 720, "Manhã"],
  [720, 1080, "Tarde"],
  [1080, 1440, "Noite"],
];

interface SlotPickerProps {
  load: () => Promise<number[]>;
  reloadKey: string;
  selected: number | null;
  onSelect: (value: number) => void;
}

export function SlotPicker({ load, reloadKey, selected, onSelect }: SlotPickerProps) {
  const [slots, setSlots] = useState<number[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setSlots(null);
    setError("");
    load()
      .then((result) => {
        if (active) setSlots(result);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Não foi possível buscar os horários.");
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  if (error) {
    return (
      <div className="empty-state">
        <strong>Não foi possível buscar os horários.</strong>
        {error}
      </div>
    );
  }
  if (slots === null) {
    return <LoadingState>Buscando horários livres…</LoadingState>;
  }
  if (slots.length === 0) {
    return (
      <div className="empty-state">
        <strong>Sem horários livres nesta data.</strong>
        Escolha outro dia para encontrar um horário para você.
      </div>
    );
  }

  return (
    <>
      <div className="slots-heading">
        <h3>Horários disponíveis</h3>
        <span className="small">{slots.length} opções</span>
      </div>
      {PERIODS.map(([from, to, label]) => {
        const times = slots.filter((value) => value >= from && value < to);
        if (times.length === 0) return null;
        return (
          <div className="slot-group" key={label}>
            <p className="slot-group-label">{label}</p>
            <div className="slots">
              {times.map((value) => (
                <button
                  key={value}
                  className={`slot ${value === selected ? "selected" : ""}`}
                  aria-pressed={value === selected}
                  onClick={() => onSelect(value)}
                >
                  {clock(value)}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
