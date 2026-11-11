"""Generate the searchable PDF and its editable Markdown source from verified evidence."""
from pathlib import Path
import json, re, html
from datetime import datetime
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'output/pdf'; OUT.mkdir(parents=True,exist_ok=True)
BACKLOG=json.loads((ROOT/'docs/backlog.json').read_text(encoding='utf-8'))
snapshot=ROOT/'evidence/jira-final.json'
if not snapshot.exists(): snapshot=ROOT/'evidence/jira-checkpoint-02.json'
SNAP=json.loads(snapshot.read_text(encoding='utf-8'))
STATES={x['key']:x['status'] for x in SNAP['items']}
delivery=ROOT/'evidence/deploy.json'
DEPLOY=json.loads(delivery.read_text(encoding='utf-8')) if delivery.exists() else {'published':False,'url':None,'provider':'Railway Free (preparado)'}
pdfmetrics.registerFont(TTFont('Arial',r'C:\Windows\Fonts\arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold',r'C:\Windows\Fonts\arialbd.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Italic',r'C:\Windows\Fonts\ariali.ttf'))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='Arial-Bold',italic='Arial-Italic',boldItalic='Arial-Bold')
GREEN=colors.HexColor('#245e49'); INK=colors.HexColor('#203c31'); MUTED=colors.HexColor('#657367'); LINE=colors.HexColor('#d9e0d5')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Body',fontName='Arial',fontSize=10,leading=14.5,textColor=INK,spaceAfter=9))
styles.add(ParagraphStyle(name='Section',fontName='Arial-Bold',fontSize=23,leading=28,textColor=GREEN,spaceAfter=19,keepWithNext=True))
styles.add(ParagraphStyle(name='Sub',fontName='Arial-Bold',fontSize=12,leading=16,textColor=INK,spaceBefore=11,spaceAfter=7,keepWithNext=True))
styles.add(ParagraphStyle(name='SmallText',fontName='Arial',fontSize=8.3,leading=11.3,textColor=MUTED,spaceAfter=6))
styles.add(ParagraphStyle(name='CellText',fontName='Arial',fontSize=8.1,leading=11,textColor=INK))
styles.add(ParagraphStyle(name='CoverTitle',fontName='Arial-Bold',fontSize=55,leading=62,textColor=GREEN,spaceAfter=18))
story=[]; md=[]
def text(s,style='Body'):
    # Only authored emphasis is interpreted. Evidence values are escaped separately.
    return Paragraph(s,styles[style])
def p(s):story.append(text(html.escape(s)));md.append(s+'\n')
def h(s):story.append(text(html.escape(s),'Sub'));md.append('### '+s+'\n')
def section(s):
    if story:story.append(PageBreak())
    story.append(text(html.escape(s),'Section'));md.append('\n## '+s+'\n')
def bullet(s):story.append(Paragraph('• '+html.escape(s),styles['Body']));md.append('- '+s+'\n')
def link(label,url):
    story.append(text(f'<b>{html.escape(label)}</b><br/><link href="{html.escape(url,quote=True)}" color="#245e49">{html.escape(url)}</link>'))
    md.append(f'{label}: [{url}]({url})\n')
def table(headers,rows,widths=None):
    data=[[text(html.escape(str(c)),'CellText') for c in row] for row in [headers]+rows]
    tab=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    tab.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e8eee3')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('LINEBELOW',(0,0),(-1,-1),.4,LINE)]))
    story.extend([tab,Spacer(1,12)])
    md.append('| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n')
    md.extend('| '+' | '.join(map(str,row))+' |\n' for row in rows);md.append('\n')
def fig(file,title,description,height=390):
    h(title);path=ROOT/'evidence'/file
    if path.exists():
        w,hh=ImageReader(str(path)).getSize();width=min(440,height*w/hh)
        story.append(Image(str(path),width=width,height=width*hh/w,hAlign='CENTER'))
        story.append(Spacer(1,12));md.append(f'![{title}](../evidence/{file})\n')
    p(description)

