/**
 * ROTEIRO INTEGRAL E ESTRUTURA DE UNIDADES — AULA 01 (REVISÃO 30/09/2026)
 * "Aula 01 — Azure do zero: entendendo o ambiente que vamos administrar"
 *
 * Todas as 68 unidades de fala preservadas literalmente, organizadas nos 9 blocos (A01-B01 a A01-B09).
 */

const fs = require('fs');
const path = require('path');

const BLOCKS = [
  {
    id: 'A01-B01',
    num: 1,
    title: 'Uma situação que vamos acompanhar',
    screenType: 'LIA',
    videoFileName: 'bloco-01-uma-situacao-que-vamos-acompanhar.mp4',
    continuityNote: 'A pergunta sobre salvar a ordem de serviço leva ao desenho do caminho dos dados.'
  },
  {
    id: 'A01-B02',
    num: 2,
    title: 'O caminho da informação',
    screenType: 'DIAGRAMA',
    videoFileName: 'bloco-02-o-caminho-da-informacao.mp4',
    continuityNote: 'O percurso apresentado prepara a pergunta sobre quem mantém a infraestrutura.'
  },
  {
    id: 'A01-B03',
    num: 3,
    title: 'Onde entra o Azure',
    screenType: 'DIAGRAMA',
    videoFileName: 'bloco-03-onde-entra-o-azure.mp4',
    continuityNote: 'A comparação termina com a decisão sobre a divisão do trabalho.'
  },
  {
    id: 'A01-B04',
    num: 4,
    title: 'Quando a equipe administra o sistema operacional',
    screenType: 'DIAGRAMA',
    videoFileName: 'bloco-04-quando-a-equipe-administra-o-so.mp4',
    continuityNote: 'A necessidade de manter o sistema operacional motiva a comparação com uma plataforma gerenciada.'
  },
  {
    id: 'A01-B05',
    num: 5,
    title: 'Quando a plataforma assume parte do trabalho',
    screenType: 'DIAGRAMA',
    videoFileName: 'bloco-05-quando-a-plataforma-assume-parte.mp4',
    continuityNote: 'Depois de comparar hospedagem, introduzir software pronto como outra necessidade.'
  },
  {
    id: 'A01-B06',
    num: 6,
    title: 'Quando a empresa usa um software pronto',
    screenType: 'DIAGRAMA',
    videoFileName: 'bloco-06-quando-a-empresa-usa-software-pronto.mp4',
    continuityNote: 'Unir a comparação pelo que continua sob responsabilidade da oficina.'
  },
  {
    id: 'A01-B07',
    num: 7,
    title: 'O que continua sendo responsabilidade da equipe',
    screenType: 'LIA',
    videoFileName: 'bloco-07-responsabilidade-da-equipe.mp4',
    continuityNote: 'O cuidado com a Ana conecta os conceitos ao trabalho do administrador.'
  },
  {
    id: 'A01-B08',
    num: 8,
    title: 'Aplicando a comparação',
    screenType: 'DIAGRAMA',
    videoFileName: 'bloco-08-aplicando-a-comparacao.mp4',
    continuityNote: 'A resposta fecha o problema inicial antes do próximo passo.'
  },
  {
    id: 'A01-B09',
    num: 9,
    title: 'Ligação com a próxima aula',
    screenType: 'LIA',
    videoFileName: 'bloco-09-ligacao-com-a-proxima-aula.mp4',
    continuityNote: 'Terminar a fala inteira; pequena pausa e cartão de encerramento apenas na edição.'
  }
];

