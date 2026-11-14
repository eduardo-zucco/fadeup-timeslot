import { useState } from "react";
import { ApiError } from "@/shared/api";
import { loginUser } from "@/shared/auth";
import { getAdminConfig } from "@/shared/endpoints";
import type { Config } from "@/shared/types";

interface LoginProps {
  onAuthenticated: (config: Config) => void;
  onNotice: (text: string, ok?: boolean) => void;
}

export function AdminLogin({ onAuthenticated, onNotice }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await loginUser(email, password);
      const config = await getAdminConfig();
      onAuthenticated(config);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401
          ? "E-mail ou senha inválidos. Confira e tente novamente."
          : err instanceof Error
            ? err.message
            : "Não foi possível entrar.";
      onNotice(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="content-panel login-panel">
      <h2 id="section-title">Acesso da barbearia</h2>
      <p className="sub">Entre com seu e-mail e senha para acessar a agenda e as configurações.</p>
      <form onSubmit={submit}>
        <label className="field">
          E-mail
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          Senha
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <div className="actions">
          <button className="primary" type="submit" disabled={busy} aria-busy={busy}>
            Entrar no painel
          </button>
        </div>
      </form>
    </section>
  );
}
