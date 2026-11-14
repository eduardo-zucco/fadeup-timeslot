import { useState } from "react";
import { ApiError } from "@/shared/api";
import { saveAdminConfig } from "@/shared/endpoints";
import { clock } from "@/shared/format";
import type { Config, Service } from "@/shared/types";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DURATIONS = [15, 30, 45, 60, 75, 90, 120];

const toMinutes = (value: string): number => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

interface SettingsProps {
  config: Config;
  onSaved: (config: Config) => void;
  onBack: () => void;
  onNotice: (text: string, ok?: boolean) => void;
  onForbidden: () => void;
}

export function AdminSettings({ config, onSaved, onBack, onNotice, onForbidden }: SettingsProps) {
  const [name, setName] = useState(config.name);
  const [open, setOpen] = useState(clock(config.open));
  const [close, setClose] = useState(clock(config.close));
  const [interval, setInterval] = useState(config.interval);
  const [days, setDays] = useState<number[]>(config.days);
  const [services, setServices] = useState<Service[]>(config.services.map((s) => ({ ...s })));
  const [busy, setBusy] = useState(false);

  const updateService = (index: number, patch: Partial<Service>) =>
    setServices(services.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const updated: Config = {
      name: name.trim(),
      open: toMinutes(open),
      close: toMinutes(close),
      interval,
      days,
      services: services.map((s) => ({ ...s, name: s.name.trim() })),
    };
    try {
      await saveAdminConfig(updated);
      onSaved(updated);
      onNotice("Configurações salvas. Reservas existentes foram preservadas.", true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        onForbidden();
        return;
      }
      onNotice(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="content-panel form-panel">
      <h2 id="section-title">Configurações da barbearia</h2>
      <p className="sub">
        As mudanças valem para novas reservas. Atendimentos existentes mantêm serviço, valor e duração.
      </p>
      <form onSubmit={submit}>
        <label className="field">
          Nome do negócio
          <input value={name} minLength={2} maxLength={80} required onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="form-grid">
          <label className="field">
            Abre às
            <input type="time" step={900} value={open} required onChange={(e) => setOpen(e.target.value)} />
          </label>
          <label className="field">
            Fecha às
            <input type="time" step={900} value={close} required onChange={(e) => setClose(e.target.value)} />
          </label>
        </div>
        <label className="field">
          Intervalo entre atendimentos
          <select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
            {[0, 15, 30].map((v) => (
              <option key={v} value={v}>
                {v} minutos
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Dias de atendimento</legend>
          <div className="days">
            {DAYS.map((label, day) => (
              <label key={label}>
                <input
                  type="checkbox"
                  checked={days.includes(day)}
                  onChange={(e) =>
                    setDays(e.target.checked ? [...days, day] : days.filter((d) => d !== day))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="list-heading">
          <h3>Serviços</h3>
          <button
            type="button"
            className="secondary"
            disabled={services.length >= 20}
            onClick={() =>
              setServices([
                ...services,
                { id: `s-${crypto.randomUUID().slice(0, 20)}`, name: "", price: 0, duration: 30 },
              ])
            }
          >
            ＋ Adicionar serviço
          </button>
        </div>
        <p className="small">Preço em reais. Mantenha pelo menos um serviço disponível.</p>
        <div id="services-editor">
          {services.map((service, index) => (
            <fieldset className="service-editor" key={service.id}>
              <legend>Serviço {index + 1}</legend>
              <div className="config-service">
                <label className="field">
                  Nome
                  <input
                    value={service.name}
                    minLength={2}
                    maxLength={60}
                    required
                    onChange={(e) => updateService(index, { name: e.target.value })}
                  />
                </label>
                <label className="field">
                  Preço (R$)
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    step={0.01}
                    value={service.price / 100}
                    required
                    onChange={(e) => updateService(index, { price: Math.round(Number(e.target.value) * 100) })}
                  />
                </label>
                <label className="field">
                  Minutos
                  <select
                    value={service.duration}
                    onChange={(e) => updateService(index, { duration: Number(e.target.value) })}
                  >
                    {DURATIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="button"
                className="text-button danger"
                disabled={services.length === 1}
                onClick={() => setServices(services.filter((_, i) => i !== index))}
              >
                Remover serviço {index + 1}
              </button>
            </fieldset>
          ))}
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={onBack}>
            Voltar à agenda
          </button>
          <button type="submit" className="primary" disabled={busy} aria-busy={busy}>
            Salvar configurações
          </button>
        </div>
      </form>
    </section>
  );
}