# Required order from the professor's PDF: 3.1 through 3.9.
md.append('# fadeUp - Projeto Semestral TimeSlot\n')
story.extend([Spacer(1,38),text('fadeUp','CoverTitle'),text('Projeto Semestral - TimeSlot','Section')])
p('3.1 Capa | Engenharia de Software III | ADS - Fatec Garça')
p('Squad fadeUp. Produto: sistema web de agendamento para uma barbearia com uma unidade e um profissional.')
table(['Integrante','Papel informado'],[['Lucas Castilho','Product Owner (PO)'],['Eduardo Zucco','Scrum Master (SM)'],['Felipe Pereira','Integrante da squad'],['Fausto Iriu','Integrante da squad']],[230,265])
link('Projeto Jira e board','https://eduardobarreto879.atlassian.net/jira/software/projects/SCRUM/boards/1')
link('Repositório GitHub','https://github.com/eduardo-zucco/fadeup-timeslot')
if DEPLOY.get('published') and DEPLOY.get('url'):link('Aplicação em staging',DEPLOY['url'])
else:p('URL pública: publicação reservada para o final, conforme orientação do responsável. Aplicação local em http://127.0.0.1:5173. Essa URL local não substitui o requisito de uma funcionalidade no ar.')
p('Data deste registro: 11 de novembro de 2026. Planejamento de referência: duas semanas, de 11 a 25 de novembro de 2026. Código e registros desta execução assistida foram produzidos em 11/11/2026; o documento não apresenta duas semanas fictícias de trabalho.')
p('Acesso do professor: os links exigem as permissões das respectivas contas. A liberação ao professor precisa ser confirmada pelo responsável antes da entrega. Não há comprovação de convite ou acesso público neste registro.')

section('3.2 Discovery')
p('O briefing descreve pequenos negócios que dependem de WhatsApp e caderno para marcar horários. As dores conhecidas são choque de horários, esquecimentos, respostas repetitivas e ausência de histórico. O recorte adotado é uma barbearia de um profissional; a apresentação inicial foi usada como exemplo e não como obrigação de implementar todas as funcionalidades.')
p('O discovery abaixo é uma síntese do briefing e hipóteses de produto. Não foram realizadas entrevistas com uma barbearia real nesta execução. Preços, serviços e horários iniciais são demonstrativos e devem ser validados pelo PO.')
h('Lean Canvas - nove blocos em texto')
canvas=[('Problema','Agendamentos manuais geram demora na resposta e risco de sobreposição. O dono perde tempo confirmando informações; o cliente não tem uma forma clara de consultar ou alterar sua reserva.'),('Segmentos de clientes','Dono de barbearia de bairro com uma unidade e um profissional; clientes finais que já usam navegador no celular. Salões e petshops são possibilidades futuras, não segmentos validados no MVP.'),('Proposta de valor','Permitir que o cliente reserve um atendimento em até quatro etapas e que o dono consulte uma agenda única, com horários realmente disponíveis.'),('Solução','Catálogo de serviços, cálculo de disponibilidade, reserva persistida e confirmação na tela. Chave individual para consulta, cancelamento e reagendamento. Painel para agenda, bloqueios e ajustes básicos.'),('Canais','Link compartilhado pela barbearia em seus canais existentes, como perfil social, mensagem ou QR code. Nenhum canal de aquisição pago foi contratado ou testado.'),('Fontes de receita','Hipótese futura de assinatura mensal por estabelecimento. O MVP acadêmico não cobra clientes, não processa pagamentos e não tem receita medida.'),('Estrutura de custos','Desenvolvimento, manutenção e hospedagem. A restrição atual é não contratar plano pago. O sistema local não depende de serviços externos cobrados; a hospedagem gratuita está sujeita aos limites do provedor.'),('Métricas-chave','Reservas concluídas, conflitos recusados, cancelamentos e pontos entregues por ciclo. Conversão e redução de faltas precisam de uso real; não foram medidas nesta execução.'),('Vantagem competitiva','Hipótese: operação simples e sem escolha de profissional, adequada à rotina de um negócio pequeno. Ainda não há vantagem exclusiva ou validação de mercado comprovada.')]
for name,body in canvas:h(name);p(body)
h('Personas refinadas')
table(['Persona fictícia','Objetivos','Dores e necessidades'],[['Marcos, dono e barbeiro, 38 anos','Organizar o dia sem interromper cada atendimento para responder mensagens.','Precisa de agenda legível, bloqueio de pausas e ausência de reservas sobrepostas. Tem pouco tempo para configurações.'],['Ana, cliente, 27 anos','Encontrar um horário pelo celular e conseguir alterar seus planos.','Evita cadastros longos; precisa saber preço e duração antes de reservar e guardar uma forma simples de consultar o horário.']],[125,175,195])

