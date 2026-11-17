"""Gera o relatório final pesquisável em PDF e sua fonte Markdown a partir das evidências verificadas."""
from pathlib import Path
import html
import json

from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.graphics.widgets.markers import makeMarker
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "documentacao/entrega"
OUT.mkdir(parents=True, exist_ok=True)

BACKLOG = json.loads((ROOT / "documentacao/backlog.json").read_text(encoding="utf-8"))
SNAP_PATH = ROOT / "documentacao/evidencias/jira-final.json"
SNAP = json.loads(SNAP_PATH.read_text(encoding="utf-8"))
STATES = {x["key"]: x["status"] for x in SNAP["items"]}

DEPLOY_PATH = ROOT / "documentacao/evidencias/deploy.json"
DEPLOY = (
    json.loads(DEPLOY_PATH.read_text(encoding="utf-8"))
    if DEPLOY_PATH.exists()
    else {
        "published": True,
        "url": "https://www.manage-control-dev.com.br/",
        "provider": "VPS Linux (Hostinger) com Docker Compose, Nginx + Let's Encrypt e MySQL",
    }
)

pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Italic", r"C:\Windows\Fonts\ariali.ttf"))
pdfmetrics.registerFontFamily(
    "Arial",
    normal="Arial",
    bold="Arial-Bold",
    italic="Arial-Italic",
    boldItalic="Arial-Bold",
)

GREEN = colors.HexColor("#245e49")
GREEN_SOFT = colors.HexColor("#e8eee3")
GREEN_ALT = colors.HexColor("#f6f8f4")
INK = colors.HexColor("#203c31")
MUTED = colors.HexColor("#657367")
LINE = colors.HexColor("#d9e0d5")
ACCENT = colors.HexColor("#4b836c")

styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="Body",
        fontName="Arial",
        fontSize=9.8,
        leading=14.2,
        textColor=INK,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="Section",
        fontName="Arial-Bold",
        fontSize=21,
        leading=26,
        textColor=GREEN,
        spaceAfter=14,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="Sub",
        fontName="Arial-Bold",
        fontSize=11.5,
        leading=15.5,
        textColor=INK,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True,
    )
)
styles.add(
    ParagraphStyle(
        name="SmallText",
        fontName="Arial",
        fontSize=8.3,
        leading=11.3,
        textColor=MUTED,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="CellText",
        fontName="Arial",
        fontSize=8.0,
        leading=10.8,
        textColor=INK,
    )
)
styles.add(
    ParagraphStyle(
        name="CellHead",
        fontName="Arial-Bold",
        fontSize=8.2,
        leading=11.0,
        textColor=INK,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        fontName="Arial-Bold",
        fontSize=52,
        leading=58,
        textColor=GREEN,
        spaceAfter=10,
    )
)

story = []
md = []


def text(s, style="Body"):
    return Paragraph(s, styles[style])


def p(s):
    story.append(text(html.escape(s)))
    md.append(s + "\n")


def p_rich(s_pdf, s_md=None):
    story.append(text(s_pdf))
    md.append((s_md or s_pdf) + "\n")


def h(s):
    story.append(text(html.escape(s), "Sub"))
    md.append("### " + s + "\n")


def section(s):
    if story:
        story.append(PageBreak())
    story.append(text(html.escape(s), "Section"))
    md.append("\n## " + s + "\n")


def bullet(s):
    story.append(Paragraph("• " + html.escape(s), styles["Body"]))
    md.append("- " + s + "\n")


def link(label, url):
    story.append(
        text(
            f'<b>{html.escape(label)}</b><br/>'
            f'<link href="{html.escape(url, quote=True)}" color="#245e49">{html.escape(url)}</link>'
        )
    )
    md.append(f"- **{label}**: [{url}]({url})\n")


def table(headers, rows, widths=None):
    head_row = [text(html.escape(str(c)), "CellHead") for c in headers]
    body_rows = [[text(html.escape(str(c)), "CellText") for c in row] for row in rows]
    tab = Table([head_row] + body_rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
    tab.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GREEN_SOFT),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GREEN_ALT]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
                ("LINEABOVE", (0, 0), (-1, 0), 0.8, GREEN),
            ]
        )
    )
    story.extend([tab, Spacer(1, 10)])
    md.append("| " + " | ".join(headers) + " |\n| " + " | ".join(["---"] * len(headers)) + " |\n")
    md.extend("| " + " | ".join(str(c).replace("\n", " ") for c in row) + " |\n" for row in rows)
    md.append("\n")


def fig(file, title, description, height=340):
    path = ROOT / "documentacao/evidencias" / file
    if not path.exists():
        return
    h(title)
    w, hh = ImageReader(str(path)).getSize()
    width = min(450, height * w / hh)
    story.append(Image(str(path), width=width, height=width * hh / w, hAlign="CENTER"))
    story.append(Spacer(1, 8))
    md.append(f"![{title}](evidencias/{file})\n")
    p(description)


def velocity_chart():
    d = Drawing(480, 190)
    d.add(String(10, 173, "Gráfico 1 — Velocity por Ciclo (Story Points Planejados vs. Concluídos)", fontName="Arial-Bold", fontSize=9.5, fillColor=INK))
    bc = VerticalBarChart()
    bc.x = 45
    bc.y = 32
    bc.height = 115
    bc.width = 390
    bc.data = [
        [16, 46, 13],  # Planejados / Adicionados no Jira
        [16, 46, 13],  # Concluídos no Jira e em Produção
    ]
    bc.strokeColor = LINE
    bc.valueAxis.valueMin = 0
    bc.valueAxis.valueMax = 55
    bc.valueAxis.valueStep = 10
    bc.valueAxis.labels.fontName = "Arial"
    bc.valueAxis.labels.fontSize = 8
    bc.categoryAxis.labels.fontName = "Arial"
    bc.categoryAxis.labels.fontSize = 8
    bc.categoryAxis.categoryNames = [
        "Ciclo 1 — Agendamento\n(11/11)",
        "Ciclo 2 — Operação e Qualidade\n(11–12/11)",
        "Ciclo 3 — Arquitetura e Deploy\n(14/11)",
    ]
    bc.bars[0].fillColor = colors.HexColor("#a9c1b2")
    bc.bars[1].fillColor = GREEN
    bc.barLabels.nudge = 6
    bc.barLabelFormat = "%d"
    bc.barLabels.fontName = "Arial-Bold"
    bc.barLabels.fontSize = 8
    d.add(bc)
    d.add(Rect(310, 155, 9, 9, fillColor=colors.HexColor("#a9c1b2"), strokeColor=None))
    d.add(String(323, 156, "Planejados (pts)", fontName="Arial", fontSize=7.8, fillColor=INK))
    d.add(Rect(400, 155, 9, 9, fillColor=GREEN, strokeColor=None))
    d.add(String(413, 156, "Concluídos (pts)", fontName="Arial", fontSize=7.8, fillColor=INK))
    story.extend([d, Spacer(1, 8)])


def burndown_chart():
    d = Drawing(480, 195)
    d.add(String(10, 178, "Gráfico 2 — Burndown do Backlog do MVP (Pontos Restantes por Marco)", fontName="Arial-Bold", fontSize=9.5, fillColor=INK))
    lp = LinePlot()
    lp.x = 50
    lp.y = 35
    lp.height = 122
    lp.width = 400
    # X = checkpoints 0..5:
    # 0: 11/11 19:49 (34 pts MVP base)
    # 1: 11/11 20:00 (5 pts)
    # 2: 12/11 12:22 (+28 pts refinamentos = 31 pts)
    # 3: 12/11 15:55 (5 pts restantes antes do fechamento final do dia)
    # 4: 14/11 (+13 pts Ciclo 3 = 16 pts totais contando SCRUM-19/2/3/33)
    # 5: 17/11 Entrega final consolidada (0 pts MVP restantes)
    lp.data = [
        [(0, 34), (1, 5), (2, 31), (3, 5), (4, 16), (5, 0)],
    ]
    lp.lines[0].strokeColor = GREEN
    lp.lines[0].strokeWidth = 2.4
    lp.lines[0].symbol = makeMarker("FilledCircle")
    lp.xValueAxis.valueMin = 0
    lp.xValueAxis.valueMax = 5
    lp.xValueAxis.valueStep = 1
    lp.xValueAxis.labels.fontName = "Arial"
    lp.xValueAxis.labels.fontSize = 7.2
    labels = {
        0: "11/11\n19:49",
        1: "11/11\n20:00",
        2: "12/11\n+28 pts",
        3: "12/11\n15:55",
        4: "14/11\nCiclo 3",
        5: "17/11\nEntrega",
    }
    lp.xValueAxis.labelTextFormat = lambda v: labels.get(int(round(v)), "")
    lp.yValueAxis.valueMin = 0
    lp.yValueAxis.valueMax = 38
    lp.yValueAxis.valueStep = 10
    lp.yValueAxis.labels.fontName = "Arial"
    lp.yValueAxis.labels.fontSize = 8
    d.add(lp)
    d.add(Rect(305, 162, 10, 3, fillColor=GREEN, strokeColor=None))
    d.add(String(320, 160, "Pontos restantes do MVP (Jira e Produção)", fontName="Arial", fontSize=7.5, fillColor=INK))
    story.extend([d, Spacer(1, 8)])


