/**
 * ROTEIRO INTEGRAL E ESTRUTURA DE UNIDADES — AULA 02 (REVISÃO 30/09/2026)
 * "Aula 02 — Encontrando o ambiente certo e preparando o controle de custos"
 *
 * Todas as 62 unidades de fala preservadas literalmente (654 palavras), organizadas nos 9 blocos (A02-B01 a A02-B09).
 */

const fs = require('fs');
const path = require('path');

const BLOCKS = [
  {
    id: 'A02-B01',
    num: 1,
    title: 'Retomando a decisão anterior',
    screenType: 'LIA',
    videoFileName: 'bloco-01-retomando-a-decisao-anterior.mp4',
    continuityNote: 'Concluir com o motivo para verificar o contexto antes de mostrar o portal.'
  },
  {
    id: 'A02-B02',
    num: 2,
    title: 'Conta, diretório e assinatura',
    screenType: 'DIAGRAMA',
    videoFileName: 'bloco-02-conta-diretorio-e-assinatura.mp4',
    continuityNote: 'A distinção prepara a localização desses elementos no portal.'
  },
  {
    id: 'A02-B03',
    num: 3,
    title: 'Conferindo o ambiente no portal',
    screenType: 'DEMO',
    videoFileName: 'bloco-03-conferindo-o-ambiente-no-portal.mp4',
    continuityNote: 'A conferência termina com a pergunta sobre o que aparecerá nas listagens.'
  },
  {
    id: 'A02-B04',
    num: 4,
    title: 'Uma lista vazia não conta toda a história',
    screenType: 'DEMO',
    videoFileName: 'bloco-04-uma-lista-vazia-nao-conta-toda-a-historia.mp4',
    continuityNote: 'Usar a lista de grupos como passagem para a organização que virá na aula seguinte.'
  },
  {
    id: 'A02-B05',
    num: 5,
    title: 'O propósito do orçamento',
    screenType: 'LIA',
    videoFileName: 'bloco-05-o-proposito-do-orcamento.mp4',
    continuityNote: 'A explicação conduz ao escopo e aos campos da configuração.'
  },
  {
    id: 'A02-B06',
    num: 6,
    title: 'Configurando com atenção ao escopo',
    screenType: 'DEMO',
    videoFileName: 'bloco-06-configurando-com-atencao-ao-escopo.mp4',
    continuityNote: 'Após salvar, permanecer na mesma tela para verificar o resultado.'
  },
  {
    id: 'A02-B07',
    num: 7,
    title: 'Verificando o que foi feito',
    screenType: 'DEMO',
    videoFileName: 'bloco-07-verificando-o-que-foi-feito.mp4',
    continuityNote: 'Voltar da interface para uma pergunta prática, sem vinheta.'
  },
  {
    id: 'A02-B08',
    num: 8,
    title: 'Uma decisão para conferir o entendimento',
    screenType: 'DIAGRAMA',
    videoFileName: 'bloco-08-uma-decisao-para-conferir-o-entendimento.mp4',
    continuityNote: 'A resposta recupera o princípio antes de avançar ao laboratório.'
  },
  {
    id: 'A02-B09',
    num: 9,
    title: 'Preparando a organização',
    screenType: 'LIA',
    videoFileName: 'bloco-09-preparando-a-organizacao.mp4',
    continuityNote: 'Encerrar sem ensinar tags ou permissões antecipadamente.'
  }
];

