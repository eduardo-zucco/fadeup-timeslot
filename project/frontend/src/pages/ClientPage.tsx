import { useEffect, useState } from "react";
import { Alert } from "@/components/Alert";
import { Layout, type HeadingContent } from "@/components/Layout";
import { useConfig } from "@/context/ConfigContext";
import { useNotice } from "@/hooks/useNotice";
import { BookingFlow } from "@/features/booking/BookingFlow";
import { HistoryPage } from "@/features/history/HistoryPage";
import { loadReservations, rememberReservation } from "@/shared/storage";
import type { Booking } from "@/shared/types";

type View = "book" | "history";

const HEADINGS: Record<View, HeadingContent> = {
  book: {
    label: "FAÇA SUA RESERVA",
    title: "Um horário que combina com você.",
    description: "Escolha o serviço e reserve em poucos passos.",
  },
  history: {
    label: "MEUS AGENDAMENTOS",
    title: "Seu próximo encontro está aqui.",
    description: "Consulte, reagende ou cancele suas reservas.",
  },
};

const RESCHEDULE_HEADING: HeadingContent = {
  label: "REAGENDAMENTO",
  title: "Vamos encontrar um novo horário.",
  description: "O serviço e o valor da reserva original são mantidos.",
};

export function ClientPage() {
  const { config } = useConfig();
  const { notice, show, clear } = useNotice();
  const [view, setView] = useState<View>("book");
  const [editing, setEditing] = useState<Booking | null>(null);

  useEffect(() => {
    const fragment = new URLSearchParams(location.hash.slice(1)).get("reserva");
    if (fragment) {
      const [id, token] = fragment.split(".");
      if (id && token) {
        rememberReservation(loadReservations(), { id, token });
        history.replaceState(null, "", location.pathname);
        setView("history");
      }
    }
  }, []);

  const go = (next: View) => {
    clear();
    setEditing(null);
    setView(next);
  };

  if (!config) return null;

  const heading = editing ? RESCHEDULE_HEADING : HEADINGS[view];

  const nav = (
    <nav aria-label="Principal">
      <button
        className={view === "book" ? "active" : ""}
        aria-pressed={view === "book"}
        onClick={() => go("book")}
      >
        Agendar
      </button>
      <button
        className={view === "history" ? "active" : ""}
        aria-pressed={view === "history"}
        onClick={() => go("history")}
      >
        Meus horários
      </button>
    </nav>
  );

  return (
    <Layout heading={heading} nav={nav}>
      <Alert notice={notice} onClose={clear} />
      {editing ? (
        <BookingFlow
          editing={editing}
          onNotice={show}
          onDone={() => {
            setEditing(null);
            setView("history");
          }}
          onCancelEdit={() => {
            setEditing(null);
            setView("history");
          }}
        />
      ) : view === "book" ? (
        <BookingFlow
          onNotice={show}
          onRemember={(booking) => rememberReservation(loadReservations(), booking)}
          onDone={() => go("history")}
        />
      ) : (
        <HistoryPage
          onBookAnother={() => go("book")}
          onReschedule={(booking) => {
            clear();
            setEditing(booking);
          }}
          onNotice={show}
        />
      )}
    </Layout>
  );
}