def kanban_diagram():
    d = Drawing(495, 130)
    d.add(String(4, 116, "Quadro Kanban Atual (Projeto SCRUM — Board ID 1 — Estado Final)", fontName="Arial-Bold", fontSize=9.5, fillColor=INK))
    cols = [
        ("To Do / Pendentes", ["US-013 / SCRUM-21", "(Evolução fora do MVP)"], colors.HexColor("#f3f5f1")),
        ("In Progress / Em andamento", ["Nenhum item ativo", "(WIP máx: 2)"], colors.HexColor("#f3f5f1")),
        ("In Review / Em análise", ["Nenhum item em revisão", "(WIP máx: 1)"], colors.HexColor("#f3f5f1")),
        ("Done / Concluído", ["US-001..US-012", "US-014..US-020 (SCRUM-2/3/33)", "SCRUM-22..32 + Subtask (27)*"], GREEN_SOFT),
    ]
    w = 118
    gap = 7
    for idx, (title, lines, bg) in enumerate(cols):
        x = idx * (w + gap)
        d.add(Rect(x, 8, w, 100, fillColor=bg, strokeColor=LINE, strokeWidth=0.8, rx=4, ry=4))
        d.add(Line(x, 88, x + w, 88, strokeColor=GREEN, strokeWidth=1))
        d.add(String(x + 6, 94, title, fontName="Arial-Bold", fontSize=7.4, fillColor=INK))
        y = 73
        for ln in lines:
            d.add(String(x + 6, y, ln, fontName="Arial", fontSize=6.8, fillColor=INK))
            y -= 13
    d.add(String(4, 0, "*26 histórias/tarefas do MVP concluídas (75 pontos) + 1 subtask técnica (SCRUM-4); apenas US-013/SCRUM-21 permanece como evolução futura.", fontName="Arial-Italic", fontSize=7.0, fillColor=MUTED))
    story.extend([d, Spacer(1, 8)])


# ==============================================================================
# 3.1 CAPA
# ==============================================================================
md.append("# fadeUp — Projeto Semestral TimeSlot\n")
story.extend(
    [
        Spacer(1, 24),
        text("fadeUp", "CoverTitle"),
        text("Projeto Semestral — TimeSlot", "Section"),
    ]
)
p("3.1 Capa | Engenharia de Software III | Análise e Desenvolvimento de Sistemas (ADS) — Fatec Garça")
p(
    "Squad fadeUp. Produto: sistema web de agendamento online para barbearia (uma unidade e um profissional), "
    "permitindo ao cliente reservar, consultar, reagendar e cancelar horários em até 4 etapas e ao administrador "
    "gerenciar agenda, bloqueios, encaixes e configurações com autenticação JWT em duas camadas."
)

table(
    ["Integrante", "Papel na Squad", "Participação verificada no projeto"],
    [
        [
            "Lucas Castilho",
            "Product Owner (PO)",
            "Definição do recorte do produto, migração completa da API para Python (FastAPI + Clean Architecture + MySQL + Alembic + JWT), reescrita do frontend em React/TypeScript, containerização Docker e publicação em produção na VPS (SCRUM-2, SCRUM-33 e commits c1136d2, 32d2cec, 674b20c).",
        ],
        [
            "Eduardo Zucco",
            "Scrum Master (SM)",
            "Condução do backlog e sprints no Jira, implementação inicial do MVP e 16 Pull Requests com testes automatizados, auditoria de concorrência, isolamento de áreas e documentação de evidências (SCRUM-5 a SCRUM-32).",
        ],
        ["Felipe Pereira", "Integrante da squad", "Integrante da equipe fadeUp participante do projeto semestral."],
        ["Fausto Iriu", "Integrante da squad", "Integrante da equipe fadeUp participante do projeto semestral."],
    ],
    [110, 115, 270],
)

link("Aplicação em Produção (URL no ar)", DEPLOY.get("url") or "https://www.manage-control-dev.com.br/")
link("Painel Administrativo (Autenticado)", "https://www.manage-control-dev.com.br/admin")
link("Projeto Jira e Board (SCRUM / Board ID 1)", "https://eduardobarreto879.atlassian.net/jira/software/projects/SCRUM/boards/1")
link("Repositório GitHub (Público)", "https://github.com/eduardo-zucco/fadeup-timeslot")

p(
    "Consolidação final deste documento: 17 de novembro de 2026, cobrindo todo o histórico executado entre 11 e 17 de novembro de 2026 "
    "(MVP inicial, auditoria e refinamentos, separação arquitetural, migração para Python/FastAPI + React/MySQL + Docker e publicação em HTTPS)."
)
p(
    "Acesso para avaliação: a aplicação pública está acessível sem login em https://www.manage-control-dev.com.br/ (a área /admin é protegida por login com e-mail e senha). "
    "O repositório GitHub (https://github.com/eduardo-zucco/fadeup-timeslot) está público para consulta de commits, Pull Requests e workflows; o board Jira (projeto SCRUM) permanece atualizado com todas as entregas."
)

# ==============================================================================
# 3.2 DISCOVERY
# ==============================================================================
section("3.2 Discovery")
p(
    "O cenário proposto pelo cliente descreve um pequeno negócio de bairro (barbearia) que realiza agendamentos exclusivamente "
    "via WhatsApp e caderno físico. As dores identificadas no briefing são: choque de horários, faltas de clientes por esquecimento, "
    "tempo operacional perdido respondendo mensagens repetitivas durante os atendimentos e ausência de histórico estruturado de reservas."
)
p(
    "Recorte adotado: barbearia com uma unidade física e um profissional, preservando simplicidade máxima para que o cliente final "
    "conclua o agendamento pelo navegador do celular em até 4 etapas e o dono administre a agenda única sem depender de aplicativos complexos."
)

h("Lean Canvas — Síntese e Descrição Completa dos Nove Blocos")
canvas = [
    (
        "1. Problema",
        "Agendamentos manuais por WhatsApp e caderno provocam demora na resposta, perda de clientes fora do horário comercial, risco constante de choque de horários e falta de visibilidade do histórico de atendimentos e cancelamentos.",
    ),
    (
        "2. Segmentos de clientes",
        "Primário (MVP): dono de barbearia de bairro (1 unidade, 1 profissional) e seus clientes finais que acessam links pelo navegador móvel ou desktop. Segmentos futuros possíveis citados no briefing (salões de beleza e petshops) permanecem como expansão posterior.",
    ),
    (
        "3. Proposta única de valor",
        "Autoatendimento direto em navegador sem necessidade de instalar aplicativo ou criar conta longa: o cliente escolhe serviço, data e horário realmente livre em 4 etapas e recebe um link exclusivo de gerenciamento; o dono centraliza a agenda em tempo real sem conflitos.",
    ),
    (
        "4. Solução",
        "Aplicação web responsiva (React + TypeScript) integrada a uma API REST em Python (FastAPI + MySQL): catálogo com preço e duração, cálculo de disponibilidade em blocos de 15 minutos no fuso America/Sao_Paulo, reserva transacional à prova de concorrência, chave secreta individual (X-Booking-Token) para consulta/reagendamento/cancelamento e painel administrativo (/admin) protegido por JWT em 2 camadas.",
    ),
    (
        "5. Canais",
        "Link direto publicado em https://www.manage-control-dev.com.br/ para compartilhamento na bio do Instagram, mensagens automáticas de saudação do WhatsApp Business ou QR Code impresso no balcão da barbearia.",
    ),
    (
        "6. Fontes de receita",
        "No escopo acadêmico do MVP não há cobrança nem processamento de pagamentos online (o pagamento pelo serviço ocorre presencialmente no estabelecimento). Como modelo futuro de negócio, prevê-se assinatura mensal acessível (SaaS) por barbearia.",
    ),
    (
        "7. Estrutura de custos",
        "Desenvolvimento pela squad, registro do domínio, hospedagem em VPS Linux (Hostinger) com Docker Compose + MySQL + certificado SSL gratuito Let's Encrypt. Nenhuma API paga de mensageria ou gateway foi contratada nesta etapa.",
    ),
    (
        "8. Métricas-chave",
        "Número de atendimentos confirmados, taxa de cancelamentos e reagendamentos pelo autoatendimento, conflitos de concorrência bloqueados (HTTP 409), previsão de faturamento no painel do operador e saúde da API (/healthy_check).",
    ),
    (
        "9. Vantagem competitiva (Injusta)",
        "Fluxo ultraenxuto sem fricção (sem senha para o cliente final, sem seleção obrigatória de múltiplos profissionais), garantia de consistência atômica direto no banco relacional MySQL e código modularizado em Clean Architecture com baixo custo operacional em VPS.",
    ),
]
table(["Bloco do Lean Canvas", "Descrição detalhada em texto"], canvas, [130, 365])