section('3.3 MVP')
h('Story Map descrito em texto')
table(['Atividade','Histórias','Recorte do MVP'],[['Descobrir o atendimento','US-001: catálogo de serviços','Mostrar serviço, preço e duração.'],['Escolher horário','US-002: disponibilidade','Considerar expediente, duração, intervalo e ocupação.'],['Reservar','US-003: confirmar dados e reserva','Nome, WhatsApp, consentimento e proteção contra conflito.'],['Gerenciar a reserva','US-004 e US-005: cancelar e reagendar','Acesso por chave secreta da reserva.'],['Consultar a confirmação','US-009: confirmação e histórico','Confirmação na tela e reservas salvas neste navegador.'],['Administrar o negócio','US-006, US-007 e US-008','Agenda, serviços, expediente, bloqueio e encaixe manual.'],['Entregar com qualidade','US-010, US-011 e US-012','Testes, CI, preparação de deploy e documentação.']],[120,190,185])
h('Linha de corte')
p('Entraram as US-001 a US-012: o fluxo essencial de agendamento, operação de uma agenda e os trabalhos de qualidade e entrega. A menor funcionalidade demonstrável é reservar um horário e vê-lo na agenda persistida.')
p('Ficaram de fora WhatsApp automático (US-013), pagamentos, chatbot, fidelidade, venda de produtos, aplicativo nativo e múltiplos profissionais/unidades. Essas funções não são necessárias para comprovar a hipótese principal e aumentariam dependências, credenciais e custo. O WhatsApp é apenas um dado de contato; o sistema não afirma ter enviado uma mensagem.')
p('O catálogo inicial tem Corte por R$ 40/30 minutos, Barba por R$ 30/30 minutos e Corte + barba por R$ 65/60 minutos, de segunda a sábado, das 9h às 18h. São parâmetros de demonstração editáveis pelo operador, sem validação comercial.')
h('Fluxo do cliente em quatro etapas')
for s in ['1. Escolher um serviço e consultar seu preço/duração.','2. Selecionar uma data e um horário disponível.','3. Informar nome, telefone e consentimento e confirmar.','4. Receber a confirmação na tela e guardar o link de gerenciamento.']:bullet(s)

section('3.4 Backlog no Jira')
p('O projeto disponível na conta conectada é SCRUM, com o board de ID 1. Os quatro itens de exemplo anteriores, SCRUM-1 a SCRUM-4, foram preservados e não fazem parte das métricas do fadeUp. Os itens deste produto usam as etiquetas fadeup e timeslot.')
table(['Épico','Descrição'],[['SCRUM-5 / E1','Agendamento do cliente: catálogo, disponibilidade, reserva, cancelamento e reagendamento.'],['SCRUM-6 / E2','Operação da barbearia: agenda, configuração, bloqueios e encaixes.'],['SCRUM-7 / E3','Comunicação: confirmação na aplicação e evolução futura de WhatsApp.'],['SCRUM-8 / E4','Qualidade e entrega: testes, integração contínua, deploy e relatório.']],[110,385])
h('Priorização e ordem do backlog')
p('Foi usado MoSCoW, com dependências técnicas e valor para o usuário como desempate: primeiro catálogo e disponibilidade; depois reserva e seu gerenciamento; em seguida operação; por fim validação e publicação. Testes acompanham a implementação mesmo quando a história de qualidade aparece no fim da lista. A ordem final é US-001 a US-012 no MVP, seguida de US-013 na evolução.')
p('As estimativas usam a escala Fibonacci (2, 3 e 5 pontos), como referência relativa de complexidade. Foram propostas nesta execução e registradas no campo Story point estimate (customfield_10016). Não ocorreu sessão coletiva de Planning Poker; a squad deve validar os valores. Os pontos não equivalem a horas.')
table(['Ordem','História','Pontos','MoSCoW'],[[str(s['id']),f"US-{s['id']:03d} / {s['key']} - {s['title']}",str(s['points']),s['priority']] for s in BACKLOG],[40,345,45,65])
h('Histórias e critérios de aceite')
for s in BACKLOG:
    title=f"US-{s['id']:03d} - {s['title']} | {s['key']} | {s['points']} pontos"
    block=[text(html.escape(title),'Sub'),text(html.escape(s['story'])),text('<b>Critério de aceite:</b> '+html.escape(s['accept'])),text('<b>Estado verificado:</b> '+html.escape(STATES.get(s['key'],'Não disponível')),'SmallText')]
    story.append(KeepTogether(block));md.extend(['### '+title+'\n',s['story']+'\n','Critério de aceite: '+s['accept']+'\n','Estado verificado: '+STATES.get(s['key'],'Não disponível')+'\n'])