const UNITS = [
  // ================= A02-B01 — Retomando a decisão anterior =================
  {
    id: 'U01',
    blockId: 'A02-B01',
    visualMode: 'LIA',
    diagramState: 'b01_lia_title',
    chainGroup: 'CHAIN_A1',
    chainStep: 0, // base 8s
    text: 'Na aula anterior, vimos como a nuvem participa do sistema da Oficina Horizonte.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U02',
    blockId: 'A02-B01',
    visualMode: 'LIA',
    diagramState: 'b01_lia_clean',
    chainGroup: 'CHAIN_A1',
    chainStep: 1, // extends U01
    text: 'Agora vamos localizar o lugar em que administraremos nosso laboratório.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U03',
    blockId: 'A02-B01',
    visualMode: 'LIA',
    diagramState: 'b01_lia_clean',
    chainGroup: 'CHAIN_A1',
    chainStep: 2, // extends U02
    text: 'O portal reúne muitos serviços, mas você não precisa explorar tudo de uma vez.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U04',
    blockId: 'A02-B01',
    visualMode: 'LIA',
    diagramState: 'b01_lia_clean',
    chainGroup: 'CHAIN_A2',
    chainStep: 1, // extends U01
    text: 'Vamos procurar apenas o que ajuda a começar com organização.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U05',
    blockId: 'A02-B01',
    visualMode: 'LIA',
    diagramState: 'b01_lia_clean',
    chainGroup: 'CHAIN_A2',
    chainStep: 2, // extends U04
    text: 'Antes de criar qualquer recurso, precisamos conferir em qual ambiente estamos trabalhando.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U06',
    blockId: 'A02-B01',
    visualMode: 'LIA',
    diagramState: 'b01_lia_clean',
    chainGroup: 'CHAIN_A2',
    chainStep: 3, // extends U05
    text: 'Isso evita fazer uma alteração no lugar errado.',
    pauseAfterSec: 0.8
  },

  // ================= A02-B02 — Conta, diretório e assinatura =================
  {
    id: 'U07',
    blockId: 'A02-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_1_account',
    chainGroup: 'SINGLE',
    text: 'A conta identifica quem está entrando.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U08',
    blockId: 'A02-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_2_directory_tenant',
    chainGroup: 'SINGLE',
    text: 'O diretório, também chamado de tenant, reúne identidades de uma organização no Microsoft Entra ID.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U09',
    blockId: 'A02-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_3_subscription_access',
    chainGroup: 'SINGLE',
    text: 'A assinatura organiza o acesso e a administração dos recursos Azure naquele contexto.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U10',
    blockId: 'A02-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_4_subscription_costs',
    chainGroup: 'SINGLE',
    text: 'Ela também participa da organização dos custos de uso.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U11',
    blockId: 'A02-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_5_trust_relation',
    chainGroup: 'SINGLE',
    text: 'Uma assinatura confia em um diretório por vez.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U12',
    blockId: 'A02-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_6_multiple_subscriptions',
    chainGroup: 'SINGLE',
    text: 'O mesmo diretório pode estar relacionado a várias assinaturas.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U13',
    blockId: 'A02-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_7_distinction_summary',
    chainGroup: 'SINGLE',
    text: 'Portanto, diretório e assinatura não são nomes diferentes para a mesma coisa.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U14',
    blockId: 'A02-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_8_link_portal',
    chainGroup: 'SINGLE',
    text: 'Vamos localizar esses elementos na interface, sem mudar sua associação.',
    pauseAfterSec: 0.8
  },

  // ================= A02-B03 — Conferindo o ambiente no portal =================
  {
    id: 'U15',
    blockId: 'A02-B03',
    visualMode: 'DEMO',
    diagramState: 'b03_demo_1_active_directory',
    chainGroup: 'SINGLE',
    text: 'Depois de entrar, confira o diretório ativo no portal.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U16',
    blockId: 'A02-B03',
    visualMode: 'DEMO',
    diagramState: 'b03_demo_2_lab_subscription_search',
    chainGroup: 'SINGLE',
    text: 'Vou usar a assinatura reservada para nosso laboratório.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U17',
    blockId: 'A02-B03',
    visualMode: 'DEMO',
    diagramState: 'b03_demo_3_open_subscription',
    chainGroup: 'SINGLE',
    text: 'Na busca, procuramos a área de assinaturas e abrimos a assinatura escolhida.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U18',
    blockId: 'A02-B03',
    visualMode: 'DEMO',
    diagramState: 'b03_demo_4_observe_name',
    chainGroup: 'SINGLE',
    text: 'Observe o nome antes de continuar.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U19',
    blockId: 'A02-B03',
    visualMode: 'DEMO',
    diagramState: 'b03_demo_5_work_account_environments',
    chainGroup: 'SINGLE',
    text: 'Se você usa uma conta de trabalho, pode ter acesso a ambientes diferentes.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U20',
    blockId: 'A02-B03',
    visualMode: 'DEMO',
    diagramState: 'b03_demo_6_avoid_prod_subscription',
    chainGroup: 'SINGLE',
    text: 'Não escolha uma assinatura de produção apenas porque ela apareceu na lista.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U21',
    blockId: 'A02-B03',
    visualMode: 'DEMO',
    diagramState: 'b03_demo_7_authorized_context',
    chainGroup: 'SINGLE',
    text: 'O importante é reconhecer o contexto em que você tem autorização para praticar.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U22',
    blockId: 'A02-B03',
    visualMode: 'DEMO',
    diagramState: 'b03_demo_8_filters_visibility',
    chainGroup: 'SINGLE',
    text: 'Também precisamos entender o que os filtros deixam visível.',
    pauseAfterSec: 0.8
  },

  // ================= A02-B04 — Uma lista vazia não conta toda a história =================
  {
    id: 'U23',
    blockId: 'A02-B04',
    visualMode: 'DEMO',
    diagramState: 'b04_demo_1_subscription_filter',
    chainGroup: 'SINGLE',
    text: 'O filtro de assinaturas influencia os recursos mostrados nas listagens.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U24',
    blockId: 'A02-B04',
    visualMode: 'DEMO',
    diagramState: 'b04_demo_2_empty_list_reasons',
    chainGroup: 'SINGLE',
    text: 'Uma lista vazia pode estar relacionada ao filtro, ao diretório ou às permissões.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U25',
    blockId: 'A02-B04',
    visualMode: 'DEMO',
    diagramState: 'b04_demo_3_check_context',
    chainGroup: 'SINGLE',
    text: 'Por isso, vamos conferir o contexto antes de concluir que algo desapareceu.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U26',
    blockId: 'A02-B04',
    visualMode: 'DEMO',
    diagramState: 'b04_demo_4_search_resource_groups',
    chainGroup: 'SINGLE',
    text: 'Agora procure a área de grupos de recursos.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U27',
    blockId: 'A02-B04',
    visualMode: 'DEMO',
    diagramState: 'b04_demo_5_rg_organization_future',
    chainGroup: 'SINGLE',
    text: 'É nela que organizaremos os componentes do laboratório na próxima aula.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U28',
    blockId: 'A02-B04',
    visualMode: 'DEMO',
    diagramState: 'b04_demo_6_recognize_rg_area',
    chainGroup: 'SINGLE',
    text: 'Hoje vamos apenas reconhecer essa área.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U29',
    blockId: 'A02-B04',
    visualMode: 'DEMO',
    diagramState: 'b04_demo_7_link_costs',
    chainGroup: 'SINGLE',
    text: 'Antes de criar componentes, falta preparar uma forma de acompanhar os gastos.',
    pauseAfterSec: 0.8
  },

  // ================= A02-B05 — O propósito do orçamento =================
  {
    id: 'U30',
    blockId: 'A02-B05',
    visualMode: 'LIA',
    diagramState: 'b05_lia_card_monitoring',
    chainGroup: 'CHAIN_B1',
    chainStep: 1, // extends U01
    text: 'Um orçamento ajuda a acompanhar o gasto em relação a um valor planejado.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U31',
    blockId: 'A02-B05',
    visualMode: 'LIA',
    diagramState: 'b05_lia_card_monitoring',
    chainGroup: 'CHAIN_B1',
    chainStep: 2, // extends U30
    text: 'Você define o período, o valor e os alertas que deseja receber.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U32',
    blockId: 'A02-B05',
    visualMode: 'LIA',
    diagramState: 'b05_lia_card_no_auto_stop',
    chainGroup: 'CHAIN_B1',
    chainStep: 3, // extends U31
    text: 'Ele não funciona como um botão que desliga recursos automaticamente.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U33',
    blockId: 'A02-B05',
    visualMode: 'LIA',
    diagramState: 'b05_lia_card_no_auto_stop',
    chainGroup: 'CHAIN_B2',
    chainStep: 1, // extends U01
    text: 'Se o consumo continuar, a cobrança também pode continuar.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U34',
    blockId: 'A02-B05',
    visualMode: 'LIA',
    diagramState: 'b05_lia_card_timing',
    chainGroup: 'CHAIN_B2',
    chainStep: 2, // extends U33
    text: 'Os dados de custo e os avisos não são instantâneos.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U35',
    blockId: 'A02-B05',
    visualMode: 'LIA',
    diagramState: 'b05_lia_card_didactic_example',
    chainGroup: 'CHAIN_B2',
    chainStep: 3, // extends U34
    text: 'Vamos configurar um exemplo simples, sem confundir o alerta com uma garantia de limite financeiro.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U36',
    blockId: 'A02-B05',
    visualMode: 'LIA',
    diagramState: 'b05_lia_card_didactic_example',
    chainGroup: 'CHAIN_B2',
    chainStep: 4, // extends U35
    text: 'O valor usado na tela é apenas didático.',
    pauseAfterSec: 0.8
  },

  // ================= A02-B06 — Configurando com atenção ao escopo =================
  {
    id: 'U37',
    blockId: 'A02-B06',
    visualMode: 'DEMO',
    diagramState: 'b06_demo_1_open_budgets',
    chainGroup: 'SINGLE',
    text: 'Dentro da assinatura de laboratório, abrimos a área de orçamentos.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U38',
    blockId: 'A02-B06',
    visualMode: 'DEMO',
    diagramState: 'b06_demo_2_check_scope',
    chainGroup: 'SINGLE',
    text: 'Confira o escopo mostrado antes de preencher o formulário.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U39',
    blockId: 'A02-B06',
    visualMode: 'DEMO',
    diagramState: 'b06_demo_3_budget_name',
    chainGroup: 'SINGLE',
    text: 'Dê ao orçamento um nome que identifique seu objetivo.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U40',
    blockId: 'A02-B06',
    visualMode: 'DEMO',
    diagramState: 'b06_demo_4_period_and_amount',
    chainGroup: 'SINGLE',
    text: 'Vamos usar um período mensal e o valor de exemplo exibido na tela.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U41',
    blockId: 'A02-B06',
    visualMode: 'DEMO',
    diagramState: 'b06_demo_5_currency_match',
    chainGroup: 'SINGLE',
    text: 'A moeda deve ser a que aparece no seu ambiente.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U42',
    blockId: 'A02-B06',
    visualMode: 'DEMO',
    diagramState: 'b06_demo_6_alert_thresholds',
    chainGroup: 'SINGLE',
    text: 'Em seguida, configuramos avisos em diferentes percentuais do valor planejado.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U43',
    blockId: 'A02-B06',
    visualMode: 'DEMO',
    diagramState: 'b06_demo_7_controlled_recipient',
    chainGroup: 'SINGLE',
    text: 'O endereço de recebimento precisa ser um endereço que você controla.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U44',
    blockId: 'A02-B06',
    visualMode: 'DEMO',
    diagramState: 'b06_demo_8_review_and_finish',
    chainGroup: 'SINGLE',
    text: 'Revise os campos e só então conclua a configuração.',
    pauseAfterSec: 0.8
  },

  // ================= A02-B07 — Verificando o que foi feito =================
  {
    id: 'U45',
    blockId: 'A02-B07',
    visualMode: 'DEMO',
    diagramState: 'b07_demo_1_budget_listed',
    chainGroup: 'SINGLE',
    text: 'Agora confira se o orçamento aparece na listagem.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U46',
    blockId: 'A02-B07',
    visualMode: 'DEMO',
    diagramState: 'b07_demo_2_confirm_details',
    chainGroup: 'SINGLE',
    text: 'Abra a configuração e confirme período, valor e destinatário.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U47',
    blockId: 'A02-B07',
    visualMode: 'DEMO',
    diagramState: 'b07_demo_3_saving_not_dispensing',
    chainGroup: 'SINGLE',
    text: 'Salvar o formulário não dispensa essa verificação.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U48',
    blockId: 'A02-B07',
    visualMode: 'DEMO',
    diagramState: 'b07_demo_4_check_permissions',
    chainGroup: 'SINGLE',
    text: 'Se a opção não estiver disponível, confira as permissões e a disponibilidade no seu ambiente.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U49',
    blockId: 'A02-B07',
    visualMode: 'DEMO',
    diagramState: 'b07_demo_5_new_subscriptions_timing',
    chainGroup: 'SINGLE',
    text: 'Assinaturas novas podem levar algum tempo para disponibilizar funcionalidades de custos.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U50',
    blockId: 'A02-B07',
    visualMode: 'DEMO',
    diagramState: 'b07_demo_6_follow_demo',
    chainGroup: 'SINGLE',
    text: 'Nesse caso, acompanhe a demonstração e faça a prática quando o acesso estiver disponível.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U51',
    blockId: 'A02-B07',
    visualMode: 'DEMO',
    diagramState: 'b07_demo_7_no_paid_resources_needed',
    chainGroup: 'SINGLE',
    text: 'Não precisamos criar recursos cobrados para entender esse procedimento.',
    pauseAfterSec: 0.8
  },

  // ================= A02-B08 — Uma decisão para conferir o entendimento =================
  {
    id: 'U52',
    blockId: 'A02-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_1_scenario',
    chainGroup: 'SINGLE',
    text: 'Imagine que o consumo ultrapassou o valor do orçamento.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U53',
    blockId: 'A02-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_2_question_pause',
    chainGroup: 'SINGLE',
    text: 'O orçamento, sozinho, interrompe o funcionamento dos recursos?',
    pauseAfterSec: 5.0 // [PAUSA 5s]
  },
  {
    id: 'U54',
    blockId: 'A02-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_3_answer_no',
    chainGroup: 'SINGLE',
    text: 'Não. Ele acompanha os custos e emite os alertas configurados.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U55',
    blockId: 'A02-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_4_action_required',
    chainGroup: 'SINGLE',
    text: 'Interromper ou ajustar recursos exige outra ação apropriada.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U56',
    blockId: 'A02-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_5_avoid_expectation',
    chainGroup: 'SINGLE',
    text: 'Esse detalhe ajuda a evitar uma expectativa que o orçamento não pode cumprir.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U57',
    blockId: 'A02-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_6_confirm_checkpoints',
    chainGroup: 'SINGLE',
    text: 'Antes de sair, confirme que você sabe localizar sua assinatura e o orçamento criado.',
    pauseAfterSec: 0.8
  },

  // ================= A02-B09 — Preparando a organização =================
  {
    id: 'U58',
    blockId: 'A02-B09',
    visualMode: 'LIA',
    diagramState: 'b09_lia_status_summary',
    chainGroup: 'CHAIN_C',
    chainStep: 1, // extends U01
    text: 'Já sabemos em qual ambiente trabalhar e onde acompanhar o planejamento de custos.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U59',
    blockId: 'A02-B09',
    visualMode: 'LIA',
    diagramState: 'b09_lia_status_summary',
    chainGroup: 'CHAIN_C',
    chainStep: 2, // extends U58
    text: 'Na próxima aula, vamos criar o grupo de recursos do laboratório.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U60',
    blockId: 'A02-B09',
    visualMode: 'LIA',
    diagramState: 'b09_lia_clean',
    chainGroup: 'CHAIN_C',
    chainStep: 3, // extends U59
    text: 'Também vamos identificá-lo e testar uma proteção contra exclusão acidental.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U61',
    blockId: 'A02-B09',
    visualMode: 'LIA',
    diagramState: 'b09_lia_clean',
    chainGroup: 'CHAIN_C',
    chainStep: 4, // extends U60
    text: 'Você verá cada configuração sendo feita e o resultado que ela produz.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U62',
    blockId: 'A02-B09',
    visualMode: 'LIA',
    diagramState: 'b09_lia_closing',
    chainGroup: 'CHAIN_C',
    chainStep: 5, // extends U61
    text: 'Mantenha o orçamento: voltaremos a ele ao aprofundar a gestão de custos.',
    pauseAfterSec: 1.5,
    hasClosingCardAfter: true
  }
];