h("Personas Refinadas")
table(
    ["Persona", "Quem é e contexto", "Objetivos", "Dores e necessidades"],
    [
        [
            "Marcos\n(Dono e Barbeiro, 38 anos)",
            "Proprietário de barbearia de bairro com uma cadeira. Atende clientes presencialmente e administra tudo sozinho pelo celular e computador.",
            "Organizar o dia com antecedência, evitar horários vazios inesperados e parar de interromper cortes para responder WhatsApp.",
            "Sofre com reservas anotadas errado no caderno e clientes que perguntam horários disponíveis tarde da noite. Precisa de agenda por dia/semana, bloqueio rápido de pausas (ex.: almoço), encaixe manual e edição fácil de preços e expediente.",
        ],
        [
            "Ana\n(Cliente final, 27 anos)",
            "Cliente habitual que agenda pelo celular no intervalo do trabalho ou à noite, sem paciência para baixar apps ou preencher formulários longos.",
            "Ver preços e horários livres na hora e conseguir reagendar ou cancelar sozinha caso surja um imprevisto.",
            "Desiste quando precisa esperar resposta humana no WhatsApp ou quando descobre o preço só depois de perguntar. Precisa saber valor e duração antes de confirmar, guardar um link simples da reserva e ver seu histórico no próprio navegador.",
        ],
    ],
    [85, 130, 125, 155],
)

# ==============================================================================
# 3.3 MVP
# ==============================================================================
section("3.3 MVP")
p(
    "O MVP foi estruturado a partir da jornada completa do cliente e do operador da barbearia, evoluindo em iterações até a versão "
    "em produção em https://www.manage-control-dev.com.br/. A menor funcionalidade demonstrável é o ciclo ponta a ponta de escolher serviço, "
    "reservar um horário livre sem risco de sobreposição e visualizá-lo imediatamente na agenda autenticada do administrador."
)

h("Story Map — Atividades do Usuário e Histórias Mapeadas")
table(
    ["Atividade do Usuário", "Histórias / Tarefas no Backlog", "Entrega no MVP e Evoluções"],
    [
        ["1. Descobrir atendimento", "US-001 (SCRUM-9)", "Catálogo público com nome do serviço, preço em reais e duração em minutos."],
        ["2. Escolher data e horário", "US-002 (SCRUM-10), SCRUM-23", "Cálculo de slots em janelas de 15 min considerando expediente, dias úteis, intervalo, ocupação e fuso America/Sao_Paulo."],
        ["3. Confirmar reserva", "US-003 (SCRUM-11), US-014 (SCRUM-24), SCRUM-22", "Fluxo em 4 etapas com resumo lateral, rascunho preservado ao voltar, validação de nome/DDD/consentimento e proteção transacional contra dupla reserva."],
        ["4. Consultar confirmação e histórico", "US-009 (SCRUM-17), US-015 (SCRUM-25)", "Confirmação na tela com link de gerenciamento; histórico salvo no navegador separado em Próximos, Passados e Cancelados."],
        ["5. Gerenciar a reserva", "US-004 (SCRUM-12), US-005 (SCRUM-13)", "Reagendamento atômico preservando serviço/duração original e cancelamento liberando imediatamente os intervalos via X-Booking-Token."],
        ["6. Administrar o negócio", "US-006 (SCRUM-14), US-007 (SCRUM-15), US-008 (SCRUM-16), US-016 (SCRUM-26), US-017 (SCRUM-28)", "Painel /admin isolado da área do cliente e protegido por login (e-mail + senha com JWT), visão dia/semana, filtros, bloqueios, encaixe manual e edição de catálogo/expediente."],
        ["7. Qualidade, arquitetura e produção", "US-010 (SCRUM-18), US-011 (SCRUM-19), US-012 (SCRUM-20), US-018 (SCRUM-2), US-019 (SCRUM-33), SCRUM-27..32", "Testes automatizados (35 pytest), CI/CD via GitHub Actions, Clean Architecture Python + MySQL + Alembic, React + Docker Compose e deploy HTTPS em produção."],
    ],
    [115, 145, 235],
)

h("Linha de Corte do MVP (O que entrou, o que ficou de fora e por quê)")
bullet(
    "O que ENTROU no escopo entregue: todo o núcleo funcional do agendamento em 4 etapas (US-001 a US-005 e US-009), a operação completa da barbearia (US-006 a US-008), as melhorias de UX, concorrência e isolamento de rotas (US-014 a US-017 e tarefas SCRUM-22 a SCRUM-32), a migração definitiva para Clean Architecture em Python/FastAPI/MySQL + frontend React/TypeScript + Docker (US-018 / SCRUM-2 e US-019 / SCRUM-33) e a publicação com HTTPS em https://www.manage-control-dev.com.br/."
)
bullet(
    "O que FICOU DE FORA do MVP: envio ativo de mensagens pelo WhatsApp (US-013 / SCRUM-21 — prioridade Could), pagamento online/antecipado, múltiplos profissionais ou múltiplas unidades, chatbot de atendimento, fidelidade/cupons e aplicativo nativo iOS/Android."
)
bullet(
    "Por que ficou de fora: o objetivo central do MVP é validar o autoatendimento web sem intermediários em no máximo 4 passos. Integrar gateway de pagamento ou API oficial do WhatsApp adicionaria custos de mensageria, aprovação de templates e gestão de webhooks que não são necessários para comprovar a resolução do choque de horários; o sistema mantém a tabela outbox preparada para evolução futura sem prometer envio automático na interface."
)

h("Fluxo do Cliente em Quatro Etapas e Parâmetros Padrão")
for s in [
    "Etapa 1 — Serviço: o cliente visualiza o catálogo editável (padrão inicial: Corte R$ 40,00 / 30 min; Barba R$ 30,00 / 30 min; Corte + barba R$ 65,00 / 60 min).",
    "Etapa 2 — Horário: seleciona a data (hoje até +90 dias, padrão seg–sáb 09:00–18:00) e escolhe um horário livre agrupado em Manhã, Tarde ou Noite.",
    "Etapa 3 — Seus dados: informa nome, WhatsApp com DDD e marca o consentimento LGPD para contato/gestão.",
    "Etapa 4 — Confirmação: recebe a confirmação na tela e o link exclusivo (#reserva=<id>.<token>) salvo automaticamente no navegador para consultas, reagendamentos ou cancelamentos futuros.",
]:
    bullet(s)

# ==============================================================================
# 3.4 BACKLOG NO JIRA
# ==============================================================================
section("3.4 Backlog no Jira")
p(
    "O projeto é gerenciado no Jira sob a chave SCRUM (Board ID 1), reunindo 4 épicos (SCRUM-5 a SCRUM-8), 26 histórias e tarefas concluídas do MVP (SCRUM-2, SCRUM-3, SCRUM-9 a SCRUM-20 e SCRUM-22 a SCRUM-33), 1 subtask técnica concluída (SCRUM-4, vinculada à SCRUM-2) e 1 história de evolução futura fora do MVP (SCRUM-21)."
)

table(
    ["Épico", "Título no Jira", "Descrição e Escopo", "Status Jira"],
    [
        ["SCRUM-5 / E1", "fadeUp E1 - Agendamento do cliente", "Catálogo de serviços, cálculo de disponibilidade, reserva sem conflito, cancelamento, reagendamento e consistência transacional.", STATES.get("SCRUM-5", "Concluído")],
        ["SCRUM-6 / E2", "fadeUp E2 - Operação da barbearia", "Agenda diária e semanal do operador, configuração de serviços/expediente, bloqueios, encaixes manuais e isolamento autenticado de /admin.", STATES.get("SCRUM-6", "Concluído")],
        ["SCRUM-7 / E3", "fadeUp E3 - Comunicação", "Confirmação em tela, histórico no navegador com separação de abas e preparação futura de WhatsApp automático (outbox).", STATES.get("SCRUM-7", "Em andamento")],
        ["SCRUM-8 / E4", "fadeUp E4 - Qualidade e entrega", "Testes automatizados, CI/CD, modularização, migração Python/FastAPI/MySQL + React/Docker, publicação em VPS e relatório final.", STATES.get("SCRUM-8", "Concluído")],
    ],
    [80, 130, 210, 75],
)
p(
    "Nota sobre o épico SCRUM-7 (E3): permanece 'Em andamento' exclusivamente porque contém a história futura US-013 / SCRUM-21 (WhatsApp automático, fora do escopo do MVP). "
    "Os épicos E1 (SCRUM-5), E2 (SCRUM-6) e E4 (SCRUM-8) estão 100% concluídos no Jira."
)