h('Marcos - versões cadastradas no Jira')
table(['Versão','Data planejada','Entrega'],[['fadeUp v0.1 - API / ID 10000','18/11/2026','API SQLite, disponibilidade, reserva e gerenciamento. Implementação integrada antes da data prevista.'],['fadeUp v1.0 - MVP / ID 10001','25/11/2026','Interface, painel, CI, publicação e PDF. Publicação segue reservada para o final.']],[150,95,250])

section('3.5 Sprints - Scrum')
p('O plano foi dividido em dois ciclos semanais. A execução assistida foi concentrada em 11/11/2026. As datas do plano não constituem prova de duas semanas de trabalho, e os resultados abaixo se baseiam no estado real do Jira e dos PRs.')
p('Conferência do Jira: a sprint 3 foi encerrada em 11/11/2026 com 16 pontos concluídos. A sprint 4 foi iniciada nesse mesmo dia para organizar o trabalho restante, antes do período originalmente planejado. O histórico conserva essa antecipação; não foi alterado para simular duas semanas decorridas.')
for sprint,name,goal,planned,dates in [(3,'Semana 1 - Agendamento','Permitir escolher serviço e horário, reservar sem sobreposição e gerenciar a reserva.',16,'11 a 18/11/2026'),(4,'Semana 2 - Operação e entrega','Organizar a operação da barbearia e preparar qualidade, publicação e relatório.',18,'18 a 25/11/2026')]:
    h(f'fadeUp - {name} | sprint ID {sprint}')
    p('Sprint Goal: '+goal+' Período planejado: '+dates+'.')
    items=[s for s in BACKLOG if s['sprint']==sprint]
    rows=[[f"US-{s['id']:03d} / {s['key']}",s['title'],str(s['points']),STATES.get(s['key'],'Pendente')] for s in items]
    table(['Item','Sprint Backlog','Pontos','Resultado verificado'],rows,[105,235,45,110])
    delivered=sum(s['points'] for s in items if STATES.get(s['key'])=='Concluído')
    p(f'Planejado: {planned} pontos. Concluído no registro consultado: {delivered} pontos. Restante: {planned-delivered} pontos.')
    if sprint==3:p('O núcleo do agendamento foi integrado nos PRs #1 e #2. Conflitos, cancelamento e reagendamento foram cobertos pelos testes e o fluxo de reserva foi executado no navegador.')
    else:p('Agenda e painel foram incluídos no PR #2; CI e build no PR #3; adaptação para Railway no PR #4. A publicação depende da etapa final na conta gratuita do responsável. A documentação foi preparada nesta entrega.')
h('Capacidade proposta e cálculo')
p('Hipótese para o planejamento, ainda não confirmada pela squad: quatro integrantes, uma hora disponível por dia útil e cinco dias por semana = 20 horas brutas por ciclo. Reservar 20% para alinhamento e imprevistos deixa 16 horas úteis por ciclo, ou 32 horas úteis nas duas semanas. Esse cálculo é uma hipótese de disponibilidade, não um registro de horas efetivamente trabalhadas.')
p('A carga de 16 e 18 pontos é uma estimativa inicial. Sem velocity histórica da equipe, não é possível assegurar que essa capacidade comporta os dois valores; a primeira revisão de planejamento deve ajustar o escopo com base na entrega observada.')

