import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingState } from "@/components/Spinner";
import { ApiError } from "@/shared/api";
import { cancelAdminBooking, getAgenda } from "@/shared/endpoints";
import { canManage, clock, dateLabel, money, shiftDate, today } from "@/shared/format";
import type { Booking } from "@/shared/types";

type Filter = "active" | "all" | "cancelled";

interface AdminAgendaProps {
  onConfig: () => void;
  onBlock: (date: string) => void;
  onManual: (date: string) => void;
  onLogout: () => void;
  onNotice: (text: string, ok?: boolean) => void;
  onForbidden: () => void;
}

export function AdminAgenda({
  onConfig,
  onBlock,
  onManual,
  onLogout,
  onNotice,
  onForbidden,
}: AdminAgendaProps) {
  const [agendaDate, setAgendaDate] = useState(today());
  const [week, setWeek] = useState(false);
  const [filter, setFilter] = useState<Filter>("active");
  const [records, setRecords] = useState<Booking[] | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<Booking | null>(null);

  const end = week ? shiftDate(agendaDate, 6) : agendaDate;

  const refresh = useCallback(async () => {
    setRecords(null);
    setError("");
    try {
      const data = await getAgenda(agendaDate, end);
      setRecords(data.records);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onForbidden();
        return;
      }
      setError(err instanceof Error ? err.message : "Agenda indisponível.");
    }
  }, [agendaDate, end, onForbidden]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const active = (records ?? []).filter((b) => b.status === "confirmed");
  const appointments = active.filter((b) => b.kind === "appointment");
  const blocks = active.filter((b) => b.kind === "block");

  const visible = (records ?? [])
    .filter((b) =>
      filter === "all" ? true : filter === "cancelled" ? b.status === "cancelled" : b.status === "confirmed",
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  const dates = [...new Set(visible.map((b) => b.date))];

  const navigate = (days: number) => setAgendaDate(shiftDate(agendaDate, days));

  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <h2 id="section-title">Agenda da barbearia</h2>
          <p className="sub">
            {dateLabel(agendaDate)}
            {week ? ` a ${dateLabel(end)}` : ""} · Horários de Brasília
          </p>
        </div>
        <div className="row-actions">
          <button className="secondary" onClick={onConfig}>
            Configurações
          </button>
          <button className="text-button" onClick={onLogout}>
            Sair
          </button>
        </div>
      </div>

      <div className="agenda-toolbar">
        <div className="calendar-nav">
          <button className="secondary" aria-label="Período anterior" onClick={() => navigate(week ? -7 : -1)}>
            ←
          </button>
          <button className="secondary" onClick={() => setAgendaDate(today())}>
            Hoje
          </button>
          <button className="secondary" aria-label="Próximo período" onClick={() => navigate(week ? 7 : 1)}>
            →
          </button>
        </div>
        <label className="field">
          Data inicial
          <input type="date" value={agendaDate} required onChange={(e) => setAgendaDate(e.target.value)} />
        </label>
        <label className="field">
          Visualização
          <select value={week ? "week" : "day"} onChange={(e) => setWeek(e.target.value === "week")}>
            <option value="day">Dia</option>
            <option value="week">Semana</option>
          </select>
        </label>
        <div className="row-actions agenda-add">
          <button className="secondary" onClick={() => onBlock(agendaDate)}>
            Bloquear horário
          </button>
          <button className="primary" onClick={() => onManual(agendaDate)}>
            ＋ Novo encaixe
          </button>
        </div>
      </div>

      <div className="agenda-stats">
        <div>
          <span>Atendimentos confirmados</span>
          <strong>{appointments.length}</strong>
        </div>
        <div>
          <span>Intervalos bloqueados</span>
          <strong>{blocks.length}</strong>
        </div>
        <div>
          <span>Valor previsto</span>
          <strong>{money(appointments.reduce((total, b) => total + b.price, 0))}</strong>
        </div>
      </div>

      <div className="list-heading">
        <h3>{week ? "Atendimentos da semana" : "Atendimentos do dia"}</h3>
        <label className="field">
          Exibir
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
            <option value="active">Ativos</option>
            <option value="all">Todos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className="empty-state">
          <strong>Agenda indisponível</strong>
          {error}
          <br />
          <button className="text-button" onClick={refresh}>
            Tentar novamente
          </button>
        </div>
      ) : records === null ? (
        <LoadingState>Consultando agenda…</LoadingState>
      ) : visible.length > 0 ? (
        dates.map((date) => (
          <section className="agenda-day" aria-label={dateLabel(date)} key={date}>
            {week && <h3 className="day-label">{dateLabel(date)}</h3>}
            {visible
              .filter((b) => b.date === date)
              .map((booking) => (
                <article
                  className={`booking-row ${booking.kind === "block" ? "blocked-row" : ""}`}
                  key={booking.id}
                >
                  <div className="time-badge">
                    <strong>{clock(booking.start)}</strong>
                    <span>{clock(booking.start + booking.duration)}</span>
                  </div>
                  <div className="booking-info">
                    <span
                      className={`status ${
                        booking.status === "confirmed" && booking.kind !== "block" ? "confirmed" : ""
                      }`}
                    >
                      {booking.status !== "confirmed"
                        ? "Cancelado"
                        : booking.kind === "block"
                          ? "Bloqueio"
                          : "Confirmado"}
                    </span>
                    <h3>{booking.name}</h3>
                    <p>
                      {booking.service} · {booking.duration} min
                      {booking.phone ? ` · ${booking.phone}` : ""}
                    </p>
                  </div>
                  <div className="row-actions">
                    {booking.kind === "appointment" && (
                      <span className="booking-value">{money(booking.price)}</span>
                    )}
                    {canManage(booking) && (
                      <button className="secondary danger" onClick={() => setConfirming(booking)}>
                        {booking.kind === "block" ? "Liberar" : "Cancelar"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
          </section>
        ))
      ) : (
        <div className="empty-state">
          <strong>
            {filter === "cancelled"
              ? "Nenhum cancelamento neste período."
              : "Nenhum item para mostrar neste período."}
          </strong>
          Use a navegação para consultar outro dia ou cadastre um encaixe.
        </div>
      )}

      <p className="small history-note">
        O valor previsto considera os atendimentos confirmados do período e não representa pagamentos
        recebidos.
      </p>

      {confirming && (
        <ConfirmDialog
          text={`${confirming.kind === "block" ? "Liberar intervalo" : "Cancelar atendimento"} de ${dateLabel(
            confirming.date,
          )} às ${clock(confirming.start)}?`}
          onConfirm={async () => {
            await cancelAdminBooking(confirming.id);
            await refresh();
            onNotice("Item cancelado e horário liberado.", true);
          }}
          onClose={() => setConfirming(null)}
        />
      )}
    </section>
  );
}