h("Critério de Priorização, Estimativas e Ordem Final do Backlog")
p(
    "Critério de priorização adotado: método MoSCoW (Must, Should, Could) combinado com dependências técnicas e valor direto para o usuário. "
    "Primeiro priorizou-se o fluxo essencial do cliente (US-001 a US-005 e US-009); em seguida a operação da barbearia (US-006 a US-008); "
    "depois qualidade, correções de auditoria, isolamento de acesso e arquitetura definitiva em Python/React/MySQL/Docker (US-010 a US-012, US-014 a US-020 e tarefas SCRUM-22 a SCRUM-32); "
    "e por último a evolução fora do MVP (US-013 — Could)."
)
p(
    "Estimativas: registradas no campo 'Story point estimate' (customfield_10016) usando a escala Fibonacci (1, 2, 3, 5). "
    "Os 26 itens concluídos do MVP e da arquitetura definitiva somam 75 pontos entregues (16 pontos no Ciclo 1, 46 pontos no Ciclo 2 e 13 pontos no Ciclo 3 — sendo 5 pts em SCRUM-2, 5 pts em SCRUM-33 e 3 pts em SCRUM-3), além de 5 pontos previstos para a evolução futura fora do MVP (US-013 / SCRUM-21)."
)

backlog_rows = []
for idx, s in enumerate(BACKLOG, start=1):
    key = s["key"]
    code = f"{s['us']} / {key}" if s.get("us") else key
    pts = str(s["points"]) if s.get("points") is not None else "0"
    status_live = STATES.get(key, s.get("status", "Pendente"))
    backlog_rows.append([str(idx), code, s["title"], pts, s["priority"], status_live])

table(["Ordem", "Identificador", "Título", "Pts", "MoSCoW", "Status Jira"], backlog_rows, [42, 98, 182, 32, 51, 90])

h("User Stories (US-001 a US-020) e Tarefas Técnicas com Critérios de Aceite")
p(
    "Rastreabilidade: no Jira, os itens da frente arquitetural e de publicação correspondem a US-018 (SCRUM-2 — API Python + FastAPI/MySQL), US-019 (SCRUM-33 — Frontend React + Docker), US-020 (SCRUM-3 — Pipeline CI/CD + Nginx HTTPS na VPS) e à subtask SCRUM-4 (Autenticação JWT em 2 camadas e migrations Alembic)."
)

for s in BACKLOG:
    code = s["us"]
    pts_txt = f"{s['points']} pts" if s.get("points") is not None else "sem pontuação separada"
    sprint_txt = f"Sprint {s['sprint']}" if s.get("sprint") else "Backlog (fora do MVP)"
    title = f"{code} – {s['title']} ({s['key']} | {pts_txt} | {s['priority']} | {sprint_txt})"
    status_live = STATES.get(s["key"], s.get("status", "Não disponível"))
    block = [
        text(html.escape(title), "Sub"),
        text(html.escape(s["story"])),
        text("<b>Critério de aceite:</b> " + html.escape(s["accept"])),
        text(
            f"<b>Épico:</b> {html.escape(s['parent'])} | <b>Status no Jira:</b> {html.escape(status_live)}",
            "SmallText",
        ),
    ]
    story.append(KeepTogether(block))
    md.extend(
        [
            f"### {title}\n",
            s["story"] + "\n",
            "Critério de aceite: " + s["accept"] + "\n",
            f"Épico: {s['parent']} | Status no Jira: {status_live}\n",
        ]
    )

h("Marcos do Projeto (Versions/Releases no Jira e Entrega em Produção)")
table(
    ["Marco / Versão", "Data", "Status", "O que entrega"],
    [
        [
            "fadeUp v0.1 - API (Jira ID 10000)",
            "11/11/2026",
            "Released (Concluída no Jira)",
            "Primeira versão funcional da API de catálogo, disponibilidade em blocos de 15 min, reserva transacional, cancelamento e reagendamento.",
        ],
        [
            "fadeUp v1.0 - MVP (Jira ID 10001)",
            "14/11/2026",
            "Released (Concluída no Jira)",
            "Entrega completa do MVP em produção (https://www.manage-control-dev.com.br/) com backend Python/FastAPI/MySQL, frontend React/TypeScript, autenticação JWT em 2 camadas, Docker Compose, correções de concorrência (SCRUM-22..27) e isolamento de áreas (SCRUM-28..32).",
        ],
    ],
    [130, 62, 95, 208],
)

# ==============================================================================
# 3.5 SPRINTS (SCRUM)
# ==============================================================================
section("3.5 Sprints (Scrum)")
p(
    "O projeto foi conduzido entre 11 e 17 de novembro de 2026 em três ciclos no Jira: "
    "Ciclo 1 (Sprint ID 3, encerrada com 16/16 pts), Ciclo 2 (Sprint ID 4, encerrada com 46/46 pts) e Ciclo 3 — Arquitetura e Deploy (Sprint ID 2, ativa no board com 13/13 pts concluídos)."
)

# Sprint 3
h("1. fadeUp - Ciclo 1 - Agendamento (Sprint ID 3 — Encerrada em 11/11/2026)")
p(
    "Sprint Goal: Disponibilizar catálogo de serviços, cálculo de horários livres, reserva sem conflito, cancelamento e reagendamento. "
    "Período: 11/11/2026."
)
s3_items = [s for s in BACKLOG if s["sprint"] == 3]
table(
    ["Item", "História", "Pts", "Resultado"],
    [[f"{s['us']} / {s['key']}", s["title"], str(s["points"]), STATES.get(s["key"], s["status"])] for s in s3_items],
    [110, 245, 45, 95],
)
p(
    "Balanço do Ciclo 1: 16 pontos planejados e 16 pontos concluídos (100% de entrega). Os endpoints iniciais, proteção transacional de horários e fluxo do cliente foram integrados nos PRs #1 e #2."
)

# Sprint 4
h("2. fadeUp - Ciclo 2 - Operação e entrega (Sprint ID 4 — Encerrada | 11/11 a 17/11/2026)")
p(
    "Sprint Goal: Consolidar a operação administrativa da barbearia, refinamentos de UX, separação de áreas, qualidade e entrega do MVP. "
    "A sprint reuniu 7 histórias iniciais em 11/11 (18 pontos) e 11 itens de auditoria, UX, isolamento e refatoração em 12/11 (28 pontos)."
)
s4_items = [s for s in BACKLOG if s["sprint"] == 4]
table(
    ["Item", "História / Tarefa", "Pts", "Status Jira"],
    [[f"{s['us']} / {s['key']}", s["title"], str(s["points"]), STATES.get(s["key"], s["status"])] for s in s4_items],
    [110, 245, 45, 95],
)
p(
    "Balanço do Ciclo 2: 46 pontos planejados e 46 pontos concluídos (100% de entrega), incluindo a conclusão de SCRUM-19 (Publicação do MVP) após o deploy em https://www.manage-control-dev.com.br/. Os itens foram entregues via PRs #2 a #16 e fechados com o encerramento da sprint no Jira."
)

# Sprint 2
h("3. fadeUp - Ciclo 3 - Arquitetura e Deploy (Sprint ID 2 — 11/11 a 25/11/2026)")
p(
    "Sprint Goal: Migrar backend para Python (FastAPI + Clean Architecture + MySQL + Alembic + JWT 2 camadas), frontend para React + TypeScript, Dockerizar e publicar em produção na VPS."
)
s2_items = [s for s in BACKLOG if s["sprint"] == 2]
table(
    ["Item", "História / Tarefa", "Responsável", "Pts", "Status Jira"],
    [
        [
            f"{s['us']} / {s['key']}",
            s["title"],
            s.get("assignee") or "Eduardo Barreto / Squad",
            str(s.get("points") or 0),
            STATES.get(s["key"], s["status"]),
        ]
        for s in s2_items
    ],
    [95, 215, 85, 35, 65],
)
p(
    "Balanço do Ciclo 3: 13 pontos planejados e 13 pontos concluídos (100% — SCRUM-2 com 5 pts, SCRUM-33 com 5 pts e SCRUM-3 com 3 pts, além da subtask técnica SCRUM-4 concluída), integrados via commits c1136d2, 32d2cec e 674b20c e publicados em https://www.manage-control-dev.com.br/."
)

h("Capacidade da Squad e Memória de Cálculo")
p(
    "Cálculo de capacidade adotado no planejamento acadêmico: 4 integrantes × 1 hora/dia × 3 dias úteis iniciais de janela (11, 12 e 13/11) = 12 horas brutas na janela principal; "
    "aplicando reserva de 20% para cerimônias Scrum, revisões e alinhamentos, restaram 9,6 horas úteis (3,2 h para o Ciclo 1 e 6,4 h para o Ciclo 2), acrescidas da dedicação no Ciclo 3 em 14/11 e ajustes finais até 17/11 para a migração Python/React e configuração da VPS. "
    "Os story points representam complexidade relativa (não horas trabalhadas)."
)

