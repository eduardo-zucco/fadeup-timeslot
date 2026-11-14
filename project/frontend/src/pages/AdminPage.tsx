import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@/components/Alert";
import { Layout, type HeadingContent } from "@/components/Layout";
import { useConfig } from "@/context/ConfigContext";
import { useNotice } from "@/hooks/useNotice";
import { AdminAgenda } from "@/features/admin/AdminAgenda";
import { AdminBlockForm } from "@/features/admin/AdminBlockForm";
import { AdminLogin } from "@/features/admin/AdminLogin";
import { AdminSettings } from "@/features/admin/AdminSettings";
import { BookingFlow } from "@/features/booking/BookingFlow";
import { ApiError } from "@/shared/api";
import { logoutUser, tokens } from "@/shared/auth";
import { getAdminConfig } from "@/shared/endpoints";
import type { Config } from "@/shared/types";

type View = "agenda" | "config" | "block" | "manual";

const HEADING: HeadingContent = {
  label: "ÁREA DA BARBEARIA",
  title: "Sua agenda, em ordem.",
  description: "Acesso exclusivo para o responsável da barbearia.",
};

export function AdminPage() {
  const { config, setConfig } = useConfig();
  const { notice, show, clear } = useNotice();
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("agenda");
  const [formDate, setFormDate] = useState("");

  useEffect(() => {
    if (!tokens.isUserAuthenticated) {
      setReady(true);
      return;
    }
    getAdminConfig()
      .then((cfg) => {
        setConfig(cfg);
        setAuthenticated(true);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logoutUser();
      })
      .finally(() => setReady(true));
  }, [setConfig]);

  const signOut = () => {
    logoutUser();
    setAuthenticated(false);
    setView("agenda");
  };

  const onForbidden = () => {
    signOut();
    show("Sessão encerrada. Entre novamente.");
  };

  if (!config || !ready) return null;

  const nav = (
    <nav aria-label="Administração">
      <button className="active" aria-pressed="true">
        Agenda
      </button>
      <Link to="/" className="customer-link">
        Página do cliente ↗
      </Link>
    </nav>
  );

  const body = () => {
    if (!authenticated) {
      return (
        <AdminLogin
          onAuthenticated={(cfg) => {
            setConfig(cfg);
            setAuthenticated(true);
            clear();
          }}
          onNotice={show}
        />
      );
    }
    if (view === "config") {
      return (
        <AdminSettings
          config={config}
          onSaved={(cfg: Config) => {
            setConfig(cfg);
            setView("agenda");
          }}
          onBack={() => {
            clear();
            setView("agenda");
          }}
          onNotice={show}
          onForbidden={onForbidden}
        />
      );
    }
    if (view === "block") {
      return (
        <AdminBlockForm
          initialDate={formDate}
          onBack={() => {
            clear();
            setView("agenda");
          }}
          onCreated={() => setView("agenda")}
          onNotice={show}
          onForbidden={onForbidden}
        />
      );
    }
    if (view === "manual") {
      return (
        <BookingFlow
          mode="manual"
          onNotice={show}
          onDone={() => setView("agenda")}
          onCancelEdit={() => setView("agenda")}
        />
      );
    }
    return (
      <AdminAgenda
        onConfig={() => {
          clear();
          setView("config");
        }}
        onBlock={(date) => {
          clear();
          setFormDate(date);
          setView("block");
        }}
        onManual={(date) => {
          clear();
          setFormDate(date);
          setView("manual");
        }}
        onLogout={signOut}
        onNotice={show}
        onForbidden={onForbidden}
      />
    );
  };

  return (
    <Layout heading={HEADING} nav={nav}>
      <Alert notice={notice} onClose={clear} />
      {body()}
    </Layout>
  );
}
