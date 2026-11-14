import { useMemo, useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import { ApiError } from "@/shared/api";
import {
  createAdminBooking,
  createBooking,
  getAdminSlots,
  getBookingSlots,
  getSlots,
  moveBooking,
} from "@/shared/endpoints";
import { dateLabel, money, shiftDate, today } from "@/shared/format";
import { copyManagementLink, managementLink } from "@/shared/links";
import type { Booking, CustomerDraft, Service } from "@/shared/types";
import { SlotPicker } from "@/features/booking/SlotPicker";
import { Stepper, SummaryPanel } from "@/features/booking/BookingParts";

export interface BookingFlowProps {
  mode?: "client" | "manual";
  editing?: Booking | null;
  onNotice: (text: string, ok?: boolean) => void;
  onRemember?: (booking: Booking) => void;
  onDone?: (booking: Booking | null) => void;
  onCancelEdit?: () => void;
}

const EMPTY_DRAFT: CustomerDraft = { name: "", phone: "", consent: false };

export function BookingFlow({
  mode = "client",
  editing = null,
  onNotice,
  onRemember,
  onDone,
  onCancelEdit,
}: BookingFlowProps) {
  const { config } = useConfig();
  const manual = mode === "manual";
  const [step, setStep] = useState(editing ? 2 : 1);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState(editing?.date ?? today());
  const [start, setStart] = useState<number | null>(null);
  const [draft, setDraft] = useState<CustomerDraft>(EMPTY_DRAFT);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [reloadKey, setReloadKey] = useState("init");

  const current = useMemo(() => {
    if (editing) return { name: editing.service, duration: editing.duration, price: editing.price };
    return service;
  }, [editing, service]);

  if (!config) return null;

  const loadSlots = async (): Promise<number[]> => {
    if (editing) {
      const result = await getBookingSlots(editing.id, date, editing.token ?? "");
      return result.slots;
    }
    if (manual && service) {
      const result = await getAdminSlots(date, service.duration);
      return result.slots;
    }
    if (service) {
      const result = await getSlots(date, service.id);
      return result.slots;
    }
    return [];
  };

  const refreshSlots = () => setReloadKey(`${date}-${service?.id ?? editing?.id}-${Date.now()}`);

  const changeDate = (value: string) => {
    setDate(value);
    setStart(null);
    setReloadKey(`${value}-${service?.id ?? editing?.id}-${Date.now()}`);
  };

  const submitReschedule = async () => {
    if (!editing || start === null) return;
    setBusy(true);
    try {
      await moveBooking(editing.id, editing.token ?? "", date, start);
      onDone?.(null);
      onNotice("Horário atualizado. O serviço e o valor foram mantidos.", true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setStart(null);
        refreshSlots();
      }
      onNotice(err instanceof Error ? err.message : "Não foi possível reagendar.");
    } finally {
      setBusy(false);
    }
  };

  const submitBooking = async () => {
    if (!service || start === null) return;
    setBusy(true);
    setFieldErrors({});
    try {
      const body = { service: service.id, date, start, ...draft };
      const booking = manual
        ? await createAdminBooking(body)
        : await createBooking(body);
      setDraft(EMPTY_DRAFT);
      if (manual) {
        onDone?.(booking);
        onNotice("Encaixe confirmado na agenda.", true);
        return;
      }
      onRemember?.(booking);
      setConfirmed(booking);
      setStep(4);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setStart(null);
        setStep(2);
        refreshSlots();
      } else if (err instanceof ApiError && err.fields) {
        setFieldErrors(err.fields);
      }
      onNotice(err instanceof Error ? err.message : "Não foi possível confirmar.");
    } finally {
      setBusy(false);
    }
  };

  const shell = (content: React.ReactNode) => (
    <div className="booking-layout">
      <section className="flow-panel">
        <Stepper step={step} />
        {content}
      </section>
      <SummaryPanel service={current} step={step} date={date} start={start} manual={manual} />
    </div>
  );

  if (step === 4 && confirmed) {
    return shell(<Confirmation booking={confirmed} onNotice={onNotice} onNew={() => {
      setService(null);
      setStart(null);
      setStep(1);
      setConfirmed(null);
    }} onHistory={() => onDone?.(confirmed)} />);
  }

  if (step === 1) {
    return shell(
      <>
        <h2 id="section-title">O que vamos fazer hoje?</h2>
        <p className="sub">Escolha um serviço. O preço e a duração já estão definidos.</p>
        <div className="services">
          {config.services.map((item, index) => (
            <button
              key={item.id}
              className={`service ${service?.id === item.id ? "selected" : ""}`}
              aria-pressed={service?.id === item.id}
              onClick={() => {
                setService(item);
                setStart(null);
              }}
            >
              <span className="service-icon" aria-hidden="true">
                {index === 0 ? "✂" : index === 1 ? "◇" : "＋"}
              </span>
              <span className="service-copy">
                <strong>{item.name}</strong>
                <small>{item.duration} minutos</small>
              </span>
              <span className="service-price">
                {money(item.price)}
                <span className="service-check">
                  {service?.id === item.id ? "✓ Selecionado" : "Selecionar"}
                </span>
              </span>
            </button>
          ))}
        </div>
        <div className="actions">
          <p className="trust-note">Reserva sem pagamento antecipado</p>
          <button className="primary" disabled={!service} onClick={() => setStep(2)}>
            Escolher horário →
          </button>
        </div>
      </>,
    );
  }

  if (step === 2 && current) {
    return shell(
      <>
        <h2 id="section-title">Qual horário combina com você?</h2>
        <p className="sub">
          {current.name} · {current.duration} min. Os horários refletem a disponibilidade atual.
        </p>
        <label className="field">
          Data
          <input
            type="date"
            min={today()}
            max={shiftDate(today(), 90)}
            value={date}
            onChange={(e) => changeDate(e.target.value)}
            required
          />
        </label>
        <div className="date-shortcuts">
          {["Hoje", "Amanhã", dateLabel(shiftDate(today(), 2))].map((label, index) => {
            const target = shiftDate(today(), index);
            return (
              <button
                key={label}
                className={date === target ? "selected" : ""}
                onClick={() => changeDate(target)}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div aria-live="polite">
          <SlotPicker load={loadSlots} reloadKey={reloadKey} selected={start} onSelect={setStart} />
        </div>
        <div className="actions">
          <button
            className="text-button"
            onClick={() => {
              if (editing) onCancelEdit?.();
              else {
                setStep(1);
                setStart(null);
              }
            }}
          >
            ← {editing ? "Minhas reservas" : "Alterar serviço"}
          </button>
          <button
            className="primary"
            disabled={start === null || busy}
            aria-busy={busy}
            onClick={() => (editing ? submitReschedule() : setStep(3))}
          >
            {editing ? "Salvar novo horário" : "Continuar →"}
          </button>
        </div>
      </>,
    );
  }

  if (step === 3 && current) {
    return shell(
      <>
        <h2 id="section-title">Só faltam seus dados.</h2>
        <p className="sub">Confira seu resumo antes de confirmar a reserva.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitBooking();
          }}
        >
          <label className="field">
            Seu nome
            <input
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
              value={draft.name}
              aria-invalid={Boolean(fieldErrors.name)}
              placeholder="Como podemos chamar você?"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <span className="field-error">{fieldErrors.name}</span>
          </label>
          <label className="field">
            WhatsApp com DDD
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              maxLength={22}
              value={draft.phone}
              aria-invalid={Boolean(fieldErrors.phone)}
              placeholder="(14) 99999-9999"
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
            <span className="field-error">{fieldErrors.phone}</span>
          </label>
          <label className="check">
            <input
              name="consent"
              type="checkbox"
              required
              checked={draft.consent}
              onChange={(e) => setDraft({ ...draft, consent: e.target.checked })}
            />
            <span>
              {manual
                ? "O cliente autorizou o uso do nome e telefone para administrar este agendamento."
                : "Autorizo o uso do nome e telefone para administrar este agendamento."}{" "}
              Os dados ficam disponíveis ao responsável da barbearia.
            </span>
          </label>
          <span className="field-error">{fieldErrors.consent}</span>
          <p className="small">
            A confirmação aparece aqui. O envio automático pelo WhatsApp ainda não está disponível.
          </p>
          <div className="actions">
            <button type="button" className="text-button" onClick={() => setStep(2)}>
              ← Alterar horário
            </button>
            <button type="submit" className="primary" disabled={busy} aria-busy={busy}>
              Confirmar {money(current.price)} →
            </button>
          </div>
        </form>
      </>,
    );
  }

  return null;
}

interface ConfirmationProps {
  booking: Booking;
  onNotice: (text: string, ok?: boolean) => void;
  onNew: () => void;
  onHistory: () => void;
}

function Confirmation({ booking, onNotice, onNew, onHistory }: ConfirmationProps) {
  const copy = async () => {
    const ok = await copyManagementLink(booking);
    onNotice(
      ok ? "Link copiado. Guarde-o em um lugar seguro." : "Selecione e copie o link de gerenciamento abaixo.",
      ok,
    );
  };
  return (
    <div className="confirmation">
      <span className="success-symbol" aria-hidden="true">
        ✓
      </span>
      <h2 id="section-title">Seu horário está reservado!</h2>
      <p className="sub">Tudo certo, {booking.name}. Esperamos você no horário combinado.</p>
      <dl className="confirmation-details">
        <div>
          <dt>Serviço</dt>
          <dd>{booking.service}</dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>{money(booking.price)}</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{dateLabel(booking.date)}</dd>
        </div>
        <div>
          <dt>Horário</dt>
          <dd>{booking.duration} min</dd>
        </div>
      </dl>
      <label className="field">
        Link para gerenciar a reserva
        <span className="hint">Este link dá acesso à reserva. Guarde para reagendar ou cancelar.</span>
        <span className="link-field">
          <input readOnly value={managementLink(booking)} />
          <button className="secondary" onClick={copy}>
            Copiar
          </button>
        </span>
      </label>
      <div className="actions">
        <button className="text-button" onClick={onNew}>
          Agendar outro →
        </button>
        <button className="primary" onClick={onHistory}>
          Minhas reservas
        </button>
      </div>
    </div>
  );
}
