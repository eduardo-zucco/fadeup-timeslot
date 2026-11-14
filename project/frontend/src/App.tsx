import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfigContext } from "@/context/ConfigContext";
import { LoadingState } from "@/components/Spinner";
import { authenticateApp } from "@/shared/auth";
import { getConfig } from "@/shared/endpoints";
import type { Config } from "@/shared/types";
import { ClientPage } from "@/pages/ClientPage";
import { AdminPage } from "@/pages/AdminPage";

export function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    // 1ª camada: o front se autentica como aplicação; depois carrega o config.
    authenticateApp()
      .then(getConfig)
      .then(setConfig)
      .catch(() => setError("A agenda está indisponível. Verifique a conexão e tente novamente."));
  };

  useEffect(load, []);

  const value = useMemo(() => ({ config, setConfig }), [config]);

  if (error) {
    return (
      <main id="main">
        <section className="content-panel" style={{ marginTop: 40 }}>
          <h2>A agenda está indisponível.</h2>
          <p className="sub">Verifique a conexão e tente novamente.</p>
          <button className="primary" onClick={load}>
            Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  if (!config) {
    return (
      <main id="main">
        <div id="app" aria-busy="true">
          <LoadingState>Preparando sua agenda…</LoadingState>
        </div>
      </main>
    );
  }

  return (
    <ConfigContext.Provider value={value}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ClientPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </ConfigContext.Provider>
  );
}