h("Resumo do que foi Concluído vs. o que ficou de Fora")
bullet(
    "Concluído no Jira e em produção (75/75 pontos do MVP): todas as funcionalidades do cliente (US-001 a US-005, US-009, US-014, US-015), toda a operação administrativa protegida (US-006 a US-008, US-016, US-017), todas as correções e modularizações (SCRUM-22 a SCRUM-32), a migração completa Python/MySQL/React/Docker e deploy na VPS (SCRUM-2, SCRUM-3, SCRUM-4, SCRUM-19, SCRUM-33), com 35 testes pytest aprovados e aplicação no ar em https://www.manage-control-dev.com.br/."
)
bullet(
    "Sincronização documental e transparência: todas as sprints de entrega (Ciclo 1 e Ciclo 2 encerradas; Ciclo 3 ativa no board), versões (v0.1 e v1.0 como Released) e status dos cartões no Jira espelham integralmente a aplicação publicada."
)
bullet(
    "Fora do escopo do MVP por decisão de produto: US-013 / SCRUM-21 (WhatsApp automático, 5 pts, Could), mantida em Tarefas pendentes para evoluções futuras."
)

# ==============================================================================
# 3.6 KANBAN E BOARD
# ==============================================================================
section("3.6 Kanban e board")
p(
    "O quadro do projeto SCRUM (Board ID 1) opera com quatro colunas mapeadas aos estados reais do Jira. "
    "Abaixo estão as regras de fluxo e a evolução observada ao longo do projeto."
)

table(
    ["Coluna no Jira", "Status Mapeado", "Significado e Regra de Saída (DoR / DoD de Fluxo)"],
    [
        ["To Do", "Tarefas pendentes", "Item refinado no backlog com história, prioridade MoSCoW e critérios de aceite definidos; aguardando início de desenvolvimento."],
        ["In Progress", "Em andamento", "Implementação ou documentação ativa. Só avança para revisão quando há código funcional e validação local verde."],
        ["In Review", "Em análise", "Pull Request aberto ou entrega sob inspeção técnica (code review, conferência de regressões e pipeline de CI)."],
        ["Done", "Concluído", "Critérios de aceite validados, suíte de testes aprovada e código integrado na branch principal."],
    ],
    [85, 100, 310],
)

h("Limite de WIP Adotado e Como Foi Respeitado")
p(
    "Política de WIP definida pela squad: máximo de 2 itens simultâneos em 'In Progress' (Em andamento) e 1 item em 'In Review' (Em análise), "
    "desconsiderando épicos agregadores. Embora o Jira tenha retornado constraintType = 'none' (sem trava automática na ferramenta), "
    "a regra foi respeitada manualmente ao trabalhar em fluxo sequencial de pequenas entregas: nos PRs #1 a #16 e na migração SCRUM-2/SCRUM-33, "
    "cada história/tarefa foi concluída, testada e integrada antes de abrir o próximo bloco de trabalho, evitando acúmulo de código não revisado."
)

h("Evolução do Board ao Longo do Projeto")
table(
    ["Marco / Snapshot", "Data / Hora", "To Do", "In Progress", "In Review", "Done", "Observação"],
    [
        ["Checkpoint 1 (Início)", "11/11 19:49 UTC", "12 US", "0", "1 (SCRUM-11)", "0", "Código base avançando antes da sincronia no quadro."],
        ["Checkpoint 2 (Código/Testes)", "11/11 20:00 UTC", "1 (US-013)", "2 (US-011/12)", "0", "10 US", "Ciclo 1 e parte do Ciclo 2 concluídos após PRs #1–#4."],
        ["Checkpoint 3 (Fechamento dia 11)", "11/11 20:41 UTC", "2 (US-011/13)", "0", "0", "11 US", "Sprint 3 fechada; US-012 concluída; US-011 aguardando etapa final de publicação."],
        ["Checkpoint 4 (Auditoria dia 12)", "12/11 15:55 UTC", "2 (US-011/13)", "0", "1 (SCRUM-27)", "16 itens", "SCRUM-22..26 concluídos; SCRUM-27..32 concluídos ao fim do dia."],
        ["Estado Atual (Pós-Deploy)", "17/11 20:30 BRT", "1 (SCRUM-21)", "0", "0", "27 itens*", "100% do MVP concluído no Jira e em produção (SCRUM-2/3/19/33); apenas US-013 pendente fora do MVP."],
    ],
    [92, 66, 62, 58, 62, 48, 107],
)
kanban_diagram()

h("Condução das Dailies e Acompanhamento")
p(
    "O acompanhamento diário seguiu o formato enxuto de sincronia focada no Sprint Goal e no board do Jira, "
    "registrando em ciclos curtos: (1) o que foi integrado e testado desde o último checkpoint, (2) o próximo card prioritário respeitando o WIP, e (3) impedimentos técnicos (como a falha de concorrência PATCH/DELETE e o erro de contexto no login, resolvidos nos PRs #7 e #16, e a posterior definição da arquitetura definitiva em Python/MySQL/React para publicação em VPS)."
)

# ==============================================================================
# 3.7 EXECUÇÃO TÉCNICA
# ==============================================================================
section("3.7 Execução técnica")

h("1. Arquitetura Atual em Produção (Clean Architecture + React + MySQL + Docker)")
p(
    "Após as entregas iniciais do MVP em Node.js/SQLite (PRs #1 a #16), o projeto foi integralmente refatorado e evoluído em 14/11/2026 "
    "(SCRUM-2 / commit c1136d2) para a arquitetura definitiva de produção: "
    "Frontend SPA em React 18 + TypeScript + Vite + Tailwind CSS + SCSS (servido por Nginx) comunicando-se via HTTPS na mesma origem (/api/*) "
    "com uma API REST em Python 3.11 + FastAPI + SQLAlchemy 2.0 assíncrono + Alembic + MySQL externo."
)

table(
    ["Camada / Diretório", "Componentes e Responsabilidades Reais"],
    [
        [
            "Apresentação / HTTP\n(project/backend/app/controllers)",
            "auth_controller.py (/api/auth/*), config_controller.py (/api/config), bookings_controller.py (/api/slots e /api/bookings/*), admin_controller.py (/api/admin/*), healthy_check_controller.py (/healthy_check) e middleware/headers.py (require_app, require_user, booking_token).",
        ],
        [
            "Casos de Uso\n(project/backend/app/usecases)",
            "agenda_usecase.py (AgendaUsecase: regras de listagem de slots, criação atômica, reagendamento e cancelamento com trava de atendimento já iniciado para cliente), config_usecase.py (ConfigUsecase) e auth_usecase.py (AuthUsecase: fluxo de tokens de app e admin).",
        ],
        [
            "Serviços de Domínio\n(project/backend/app/services)",
            "scheduling_service.py (fuso America/Sao_Paulo, janela de 90 dias, intervalos de 15 min), config_service.py (validação do catálogo/expediente), customer_service.py (validação de nome, telefone DDD e consentimento), jwt_service.py (HS256), hashing_service.py (SHA-256 e bcrypt + pepper), notifications_service.py (outbox) e errors.py.",
        ],
        [
            "Entidades e Contratos\n(project/backend/app/entities e interfaces)",
            "Modelos ORM SQLAlchemy em mysql/models.py (Setting, Booking, Occupancy, Outbox) e mysql/auth_models.py (TypeDocument, Administrator, User, ServiceCredential); schemas Pydantic de request/response; interfaces abstratas IAgendaUsecase, IAgendaRepository e IConfigUsecase.",
        ],
        [
            "Infraestrutura e Migrations\n(project/backend/infrastructure e migrations)",
            "AgendaRepository e AuthRepository assíncronos (SQLAlchemy + aiomysql), connection.py com pool configurável e rollback automático, e migrations Alembic 0001_inicial.py e 0002_auth.py executadas no start pelo entrypoint.sh.",
        ],
        [
            "Frontend SPA React\n(project/frontend/src)",
            "App.tsx (autenticação automática da camada app + roteamento React Router para / e /admin), ClientPage.tsx (BookingFlow em 4 etapas, SlotPicker, SummaryPanel, HistoryPage), AdminPage.tsx (AdminLogin, AdminAgenda, AdminBlockForm, AdminSettings), shared/auth.ts (renovação transparente de JWT) e shared/api.ts.",
        ],
    ],
    [135, 360],
)

h("Banco de Dados MySQL, Migrations Alembic e Segurança JWT em 2 Camadas")
p(
    "O esquema relacional versionado pelo Alembic cria 8 tabelas no MySQL: "
    "settings (configuração JSON do negócio), bookings (reservas e bloqueios com token de 72 chars), "
    "occupancy (chave primária composta por date e minute em células de 15 min, impedindo fisicamente duas reservas no mesmo horário sob concorrência), "
    "outbox (fila de eventos de confirmação, lembrete e cancelamento), "
    "além das tabelas de autenticação type_documents, administrators, users e service_credentials."
)
p(
    "Autenticação em 2 camadas (JWT HS256): na 1ª camada, o frontend troca client_id e client_secret (validado via SHA-256 em service_credentials) em POST /api/auth/app-token por um JWT de aplicação (30 min) e refresh (7 dias), exigido nas rotas públicas via Bearer. "
    "Na 2ª camada, o administrador autentica com e-mail e senha em POST /api/auth/login (validados via bcrypt + PASSWORD_PEPPER em users), obtendo access token (30 min) e refresh token stateless (2h, com rotação em /api/auth/refresh). "
    "As rotas /api/admin/* exigem simultaneamente Authorization: Bearer <user_token> e X-App-Token: <app_token>; falhas retornam HTTP 401."
)

