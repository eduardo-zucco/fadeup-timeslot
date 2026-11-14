import { clock, dateLabel, money } from "@/shared/format";
import type { Service } from "@/shared/types";

const STEP_NAMES = ["Serviço", "Horário", "Seus dados", "Confirmação"];

export function Stepper({ step }: { step: number }) {
  return (
    <ol className="steps" aria-label="Etapas do agendamento">
      {STEP_NAMES.map((name, index) => {
        const position = index + 1;
        const cls = step === position ? "current" : step > position ? "complete" : "";
        return (
          <li key={name} className={cls} aria-current={step === position ? "step" : undefined}>
            <b aria-hidden="true">{step > position ? "✓" : position}</b>
            {name}
          </li>
        );
      })}
    </ol>
  );
}

interface SummaryProps {
  service: Pick<Service, "name" | "duration" | "price"> | null;
  step: number;
  date: string;
  start: number | null;
  manual: boolean;
}

export function SummaryPanel({ service, step, date, start, manual }: SummaryProps) {
  return (
    <aside className="summary-panel" aria-label="Resumo do agendamento">
      <p className="summary-label">Sua reserva</p>
      {service ? (
        <>
          <h3 className="summary-service">{service.name}</h3>
          <span className="summary-duration">{service.duration} minutos de atendimento</span>
          <div className="summary-date">
            {step >= 2 ? dateLabel(date) : "Escolha a data na próxima etapa"}
            <br />
            <strong>{start !== null ? clock(start) : "Horário a definir"}</strong>
          </div>
          <div className="summary-total">
            <span>Total do serviço</span>
            <strong>{money(service.price)}</strong>
          </div>
        </>
      ) : (
        <p className="summary-placeholder">
          Escolha um serviço para começar.
          <br />O seu resumo aparece aqui.
        </p>
      )}
      <p className="summary-note">
        <strong>Pagamento no estabelecimento.</strong>
        <br />
        {manual
          ? "O atendimento será gerenciado pelo painel da barbearia."
          : "Guarde o link da confirmação para gerenciar sua reserva."}
      </p>
    </aside>
  );
}