section('3.6 Kanban e board')
table(['Coluna real do board','Significado e regra de saída'],[['To Do / Tarefas pendentes','Item compreendido, com critério de aceite e prioridade; ainda sem execução.'],['In Progress / Em andamento','Implementação ou documentação em execução. Avança quando existe resultado revisável e validação local.'],['In Review / Em análise','PR ou entrega em revisão. Correções e resultado do CI devem ser verificados.'],['Done / Concluído','Critérios técnicos verificados e código integrado. Publicação e aceitação humana são verificadas separadamente quando ainda pendentes.']],[180,315])
p('Política de WIP adotada para esta execução: no máximo duas histórias/tarefas em andamento e uma em análise. Épicos agregadores não entram nesse limite. O board retornou constraintType = none: não há bloqueio automático de WIP configurado no Jira. O limite é uma política manual, não uma restrição imposta pela ferramenta.')
p('Evolução observada: o primeiro checkpoint mostrava as histórias ainda pendentes, com SCRUM-11 em análise, embora parte do código já estivesse pronta. Após conferir testes e integrar os PRs, US-001 a US-010 foram movidas para Concluído. Publicação e relatório passaram a Em andamento. Esse atraso de atualização é um ponto de melhoria do processo; não foi reconstruído como se o board tivesse sido atualizado diariamente.')
h('Dailies e acompanhamento')
p('Não existem registros de Dailies da squad no período de duas semanas. Nesta execução houve atualizações pelo chat, com trabalho concluído, próximo passo e impedimentos. Essas atualizações não são apresentadas como reuniões Scrum de todos os integrantes.')
p('Rotina recomendada para a squad: encontro de até 15 minutos em cada dia útil, observando o Sprint Goal e o board. Eduardo facilita o fluxo; os participantes identificam impedimentos e combinam o próximo trabalho. Decisões de produto seguem para Lucas. A realização desses encontros precisa ser registrada pela equipe.')