table(
    ["Método e Rota", "Autenticação Exigida", "Responsabilidade"],
    [
        ["POST /api/auth/app-token | /app-refresh", "Aberta (client_id + secret)", "Emite e renova o JWT da aplicação SPA."],
        ["POST /api/auth/login | /refresh", "Aberta (e-mail + senha / refresh)", "Autentica administrador (bcrypt + pepper) e rotaciona tokens."],
        ["GET /api/config", "JWT Aplicação (Bearer)", "Retorna catálogo de serviços, expediente e dias ativos."],
        ["GET /api/slots?date&service", "JWT Aplicação (Bearer)", "Calcula horários disponíveis respeitando duração e intervalo."],
        ["POST /api/bookings", "JWT Aplicação (Bearer)", "Cria reserva atômica e retorna token individual de gerenciamento."],
        ["GET | PATCH | DELETE /api/bookings/{id}", "JWT App + X-Booking-Token", "Consulta, reagenda e cancela reserva específica (409 se já iniciou)."],
        ["GET /api/bookings/{id}/slots?date", "JWT App + X-Booking-Token", "Lista horários para reagendar mantendo duração original."],
        ["GET /api/admin/session", "JWT User + X-App-Token", "Valida sessão administrativa ativa."],
        ["GET | PUT /api/admin/config", "JWT User + X-App-Token", "Consulta e atualiza catálogo, preços, expediente e dias."],
        ["GET /api/admin/agenda?date&end", "JWT User + X-App-Token", "Lista atendimentos, bloqueios e cancelados (janela de até 31 dias)."],
        ["GET /api/admin/slots?date&duration", "JWT User + X-App-Token", "Horários livres para duração customizada (encaixe/bloqueio)."],
        ["POST /api/admin/bookings", "JWT User + X-App-Token", "Cria encaixe manual ou bloqueio de intervalo (kind='block')."],
        ["DELETE /api/admin/bookings/{id}", "JWT User + X-App-Token", "Cancela atendimento ou libera bloqueio administrativo."],
        ["GET /healthy_check", "Aberta", "Health check utilizado pelo pipeline de deploy e Nginx."],
    ],
    [165, 115, 215],
)

h("2. Pull Requests (#1 a #16), Commits de Migração/Deploy e Code Review")
p(
    "Todo o histórico de código está preservado no repositório público GitHub (https://github.com/eduardo-zucco/fadeup-timeslot, branch main). "
    "Os 16 Pull Requests das etapas iniciais e de refinamento (11 e 12/11) foram publicados, validados em CI e revisados no repositório, registrando achados técnicos e links nas issues do Jira. "
    "Em 14/11/2026, o PO Lucas Castilho integrou diretamente na main os commits c1136d2, 32d2cec e 674b20c com a migração completa para Python/FastAPI/MySQL/React, pipeline de deploy e configuração do Nginx em produção."
)

pr_rows = [
    ["#1 (11/11)", "SCRUM-11/18", "eduardo-zucco", "API SQLite e domínio base; revisão removeu deps residuais do lockfile e adicionou teste de origem externa."],
    ["#2 (11/11)", "SCRUM-9/17", "eduardo-zucco", "Fluxo cliente em 4 etapas e painel; revisão corrigiu ordenação do histórico e removeu fontes externas."],
    ["#3 (11/11)", "SCRUM-19", "eduardo-zucco", "Build ESM e ampliação do CI com checagem, build e publicação de artefatos."],
    ["#4 (11/11)", "SCRUM-19", "eduardo-zucco", "Preparação inicial de staging com proteção de chave admin e descarte de headers forjados."],
    ["#5 (11/11)", "SCRUM-20", "eduardo-zucco", "Primeiro relatório PDF e exportação das evidências iniciais do Jira."],
    ["#6 (11/11)", "Docs", "eduardo-zucco", "Auditoria de escopo reproduzindo falha P2 de concorrência PATCH/DELETE e ajuste de janela."],
    ["#7 (12/11)", "SCRUM-22", "eduardo-zucco", "Correção definitiva da concorrência cancelar/reagendar com triggers e testes nas duas ordens."],
    ["#8 (12/11)", "SCRUM-23", "eduardo-zucco", "Auditoria da API: agenda histórica (31 dias), duração original no reagendamento e erros HTTP 4xx/5xx."],
    ["#9 (12/11)", "SCRUM-24", "eduardo-zucco", "Resumo lateral ao vivo no agendamento, rascunho preservado ao voltar etapa e recuperação de conflito 409."],
    ["#10 (12/11)", "SCRUM-25", "eduardo-zucco", "Histórico separado em Próximos/Passados/Cancelados, diálogo acessível de cancelamento e link recuperável."],
    ["#11 (12/11)", "SCRUM-26", "eduardo-zucco", "Painel com visão dia/semana, filtros, bloqueio por slots livres, encaixe e editor de serviços."],
    ["#12 (12/11)", "SCRUM-27", "eduardo-zucco", "Consolidação da auditoria de melhorias, CI com timeout, JUnit XML e retenção de artefatos por 14 dias."],
    ["#13 (12/11)", "SCRUM-28/29", "eduardo-zucco", "Separação estrita cliente (/) vs. /admin autenticado e modularização em camadas."],
    ["#14 (12/11)", "SCRUM-30", "eduardo-zucco", "Guia de arquitetura, testes de isolamento/XSS e capturas da separação de áreas."],
    ["#15 (12/11)", "SCRUM-31", "eduardo-zucco", "Reorganização de pastas e remoção de preparações antigas sem uso (Worker/Cloudflare)."],
    ["#16 (12/11)", "SCRUM-32", "eduardo-zucco", "Correção do bug 'notice is not a function' no submit de login admin e +2 testes de regressão (37 testes)."],
    ["Commit c1136d2\n(14/11)", "SCRUM-2 / SCRUM-33", "Lucas Castilho (PO)", "Migração completa para Python (FastAPI + Clean Architecture + SQLAlchemy/MySQL + Alembic + JWT 2 camadas) e frontend React + TypeScript + Tailwind + SCSS + Docker Compose."],
    ["Commits 32d2cec / 674b20c (14/11)", "SCRUM-3 / Deploy VPS", "Lucas Castilho (PO)", "Pipeline GitHub Actions (.github/workflows/deploy.yml), script deploy.sh com health check e proxy Nginx com HTTPS Let's Encrypt."],
]
table(["PR / Commit", "Jira", "Autor / Revisão", "Escopo e Achados do Code Review"], pr_rows, [72, 68, 95, 260])
link("Lista completa de Pull Requests (#1 a #16)", "https://github.com/eduardo-zucco/fadeup-timeslot/pulls?q=is%3Apr")
link("Commits da branch main (inclui c1136d2, 32d2cec e 674b20c)", "https://github.com/eduardo-zucco/fadeup-timeslot/commits/main")

h("3. Pipeline de Integração Contínua (CI) e Entrega Contínua (CD)")
p(
    "Durante os PRs #1 a #16, o pipeline de CI em GitHub Actions executava a cada push e pull_request em Ubuntu (Node 24) com timeout de 10 minutos, "
    "rodando suíte completa de testes (evoluindo de 16 até 37 testes), verificação de sintaxe (48 módulos), build e geração de relatórios JUnit XML "
    "(runs aprovados: 43086969699, 43088503885, 43090711621, 43092264614, 43247593235, 43248333894, 43250474441, 43250968563, 43251928443, 43253349922, 43268209939, 43268562602, 43270743466 e 43281875218)."
)
p(
    "Na arquitetura definitiva (14/11/2026), o repositório conta com o workflow de Entrega Contínua em .github/workflows/deploy.yml ('Deploy (manual)', disparado via workflow_dispatch com seleção de branch). "
    "O workflow injeta os segredos de produção (VPS_HOST, VPS_USER, VPS_PORT, VPS_SSH_KEY, APP_DIR, DOMAIN, credenciais MySQL, JWT_SECRET, PASSWORD_PEPPER, VITE_APP_CLIENT_ID e VITE_APP_CLIENT_SECRET), conecta na VPS via SSH (appleboy/ssh-action@v1.0.3) e executa deploy.sh, que sincroniza o código via git reset --hard, grava o .env de produção, reconstrói e sobe os containers com docker-compose.prod.yml e verifica até 20 vezes o endpoint http://localhost:8000/healthy_check antes de finalizar."
)

