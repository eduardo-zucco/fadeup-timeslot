import { Link } from "react-router-dom";
import { useConfig } from "@/context/ConfigContext";

export interface HeadingContent {
  label: string;
  title: string;
  description: string;
}

interface NavItem {
  key: string;
  label: string;
}

interface LayoutProps {
  heading: HeadingContent;
  nav: React.ReactNode;
  children: React.ReactNode;
}

export function Layout({ heading, nav, children }: LayoutProps) {
  const { config } = useConfig();
  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="fadeUp início">
          fade<span>Up</span>
          <small>AGENDE. APAREÇA. RENOVE.</small>
        </Link>
        {nav}
      </header>
      <main id="main">
        <div className="page-heading">
          <div>
            <p className="eyebrow">{heading.label}</p>
            <h1>{heading.title}</h1>
            <p>{heading.description}</p>
          </div>
          <div className="business">
            <span className="business-mark" aria-hidden="true">
              f.
            </span>
            <div>
              <strong>{config?.name ?? "fadeUp Barbearia"}</strong>
              <small>Uma unidade · um profissional</small>
            </div>
          </div>
        </div>
        <section className="workspace" aria-label="Área de agendamento">
          <div id="app">{children}</div>
        </section>
        <footer>
          <span>
            <strong>fadeUp</strong> · Seu tempo merece cuidado.
          </span>
          <span>Horários de Brasília · Pagamento no local</span>
        </footer>
      </main>
    </>
  );
}

export type { NavItem };
