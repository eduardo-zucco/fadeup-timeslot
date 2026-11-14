import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingState } from "@/components/Spinner";
import { cancelBooking, getBooking } from "@/shared/endpoints";
import { canManage, clock, dateLabel, dayOfMonth, money, monthShort } from "@/shared/format";
import { copyManagementLink, managementLink } from "@/shared/links";
import { loadReservations } from "@/shared/storage";
import type { Booking } from "@/shared/types";

type Group = "upcoming" | "past" | "cancelled";

const GROUP_LABELS: [Group, string][] = [
  ["upcoming", "Próximos"],
  ["past", "Passados"],
  ["cancelled", "Cancelados"],
];

interface HistoryPageProps {
  onBookAnother: () => void;
  onReschedule: (booking: Booking) => void;
  onNotice: (text: string, ok?: boolean) => void;
}

export function HistoryPage({ onBookAnother, onReschedule, onNotice }: HistoryPageProps) {
  const [rows, setRows] = useState<Booking[]>([]);
  const [failures, setFailures] = useState(0);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group>("upcoming");
  const [linkFor, setLinkFor] = useState<Booking | null>(null);
  const [confirming, setConfirming] = useState<Booking | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const keys = loadReservations();
    const results = await Promise.allSettled(
      keys.map(async (key) => ({ ...(await getBooking(key.id, key.token)), token: key.token })),
    );
    setRows(results.filter((r) => r.status === "fulfilled").map((r) => (r as PromiseFulfilledResult<Booking>).value));
    setFailures(results.filter((r) => r.status === "rejected").length);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const groups: Record<Group, Booking[]> = {
    upcoming: rows.filter((b) => canManage(b)).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start),
    past: rows
      .filter((b) => b.status === "confirmed" && !canManage(b))
      .sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start),
    cancelled: rows
      .filter((b) => b.status === "cancelled")
      .sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start),
  };

  const copyLink = async (booking: Booking) => {
    const ok = await copyManagementLink(booking);
    onNotice(ok ? "Link copiado. Guarde-o em um lugar seguro." : "Selecione e copie o link abaixo.", ok);
  };

  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <h2 id="section-title">Meus agendamentos</h2>
          <p className="sub">
            Reservas salvas neste navegador. Em outro aparelho, abra o link de gerenciamento.
          </p>
        </div>
        <button className="primary" onClick={onBookAnother}>
          Agendar novo →
        </button>
      </div>

      {failures > 0 && (
        <div className="alert">
          <span>
            {failures} reserva(s) não puderam ser consultadas. Sua chave continua salva neste navegador.
          </span>
          <button className="text-button" onClick={refresh}>
            Tentar novamente
          </button>
        </div>
      )}

      <div className="tabs" aria-label="Filtrar reservas">
        {GROUP_LABELS.map(([key, label]) => (
          <button
            key={key}
            aria-pressed={group === key}
            className={group === key ? "selected" : ""}
            onClick={() => setGroup(key)}
          >
            {label} <span>{groups[key].length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState>Consultando reservas salvas…</LoadingState>
      ) : groups[group].length > 0 ? (
        groups[group].map((booking) => (
          <article className="booking-row" key={booking.id}>
            <div className="booking-date">
              <strong>{dayOfMonth(booking.date)}</strong>
              <span>{monthShort(booking.date)}</span>
            </div>
            <div className="booking-info">
              <span className={`status ${group === "upcoming" ? "confirmed" : ""}`}>
                {group === "upcoming" ? "Confirmado" : group === "past" ? "Passado" : "Cancelado"}
              </span>
              <h3>{booking.service}</h3>
              <p>
                {dateLabel(booking.date)} · {clock(booking.start)} · {booking.duration} min ·{" "}
                {money(booking.price)}
              </p>
              <p>{booking.name}</p>
            </div>
            <div className="row-actions">
              {canManage(booking) && (
                <>
                  <button className="secondary" onClick={() => onReschedule(booking)}>
                    Reagendar
                  </button>
                  <button className="secondary danger" onClick={() => setConfirming(booking)}>
                    Cancelar
                  </button>
                </>
              )}
              <button className="text-button" onClick={() => setLinkFor(booking)}>
                Link da reserva
              </button>
            </div>
          </article>
        ))
      ) : (
        <div className="empty-state">
          <strong>
            {group === "upcoming"
              ? "Nenhum horário marcado por aqui."
              : group === "past"
                ? "Ainda não há reservas passadas."
                : "Nenhuma reserva cancelada."}
          </strong>
          {group === "upcoming" ? "Que tal reservar seu próximo atendimento?" : "Seu histórico aparece nesta aba."}
        </div>
      )}

      {linkFor && (
        <div id="reservation-link">
          <div className="link-card">
            <label className="field">
              Link de gerenciamento
              <span className="hint">
                Este link dá acesso à reserva. Compartilhe apenas com quem poderá gerenciá-la.
              </span>
              <span className="link-field">
                <input readOnly value={managementLink(linkFor)} />
                <button className="secondary" onClick={() => copyLink(linkFor)}>
                  Copiar
                </button>
              </span>
            </label>
          </div>
        </div>
      )}

      <p className="small history-note">
        “Passado” indica que o horário já ocorreu; não confirma presença. Para acessar uma reserva em
        outro aparelho, use o link salvo na confirmação.
      </p>

      {confirming && (
        <ConfirmDialog
          text={`Cancelar ${confirming.service} de ${dateLabel(confirming.date)} às ${clock(confirming.start)}?`}
          onConfirm={async () => {
            await cancelBooking(confirming.id, confirming.token ?? "");
            await refresh();
            onNotice("Reserva cancelada. O horário foi liberado.", true);
          }}
          onClose={() => setConfirming(null)}
        />
      )}
    </section>
  );
}