section('3.7 Execução técnica')
h('Arquitetura simples e banco')
p('Navegador (HTML, CSS e JavaScript) -> API HTTP em Node.js 24 -> SQLite nativo. Não há framework de interface nem dependências de execução instaladas. O build alternativo gera um Worker ESM para D1, mas o caminho de hospedagem escolhido para preparação é Railway com volume persistente.')
table(['Tabela','Responsabilidade'],[['settings','Configuração do negócio, serviços e expediente em JSON.'],['bookings','Dados do atendimento, situação e chave secreta de gerenciamento.'],['occupancy','Ocupação em células de 15 minutos; chave primária composta por data e minuto.'],['outbox','Eventos de confirmação, lembrete e cancelamento; não comprova envio externo.']],[105,390])
p('A chave composta de occupancy impede duas reservas no mesmo intervalo. Reservas e reagendamentos usam uma transação: se qualquer célula conflitar, o banco faz rollback. Cancelamentos liberam as células e preservam a reserva com situação cancelada. Consultas usam parâmetros SQL. Valores monetários são inteiros em centavos.')
table(['Endpoint','Uso'],[['GET /api/config','Catálogo e configuração pública; indica acesso administrativo quando autenticado.'],['GET /api/slots','Disponibilidade para data e serviço.'],['POST /api/bookings','Criação de reserva com validação e ocupação atômica.'],['GET, PATCH, DELETE /api/bookings/:id','Consulta, reagendamento e cancelamento com X-Booking-Token.'],['GET /api/admin/agenda','Agenda por período; exige operador.'],['PUT /api/admin/config','Atualização de serviços e expediente.'],['POST /api/admin/bookings','Bloqueio ou encaixe; cancelamento administrativo pela rota do item.']],[230,265])
h('Segurança e limites do MVP')
p('O cliente recebe uma chave aleatória por reserva; não existe consulta pública de dados por telefone. O link permite gerenciar a reserva e deve ser tratado como segredo. Em hospedagem Node pública, a chave administrativa ADMIN_KEY fica no ambiente do servidor e é exigida para o painel. Cabeçalhos de identidade enviados diretamente pelo cliente são descartados. O modo local é restrito a 127.0.0.1 e representa o operador para facilitar a demonstração.')
p('O protótipo tem validação, autorização e proteção contra origem externa nas mutações, mas não inclui verificação de telefone, recuperação de chave, política de retenção completa nem testes de carga. Seu uso acadêmico deve empregar dados fictícios.')
h('Pull Requests, commits e revisão')
table(['PR','Conteúdo e achados da revisão'],[['#1 - API e SQLite','Removidas dependências residuais do lockfile; acrescentado teste de origem externa. Reserva, rollback e autorização revisados.'],['#2 - Cliente e painel','Corrigida ordenação do histórico, descarte de resposta atrasada e dependência de fontes externas. Reserva verificada no navegador.'],['#3 - Build e CI','Conferidos build ESM, manifesto, migração de esquema e teste do artefato gerado.'],['#4 - Railway e autorização','Conferidos volume /data, porta do provedor, modo público e teste HTTP de identidade falsa e proxy HTTPS.']],[120,375])
for n in range(1,5):link(f'Pull Request #{n}',f'https://github.com/eduardo-zucco/fadeup-timeslot/pull/{n}')
p('Quem revisou: os registros foram publicados pela conta eduardo-zucco e identificam expressamente revisão técnica assistida por Codex. Não há aprovação independente de Lucas, Felipe ou Fausto. O documento não atribui a esses integrantes revisões que eles não fizeram. A revisão humana da squad continua sendo uma validação necessária para demonstrar colaboração e aprovação independente.')
p('Os commits preservam as datas reais e são agrupados por fase, incluindo correções após revisão. Exemplos verificáveis: 3db3c99 (base SQLite), 03ff991 (API), 7be7ebb (lockfile e origem), a542877 (interface), 59923ca (histórico), bf37187 (build/CI), 2d6277a e 9cb7008 (Railway e teste HTTP).')
h('Pipeline de integração contínua')
p('O workflow CI roda em push e pull_request, em Ubuntu com Node 24. Executa npm ci --ignore-scripts, npm test, npm run check e npm run build. O artefato fadeup-worker guarda o diretório dist. Nos primeiros PRs o workflow executava a suíte inicial; o PR #3 ampliou o pipeline com checagem, build e artefato.')
for run in [43086969699,43088503885,43090711621,43092264614]:link('Execução CI aprovada',f'https://github.com/eduardo-zucco/fadeup-timeslot/actions/runs/{run}')
h('Testes e Definition of Done')
p('Suíte final: 20 testes aprovados. Cobre expediente, duração, fuso, dias fechados, datas inválidas, intervalo, consentimento, telefone, configuração, reserva concorrente, cancelamento, reagendamento em conflito, rollback, autorização, origem externa, chave administrativa, artefato Worker e servidor HTTP público atrás de proxy HTTPS. O arquivo evidence/testes.txt preserva a saída da suíte.')
table(['Item da DoD','Verificação'],[['Critério de aceite implementado','Fluxos cobertos pelos testes e demonstração local, dentro do recorte do MVP.'],['Persistência e ausência de choque','SQLite, chave única de ocupação e transações verificadas.'],['Validação e autorização','Campos obrigatórios, chave de reserva e acesso administrativo testados.'],['Testes e CI verdes','20 testes locais; execuções remotas aprovadas nos quatro PRs de implementação.'],['Revisão registrada','Revisão assistida real; aprovação humana independente ainda não comprovada.'],['Documentação e evidência','Relatório textual, fontes editáveis, capturas reais e exports do Jira.'],['Deploy e acesso de avaliação','Publicação reservada para o final; liberar acesso do professor antes de enviar.']],[200,295])
h('Deploy e operação')
if DEPLOY.get('published'):p('Publicação verificada: '+str(DEPLOY.get('provider'))+'. URL: '+str(DEPLOY.get('url'))+'. '+str(DEPLOY.get('notes','')))
else:p('A aplicação foi executada e testada localmente, mas ainda não foi publicada. A publicação ficou para o final por orientação do responsável. O Dockerfile e railway.json estão prontos. Na Railway, é necessário escolher o plano gratuito, anexar volume em /data, configurar ADMIN_KEY e gerar o domínio. Não foi contratado plano pago. Sem uma URL publicada verificada, a parte de deploy do enunciado permanece pendente.')
p('Para repetir localmente: instalar Node 24 e executar npm start na pasta do projeto; abrir http://127.0.0.1:5173. O banco é criado em data/fadeup.sqlite. Para validar: npm test, npm run check e npm run build. O SQLite local não é enviado ao repositório. Em hospedagem, testar a permanência de uma reserva após reiniciar o serviço confirma a persistência do volume.')