function buildVeoPromptForUnit(unitText) {
  return (
    `Same Lia as the approved reference video, same face, glasses, hairstyle, blue blazer, ivory blouse, voice and studio lighting. ` +
    `Stable chest-up framing, hands entirely outside the frame. ` +
    `Warm, composed Brazilian Portuguese instructor, natural eye contact, subtle facial expression and breathing. ` +
    `Plain background panels. ` +
    `She says in Brazilian Portuguese exactly: "${unitText}" ` +
    `Preserve a natural speaking pace and accurate lip synchronization. ` +
    `Begin and end in a calm neutral pose. Clean speech, no music.`
  );
}

const VEO_NEGATIVE_PROMPT =
  'finger counting, number gestures, pointing fingers, hand signs, extra fingers, deformed hands, floating diagrams, generated letters, captions, logos, holographic text, fake software interfaces, abrupt camera motion';

function generateClipsCsv(csvOutputPath = path.join(__dirname, 'Aula_02_Clipes.csv')) {
  const header = [
    'bloco_id',
    'bloco_titulo',
    'unidade_id',
    'tela',
    'palavras',
    'duracao_estimada_s',
    'pausa_apos_s',
    'fala',
    'prompt_veo'
  ].join(',');

  const rows = UNITS.map((u) => {
    const block = BLOCKS.find((b) => b.id === u.blockId);
    const words = u.text.trim().split(/\s+/).length;
    const estSpeechSec = Number(((words / 135) * 60 + 0.8).toFixed(1));
    const promptVeo = u.visualMode === 'LIA' ? buildVeoPromptForUnit(u.text) : '(Tela produzida na edição; voz aprovada da Lia)';
    const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
    return [
      esc(u.blockId),
      esc(block ? block.title : ''),
      esc(u.id),
      esc(u.visualMode),
      words,
      estSpeechSec,
      u.pauseAfterSec,
      esc(u.text),
      esc(promptVeo)
    ].join(',');
  });

  fs.writeFileSync(csvOutputPath, [header, ...rows].join('\n'), 'utf8');
  return csvOutputPath;
}

if (require.main === module) {
  const out = generateClipsCsv();
  const totalWords = UNITS.reduce((acc, u) => acc + u.text.trim().split(/\s+/).length, 0);
  console.log(`CSV gerado em: ${out} (${UNITS.length} unidades, ${totalWords} palavras)`);
}

module.exports = {
  BLOCKS,
  UNITS,
  buildVeoPromptForUnit,
  VEO_NEGATIVE_PROMPT,
  generateClipsCsv
};