h("4. Testes Implementados e Definition of Done (DoD)")
p(
    "A nova suíte automatizada em Python (project/backend/tests/) utiliza pytest + httpx TestClient + SQLAlchemy assíncrono com aiosqlite em banco temporário isolado por teste, exercitando os mesmos repositórios, serviços e controllers da produção sem exigir MySQL ativo durante o teste. "
    "Executada em 17/11/2026, registrou 35 testes aprovados (35 passed, 0 failed):"
)
bullet("tests/api/test_auth.py (9 testes): emissão de app-token, rejeição 401 de client_secret errado e client_id inexistente, login admin válido, senha errada 401, rotação de refresh token de usuário, refresh inválido 401, app-refresh válido e validação conjunta obrigatória de Authorization + X-App-Token nas rotas /api/admin/*.")
bullet("tests/api/test_bookings.py (12 testes): bloqueio 401 sem auth, retorno da configuração padrão, listagem de slots em dia útil, rejeição 400 para data passada, ciclo completo criar -> consultar (sem expor token no GET) -> cancelar, conflito de horário 409, erro 400 detalhado por campos (fields), proteção 401 do painel, fluxo completo do admin, criação de bloqueio, reagendamento PATCH e /healthy_check.")
bullet("tests/services/test_scheduling_service.py (14 casos de teste): formatação de horários, validação de datas de calendário (ex.: rejeição de 2026-02-30), cálculo de células de 15 min com intervalo, dia da semana, janela máxima de 31 dias na agenda, imutabilidade da config padrão, 5 cenários parametrizados de rejeição de configuração inválida, ID de serviço duplicado, normalização de telefone e validação de campos de cliente.")

table(
    ["Item da Definition of Done (DoD)", "Verificação Atual"],
    [
        ["Critérios de aceite implementados", "Fluxos de cliente, operador, isolamento de rotas, autenticação JWT 2 camadas e concorrência implementados e verificados."],
        ["Persistência e ausência de conflitos", "MySQL com migrations Alembic (0001_inicial e 0002_auth) e chave primária composta (date, minute) em occupancy garantindo atomicidade."],
        ["Validação e segurança", "Pydantic + regras de domínio, CORS configurado por FRONT_ORIGINS, headers no-store/nosniff, bcrypt com pepper e JWT HS256."],
        ["Testes automatizados", "35 testes pytest aprovados em 17/11/2026 (cobrindo auth, API de reservas, concorrência 409, admin e domínio), sucedendo os 37 testes da fase Node."],
        ["CI/CD e revisão registrada", "Histórico de 16 PRs com CI verde + workflow deploy.yml automatizando build, migrations e health check na VPS."],
        ["Deploy em produção acessível", "Publicado e no ar com HTTPS em https://www.manage-control-dev.com.br/."],
        ["Documentação e entrega final", "PDF atualizado com seções 3.1 a 3.9, texto pesquisável, gráficos, evidências visuais e fontes rastreáveis."],
    ],
    [165, 330],
)

h("5. Deploy: Onde Está no Ar e Como Foi Feito")
p(
    "A aplicação está publicada em produção com domínio e certificado TLS/HTTPS ativos em: https://www.manage-control-dev.com.br/"
)
p(
    "Topologia de infraestrutura na VPS (Hostinger): o Nginx instalado no host gerencia as portas 80 e 443 com certificados Let's Encrypt (/etc/letsencrypt/live/www.manage-control-dev.com.br/) e faz proxy reverso na mesma origem: "
    "'/' encaminha para o container fadeup-frontend (127.0.0.1:8080, build multi-stage Node 24 -> Nginx 1.27-alpine com fallback SPA para React Router); "
    "'/api/' e '/healthy_check' encaminham para o container fadeup-backend (127.0.0.1:8000, Python 3.11-alpine com Uvicorn). "
    "O container do backend executa 'alembic upgrade head' automaticamente via entrypoint.sh antes de iniciar a API e conecta-se ao MySQL da VPS via host.docker.internal:3306. "
    "As credenciais iniciais de aplicação (service_credentials) e do usuário administrador (users com bcrypt + pepper) são geradas pelo utilitário project/backend/tools/gerar_hash.py."
)

# ==============================================================================
# 3.8 MÉTRICAS E RETROSPECTIVA
# ==============================================================================
section("3.8 Métricas e retrospectiva")

h("Velocity — Pontos Planejados vs. Entregues por Ciclo")
table(
    ["Ciclo / Sprint", "Itens", "Planejados (pts)", "Concluídos no Jira", "Restantes no Jira", "Observação Real"],
    [
        ["Ciclo 1 (Sprint ID 3)", "5 histórias (US-001..005)", "16", "16", "0", "100% concluído e encerrado em 11/11/2026."],
        ["Ciclo 2 — Base e Refinamentos (Sprint ID 4)", "18 itens (US-006..012 + SCRUM-22..32)", "46", "46", "0", "100% concluído (18 pts base + 28 pts refinamento); sprint encerrada no Jira."],
        ["Ciclo 3 — Arquitetura e Deploy (Sprint ID 2)", "3 itens + 1 subtask (SCRUM-2, 3, 33, 4)", "13", "13", "0", "100% concluído (14/11–17/11/2026) com site no ar em produção."],
        ["Total MVP Entregue", "26 itens principais + 1 subtask", "75", "75", "0", "Todo o recorte do MVP entregue e verificado."],
        ["Backlog Evolução (Fora MVP)", "1 história (US-013 / SCRUM-21)", "5", "0", "5", "Recorte intencional fora do MVP (Could)."],
    ],
    [102, 92, 58, 66, 66, 111],
)
velocity_chart()

h("Burndown — Pontos Restantes do MVP nos Marcos Observados")
table(
    ["Checkpoint Observado", "Data / Hora", "Pontos Restantes (MVP)", "Evento Associado"],
    [
        ["1. Abertura inicial", "11/11/2026 19:49 UTC", "34", "Abertura do Ciclo 1 e Ciclo 2 com 12 histórias base do MVP."],
        ["2. Após núcleo e painel (PRs #1–#4)", "11/11/2026 20:00 UTC", "5", "Conclusão de US-001 a US-010 (16 pts do Ciclo 1 + 13 pts do Ciclo 2)."],
        ["3. Inclusão auditoria/melhorias", "12/11/2026 12:22 BRT", "31", "US-012 concluída (3 pts restantes) + adição de 28 pts (SCRUM-22 a SCRUM-32)."],
        ["4. Snapshot revisão dia 12", "12/11/2026 15:55 UTC", "5", "SCRUM-22..26 concluídos; SCRUM-27 em análise; SCRUM-28..32 concluídos às 15:38 BRT."],
        ["5. Ciclo 3 (Migração/Deploy)", "14/11/2026", "16", "SCRUM-19 (3 pts) somada a SCRUM-2 (5), SCRUM-33 (5) e SCRUM-3 (3) na entrega final."],
        ["6. Entrega Final Consolidada", "17/11/2026", "0", "100% dos 75 pontos do MVP concluídos no Jira, no GitHub público e em produção (https://www.manage-control-dev.com.br/)."],
    ],
    [115, 95, 85, 200],
)
burndown_chart()

h("Ata da Retrospectiva — Formato Start / Stop / Continue")
table(
    ["Categoria", "Constatações da Squad e Ações"],
    [
        [
            "Start\n(Começar)",
            "• Atualizar imediatamente no Jira os cards, estimativas e versões assim que uma frente técnica conclui o objetivo em código ou deploy.\n"
            "• Formalizar revisões cruzadas (Code Review entre integrantes diferentes da squad) em todos os Pull Requests da main.\n"
            "• Conduzir validação pós-deploy com checklist e capturas diretamente do ambiente de produção logo após cada release.",
        ],
        [
            "Stop\n(Parar)",
            "• Parar de deixar código avançar em commits diretos ou PRs sem sincronizar no mesmo instante as colunas e versões do board Jira.\n"
            "• Parar de depender de soluções temporárias de infraestrutura (como Worker/SQLite local) quando o ambiente alvo já prevê banco relacional robusto (MySQL) e containerização.\n"
            "• Parar de postergar validação com usuários reais da barbearia após a entrada do MVP em produção.",
        ],
        [
            "Continue\n(Continuar)",
            "• Manter o isolamento estrito de responsabilidades via Clean Architecture no backend Python e separação clara entre área pública (/) e painel autenticado (/admin) no frontend React.\n"
            "• Manter a proteção de concorrência diretamente no banco de dados (chave composta em occupancy) e cobertura automatizada de regressões (35 testes pytest).\n"
            "• Continuar automatizando entrega com Docker Compose, migrations Alembic no startup e deploy via GitHub Actions com verificação de /healthy_check.",
        ],
    ],
    [75, 420],
)

# ==============================================================================
# 3.9 APRENDIZADOS
# ==============================================================================
section("3.9 Aprendizados")