section('3.8 Métricas e retrospectiva')
h('Velocity - pontos planejados e concluídos')
velocity=[]
for sprint,label,total in [(3,'Semana 1',16),(4,'Semana 2',18)]:
    done=sum(s['points'] for s in BACKLOG if s['sprint']==sprint and STATES.get(s['key'])=='Concluído')
    velocity.append([label,str(total),str(done),str(total-done)])
table(['Ciclo planejado','Planejados','Concluídos no Jira','Restantes'],velocity,[170,100,120,105])
p('O total do MVP é 34 pontos em 12 histórias. A US-013 soma mais 5 pontos fora do MVP e não entra nos indicadores dos ciclos. Os números medem a atualização e verificação dos itens nesta execução; não são uma velocity histórica de duas semanas da equipe.')
h('Burndown - observações reais')
burn=[]
for filename,label in [('jira-checkpoint-01.json','Antes da atualização de conclusão'),('jira-checkpoint-02.json','Após código e testes'),('jira-final.json','Conferência final')]:
    f=ROOT/'evidence'/filename
    if not f.exists():continue
    obs=json.loads(f.read_text(encoding='utf-8'));remaining=0
    for item in obs['items']:
        match=next((s for s in BACKLOG if s['key']==item['key'] and s['sprint']),None)
        if match and item['status']!='Concluído':remaining+=match['points']
    burn.append([label,obs.get('capturedAt','')[:19].replace('T',' ')+' UTC',str(remaining)])
table(['Checkpoint observado','Data da captura','Pontos restantes'],burn,[220,180,95])
p('Todos os checkpoints foram capturados em 11/11/2026. Não há série diária de 14 dias nem burndown diário verificável. Uma linha ideal de duas semanas poderia servir ao planejamento, mas não foi apresentada como resultado real.')
h('Registro de retrospectiva técnica - Start / Stop / Continue')
p('Data: 11/11/2026. Base: execução assistida, resultados dos testes, PRs e impedimentos observados. Trata-se de um registro técnico desta execução, sem comprovação de reunião ou aprovação coletiva dos quatro integrantes.')
table(['Formato','Constatação e próxima ação'],[['Start','Validar personas e parâmetros com um negócio real. Fazer revisão cruzada por um colega em cada PR. Atualizar o Jira na mesma fase em que o código avança. Registrar medições ao encerrar cada dia.'],['Stop','Tratar todas as ideias da apresentação como obrigação do MVP. Usar bibliotecas sem necessidade. Confundir preparação de deploy com aplicação efetivamente publicada.'],['Continue','Entregar incrementos pequenos, preservar commits e PRs, testar transações e manter o foco no agendamento em quatro etapas. Usar SQLite enquanto a escala do MVP permitir.']],[80,415])
p('Ações propostas para validação da squad: Lucas confirmar o recorte e aceitar o fluxo; Eduardo coordenar atualização de board e cerimônias; Felipe realizar revisão cruzada de testes; Fausto conferir execução e persistência no ambiente publicado. Essas ações são propostas, não atas de trabalho já realizado por esses integrantes.')