const UNITS = [
  // ================= A01-B01 — Uma situação que vamos acompanhar =================
  {
    id: 'U01',
    blockId: 'A01-B01',
    visualMode: 'LIA',
    diagramState: 'b01_lia_intro',
    chainGroup: 'CHAIN_A',
    chainStep: 0, // root base clip
    text: 'Olá! Eu sou a Lia, e vou acompanhar você neste curso de Azure.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U02',
    blockId: 'A01-B01',
    visualMode: 'LIA',
    diagramState: 'b01_lia_clean',
    chainGroup: 'CHAIN_A',
    chainStep: 1, // extends U01
    text: 'Vamos começar com uma situação simples, antes de entrar nos nomes dos serviços.',
    pauseAfterSec: 0.45
  },
  {
    id: 'U03',
    blockId: 'A01-B01',
    visualMode: 'OFICINA',
    diagramState: 'b01_oficina_1',
    chainGroup: 'SINGLE',
    text: 'A Oficina Horizonte registra os atendimentos dos clientes em um sistema.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U04',
    blockId: 'A01-B01',
    visualMode: 'OFICINA',
    diagramState: 'b01_oficina_2',
    chainGroup: 'SINGLE',
    text: 'Ana abre esse sistema, preenche uma ordem de serviço e clica em salvar.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U05',
    blockId: 'A01-B01',
    visualMode: 'OFICINA',
    diagramState: 'b01_oficina_3',
    chainGroup: 'SINGLE',
    text: 'O registro precisa continuar disponível quando outro funcionário abrir o atendimento.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U06',
    blockId: 'A01-B01',
    visualMode: 'OFICINA',
    diagramState: 'b01_oficina_4',
    chainGroup: 'SINGLE',
    text: 'Também precisa estar protegido contra acessos indevidos e falhas.',
    pauseAfterSec: 0.45
  },
  {
    id: 'U07',
    blockId: 'A01-B01',
    visualMode: 'LIA',
    diagramState: 'b01_lia_link',
    chainGroup: 'SINGLE',
    text: 'Para entender onde o Azure entra, vamos acompanhar esse clique da Ana.',
    pauseAfterSec: 0.8
  },

  // ================= A01-B02 — O caminho da informação =================
  {
    id: 'U08',
    blockId: 'A01-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_1_pc_to_app',
    chainGroup: 'SINGLE',
    text: 'O computador da Ana envia uma solicitação para a aplicação.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U09',
    blockId: 'A01-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_2_app_focus',
    chainGroup: 'SINGLE',
    text: 'A aplicação é o programa que processa as informações do atendimento.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U10',
    blockId: 'A01-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_3_app_to_storage',
    chainGroup: 'SINGLE',
    text: 'Ela verifica o pedido e grava os dados em um armazenamento.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U11',
    blockId: 'A01-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_4_server_base',
    chainGroup: 'SINGLE',
    text: 'Um servidor fornece a capacidade necessária para executar esse trabalho.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U12',
    blockId: 'A01-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_5_server_types',
    chainGroup: 'SINGLE',
    text: 'Servidor pode ser uma máquina física ou um ambiente virtualizado, dependendo da solução.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U13',
    blockId: 'A01-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_6_response_to_pc',
    chainGroup: 'SINGLE',
    text: 'Depois, a aplicação devolve uma resposta ao computador da Ana.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U14',
    blockId: 'A01-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_7_internet',
    chainGroup: 'SINGLE',
    text: 'Se o sistema estiver hospedado na nuvem, essa comunicação pode passar pela internet.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U15',
    blockId: 'A01-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_8_real_infra',
    chainGroup: 'SINGLE',
    text: 'Os dados não ficam soltos em uma nuvem imaginária: existe infraestrutura por trás.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U16',
    blockId: 'A01-B02',
    visualMode: 'DIAGRAMA',
    diagramState: 'b02_step_9_question',
    chainGroup: 'SINGLE',
    text: 'A questão é quem mantém essa infraestrutura e quais partes a oficina administra.',
    pauseAfterSec: 0.8
  },

  // ================= A01-B03 — Onde entra o Azure =================
  {
    id: 'U17',
    blockId: 'A01-B03',
    visualMode: 'DIAGRAMA',
    diagramState: 'b03_step_1_azure_box',
    chainGroup: 'SINGLE',
    text: 'Azure é a plataforma de nuvem da Microsoft.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U18',
    blockId: 'A01-B03',
    visualMode: 'DIAGRAMA',
    diagramState: 'b03_step_2_azure_services',
    chainGroup: 'SINGLE',
    text: 'Ela oferece serviços para executar aplicações, armazenar dados e conectar ambientes.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U19',
    blockId: 'A01-B03',
    visualMode: 'DIAGRAMA',
    diagramState: 'b03_step_3_oficina_uses_azure',
    chainGroup: 'SINGLE',
    text: 'A oficina pode usar esses serviços em vez de manter toda a infraestrutura localmente.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U20',
    blockId: 'A01-B03',
    visualMode: 'DIAGRAMA',
    diagramState: 'b03_step_4_admin_needed',
    chainGroup: 'SINGLE',
    text: 'Isso não elimina a necessidade de administrar o sistema.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U21',
    blockId: 'A01-B03',
    visualMode: 'DIAGRAMA',
    diagramState: 'b03_step_5_admin_tasks',
    chainGroup: 'SINGLE',
    text: 'Alguém ainda precisa escolher configurações, controlar acessos e acompanhar o funcionamento.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U22',
    blockId: 'A01-B03',
    visualMode: 'DIAGRAMA',
    diagramState: 'b03_step_6_cost_watch',
    chainGroup: 'SINGLE',
    text: 'O custo também precisa ser observado, conforme os recursos e o consumo da solução.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U23',
    blockId: 'A01-B03',
    visualMode: 'DIAGRAMA',
    diagramState: 'b03_step_7_no_auto_savings',
    chainGroup: 'SINGLE',
    text: 'Por isso, migrar para a nuvem não significa economizar automaticamente.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U24',
    blockId: 'A01-B03',
    visualMode: 'DIAGRAMA',
    diagramState: 'b03_step_8_work_division',
    chainGroup: 'SINGLE',
    text: 'Antes de escolher um serviço, precisamos entender como o trabalho será dividido.',
    pauseAfterSec: 0.8
  },

  // ================= A01-B04 — Quando a equipe administra o sistema operacional =================
  {
    id: 'U25',
    blockId: 'A01-B04',
    visualMode: 'DIAGRAMA',
    diagramState: 'b04_step_1_os_requirement',
    chainGroup: 'SINGLE',
    text: 'Imagine que o programa da oficina exige um sistema operacional configurado pela própria equipe.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U26',
    blockId: 'A01-B04',
    visualMode: 'DIAGRAMA',
    diagramState: 'b04_step_2_vm_intro',
    chainGroup: 'SINGLE',
    text: 'Uma máquina virtual pode atender a esse tipo de necessidade.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U27',
    blockId: 'A01-B04',
    visualMode: 'DIAGRAMA',
    diagramState: 'b04_step_3_team_os_app',
    chainGroup: 'SINGLE',
    text: 'Nesse modelo, a equipe administra o sistema operacional e a aplicação.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U28',
    blockId: 'A01-B04',
    visualMode: 'DIAGRAMA',
    diagramState: 'b04_step_4_ms_infra',
    chainGroup: 'SINGLE',
    text: 'A Microsoft cuida da infraestrutura física que sustenta o serviço.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U29',
    blockId: 'A01-B04',
    visualMode: 'DIAGRAMA',
    diagramState: 'b04_step_5_iaas_label',
    chainGroup: 'SINGLE',
    text: 'Esse modelo é chamado de infraestrutura como serviço, ou IaaS.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U30',
    blockId: 'A01-B04',
    visualMode: 'DIAGRAMA',
    diagramState: 'b04_step_6_azure_vm',
    chainGroup: 'SINGLE',
    text: 'Um exemplo no Azure é o serviço de máquinas virtuais.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U31',
    blockId: 'A01-B04',
    visualMode: 'DIAGRAMA',
    diagramState: 'b04_step_7_flexibility_tradeoff',
    chainGroup: 'SINGLE',
    text: 'Existe flexibilidade, mas a equipe assume mais tarefas de administração.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U32',
    blockId: 'A01-B04',
    visualMode: 'DIAGRAMA',
    diagramState: 'b04_step_8_link_paas',
    chainGroup: 'SINGLE',
    text: 'E se a oficina quiser publicar a aplicação sem administrar esse sistema operacional?',
    pauseAfterSec: 0.8
  },

  // ================= A01-B05 — Quando a plataforma assume parte do trabalho =================
  {
    id: 'U33',
    blockId: 'A01-B05',
    visualMode: 'DIAGRAMA',
    diagramState: 'b05_step_1_managed_platform',
    chainGroup: 'SINGLE',
    text: 'Uma plataforma gerenciada pode ser uma alternativa.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U34',
    blockId: 'A01-B05',
    visualMode: 'DIAGRAMA',
    diagramState: 'b05_step_2_app_service',
    chainGroup: 'SINGLE',
    text: 'No Azure App Service, por exemplo, a equipe publica uma aplicação em uma plataforma administrada.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U35',
    blockId: 'A01-B05',
    visualMode: 'DIAGRAMA',
    diagramState: 'b05_step_3_no_os_mgmt',
    chainGroup: 'SINGLE',
    text: 'Ela não gerencia as máquinas e o sistema operacional da mesma forma que numa VM.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U36',
    blockId: 'A01-B05',
    visualMode: 'DIAGRAMA',
    diagramState: 'b05_step_4_paas_label',
    chainGroup: 'SINGLE',
    text: 'Esse modelo é chamado de plataforma como serviço, ou PaaS.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U37',
    blockId: 'A01-B05',
    visualMode: 'DIAGRAMA',
    diagramState: 'b05_step_5_team_code_config_access',
    chainGroup: 'SINGLE',
    text: 'A equipe continua cuidando do código, das configurações e dos acessos sob sua responsabilidade.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U38',
    blockId: 'A01-B05',
    visualMode: 'DIAGRAMA',
    diagramState: 'b05_step_6_choice_criteria',
    chainGroup: 'SINGLE',
    text: 'A escolha depende do que a aplicação precisa e do trabalho que a equipe assumirá.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U39',
    blockId: 'A01-B05',
    visualMode: 'DIAGRAMA',
    diagramState: 'b05_step_7_link_saas',
    chainGroup: 'SINGLE',
    text: 'Mas talvez a oficina nem queira desenvolver ou hospedar uma aplicação própria.',
    pauseAfterSec: 0.8
  },

  // ================= A01-B06 — Quando a empresa usa um software pronto =================
  {
    id: 'U40',
    blockId: 'A01-B06',
    visualMode: 'DIAGRAMA',
    diagramState: 'b06_step_1_ready_software',
    chainGroup: 'SINGLE',
    text: 'Para algumas necessidades, ela pode contratar um software pronto e usá-lo como serviço.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U41',
    blockId: 'A01-B06',
    visualMode: 'DIAGRAMA',
    diagramState: 'b06_step_2_saas_label',
    chainGroup: 'SINGLE',
    text: 'Esse é o modelo SaaS, ou software como serviço.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U42',
    blockId: 'A01-B06',
    visualMode: 'DIAGRAMA',
    diagramState: 'b06_step_3_m365_example',
    chainGroup: 'SINGLE',
    text: 'Microsoft 365 é um exemplo conhecido desse tipo de solução.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U43',
    blockId: 'A01-B06',
    visualMode: 'DIAGRAMA',
    diagramState: 'b06_step_4_m365_note',
    chainGroup: 'SINGLE',
    text: 'Ele aparece aqui para comparar os modelos; não será implantado neste laboratório Azure.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U44',
    blockId: 'A01-B06',
    visualMode: 'DIAGRAMA',
    diagramState: 'b06_step_5_three_models_diff',
    chainGroup: 'SINGLE',
    text: 'Perceba a diferença: mudam as partes que a equipe precisa administrar.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U45',
    blockId: 'A01-B06',
    visualMode: 'DIAGRAMA',
    diagramState: 'b06_step_6_users_info_remain',
    chainGroup: 'SINGLE',
    text: 'Isso não significa que os cuidados com usuários e informações desaparecem.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U46',
    blockId: 'A01-B06',
    visualMode: 'DIAGRAMA',
    diagramState: 'b06_step_7_link_ana',
    chainGroup: 'SINGLE',
    text: 'Vamos voltar à Ana para entender o que continua dependendo da oficina.',
    pauseAfterSec: 0.8
  },

  // ================= A01-B07 — O que continua sendo responsabilidade da equipe =================
  {
    id: 'U47',
    blockId: 'A01-B07',
    visualMode: 'LIA',
    diagramState: 'b07_lia_acessos',
    chainGroup: 'CHAIN_B',
    chainStep: 1, // extends U01
    text: 'A Ana deve acessar apenas o que precisa para trabalhar.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U48',
    blockId: 'A01-B07',
    visualMode: 'LIA',
    diagramState: 'b07_lia_acessos',
    chainGroup: 'CHAIN_B',
    chainStep: 2, // extends U47
    text: 'Quando alguém deixa a empresa, os acessos dessa pessoa precisam ser revistos.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U49',
    blockId: 'A01-B07',
    visualMode: 'LIA',
    diagramState: 'b07_lia_dados',
    chainGroup: 'CHAIN_B',
    chainStep: 3, // extends U48
    text: 'A equipe também precisa cuidar dos dados e das configurações que controla.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U50',
    blockId: 'A01-B07',
    visualMode: 'LIA',
    diagramState: 'b07_lia_configuracoes',
    chainGroup: 'CHAIN_B',
    chainStep: 4, // extends U49
    text: 'Usar um serviço gerenciado não resolve essas decisões sozinho.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U51',
    blockId: 'A01-B07',
    visualMode: 'DIAGRAMA',
    diagramState: 'b07_admin_synthesis_card', // Covers transition between Chain B and Chain C
    chainGroup: 'SINGLE',
    text: 'O administrador acompanha o ambiente, investiga problemas e ajusta recursos conforme a necessidade.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U52',
    blockId: 'A01-B07',
    visualMode: 'LIA',
    diagramState: 'b07_lia_configuracoes',
    chainGroup: 'CHAIN_C',
    chainStep: 1, // extends U01
    text: 'Nosso curso vai desenvolver essas tarefas com exemplos e prática.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U53',
    blockId: 'A01-B07',
    visualMode: 'LIA',
    diagramState: 'b07_lia_acessos',
    chainGroup: 'CHAIN_C',
    chainStep: 2, // extends U52
    text: 'Começaremos organizando o laboratório e preparando o acesso da Ana.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U54',
    blockId: 'A01-B07',
    visualMode: 'LIA',
    diagramState: 'b07_lia_clean',
    chainGroup: 'CHAIN_C',
    chainStep: 3, // extends U53
    text: 'Depois avançaremos para armazenamento, computação, redes e acompanhamento dos recursos.',
    pauseAfterSec: 0.8
  },

  // ================= A01-B08 — Aplicando a comparação =================
  {
    id: 'U55',
    blockId: 'A01-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_1_intro',
    chainGroup: 'SINGLE',
    text: 'Vamos testar a ideia com uma decisão da oficina.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U56',
    blockId: 'A01-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_2_requirement',
    chainGroup: 'SINGLE',
    text: 'O programa exige que a equipe instale componentes no próprio sistema operacional.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U57',
    blockId: 'A01-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_3_question',
    chainGroup: 'SINGLE',
    text: 'Qual modelo discutido oferece esse tipo de controle de forma mais direta?',
    pauseAfterSec: 0.35
  },
  {
    id: 'U58',
    blockId: 'A01-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_4_think_pause',
    chainGroup: 'SINGLE',
    text: 'Pense na responsabilidade pelo sistema operacional antes de responder.',
    pauseAfterSec: 5.0 // [PAUSA 5s]
  },
  {
    id: 'U59',
    blockId: 'A01-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_5_answer_iaas',
    chainGroup: 'SINGLE',
    text: 'Nesse exemplo, uma máquina virtual no modelo IaaS é a opção mais direta.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U60',
    blockId: 'A01-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_6_not_always_iaas',
    chainGroup: 'SINGLE',
    text: 'Não é uma regra de que IaaS sempre será melhor.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U61',
    blockId: 'A01-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_7_matches_need',
    chainGroup: 'SINGLE',
    text: 'A escolha atende à necessidade apresentada: administrar o sistema operacional.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U62',
    blockId: 'A01-B08',
    visualMode: 'DIAGRAMA',
    diagramState: 'b08_step_8_context_changes',
    chainGroup: 'SINGLE',
    text: 'Se essa necessidade mudar, a comparação entre os serviços também pode mudar.',
    pauseAfterSec: 0.8
  },

  // ================= A01-B09 — Ligação com a próxima aula =================
  {
    id: 'U63',
    blockId: 'A01-B09',
    visualMode: 'DIAGRAMA',
    diagramState: 'b09_initial_path_recap', // Retornar ao desenho inicial, sem acrescentar novos serviços
    chainGroup: 'SINGLE',
    text: 'Hoje acompanhamos uma informação e vimos como dividir o trabalho de administração.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U64',
    blockId: 'A01-B09',
    visualMode: 'DIAGRAMA',
    diagramState: 'b09_initial_path_recap',
    chainGroup: 'SINGLE',
    text: 'Você não precisa decorar todos os serviços do Azure agora.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U65',
    blockId: 'A01-B09',
    visualMode: 'LIA',
    diagramState: 'b09_lia_closing',
    chainGroup: 'CHAIN_D',
    chainStep: 1, // extends U01
    text: 'O importante é saber perguntar o que a solução precisa e quem administra cada parte.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U66',
    blockId: 'A01-B09',
    visualMode: 'LIA',
    diagramState: 'b09_lia_closing',
    chainGroup: 'CHAIN_D',
    chainStep: 2, // extends U65
    text: 'Na próxima aula, vamos abrir o portal e localizar nosso ambiente de trabalho.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U67',
    blockId: 'A01-B09',
    visualMode: 'LIA',
    diagramState: 'b09_lia_closing',
    chainGroup: 'CHAIN_D',
    chainStep: 3, // extends U66
    text: 'Antes de criar recursos, vamos conferir a assinatura e preparar o acompanhamento de custos.',
    pauseAfterSec: 0.35
  },
  {
    id: 'U68',
    blockId: 'A01-B09',
    visualMode: 'LIA',
    diagramState: 'b09_lia_closing',
    chainGroup: 'CHAIN_D',
    chainStep: 4, // extends U67
    text: 'É esse cuidado que vai orientar nossos primeiros passos no laboratório.',
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

function generateClipsCsv(csvOutputPath = path.join(__dirname, 'Aula_01_Clipes.csv')) {
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
