# fadeUp - Projeto Semestral TimeSlot

3.1 Capa | Engenharia de Software III | ADS - Fatec Garça

Squad fadeUp. Produto: sistema web de agendamento para uma barbearia com uma unidade e um profissional.

| Integrante | Papel informado |
| --- | --- |

| Lucas Castilho | Product Owner (PO) |

| Eduardo Zucco | Scrum Master (SM) |

| Felipe Pereira | Integrante da squad |

| Fausto Iriu | Integrante da squad |



Projeto Jira e board: [https://eduardobarreto879.atlassian.net/jira/software/projects/SCRUM/boards/1](https://eduardobarreto879.atlassian.net/jira/software/projects/SCRUM/boards/1)

Repositório GitHub: [https://github.com/eduardo-zucco/fadeup-timeslot](https://github.com/eduardo-zucco/fadeup-timeslot)

URL pública: publicação adiada por orientação do responsável. Aplicação local em http://127.0.0.1:5173. Essa URL local não substitui o requisito de uma funcionalidade no ar.

Data deste registro: 11 de novembro de 2026. Janela de referência solicitada: de 11 a 13 de novembro de 2026. A maior parte do MVP já está implementada. Código e evidências existentes mantêm suas datas reais; as atividades futuras não são apresentadas como concluídas.

Acesso do professor: os links exigem as permissões das respectivas contas. A liberação ao professor precisa ser confirmada pelo responsável antes da entrega. Não há comprovação de convite ou acesso público neste registro.


## 3.2 Discovery

O briefing descreve pequenos negócios que dependem de WhatsApp e caderno para marcar horários. As dores conhecidas são choque de horários, esquecimentos, respostas repetitivas e ausência de histórico. O recorte adotado é uma barbearia de um profissional; a apresentação inicial foi usada como exemplo e não como obrigação de implementar todas as funcionalidades.

O discovery abaixo é uma síntese do briefing e hipóteses de produto. Não foram realizadas entrevistas com uma barbearia real nesta execução. Preços, serviços e horários iniciais são demonstrativos e devem ser validados pelo PO.

### Lean Canvas - nove blocos em texto

### Problema

Agendamentos manuais geram demora na resposta e risco de sobreposição. O dono perde tempo confirmando informações; o cliente não tem uma forma clara de consultar ou alterar sua reserva.

### Segmentos de clientes

Dono de barbearia de bairro com uma unidade e um profissional; clientes finais que já usam navegador no celular. Salões e petshops são possibilidades futuras, não segmentos validados no MVP.

### Proposta de valor

Permitir que o cliente reserve um atendimento em até quatro etapas e que o dono consulte uma agenda única, com horários realmente disponíveis.

### Solução

Catálogo de serviços, cálculo de disponibilidade, reserva persistida e confirmação na tela. Chave individual para consulta, cancelamento e reagendamento. Painel para agenda, bloqueios e ajustes básicos.

### Canais

Link compartilhado pela barbearia em seus canais existentes, como perfil social, mensagem ou QR code. Nenhum canal de aquisição pago foi contratado ou testado.

### Fontes de receita

Hipótese futura de assinatura mensal por estabelecimento. O MVP acadêmico não cobra clientes, não processa pagamentos e não tem receita medida.

### Estrutura de custos

Desenvolvimento, manutenção e hospedagem. A restrição atual é não contratar plano pago. O sistema local não depende de serviços externos cobrados; a hospedagem gratuita está sujeita aos limites do provedor.

### Métricas-chave

Reservas concluídas, conflitos recusados, cancelamentos e pontos entregues por ciclo. Conversão e redução de faltas precisam de uso real; não foram medidas nesta execução.

### Vantagem competitiva

Hipótese: operação simples e sem escolha de profissional, adequada à rotina de um negócio pequeno. Ainda não há vantagem exclusiva ou validação de mercado comprovada.

### Personas refinadas

| Persona fictícia | Objetivos | Dores e necessidades |
| --- | --- | --- |

| Marcos, dono e barbeiro, 38 anos | Organizar o dia sem interromper cada atendimento para responder mensagens. | Precisa de agenda legível, bloqueio de pausas e ausência de reservas sobrepostas. Tem pouco tempo para configurações. |

| Ana, cliente, 27 anos | Encontrar um horário pelo celular e conseguir alterar seus planos. | Evita cadastros longos; precisa saber preço e duração antes de reservar e guardar uma forma simples de consultar o horário. |




## 3.3 MVP

### Story Map descrito em texto

| Atividade | Histórias | Recorte do MVP |
| --- | --- | --- |

| Descobrir o atendimento | US-001: catálogo de serviços | Mostrar serviço, preço e duração. |

| Escolher horário | US-002: disponibilidade | Considerar expediente, duração, intervalo e ocupação. |

| Reservar | US-003: confirmar dados e reserva | Nome, WhatsApp, consentimento e proteção contra conflito. |

| Gerenciar a reserva | US-004 e US-005: cancelar e reagendar | Acesso por chave secreta da reserva. |

| Consultar a confirmação | US-009: confirmação e histórico | Confirmação na tela e reservas salvas neste navegador. |

| Administrar o negócio | US-006, US-007 e US-008 | Agenda, serviços, expediente, bloqueio e encaixe manual. |

| Entregar com qualidade | US-010, US-011 e US-012 | Testes, CI, preparação de deploy e documentação. |



### Linha de corte

Entraram as US-001 a US-012: o fluxo essencial de agendamento, operação de uma agenda e os trabalhos de qualidade e entrega. A menor funcionalidade demonstrável é reservar um horário e vê-lo na agenda persistida.

Ficaram de fora WhatsApp automático (US-013), pagamentos, chatbot, fidelidade, venda de produtos, aplicativo nativo e múltiplos profissionais/unidades. Essas funções não são necessárias para comprovar a hipótese principal e aumentariam dependências, credenciais e custo. O WhatsApp é apenas um dado de contato; o sistema não afirma ter enviado uma mensagem.

O catálogo inicial tem Corte por R$ 40/30 minutos, Barba por R$ 30/30 minutos e Corte + barba por R$ 65/60 minutos, de segunda a sábado, das 9h às 18h. São parâmetros de demonstração editáveis pelo operador, sem validação comercial.

### Fluxo do cliente em quatro etapas

- 1. Escolher um serviço e consultar seu preço/duração.

- 2. Selecionar uma data e um horário disponível.

- 3. Informar nome, telefone e consentimento e confirmar.

- 4. Receber a confirmação na tela e guardar o link de gerenciamento.


## 3.4 Backlog no Jira

O projeto disponível na conta conectada é SCRUM, com o board de ID 1. Os quatro itens de exemplo anteriores, SCRUM-1 a SCRUM-4, foram preservados e não fazem parte das métricas do fadeUp. Os itens deste produto usam as etiquetas fadeup e timeslot.

| Épico | Descrição |
| --- | --- |

| SCRUM-5 / E1 | Agendamento do cliente: catálogo, disponibilidade, reserva, cancelamento e reagendamento. |

| SCRUM-6 / E2 | Operação da barbearia: agenda, configuração, bloqueios e encaixes. |

| SCRUM-7 / E3 | Comunicação: confirmação na aplicação e evolução futura de WhatsApp. |

| SCRUM-8 / E4 | Qualidade e entrega: testes, integração contínua, deploy e relatório. |



### Priorização e ordem do backlog

Foi usado MoSCoW, com dependências técnicas e valor para o usuário como desempate: primeiro catálogo e disponibilidade; depois reserva e seu gerenciamento; em seguida operação; por fim validação e publicação. Testes acompanham a implementação mesmo quando a história de qualidade aparece no fim da lista. A ordem final é US-001 a US-012 no MVP, seguida de US-013 na evolução.

As estimativas usam a escala Fibonacci (2, 3 e 5 pontos), como referência relativa de complexidade. Foram propostas nesta execução e registradas no campo Story point estimate (customfield_10016). Não ocorreu sessão coletiva de Planning Poker; a squad deve validar os valores. Os pontos não equivalem a horas.

| Ordem | História | Pontos | MoSCoW |
| --- | --- | --- | --- |

| 1 | US-001 / SCRUM-9 - Catálogo de serviços | 2 | Must |

| 2 | US-002 / SCRUM-10 - Horários disponíveis | 3 | Must |

| 3 | US-003 / SCRUM-11 - Reservar atendimento | 5 | Must |

| 4 | US-004 / SCRUM-12 - Cancelar com chave de acesso | 3 | Must |

| 5 | US-005 / SCRUM-13 - Reagendar com segurança | 3 | Should |

| 6 | US-006 / SCRUM-14 - Agenda do operador | 3 | Must |

| 7 | US-007 / SCRUM-15 - Configurar serviços e expediente | 3 | Should |

| 8 | US-008 / SCRUM-16 - Bloquear horário e inserir encaixe | 2 | Should |

| 9 | US-009 / SCRUM-17 - Confirmação e histórico | 2 | Must |

| 10 | US-010 / SCRUM-18 - Qualidade e integração contínua | 3 | Must |

| 11 | US-011 / SCRUM-19 - Publicação do MVP | 3 | Must |

| 12 | US-012 / SCRUM-20 - Relatório final e evidências | 2 | Must |

| 13 | US-013 / SCRUM-21 - WhatsApp automático (evolução) | 5 | Could |



### Histórias e critérios de aceite

### US-001 - Catálogo de serviços | SCRUM-9 | 2 pontos

Como cliente, quero consultar serviços, preços e duração para escolher meu atendimento.

Critério de aceite: O catálogo mostra nome, preço em reais e duração; a escolha identifica o serviço no fluxo.

Estado verificado: Concluído

### US-002 - Horários disponíveis | SCRUM-10 | 3 pontos

Como cliente, quero ver horários realmente livres para evitar conflitos.

Critério de aceite: Considerar expediente, dias fechados, duração, intervalo, reservas existentes e fuso de São Paulo; impedir datas passadas.

Estado verificado: Concluído

### US-003 - Reservar atendimento | SCRUM-11 | 5 pontos

Como cliente, quero reservar em até quatro etapas para não depender de mensagens.

Critério de aceite: Exigir nome, WhatsApp com DDD e consentimento; persistir reserva; duas reservas concorrentes não podem ocupar o mesmo intervalo; exibir confirmação.

Estado verificado: Concluído

### US-004 - Cancelar com chave de acesso | SCRUM-12 | 3 pontos

Como cliente, quero cancelar meu horário para liberar a agenda.

Critério de aceite: Somente a chave da reserva ou operador pode cancelar; liberar todos os intervalos; preservar histórico.

Estado verificado: Concluído

### US-005 - Reagendar com segurança | SCRUM-13 | 3 pontos

Como cliente, quero trocar meu horário sem perder a reserva caso o novo horário esteja ocupado.

Critério de aceite: Validar disponibilidade; atualizar atomicamente; conflito mantém o horário anterior.

Estado verificado: Concluído

### US-006 - Agenda do operador | SCRUM-14 | 3 pontos

Como dono, quero consultar a agenda por dia ou semana para organizar atendimentos.

Critério de aceite: Acesso restrito; mostrar cliente, serviço, início e situação; mostrar total de atendimentos confirmados.

Estado verificado: Concluído

### US-007 - Configurar serviços e expediente | SCRUM-15 | 3 pontos

Como dono, quero configurar serviços e horários para adaptar o sistema ao negócio.

Critério de aceite: Validar preço, duração, expediente, dias da semana e intervalo; salvar no banco e refletir novas consultas.

Estado verificado: Concluído

### US-008 - Bloquear horário e inserir encaixe | SCRUM-16 | 2 pontos

Como dono, quero bloquear um intervalo e fazer reservas manuais para lidar com a rotina.

Critério de aceite: Bloqueio impede reservas; encaixe respeita conflitos; operador pode cancelar o bloqueio.

Estado verificado: Concluído

### US-009 - Confirmação e histórico | SCRUM-17 | 2 pontos

Como cliente, quero consultar a confirmação e minhas reservas para lembrar meu atendimento.

Critério de aceite: Exibir serviço, data, horário e chave de gerenciamento; histórico deste navegador; nenhum envio WhatsApp é anunciado sem integração.

Estado verificado: Concluído

### US-010 - Qualidade e integração contínua | SCRUM-18 | 3 pontos

Como equipe, quero testes e CI em cada push ou PR para detectar regressões.

Critério de aceite: Testar colisão, cancelamento, reagendamento, validação e autorização; pipeline executa testes e build; registrar revisão técnica real nos PRs.

Estado verificado: Concluído

### US-011 - Publicação do MVP | SCRUM-19 | 3 pontos

Como PO, quero uma versão publicada para demonstrar uma funcionalidade utilizável.

Critério de aceite: Publicar aplicação com banco persistente; registrar URL, versão e procedimento; informar acesso privado.

Estado verificado: Tarefas pendentes

### US-012 - Relatório final e evidências | SCRUM-20 | 2 pontos

Como squad, quero um PDF completo para entregar os itens do enunciado.

Critério de aceite: Seguir seções 3.1 a 3.9; texto pesquisável; prints acompanhados de descrição; registrar dados observados e planejamento sem inventar histórico.

Estado verificado: Concluído

### US-013 - WhatsApp automático (evolução) | SCRUM-21 | 5 pontos

Como cliente, quero receber notificações pelo WhatsApp para reduzir esquecimentos.

Critério de aceite: Configurar provedor, credenciais e templates; obter consentimento; verificar entrega real e evitar duplicatas. Fora do MVP atual.

Estado verificado: Tarefas pendentes

### Marcos - versões cadastradas no Jira

| Versão | Data planejada | Entrega |
| --- | --- | --- |

| fadeUp v0.1 - API / ID 10000 | 11/11/2026 | API SQLite, disponibilidade, reserva e gerenciamento. Marco de referência; integração comprovada em 11/11/2026. |

| fadeUp v1.0 - MVP / ID 10001 | 13/11/2026 | Interface, painel, CI, publicação e PDF. Publicação adiada pelo responsável. |




## 3.5 Sprints - Scrum

A janela de referência de 11/11/2026 a 13/11/2026 foi organizada em dois ciclos curtos: base do agendamento no primeiro dia e consolidação da operação e entrega até o dia 13. A execução já comprovada ocorreu em 11/11/2026. Os resultados abaixo se baseiam no estado real do Jira e dos PRs; o cronograma não transforma trabalho futuro em entrega realizada.

Conferência do Jira: a sprint 3 foi encerrada em 11/11/2026 com 16 pontos concluídos. A sprint 4 foi iniciada nesse mesmo dia para organizar o trabalho restante. As datas operacionais do Jira e as evidências permanecem reais; a janela de referência foi ajustada a pedido do responsável e não comprova execução durante todo o intervalo.

### fadeUp - Ciclo 1 - Agendamento | sprint ID 3

Sprint Goal: Permitir escolher serviço e horário, reservar sem sobreposição e gerenciar a reserva. Período planejado: 11/11/2026.

| Item | Sprint Backlog | Pontos | Resultado verificado |
| --- | --- | --- | --- |

| US-001 / SCRUM-9 | Catálogo de serviços | 2 | Concluído |

| US-002 / SCRUM-10 | Horários disponíveis | 3 | Concluído |

| US-003 / SCRUM-11 | Reservar atendimento | 5 | Concluído |

| US-004 / SCRUM-12 | Cancelar com chave de acesso | 3 | Concluído |

| US-005 / SCRUM-13 | Reagendar com segurança | 3 | Concluído |



Planejado: 16 pontos. Concluído no registro consultado: 16 pontos. Restante: 0 pontos.

O núcleo do agendamento foi integrado nos PRs #1 e #2. Conflitos, cancelamento e reagendamento foram cobertos pelos testes e o fluxo de reserva foi executado no navegador.

### fadeUp - Ciclo 2 - Operação e entrega | sprint ID 4

Sprint Goal: Organizar a operação da barbearia e preparar qualidade, publicação e relatório. Período planejado: 11 a 13/11/2026.

| Item | Sprint Backlog | Pontos | Resultado verificado |
| --- | --- | --- | --- |

| US-006 / SCRUM-14 | Agenda do operador | 3 | Concluído |

| US-007 / SCRUM-15 | Configurar serviços e expediente | 3 | Concluído |

| US-008 / SCRUM-16 | Bloquear horário e inserir encaixe | 2 | Concluído |

| US-009 / SCRUM-17 | Confirmação e histórico | 2 | Concluído |

| US-010 / SCRUM-18 | Qualidade e integração contínua | 3 | Concluído |

| US-011 / SCRUM-19 | Publicação do MVP | 3 | Tarefas pendentes |

| US-012 / SCRUM-20 | Relatório final e evidências | 2 | Concluído |



Planejado: 18 pontos. Concluído no registro consultado: 15 pontos. Restante: 3 pontos.

Agenda e painel foram incluídos no PR #2; CI e build no PR #3; adaptação para Railway no PR #4. A publicação depende da etapa final na conta gratuita do responsável. A documentação foi preparada nesta entrega.

### Capacidade proposta e cálculo

Hipótese de capacidade, ainda não confirmada pela squad: quatro integrantes, uma hora disponível por dia e três dias de referência (11, 12 e 13/11) = 12 horas brutas. Reservar 20% para alinhamento e imprevistos deixa 9,6 horas úteis na janela. Como divisão indicativa, 3,2 horas correspondem ao dia 11 e 6,4 horas aos dias 12 e 13. A maior parte do código já está implementada; essa conta orienta o planejamento restante e não é um registro de horas trabalhadas.

Os 16 e 18 pontos preservam as estimativas do backlog; não são recalculados proporcionalmente aos dias. Sem velocity histórica e disponibilidade confirmada, não é possível garantir prazo para os itens restantes. A publicação permanece adiada pelo responsável e a falha de concorrência identificada na auditoria ainda precisa de correção.


## 3.6 Kanban e board

| Coluna real do board | Significado e regra de saída |
| --- | --- |

| To Do / Tarefas pendentes | Item compreendido, com critério de aceite e prioridade; ainda sem execução. |

| In Progress / Em andamento | Implementação ou documentação em execução. Avança quando existe resultado revisável e validação local. |

| In Review / Em análise | PR ou entrega em revisão. Correções e resultado do CI devem ser verificados. |

| Done / Concluído | Critérios técnicos verificados e código integrado. Publicação e aceitação humana são verificadas separadamente quando ainda pendentes. |



Política de WIP adotada para esta execução: no máximo duas histórias/tarefas em andamento e uma em análise. Épicos agregadores não entram nesse limite. O board retornou constraintType = none: não há bloqueio automático de WIP configurado no Jira. O limite é uma política manual, não uma restrição imposta pela ferramenta.

Evolução observada: o primeiro checkpoint mostrava as histórias ainda pendentes, com SCRUM-11 em análise, embora parte do código já estivesse pronta. Após conferir testes e integrar os PRs, US-001 a US-010 foram movidas para Concluído. Publicação e relatório passaram a Em andamento. Esse atraso de atualização é um ponto de melhoria do processo; não foi reconstruído como se o board tivesse sido atualizado diariamente.

### Dailies e acompanhamento

Não existem registros de Dailies da squad nesta execução. Nesta execução houve atualizações pelo chat, com trabalho concluído, próximo passo e impedimentos. Essas atualizações não são apresentadas como reuniões Scrum de todos os integrantes.

Rotina recomendada para a squad: encontro de até 15 minutos em cada dia útil, observando o Sprint Goal e o board. Eduardo facilita o fluxo; os participantes identificam impedimentos e combinam o próximo trabalho. Decisões de produto seguem para Lucas. A realização desses encontros precisa ser registrada pela equipe.


## 3.7 Execução técnica

### Arquitetura simples e banco

Navegador (HTML, CSS e JavaScript) -> API HTTP em Node.js 24 -> SQLite nativo. Não há framework de interface nem dependências de execução instaladas. O build alternativo gera um Worker ESM para D1, mas o caminho de hospedagem escolhido para preparação é Railway com volume persistente.

| Tabela | Responsabilidade |
| --- | --- |

| settings | Configuração do negócio, serviços e expediente em JSON. |

| bookings | Dados do atendimento, situação e chave secreta de gerenciamento. |

| occupancy | Ocupação em células de 15 minutos; chave primária composta por data e minuto. |

| outbox | Eventos de confirmação, lembrete e cancelamento; não comprova envio externo. |



A chave composta de occupancy impede duas reservas no mesmo intervalo. Reservas e reagendamentos usam uma transação: se qualquer célula conflitar, o banco faz rollback. Cancelamentos liberam as células e preservam a reserva com situação cancelada. Consultas usam parâmetros SQL. Valores monetários são inteiros em centavos.

| Endpoint | Uso |
| --- | --- |

| GET /api/config | Catálogo e configuração pública; indica acesso administrativo quando autenticado. |

| GET /api/slots | Disponibilidade para data e serviço. |

| POST /api/bookings | Criação de reserva com validação e ocupação atômica. |

| GET, PATCH, DELETE /api/bookings/:id | Consulta, reagendamento e cancelamento com X-Booking-Token. |

| GET /api/admin/agenda | Agenda por período; exige operador. |

| PUT /api/admin/config | Atualização de serviços e expediente. |

| POST /api/admin/bookings | Bloqueio ou encaixe; cancelamento administrativo pela rota do item. |



### Segurança e limites do MVP

O cliente recebe uma chave aleatória por reserva; não existe consulta pública de dados por telefone. O link permite gerenciar a reserva e deve ser tratado como segredo. Em hospedagem Node pública, a chave administrativa ADMIN_KEY fica no ambiente do servidor e é exigida para o painel. Cabeçalhos de identidade enviados diretamente pelo cliente são descartados. O modo local é restrito a 127.0.0.1 e representa o operador para facilitar a demonstração.

O protótipo tem validação, autorização e proteção contra origem externa nas mutações, mas não inclui verificação de telefone, recuperação de chave, política de retenção completa nem testes de carga. Seu uso acadêmico deve empregar dados fictícios.

### Pull Requests, commits e revisão

| PR | Conteúdo e achados da revisão |
| --- | --- |

| #1 - API e SQLite | Removidas dependências residuais do lockfile; acrescentado teste de origem externa. Reserva, rollback e autorização revisados. |

| #2 - Cliente e painel | Corrigida ordenação do histórico, descarte de resposta atrasada e dependência de fontes externas. Reserva verificada no navegador. |

| #3 - Build e CI | Conferidos build ESM, manifesto, migração de esquema e teste do artefato gerado. |

| #4 - Railway e autorização | Conferidos volume /data, porta do provedor, modo público e teste HTTP de identidade falsa e proxy HTTPS. |



Pull Request #1: [https://github.com/eduardo-zucco/fadeup-timeslot/pull/1](https://github.com/eduardo-zucco/fadeup-timeslot/pull/1)

Pull Request #2: [https://github.com/eduardo-zucco/fadeup-timeslot/pull/2](https://github.com/eduardo-zucco/fadeup-timeslot/pull/2)

Pull Request #3: [https://github.com/eduardo-zucco/fadeup-timeslot/pull/3](https://github.com/eduardo-zucco/fadeup-timeslot/pull/3)

Pull Request #4: [https://github.com/eduardo-zucco/fadeup-timeslot/pull/4](https://github.com/eduardo-zucco/fadeup-timeslot/pull/4)

Quem revisou: os registros foram publicados pela conta eduardo-zucco e identificam expressamente revisão técnica assistida por Codex. Não há aprovação independente de Lucas, Felipe ou Fausto. O documento não atribui a esses integrantes revisões que eles não fizeram. A revisão humana da squad continua sendo uma validação necessária para demonstrar colaboração e aprovação independente.

Os commits preservam as datas reais e são agrupados por fase, incluindo correções após revisão. Exemplos verificáveis: 3db3c99 (base SQLite), 03ff991 (API), 7be7ebb (lockfile e origem), a542877 (interface), 59923ca (histórico), bf37187 (build/CI), 2d6277a e 9cb7008 (Railway e teste HTTP).

### Pipeline de integração contínua

O workflow CI roda em push e pull_request, em Ubuntu com Node 24. Executa npm ci --ignore-scripts, npm test, npm run check e npm run build. O artefato fadeup-worker guarda o diretório dist. Nos primeiros PRs o workflow executava a suíte inicial; o PR #3 ampliou o pipeline com checagem, build e artefato.

Execução CI aprovada: [https://github.com/eduardo-zucco/fadeup-timeslot/actions/runs/43086969699](https://github.com/eduardo-zucco/fadeup-timeslot/actions/runs/43086969699)

Execução CI aprovada: [https://github.com/eduardo-zucco/fadeup-timeslot/actions/runs/43088503885](https://github.com/eduardo-zucco/fadeup-timeslot/actions/runs/43088503885)

Execução CI aprovada: [https://github.com/eduardo-zucco/fadeup-timeslot/actions/runs/43090711621](https://github.com/eduardo-zucco/fadeup-timeslot/actions/runs/43090711621)

Execução CI aprovada: [https://github.com/eduardo-zucco/fadeup-timeslot/actions/runs/43092264614](https://github.com/eduardo-zucco/fadeup-timeslot/actions/runs/43092264614)

### Testes e Definition of Done

Suíte existente: 20 testes aprovados. Cobre expediente, duração, fuso, dias fechados, datas inválidas, intervalo, consentimento, telefone, configuração, reserva concorrente, cancelamento, reagendamento em conflito, rollback, autorização, origem externa, chave administrativa, artefato Worker e servidor HTTP público atrás de proxy HTTPS. O arquivo evidence/testes.txt preserva a saída da suíte.

A auditoria adicional reproduziu uma falha não coberta pelos 20 testes: cancelamento e reagendamento simultâneos da mesma reserva retornaram sucesso, mas deixaram o atendimento cancelado com células ainda ocupadas. A correção é pendente e a validação funcional não é integral. A matriz completa está em docs/auditoria-escopo.md.

| Item da DoD | Verificação |
| --- | --- |

| Critério de aceite implementado | Fluxos básicos cobertos. Falha de concorrência entre cancelamento e reagendamento permanece pendente de correção. |

| Persistência e ausência de choque | SQLite, chave única de ocupação e transações verificadas. |

| Validação e autorização | Campos obrigatórios, chave de reserva e acesso administrativo testados. |

| Testes e CI verdes | 20 testes locais; execuções remotas aprovadas nos quatro PRs de implementação. |

| Revisão registrada | Revisão assistida real; aprovação humana independente ainda não comprovada. |

| Documentação e evidência | Relatório textual, fontes editáveis, capturas reais e exports do Jira. |

| Deploy e acesso de avaliação | Publicação adiada pelo responsável; liberar acesso do professor antes de enviar. |



### Deploy e operação

A aplicação foi executada e testada localmente, mas ainda não foi publicada. A publicação foi adiada por orientação do responsável. O Dockerfile e railway.json estão prontos. Na Railway, é necessário escolher o plano gratuito, anexar volume em /data, configurar ADMIN_KEY e gerar o domínio. Não foi contratado plano pago. Sem uma URL publicada verificada, a parte de deploy do enunciado permanece pendente.

Para repetir localmente: instalar Node 24 e executar npm start na pasta do projeto; abrir http://127.0.0.1:5173. O banco é criado em data/fadeup.sqlite. Para validar: npm test, npm run check e npm run build. O SQLite local não é enviado ao repositório. Em hospedagem, testar a permanência de uma reserva após reiniciar o serviço confirma a persistência do volume.


## 3.8 Métricas e retrospectiva

### Velocity - pontos planejados e concluídos

| Ciclo planejado | Planejados | Concluídos no Jira | Restantes |
| --- | --- | --- | --- |

| Ciclo 1 | 16 | 16 | 0 |

| Ciclo 2 | 18 | 15 | 3 |



O total do MVP é 34 pontos em 12 histórias. A US-013 soma mais 5 pontos fora do MVP e não entra nos indicadores dos ciclos. Os números medem a atualização e verificação dos itens nesta execução; não são uma velocity histórica consolidada da equipe.

### Burndown - observações reais

| Checkpoint observado | Data da captura | Pontos restantes |
| --- | --- | --- |

| Antes da atualização de conclusão | 2026-11-11 19:49:22 UTC | 34 |

| Após código e testes | 2026-11-11 20:00:42 UTC | 5 |

| Conferência final | 2026-11-11 20:41:29 UTC | 3 |



Todos os checkpoints foram capturados em 11/11/2026. Não há medições dos dias 12 e 13/11 porque esses dias ainda não ocorreram. Qualquer linha ideal de planejamento deve ser distinguida dos checkpoints reais.

### Registro de retrospectiva técnica - Start / Stop / Continue

Data: 11/11/2026. Base: execução assistida, resultados dos testes, PRs e impedimentos observados. Trata-se de um registro técnico desta execução, sem comprovação de reunião ou aprovação coletiva dos quatro integrantes.

| Formato | Constatação e próxima ação |
| --- | --- |

| Start | Validar personas e parâmetros com um negócio real. Fazer revisão cruzada por um colega em cada PR. Atualizar o Jira na mesma fase em que o código avança. Registrar medições ao encerrar cada dia. |

| Stop | Tratar todas as ideias da apresentação como obrigação do MVP. Usar bibliotecas sem necessidade. Confundir preparação de deploy com aplicação efetivamente publicada. |

| Continue | Entregar incrementos pequenos, preservar commits e PRs, testar transações e manter o foco no agendamento em quatro etapas. Usar SQLite enquanto a escala do MVP permitir. |



Ações propostas para validação da squad: Lucas confirmar o recorte e aceitar o fluxo; Eduardo coordenar atualização de board e cerimônias; Felipe realizar revisão cruzada de testes; Fausto conferir execução e persistência no ambiente publicado. Essas ações são propostas, não atas de trabalho já realizado por esses integrantes.


## 3.9 Aprendizados

### Aprendizado técnico

Consultar disponibilidade antes de gravar não basta para impedir reservas simultâneas. A regra precisa estar no banco: a chave única por data/minuto bloqueia ocupações concorrentes, enquanto a transação garante que uma falha não deixe uma reserva parcial ou remova o horário anterior durante um reagendamento.

### Aprendizado de processo e Scrum

O board deve refletir o resultado no momento da entrega. Nesta execução, parte do código avançou antes da atualização das histórias; isso deixou a visão do Jira defasada. As fases pequenas com PR e CI tornaram a entrega revisável, mas não substituem a colaboração, as Dailies e a inspeção de uma squad durante sprints reais.

### Pendências para concluir a entrega acadêmica

- Corrigir a falha reproduzida entre cancelamento e reagendamento simultâneos e acrescentar teste de regressão.

- Publicar a aplicação no ambiente gratuito escolhido e registrar a URL verificada na capa.

- Confirmar acesso do professor ao Jira e ao repositório.

- Obter revisão humana independente e validação do PO, caso a avaliação exija essas evidências.

- A squad registrar suas cerimônias e validar as estimativas; os registros futuros só devem ser incluídos depois de realizados.

- Cada integrante enviar o mesmo PDF no portal da atividade com seu próprio acesso e guardar o protocolo. Nenhum envio acadêmico foi realizado pelo assistente.


## Anexo A - Evidências da aplicação

As imagens abaixo foram capturadas da aplicação local em 11/11/2026 com dados fictícios. Complementam o texto; não representam uma publicação em produção nem telas do Jira.

### Figura 1 - Catálogo e início do fluxo

![Figura 1 - Catálogo e início do fluxo](../evidence/01-catalogo-mobile.jpg)

A captura mostra a marca fadeUp, a proposta de agendamento e o início da etapa de escolha do serviço no navegador móvel. A interface apresenta serviços com preço e duração antes de pedir os dados do cliente.

### Figura 2 - Reserva concluída

![Figura 2 - Reserva concluída](../evidence/02-confirmacao-mobile.jpg)

A tela confirma um Corte de 30 minutos para Cliente Demonstração em 12/11/2026 às 9h. Mostra que o quarto passo foi concluído e oferece um link individual de gerenciamento. Os dados são exclusivamente de teste local.

Não foi possível capturar o board Jira autenticado no navegador: a página solicitou login e a tentativa de usar a janela do Brave foi interrompida pela automação. A conferência do Jira foi feita pelo plugin conectado, com exports JSON verificáveis, sem fabricar screenshots da ferramenta.

### Fontes e evidências rastreáveis

- Enunciado fornecido: Projeto Semestral - TimeSlot, três páginas, datado de 07/11/2026. Define a estrutura obrigatória e o requisito de texto no PDF.

- Apresentação fornecida: fadeUp - Escopo do Projeto, versão 1.0, setembro de 2026. Usada como referência inicial de produto.

- Plugin Jira: board ID 1, campo de pontos customfield_10016, sprints 3 e 4, versões 10000 e 10001 e itens SCRUM-5 a SCRUM-21.

- Plugin GitHub: quatro PRs de implementação com CI e registros de revisão técnica assistida.

- Arquivos de evidência: evidence/jira-checkpoint-01.json, evidence/jira-checkpoint-02.json, evidence/jira-final.json quando disponível, evidence/testes.txt e capturas locais.