section('3.9 Aprendizados')
h('Aprendizado técnico')
p('Consultar disponibilidade antes de gravar não basta para impedir reservas simultâneas. A regra precisa estar no banco: a chave única por data/minuto bloqueia ocupações concorrentes, enquanto a transação garante que uma falha não deixe uma reserva parcial ou remova o horário anterior durante um reagendamento.')
h('Aprendizado de processo e Scrum')
p('O board deve refletir o resultado no momento da entrega. Nesta execução, parte do código avançou antes da atualização das histórias; isso deixou a visão do Jira defasada. As fases pequenas com PR e CI tornaram a entrega revisável, mas não substituem a colaboração, as Dailies e a inspeção de uma squad durante sprints reais.')
h('Pendências para concluir a entrega acadêmica')
for s in ['Publicar a aplicação no ambiente gratuito escolhido e registrar a URL verificada na capa.','Confirmar acesso do professor ao Jira e ao repositório.','Obter revisão humana independente e validação do PO, caso a avaliação exija essas evidências.','A squad registrar suas cerimônias e validar as estimativas; não há histórico de duas semanas nesta execução.','Cada integrante enviar o mesmo PDF no portal da atividade com seu próprio acesso e guardar o protocolo. Nenhum envio acadêmico foi realizado pelo assistente.']:bullet(s)

section('Anexo A - Evidências da aplicação')
p('As imagens abaixo foram capturadas da aplicação local em 11/11/2026 com dados fictícios. Complementam o texto; não representam uma publicação em produção nem telas do Jira.')
fig('01-catalogo-mobile.jpg','Figura 1 - Catálogo e início do fluxo','A captura mostra a marca fadeUp, a proposta de agendamento e o início da etapa de escolha do serviço no navegador móvel. A interface apresenta serviços com preço e duração antes de pedir os dados do cliente.',340)
story.append(PageBreak())
fig('02-confirmacao-mobile.jpg','Figura 2 - Reserva concluída','A tela confirma um Corte de 30 minutos para Cliente Demonstração em 12/11/2026 às 9h. Mostra que o quarto passo foi concluído e oferece um link individual de gerenciamento. Os dados são exclusivamente de teste local.',380)
p('Não foi possível capturar o board Jira autenticado no navegador: a página solicitou login e a tentativa de usar a janela do Brave foi interrompida pela automação. A conferência do Jira foi feita pelo plugin conectado, com exports JSON verificáveis, sem fabricar screenshots da ferramenta.')
h('Fontes e evidências rastreáveis')
for s in ['Enunciado fornecido: Projeto Semestral - TimeSlot, três páginas, datado de 07/11/2026. Define a estrutura obrigatória e o requisito de texto no PDF.','Apresentação fornecida: fadeUp - Escopo do Projeto, versão 1.0, setembro de 2026. Usada como referência inicial de produto.','Plugin Jira: board ID 1, campo de pontos customfield_10016, sprints 3 e 4, versões 10000 e 10001 e itens SCRUM-5 a SCRUM-21.','Plugin GitHub: quatro PRs de implementação com CI e registros de revisão técnica assistida.','Arquivos de evidência: evidence/jira-checkpoint-01.json, evidence/jira-checkpoint-02.json, evidence/jira-final.json quando disponível, evidence/testes.txt e capturas locais.']:bullet(s)

def furniture(canvas,doc):
    w,h=doc.pagesize;canvas.saveState();canvas.setStrokeColor(LINE);canvas.line(48,h-35,w-48,h-35)
    canvas.setFont('Arial',8);canvas.setFillColor(MUTED);canvas.drawString(48,h-27,'fadeUp / TimeSlot');canvas.drawRightString(w-48,h-27,'Engenharia de Software III')
    canvas.line(48,38,w-48,38);canvas.drawString(48,25,'Registro de 11/11/2026 | planejamento de duas semanas');canvas.drawRightString(w-48,25,str(doc.page));canvas.restoreState()

doc=SimpleDocTemplate(str(OUT/'fadeup-relatorio-final.pdf'),pagesize=(595.28,841.89),leftMargin=50,rightMargin=50,topMargin=57,bottomMargin=53,title='fadeUp - Projeto Semestral TimeSlot',author='Squad fadeUp',subject='MVP de agendamento e evidências de execução')
doc.build(story,onFirstPage=furniture,onLaterPages=furniture)
(ROOT/'docs/relatorio.md').write_text('\n'.join(md),encoding='utf-8')
print(str(OUT/'fadeup-relatorio-final.pdf'))