h("1. Aprendizado Técnico")
p(
    "Dois pilares técnicos marcaram o projeto. Primeiro, o controle de concorrência não pode depender apenas de consultas prévias na aplicação: "
    "ao modelar a tabela occupancy com chave primária composta (date, minute) e executar criação, reagendamento e cancelamento em transações atômicas, "
    "garantimos fisicamente que duas requisições simultâneas nunca ocupem o mesmo horário (retornando HTTP 409) nem deixem ocupação fantasma. "
    "Segundo, adotar Clean Architecture no backend Python (FastAPI + SQLAlchemy + Alembic + MySQL) e separar contratos bem definidos permitiu substituir integralmente a stack inicial Node/SQLite pela arquitetura definitiva em React + FastAPI + JWT em duas camadas sem quebrar nenhuma regra de negócio nem o fluxo do cliente."
)

h("2. Aprendizado de Processo e Scrum")
p(
    "Manter o board do Jira e os rituais Scrum sincronizados com o ritmo real do código é tão importante quanto a entrega técnica. "
    "Quando o desenvolvimento e os commits avançaram mais rápido que a atualização do quadro (como ocorreu nos primeiros checkpoints e antes da consolidação final de status, pontos e versões no Jira), tornou-se essencial revisar o board para que ele espelhasse fielmente o progresso real. "
    "Além disso, trabalhar com incrementos pequenos, critérios de aceite objetivos e Definition of Done verificável reduziu drasticamente regressões durante as mudanças de arquitetura e reforçou a importância do alinhamento contínuo entre todos os membros da squad."
)

# ==============================================================================
# ANEXO A - EVIDÊNCIAS VISUAIS
# ==============================================================================
section("Anexo A — Evidências da Aplicação e Rastreabilidade")
p(
    "As capturas abaixo comprovam o estado do projeto em duas frentes complementares: (1) prints diretos do ambiente publicado em produção (https://www.manage-control-dev.com.br/), "
    "cobrindo todo o fluxo do cliente e todas as telas do painel administrativo autenticado (/admin); (2) capturas do quadro Kanban e Backlog no Jira; e (3) registros mobile responsivos do fluxo de agendamento."
)

fig(
    "producao-2026-11-17/03-producao-agendar.jpg",
    "Figura 1 — Aplicação em Produção (/): Etapa 1 — Catálogo e Navegação Isolada",
    "Captura direta em https://www.manage-control-dev.com.br/ exibindo o cabeçalho fadeUp, a navegação isolada do cliente ('Agendar' e 'Meus horários', sem link administrativo), os serviços (Corte R$ 40,00 / 30 min, Barba R$ 30,00 / 30 min, Corte + barba R$ 65,00 / 60 min) e o resumo lateral 'SUA RESERVA'.",
    255,
)
fig(
    "melhorias-2026-11-12/02-agendamento-mobile.jpg",
    "Figura 2 — Responsividade Mobile: Etapa 1 em Coluna Única",
    "Demonstra a adaptação em tela móvel com cartões de serviço tocáveis, botões legíveis e resumo posicionado abaixo sem rolagem horizontal.",
    290,
)
fig(
    "melhorias-2026-11-12/05-conflito-mobile.jpg",
    "Figura 3 — Responsividade Mobile (Etapa 2): Horários Livres por Período",
    "Exibe a grade mobile de horários disponíveis agrupados em Manhã e Tarde, mantendo o contexto após tratamento de conflito HTTP 409.",
    290,
)
fig(
    "producao-2026-11-17/04-producao-confirmacao.png",
    "Figura 4 — Aplicação em Produção (/): Etapa 4 — Confirmação e Link Exclusivo",
    "Confirmação real registrada em produção (https://www.manage-control-dev.com.br/) exibindo serviço (Corte), data, horário (11:45), pagamento no estabelecimento e o link único de gerenciamento (#reserva=<id>.<token>) com botão Copiar.",
    255,
)
fig(
    "producao-2026-11-17/05-producao-meus-agendamentos.png",
    "Figura 5 — Aplicação em Produção (/): Meus Agendamentos (Próximos, Passados, Cancelados)",
    "Tela de histórico em https://www.manage-control-dev.com.br/ mostrando a separação por abas ('Próximos 1', 'Passados 0', 'Cancelados 0') e as ações de Reagendar, Cancelar e Link da reserva.",
    255,
)
fig(
    "producao-2026-11-17/06-producao-admin-login.png",
    "Figura 6 — Painel Administrativo em Produção (/admin): Login com E-mail e Senha",
    "Captura direta em https://www.manage-control-dev.com.br/admin comprovando o bloqueio da agenda para usuários não autenticados e a evolução da tela de entrada para login por E-mail e Senha validados via JWT em 2 camadas.",
    255,
)
fig(
    "producao-2026-11-17/07-producao-admin-agenda.png",
    "Figura 7 — Painel Administrativo em Produção (/admin): Agenda do Operador",
    "Agenda autenticada em produção mostrando navegação por data, visualização Dia/Semana, botões 'Bloquear horário', '+ Novo encaixe', 'Configurações' e 'Sair', contadores ('1' atendimento confirmado, '0' bloqueios, 'R$ 40,00' previstos) e o agendamento confirmado.",
    255,
)
fig(
    "producao-2026-11-17/08-producao-admin-configuracoes.png",
    "Figura 8 — Painel Administrativo em Produção (/admin): Configurações da Barbearia",
    "Tela de configurações em produção permitindo editar nome do negócio, horários de abertura e fechamento (09:00–18:00), intervalo entre atendimentos, dias da semana e catálogo de serviços.",
    255,
)
fig(
    "producao-2026-11-17/01-jira-quadro.jpg",
    "Figura 9 — Jira (SCRUM): Visão do Quadro Kanban",
    "Captura do Quadro SCRUM obtida antes da sincronização final de fechamento (posteriormente à captura, SCRUM-19 foi movido para Concluído/Done, deixando apenas US-013/SCRUM-21 fora do MVP pendente).",
    255,
)
fig(
    "producao-2026-11-17/02-jira-backlog.jpg",
    "Figura 10 — Jira (SCRUM): Visão de Backlog e Sprints",
    "Captura do Backlog e Sprints do projeto SCRUM obtida antes da atualização final dos títulos de ciclo (Ciclo 3), fechamento do Ciclo 2 e registro de pontos em SCRUM-2 e SCRUM-33 — alterações já aplicadas no Jira ao vivo e refletidas nas tabelas deste relatório.",
    255,
)

h("Fontes e Evidências Rastreáveis")
for src in [
    "Enunciado da atividade: Projeto Semestral — TimeSlot (Engenharia de Software III, Fatec Garça, 3 páginas, 07/11/2026).",
    "Jira ao vivo (MCP Atlassian): projeto SCRUM, board ID 1, sprints 2, 3 e 4, versões 10000 e 10001 (Released), épicos SCRUM-5 a SCRUM-8, itens SCRUM-2 a SCRUM-33.",
    "Repositório GitHub público (https://github.com/eduardo-zucco/fadeup-timeslot): branch main, 16 Pull Requests (#1 a #16) e commits de migração/deploy c1136d2, 32d2cec e 674b20c.",
    "Aplicação publicada em produção: https://www.manage-control-dev.com.br/ (documentada em documentacao/deploy.md, deploy.sh, docker-compose.prod.yml e documentacao/nginx-host.conf.exemplo).",
    "Suíte de testes automatizados Python (project/backend/tests): 35 testes pytest executados e aprovados em 17/11/2026.",
    "Snapshots e capturas locais: documentacao/backlog.json, documentacao/evidencias/deploy.json, documentacao/evidencias/jira-final.json, documentacao/evidencias/producao-2026-11-17/ (8 prints) e github-reviews.json.",
]:
    bullet(src)


def furniture(canvas, doc):
    w, hh = doc.pagesize
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(48, hh - 35, w - 48, hh - 35)
    canvas.setFont("Arial", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(48, hh - 27, "fadeUp / TimeSlot — Relatório Final Atualizado")
    canvas.drawRightString(w - 48, hh - 27, "Engenharia de Software III | Fatec Garça")
    canvas.line(48, 38, w - 48, 38)
    canvas.drawString(48, 25, "Atualizado em 17/11/2026 | Produção: https://www.manage-control-dev.com.br/")
    canvas.drawRightString(w - 48, 25, f"Página {doc.page}")
    canvas.restoreState()


output_pdf = OUT / "fadeup-relatorio-final.pdf"
doc = SimpleDocTemplate(
    str(output_pdf),
    pagesize=(595.28, 841.89),
    leftMargin=50,
    rightMargin=50,
    topMargin=55,
    bottomMargin=52,
    title="fadeUp - Projeto Semestral TimeSlot (Atualizado)",
    author="Squad fadeUp",
    subject="MVP de agendamento, arquitetura Python/React/MySQL, deploy e evidências",
)
doc.build(story, onFirstPage=furniture, onLaterPages=furniture)
(ROOT / "documentacao/relatorio.md").write_text("\n".join(md), encoding="utf-8")
print(str(output_pdf))
