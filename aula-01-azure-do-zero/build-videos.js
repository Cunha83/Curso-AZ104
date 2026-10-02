const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const { renderFramePNG } = require('./render-frames');
const { synthesizeAndAlignPTBR, sampleVisemeAtTime } = require('./phonetic-aligner-ptbr');

const OUT_DIR = path.join(__dirname, 'videos');
const TEMP_DIR = path.join(__dirname, 'temp_build');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

/**
 * Definição completa dos 22 planos contínuos nas 6 cenas da Aula 01
 */
const PLANS = [
  // ================= CENA 1: 00:00 - 01:00 =================
  {
    id: 'p1_1',
    scene: 1,
    sceneTitle: 'Cena 1 • Abertura',
    planCode: 'Plano 1.1',
    stepFocus: 'hero',
    liaPos: 'hero',
    sub1: 'Bem-vinda, bem-vindo! Eu sou a Lia. Se Azure ainda parece um painel',
    sub2: 'cheio de nomes estranhos, fica comigo: vamos começar do zero!',
    text: 'Bem-vinda, bem-vindo! Eu sou a Lia. Se Azure ainda parece um painel cheio de nomes estranhos, fica comigo. Vamos começar do zero e transformar esses nomes em tarefas que você consegue entender e praticar.',
    pauseAfter: 1.2,
    isVignetteStart: true
  },
  {
    id: 'p1_2',
    scene: 1,
    sceneTitle: 'Cena 1 • Cenário Oficina Horizonte',
    planCode: 'Plano 1.2',
    stepFocus: 'os',
    liaPos: 'right',
    sub1: 'Curso rumo ao AZ-104 (Administrador do Azure) na Oficina Horizonte:',
    sub2: 'Ana (consulta), Bruno (administra recursos) e Equipe de Custos.',
    text: 'Ao longo do nosso curso rumo ao AZ-104, que é a certificação de Administrador do Azure da Microsoft, nós vamos acompanhar um cenário real de trabalho: a empresa fictícia Oficina Horizonte. Lá, a Ana consulta informações e registra ordens de serviço no computador dela; o Bruno administra os recursos técnicos; e uma equipe precisa acompanhar os custos.',
    pauseAfter: 1.0
  },
  {
    id: 'p1_3a',
    scene: 1,
    sceneTitle: 'Cena 1 • Três Perguntas',
    planCode: 'Plano 1.3a',
    stepFocus: 'q1',
    liaPos: 'right',
    sub1: 'Para colocar o sistema de ordens de serviço no ar,',
    sub2: 'três perguntas surgem: 1) Onde roda?',
    text: 'Para colocar esse sistema de ordens de serviço no ar, três perguntas aparecem na hora: Primeiro: Onde roda?',
    pauseAfter: 0.5
  },
  {
    id: 'p1_3b',
    scene: 1,
    sceneTitle: 'Cena 1 • Três Perguntas',
    planCode: 'Plano 1.3b',
    stepFocus: 'q2',
    liaPos: 'right',
    sub1: '2) Quem acessa o sistema e os dados da oficina?',
    sub2: '3) E quanto custa manter esse ambiente?',
    text: 'Segundo: Quem acessa? E terceiro: Quanto custa?',
    pauseAfter: 0.6
  },
  {
    id: 'p1_3c',
    scene: 1,
    sceneTitle: 'Cena 1 • Objetivos da Aula',
    planCode: 'Plano 1.3c',
    stepFocus: 'q3',
    liaPos: 'right',
    sub1: 'Cada decisão desse ambiente guiará nossas aulas.',
    sub2: 'E fique tranquilo: hoje você não precisa ter conta no Azure!',
    text: 'Cada decisão desse ambiente vai guiar as nossas aulas. E pode relaxar: hoje você não precisa ter conta no Azure para acompanhar. Vamos construir a sua base!',
    pauseAfter: 1.5
  },

  // ================= CENA 2: 01:00 - 03:00 =================
  {
    id: 'p2_1',
    scene: 2,
    sceneTitle: 'Cena 2 • O que significa usar nuvem',
    planCode: 'Plano 2.1',
    stepFocus: 'concepts',
    liaPos: 'right',
    sub1: 'Computador da atendente ➔ Internet ➔ Infraestrutura de nuvem:',
    sub2: 'Servidor (fornece serviço), Aplicação (software) e Armazenamento (dados).',
    text: 'Mas o que acontece quando a Ana clica em salvar uma ordem de serviço usando a nuvem? Olha este desenho simples: o pedido sai do computador da atendente, passa pela internet e chega a uma estrutura com três partes essenciais. Primeiro, o servidor, que é o computador que fornece um serviço. Segundo, a aplicação, que é o software em si. E terceiro, o armazenamento, que é o local de persistência dos dados, onde tudo fica gravado para não sumir.',
    pauseAfter: 1.2
  },
  {
    id: 'p2_2',
    scene: 2,
    sceneTitle: 'Cena 2 • Plataforma Microsoft Azure',
    planCode: 'Plano 2.2',
    stepFocus: 'concepts',
    liaPos: 'right',
    sub1: 'Azure é a plataforma de nuvem da Microsoft.',
    sub2: 'TI = Tecnologia da Informação (onde o Bruno administra recursos).',
    text: 'E onde entra o Azure? O Azure é a plataforma de nuvem da Microsoft. Para a equipe de TI, isto é, de Tecnologia da Informação, onde o Bruno trabalha, entender a nuvem começa comparando dois caminhos possíveis para a mesma ordem de serviço da Oficina Horizonte.',
    pauseAfter: 1.2
  },
  {
    id: 'p2_3',
    scene: 2,
    sceneTitle: 'Cena 2 • Sala Própria vs. Nuvem',
    planCode: 'Plano 2.3',
    stepFocus: 'compare',
    liaPos: 'left',
    sub1: 'Sala de servidores própria vs. Serviços contratados na nuvem:',
    sub2: 'Nuvem NÃO significa ausência de equipamentos físicos!',
    text: 'Veja a mesma ordem de serviço da Ana nos dois desenhos. No primeiro, a Oficina Horizonte mantém uma sala de servidores própria: compra máquinas físicas e cuida de energia, ar-condicionado, cabos e discos. No segundo, ela contrata serviços na nuvem. Repare bem: usar nuvem não significa ausência de equipamentos físicos! Eles continuam existindo dentro dos centros de dados da Microsoft.',
    pauseAfter: 1.2
  },
  {
    id: 'p2_4',
    scene: 2,
    sceneTitle: 'Cena 2 • Transição para Administração',
    planCode: 'Plano 2.4',
    stepFocus: 'compare',
    liaPos: 'left',
    sub1: '“O servidor não desapareceu. Mudou quem cuida de cada parte —',
    sub2: 'e é aí que começa o trabalho de administração.”',
    text: 'Além disso, ir para a nuvem não garante economia automática: é preciso saber dimensionar e controlar o que está ligado. O servidor não desapareceu. Mudou quem cuida de cada parte — e é aí que começa o trabalho de administração.',
    pauseAfter: 1.8
  },

  // ================= CENA 3: 03:00 - 06:00 =================
  {
    id: 'p3_1',
    scene: 3,
    sceneTitle: 'Cena 3 • Três modelos com o mesmo negócio',
    planCode: 'Plano 3.1 (IaaS)',
    stepFocus: 'cards',
    liaPos: 'right',
    sub1: 'IaaS (Infrastructure as a Service — Infraestrutura como Serviço):',
    sub2: 'Exemplo: Azure Virtual Machines (VM = Máquina Virtual).',
    text: 'Sem transformar esta aula em uma revisão longa do exame inicial AZ-900, de Fundamentos do Azure, vamos ver três modelos de serviço aplicados ao mesmo negócio da oficina. O primeiro é o IaaS, sigla para Infrastructure as a Service, ou Infraestrutura como Serviço. O exemplo direto é o Azure Virtual Machines, as Máquinas Virtuais, abreviadas como VM. Aqui a equipe da oficina administra o sistema operacional e a aplicação.',
    pauseAfter: 1.2
  },
  {
    id: 'p3_2',
    scene: 3,
    sceneTitle: 'Cena 3 • Três modelos com o mesmo negócio',
    planCode: 'Plano 3.2 (PaaS)',
    stepFocus: 'cards',
    liaPos: 'right',
    sub1: 'PaaS (Platform as a Service — Plataforma como Serviço):',
    sub2: 'Exemplo: Azure App Service (aplicação em plataforma gerenciada).',
    text: 'O segundo modelo é o PaaS, Platform as a Service, ou Plataforma como Serviço. O exemplo é o Azure App Service. Nele, a aplicação de ordens de serviço é publicada em uma plataforma já gerenciada pela Microsoft. Mais adiante aprenderemos a implantar, mas note a diferença: no PaaS, a equipe administra a aplicação, suas configurações e os dados, sem precisar cuidar do sistema operacional.',
    pauseAfter: 1.2
  },
  {
    id: 'p3_3',
    scene: 3,
    sceneTitle: 'Cena 3 • Três modelos com o mesmo negócio',
    planCode: 'Plano 3.3 (SaaS)',
    stepFocus: 'cards',
    liaPos: 'right',
    sub1: 'SaaS (Software as a Service): Exemplo Microsoft 365.',
    sub2: 'Atenção: Exemplo de SaaS — não será criado neste laboratório Azure.',
    text: 'E o terceiro modelo é o SaaS, Software as a Service, ou Software como Serviço. Usamos o Microsoft 365 como exemplo de aplicação pronta para o dia a dia. E vale destacar explicitamente: o Microsoft 365 aparece aqui apenas como exemplo de SaaS; ele não é um recurso que será criado neste laboratório do Azure.',
    pauseAfter: 1.2
  },
  {
    id: 'p3_4',
    scene: 3,
    sceneTitle: 'Cena 3 • Matriz de Responsabilidade Compartilhada',
    planCode: 'Plano 3.4 (Matriz)',
    stepFocus: 'matrix',
    liaPos: 'left',
    sub1: 'Matriz de 4 linhas: Infraestrutura física, Sistema operacional,',
    sub2: 'Aplicação/configurações e Dados/identidades.',
    text: 'Olhe agora para esta matriz simplificada com quatro linhas: infraestrutura física, sistema operacional, aplicação e configurações, e dados e identidades. Conforme vamos do IaaS para o PaaS e o SaaS, a Microsoft assume mais camadas técnicas.',
    pauseAfter: 1.0
  },
  {
    id: 'p3_5',
    scene: 3,
    sceneTitle: 'Cena 3 • Cuidado Permanente do Cliente',
    planCode: 'Plano 3.5 (Segurança)',
    stepFocus: 'matrix',
    liaPos: 'left',
    sub1: 'A Microsoft NÃO assume toda a segurança sozinha no PaaS ou SaaS:',
    sub2: 'Dados, identidades e configurações do cliente continuam exigindo cuidado!',
    text: 'Mas cuidado: nunca afirme que a Microsoft assume toda a segurança no PaaS ou no SaaS! Em qualquer modelo de nuvem, os dados da oficina, as identidades dos usuários e as configurações que ficam sob controle do cliente continuam exigindo atenção e administração da sua equipe.',
    pauseAfter: 1.6
  },

  // ================= CENA 4: 06:00 - 09:00 =================
  {
    id: 'p4_1',
    scene: 4,
    sceneTitle: 'Cena 4 • Simulação Didática do Portal Azure',
    planCode: 'Plano 4.1 (Virtual machines)',
    stepFocus: 'vm',
    liaPos: 'right',
    slowSpeech: true,
    sub1: 'Busca no Portal Azure: “Virtual machines” (Máquinas virtuais)',
    sub2: 'Papel no negócio da oficina: EXECUTAR (sem criar recursos pagos).',
    text: 'Vamos conhecer o Portal do Azure nesta simulação didática identificada? Partimos do estado inicial na barra de busca superior. Eu clico na busca, digito Virtual machines e seleciono Virtual machines. O resultado verificável é a página de listagem de Máquinas virtuais. Não vamos criar recursos nem iniciar assistentes pagos. No nosso desenho, esta tela representa executar o sistema.',
    pauseAfter: 1.2
  },
  {
    id: 'p4_2',
    scene: 4,
    sceneTitle: 'Cena 4 • Simulação Didática do Portal Azure',
    planCode: 'Plano 4.2 (Storage accounts)',
    stepFocus: 'storage',
    liaPos: 'right',
    slowSpeech: true,
    sub1: 'Busca no Portal Azure: “Storage accounts” (Contas de armazenamento)',
    sub2: 'Papel no negócio da oficina: GUARDAR dados com persistência.',
    text: 'Segunda busca no topo do portal: clicamos na caixa de pesquisa, digitamos Storage accounts e abrimos Storage accounts. Vemos a página de listagem de Contas de armazenamento. No desenho da Oficina Horizonte, esta peça cumpre a função de guardar as ordens de serviço e arquivos.',
    pauseAfter: 1.2
  },
  {
    id: 'p4_3',
    scene: 4,
    sceneTitle: 'Cena 4 • Simulação Didática do Portal Azure',
    planCode: 'Plano 4.3 (Virtual networks)',
    stepFocus: 'vnet',
    liaPos: 'right',
    slowSpeech: true,
    sub1: 'Busca no Portal Azure: “Virtual networks” (Redes virtuais)',
    sub2: 'Papel no negócio da oficina: CONECTAR recursos com segurança.',
    text: 'Terceira busca: voltamos o cursor ao topo, digitamos Virtual networks e clicamos em Virtual networks. O resultado é a listagem de Redes virtuais. Para a oficina, é o que permite conectar com segurança a aplicação, as máquinas e o armazenamento.',
    pauseAfter: 1.2
  },
  {
    id: 'p4_4',
    scene: 4,
    sceneTitle: 'Cena 4 • Simulação Didática do Portal Azure',
    planCode: 'Plano 4.4 (Microsoft Entra ID)',
    stepFocus: 'entra',
    liaPos: 'right',
    slowSpeech: true,
    sub1: 'Busca no Portal Azure: “Microsoft Entra ID” (Identidade e acesso)',
    sub2: 'Papel no negócio da oficina: IDENTIFICAR quem acessa o ambiente.',
    text: 'Quarta busca: clicamos no campo de pesquisa, digitamos Microsoft Entra ID — onde ID significa Identity, ou Identidade — e abrimos o serviço Microsoft Entra ID. Ele é responsável por identificar quem é a Ana, quem é o Bruno e quais acessos cada pessoa possui.',
    pauseAfter: 1.2
  },
  {
    id: 'p4_5',
    scene: 4,
    sceneTitle: 'Cena 4 • Percurso do Curso AZ-104',
    planCode: 'Plano 4.5 (Percurso)',
    stepFocus: 'roadmap',
    liaPos: 'left',
    sub1: 'Percurso AZ-104: Identidade/Governança, Armazenamento, Computação,',
    sub2: 'Redes e Monitoramento. As primeiras aulas constroem a base!',
    text: 'Viu como tudo se conecta? Executar, guardar, conectar e identificar resumem o dia a dia do administrador e formam os cinco módulos do nosso curso rumo ao AZ-104: identidade e governança, armazenamento, computação, redes, e monitoramento e manutenção. Lembrando que estas primeiras aulas constroem a base fundamental e não cobrem toda a certificação de uma só vez.',
    pauseAfter: 1.5
  },

  // ================= CENA 5: 09:00 - 11:00 =================
  {
    id: 'p5_1a',
    scene: 5,
    sceneTitle: 'Cena 5 • Participação do Aluno',
    planCode: 'Plano 5.1a (Pergunta 1)',
    stepFocus: 'q1_pause',
    liaPos: 'right',
    sub1: 'Pergunta 1: A oficina precisa instalar e manter seu próprio SO.',
    sub2: 'Qual modelo combina mais? A) IaaS  B) PaaS  C) SaaS  [Pausa 5s]',
    text: 'Chegou a hora de você participar com exercícios autorais de fixação! Primeira pergunta: A oficina precisa instalar e manter seu próprio sistema operacional. Qual dos três modelos combina mais diretamente com essa necessidade? A, IaaS; B, PaaS; ou C, SaaS? Pense por cinco segundos.',
    pauseAfter: 5.0
  },
  {
    id: 'p5_1b',
    scene: 5,
    sceneTitle: 'Cena 5 • Participação do Aluno',
    planCode: 'Plano 5.1b (Gabarito 1)',
    stepFocus: 'q1_ans',
    liaPos: 'right',
    sub1: 'Gabarito: A) IaaS (Infraestrutura como Serviço)!',
    sub2: 'No IaaS (como em uma VM), a equipe administra o sistema operacional.',
    text: 'Resposta correta: letra A, IaaS! Porque na Infraestrutura como Serviço, como em uma Máquina Virtual do Azure, é a equipe da oficina que instala, atualiza e administra o sistema operacional.',
    pauseAfter: 1.4
  },
  {
    id: 'p5_2a',
    scene: 5,
    sceneTitle: 'Cena 5 • Participação do Aluno',
    planCode: 'Plano 5.2a (Pergunta 2)',
    stepFocus: 'q2_pause',
    liaPos: 'right',
    sub1: 'Pergunta 2: Colocar a aplicação na nuvem elimina a necessidade',
    sub2: 'de cuidar dos acessos dos funcionários? [Pausa 5s]',
    text: 'Segunda pergunta: Colocar a aplicação na nuvem elimina a necessidade de cuidar dos acessos dos funcionários? Vou fazer uma pausa para você responder.',
    pauseAfter: 5.0
  },
  {
    id: 'p5_2b',
    scene: 5,
    sceneTitle: 'Cena 5 • Participação do Aluno',
    planCode: 'Plano 5.2b (Gabarito 2)',
    stepFocus: 'q2_ans',
    liaPos: 'right',
    sub1: 'Gabarito: NÃO! A equipe continua responsável pelos acessos',
    sub2: 'que administra. Serviço gerenciado ≠ responsabilidade eliminada.',
    text: 'A resposta é não! Mesmo na nuvem, a equipe continua responsável pelas contas e pelos acessos que administra. Diferencie sempre serviço gerenciado de responsabilidade eliminada!',
    pauseAfter: 1.4
  },
  {
    id: 'p5_3a',
    scene: 5,
    sceneTitle: 'Cena 5 • Atividade de Desenho',
    planCode: 'Plano 5.3a (Proposta)',
    stepFocus: 'act_ask',
    liaPos: 'left',
    sub1: 'Atividade: Desenhe ou anote três blocos para a Oficina Horizonte:',
    sub2: '1) A aplicação   2) Os dados   3) As pessoas que terão acesso',
    text: 'Agora uma atividade rápida: desenhe ou anote três blocos representando a aplicação, os dados e as pessoas que terão acesso no nosso cenário.',
    pauseAfter: 4.0
  },
  {
    id: 'p5_3b',
    scene: 5,
    sceneTitle: 'Cena 5 • Atividade de Desenho',
    planCode: 'Plano 5.3b (Exemplo)',
    stepFocus: 'act_ans',
    liaPos: 'left',
    sub1: 'Exemplo preenchido: Aplicação = “sistema de ordens” |',
    sub2: 'Dados = “registros da oficina” | Acesso = “equipe de atendimento”.',
    text: 'Veja na tela um exemplo preenchido: na aplicação, colocamos o sistema de ordens; nos dados, os registros da oficina; e nas pessoas que terão acesso, a equipe de atendimento, como a Ana, além da administração técnica do Bruno.',
    pauseAfter: 1.5
  },

  // ================= CENA 6: 11:00 - 12:00 =================
  {
    id: 'p6_1',
    scene: 6,
    sceneTitle: 'Cena 6 • Recapitulação no Desenho',
    planCode: 'Plano 6.1 (Recap)',
    stepFocus: 'recap',
    liaPos: 'left',
    sub1: 'No desenho da oficina: Onde roda (Azure IaaS/PaaS), Quem acessa',
    sub2: '(Microsoft Entra ID) e Quanto custa (Governança • 0 recursos criados).',
    text: 'Olhando para o nosso desenho da Oficina Horizonte, respondemos visualmente às três perguntas da abertura: Onde roda? Na infraestrutura do Azure, associando uma máquina virtual ao IaaS. Quem acessa? As identidades controladas pela nossa equipe no Microsoft Entra ID. E quanto custa? Aquilo que planejamos e monitoramos, lembrando que hoje nenhum recurso foi criado.',
    pauseAfter: 1.2
  },
  {
    id: 'p6_2',
    scene: 6,
    sceneTitle: 'Cena 6 • Próximo Passo e Fontes Oficiais',
    planCode: 'Plano 6.2 (Fechamento)',
    stepFocus: 'closing',
    liaPos: 'hero',
    sub1: '“Na próxima aula, vamos entrar no portal e entender onde você está',
    sub2: 'trabalhando antes de clicar em Criar. Organização começa antes do primeiro recurso!”',
    text: 'Na próxima aula, vamos entrar no portal e entender onde você está trabalhando antes de clicar em Criar. Organização começa antes do primeiro recurso! Confira na tela as fontes oficiais da Microsoft e a data de revisão em 29 de setembro de 2026. Até a próxima aula!',
    pauseAfter: 4.5,
    isVignetteEnd: true
  }
];

function formatSRTTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(Math.min(999, ms)).padStart(3, '0')}`;
}

/**
 * Cria um cabeçalho WAV de 44 bytes para PCM 16-bit mono 24000 Hz
 */
function createWavBuffer(pcmBuffer, sampleRate = 24000) {
  const header = Buffer.alloc(44);
  const dataSize = pcmBuffer.length;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20);  // PCM = 1
  header.writeUInt16LE(1, 22);  // Mono = 1
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  header.writeUInt16LE(2, 32);  // BlockAlign
  header.writeUInt16LE(16, 34); // BitsPerSample
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Gera uma vinheta discreta suave (acorde harmônico curto em PCM 24kHz) para abertura/fechamento
 * (Sem música durante demonstrações!)
 */
function generateDiscreteVignettePCM(durationSec, sampleRate = 24000) {
  const totalSamples = Math.round(durationSec * sampleRate);
  const buf = Buffer.alloc(totalSamples * 2);
  const freqs = [261.63, 329.63, 392.00, 523.25]; // Acorde Dó Maior suave
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, t / 0.25) * Math.exp(-t * 1.35);
    let sample = 0;
    for (const f of freqs) {
      sample += Math.sin(2 * Math.PI * f * t);
    }
    sample = (sample / freqs.length) * env * 0.22;
    const val = Math.max(-32767, Math.min(32767, Math.round(sample * 32767)));
    buf.writeInt16LE(val, i * 2);
  }
  return buf;
}

/**
 * Mapeador Fonético Grafo-Fono-Visêmico para Português Brasileiro (PT-BR):
 * Converte o texto de cada plano em visemas ('MBP', 'FV', 'OU', 'EI', 'A', 'REST')
 */
function textToPhoneticVisemeTimeline(text) {
  const clean = text.toLowerCase().replace(/[^a-záàâãéêíóôõúç\s,;:.!?-]/g, '');
  const tokens = [];
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (/[pbm]/.test(ch)) tokens.push({ viseme: 'MBP', weight: 1.15 });
    else if (/[fv]/.test(ch)) tokens.push({ viseme: 'FV', weight: 1.15 });
    else if (/[oóôõuú]/.test(ch)) tokens.push({ viseme: 'OU', weight: 1.45 });
    else if (/[aáàâã]/.test(ch)) tokens.push({ viseme: 'A', weight: 1.55 });
    else if (/[eéêií]/.test(ch)) tokens.push({ viseme: 'EI', weight: 1.35 });
    else if (/[szcçtdnlrjq]/.test(ch)) tokens.push({ viseme: 'EI', weight: 0.75 });
    else if (/[,;:.!?]/.test(ch)) tokens.push({ viseme: 'REST', weight: 1.8 });
    else if (/\s/.test(ch)) tokens.push({ viseme: 'REST', weight: 0.35 });
  }
  const totalWeight = tokens.reduce((acc, t) => acc + t.weight, 0) || 1;
  let cursor = 0;
  return tokens.map(t => {
    const startRatio = cursor / totalWeight;
    cursor += t.weight;
    return { viseme: t.viseme, startRatio, endRatio: cursor / totalWeight };
  });
}

/**
 * Define o estilo de atuação/enquadramento por plano (Alternância intencional entre Close-Up e Plano Médio)
 */
const PLAN_ACTING_STYLE = {
  p1_1:  { mode: 'CLOSE', pointWindow: null },
  p1_2:  { mode: 'MED_PALM', pointWindow: [0.45, 0.62] },
  p1_3a: { mode: 'MED_ENUM1', pointWindow: null },
  p1_3b: { mode: 'MED_ENUM2', pointWindow: null },
  p1_3c: { mode: 'CLOSE', pointWindow: null },

  p2_1:  { mode: 'MED_PALM', pointWindow: [0.18, 0.32] },
  p2_2:  { mode: 'CLOSE', pointWindow: null },
  p2_3:  { mode: 'MED_PALM', pointWindow: null },
  p2_4:  { mode: 'CLOSE', pointWindow: null },

  p3_1:  { mode: 'MED_PALM', pointWindow: [0.55, 0.72] },
  p3_2:  { mode: 'MED_ENUM1', pointWindow: null },
  p3_3:  { mode: 'MED_ENUM2', pointWindow: null },
  p3_4:  { mode: 'CLOSE', pointWindow: null },
  p3_5:  { mode: 'MED_PALM', pointWindow: null },

  p4_1:  { mode: 'MED_PALM', pointWindow: [0.22, 0.38] },
  p4_2:  { mode: 'MED_ENUM1', pointWindow: null },
  p4_3:  { mode: 'MED_ENUM2', pointWindow: null },
  p4_4:  { mode: 'CLOSE', pointWindow: null },
  p4_5:  { mode: 'CLOSE', pointWindow: null },

  p5_1a: { mode: 'MED_ENUM1', pointWindow: null },
  p5_1b: { mode: 'CLOSE', pointWindow: null },
  p5_2a: { mode: 'MED_ENUM2', pointWindow: null },
  p5_2b: { mode: 'CLOSE', pointWindow: null },
  p5_3a: { mode: 'MED_PALM', pointWindow: null },
  p5_3b: { mode: 'CLOSE', pointWindow: null },

  p6_1:  { mode: 'MED_PALM', pointWindow: null },
  p6_2:  { mode: 'CLOSE', pointWindow: null }
};

function getStatesForPlan(planId, liaPos) {
  const act = PLAN_ACTING_STYLE[planId] || { mode: 'CLOSE' };
  const set = new Set();
  if (act.mode === 'CLOSE') {
    [
      'close_rest', 'close_smile', 'close_blink',
      'close_mbp', 'close_fv', 'close_ou_50', 'close_ou',
      'close_ei_25', 'close_ei_50', 'close_ei', 'close_a_75', 'close_a'
    ].forEach(s => set.add(s));
  } else {
    // Medium Shot: NEVER jump to Close-Up during pauses! Always use med_rest_* and med_prep_*
    ['med_rest_closed', 'med_rest_smile', 'med_rest_blink'].forEach(s => set.add(s));
    if (act.mode === 'MED_PALM') {
      set.add('med_prep_palm');
      ['med_palm_closed', 'med_palm_mbp', 'med_palm_fv', 'med_palm_ou', 'med_palm_ei', 'med_palm_a', 'med_palm_blink'].forEach(s => set.add(s));
    } else if (act.mode === 'MED_ENUM1') {
      set.add('med_prep_enum1');
      ['med_enum1_closed', 'med_enum1_mbp', 'med_enum1_fv', 'med_enum1_ou', 'med_enum1_ei', 'med_enum1_a', 'med_enum1_blink'].forEach(s => set.add(s));
    } else if (act.mode === 'MED_ENUM2') {
      set.add('med_prep_enum2');
      ['med_enum2_closed', 'med_enum2_mbp', 'med_enum2_fv', 'med_enum2_ou', 'med_enum2_ei', 'med_enum2_a', 'med_enum2_blink'].forEach(s => set.add(s));
    }
    if (act.pointWindow && liaPos === 'right') {
      ['med_point_closed', 'med_point_mbp', 'med_point_fv', 'med_point_ou', 'med_point_ei', 'med_point_a', 'med_point_blink'].forEach(s => set.add(s));
    }
  }
  return Array.from(set);
}

function mapVisemeToStateKeyV3(viseme, act, ratio, liaPos, isBlink, inPrepOrRecov = false, isPause = false, isSmilePause = false) {
  if (act.mode === 'CLOSE') {
    if (isBlink) return 'close_blink';
    if (isPause) return isSmilePause ? 'close_smile' : 'close_rest';
    switch (viseme) {
      case 'MBP':   return 'close_mbp';
      case 'FV':    return 'close_fv';
      case 'OU_50': return 'close_ou_50';
      case 'OU':    return 'close_ou';
      case 'EI_25': return 'close_ei_25';
      case 'EI_50': return 'close_ei_50';
      case 'EI':    return 'close_ei';
      case 'A_75':  return 'close_a_75';
      case 'A':     return 'close_a';
      case 'SMILE': return 'close_smile';
      default:      return 'close_rest';
    }
  }

  // MEDIUM SHOT:
  if (isPause) {
    if (isBlink) return 'med_rest_blink';
    return isSmilePause ? 'med_rest_smile' : 'med_rest_closed';
  }
  if (inPrepOrRecov) {
    if (act.mode === 'MED_ENUM1') return 'med_prep_enum1';
    if (act.mode === 'MED_ENUM2') return 'med_prep_enum2';
    return 'med_prep_palm';
  }

  let prefix = act.mode.toLowerCase(); // med_palm, med_enum1, med_enum2
  if (act.pointWindow && liaPos === 'right' && ratio >= act.pointWindow[0] && ratio <= act.pointWindow[1]) {
    prefix = 'med_point';
  }

  if (isBlink) return `${prefix}_blink`;

  switch (viseme) {
    case 'MBP':
      return `${prefix}_mbp`;
    case 'FV':
      return `${prefix}_fv`;
    case 'OU_50':
    case 'OU':
      return `${prefix}_ou`;
    case 'EI_25':
    case 'EI_50':
    case 'EI':
      return `${prefix}_ei`;
    case 'A_75':
    case 'A':
      return `${prefix}_a`;
    default:
      return `${prefix}_closed`;
  }
}

async function buildAll() {
  console.log('Iniciando produção audiovisual 1920x1080 30fps da Aula 01 com Rig 3D v3 e Alinhamento Acústico Forçado...');
  const sceneClips = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const srtEntries = [];
  const fullLessonTimeline = [];
  let globalTimelineSec = 0;
  let srtIndex = 1;

  const v3AlignDir = path.join(TEMP_DIR, 'v3_align');
  const v3FramesDir = path.join(TEMP_DIR, 'v3_plan_frames');
  if (!fs.existsSync(v3AlignDir)) fs.mkdirSync(v3AlignDir, { recursive: true });
  if (!fs.existsSync(v3FramesDir)) fs.mkdirSync(v3FramesDir, { recursive: true });

  for (let i = 0; i < PLANS.length; i++) {
    const plan = PLANS[i];
    const act = PLAN_ACTING_STYLE[plan.id] || { mode: 'CLOSE' };
    const neededStates = getStatesForPlan(plan.id, plan.liaPos);
    console.log(`[${i + 1}/${PLANS.length}] Produzindo ${plan.id} (${plan.planCode} | modo=${act.mode})...`);

    // 1. Renderizar os quadros 1920x1080 necessários para os estados de visema/gesto deste plano (com cache em v3_plan_frames)
    const framePaths = {};
    for (const stKey of neededStates) {
      const fPath = path.join(v3FramesDir, `${plan.id}_${stKey}.png`).replace(/\\/g, '/');
      if (!fs.existsSync(fPath)) {
        await renderFramePNG(fPath, {
          sceneId: plan.scene,
          sceneTitle: plan.sceneTitle,
          planCode: plan.planCode,
          stepFocus: plan.stepFocus,
          liaPos: plan.liaPos,
          mouthState: stKey,
          sub1: plan.sub1,
          sub2: plan.sub2
        });
      }
      framePaths[stKey] = fPath;
    }

    // 2. Sintetizar voz PT-BR com WordBoundary + Alinhamento Acústico Forçado em 5ms PCM
    const mp3Path = path.join(v3AlignDir, `${plan.id}.mp3`);
    const pcmPath = path.join(v3AlignDir, `${plan.id}.pcm`);
    const alignJsonPath = path.join(v3AlignDir, `${plan.id}_align.json`);

    let alignment;
    if (fs.existsSync(alignJsonPath) && fs.existsSync(pcmPath)) {
      alignment = JSON.parse(fs.readFileSync(alignJsonPath, 'utf8'));
    } else {
      const rateStr = plan.slowSpeech ? '-10%' : '+0%';
      const res = await synthesizeAndAlignPTBR(plan.text, mp3Path, { rate: rateStr });
      execFileSync(ffmpegPath, [
        '-y', '-i', mp3Path,
        '-f', 's16le', '-acodec', 'pcm_s16le', '-ar', '24000', '-ac', '1',
        pcmPath
      ], { stdio: 'ignore' });
      alignment = {
        planId: plan.id,
        text: res.text,
        durationSec: res.durationSec,
        words: res.words,
        visemeEvents: res.visemeEvents
      };
      fs.writeFileSync(alignJsonPath, JSON.stringify(alignment, null, 2), 'utf8');
    }

    const speechPcm = fs.readFileSync(pcmPath);
    const sampleRate = 24000;
    const chunks = [];

    let preSilenceSec = 0;
    if (plan.isVignetteStart) {
      preSilenceSec = 3.2;
      chunks.push(generateDiscreteVignettePCM(preSilenceSec, sampleRate));
    }

    chunks.push(speechPcm);

    const pauseSec = plan.pauseAfter || 1.0;
    if (plan.isVignetteEnd) {
      chunks.push(generateDiscreteVignettePCM(pauseSec, sampleRate));
    } else {
      chunks.push(Buffer.alloc(Math.round(pauseSec * sampleRate) * 2));
    }

    const fullPcm = Buffer.concat(chunks);
    const totalDurationSec = fullPcm.length / (sampleRate * 2);
    const wavPath = path.join(TEMP_DIR, `${plan.id}_v3.wav`);
    fs.writeFileSync(wavPath, createWavBuffer(fullPcm, sampleRate));

    // Record into full lesson timeline
    fullLessonTimeline.push({
      planId: plan.id,
      scene: plan.scene,
      globalStartSec: Number(globalTimelineSec.toFixed(3)),
      preSilenceSec,
      speechDurationSec: Number((speechPcm.length / (sampleRate * 2)).toFixed(3)),
      totalDurationSec: Number(totalDurationSec.toFixed(3)),
      mode: act.mode,
      words: alignment.words,
      visemeEvents: alignment.visemeEvents
    });

    // 3. Avaliar timeline a exatos 30 fps (stepSec = 1/30s) e coalescer quadros consecutivos idênticos para o concat do ffmpeg
    const stepSec = 1 / 30;
    const totalFrames = Math.max(1, Math.round(totalDurationSec * 30));
    const speechDurationSec = speechPcm.length / (sampleRate * 2);
    const speechFirstWordSec = alignment.words.length > 0 ? alignment.words[0].startSec : 0.05;
    const speechLastWordSec = alignment.words.length > 0 ? alignment.words[alignment.words.length - 1].endSec : speechDurationSec - 0.05;
    const activeStartSec = preSilenceSec + speechFirstWordSec;
    const activeEndSec = preSilenceSec + speechLastWordSec;

    // Intervalos não-cíclicos de piscada natural (duração de ~4 frames = 0.133s)
    const blinkFrames = new Set();
    let nextBlinkSec = 1.45 + (i % 3) * 0.42;
    while (nextBlinkSec < totalDurationSec - 0.25) {
      const bf = Math.round(nextBlinkSec * 30);
      blinkFrames.add(bf);
      blinkFrames.add(bf + 1);
      blinkFrames.add(bf + 2);
      blinkFrames.add(bf + 3);
      nextBlinkSec += 3.25 + ((bf * 7) % 5) * 0.35;
    }

    const isSmilePlan = (plan.id === 'p1_1' || plan.id === 'p1_3c' || plan.id === 'p6_2');
    const defaultRestKey = act.mode === 'CLOSE' ? 'close_rest' : 'med_rest_closed';

    const frameSeq = [];
    for (let f = 0; f < totalFrames; f++) {
      const tSec = f * stepSec;
      const isBlink = blinkFrames.has(f);
      let stKey = defaultRestKey;

      if (tSec >= activeStartSec && tSec <= activeEndSec) {
        const tSpeech = tSec - preSilenceSec;
        const ratio = tSpeech / Math.max(0.1, speechDurationSec);
        const vSample = sampleVisemeAtTime(alignment, tSpeech);
        const isInternalLongPause = (vSample.viseme === 'REST' && vSample.event && (vSample.event.endSec - vSample.event.startSec) > 0.42);
        const inInternalPrep = (vSample.viseme === 'REST' && vSample.event && (vSample.event.endSec - vSample.event.startSec) > 0.42 &&
          (tSpeech - vSample.event.startSec < 0.12 || vSample.event.endSec - tSpeech < 0.12));

        stKey = mapVisemeToStateKeyV3(
          vSample.viseme,
          act,
          ratio,
          plan.liaPos,
          isBlink,
          inInternalPrep,
          isInternalLongPause && !inInternalPrep,
          false
        );
      } else {
        // Preparação antes da fala (140ms) ou recuperação logo após a fala (140ms) nos planos em Plano Médio
        const inPrep = (act.mode !== 'CLOSE') && (
          (tSec >= activeStartSec - 0.14 && tSec < activeStartSec) ||
          (tSec > activeEndSec && tSec <= activeEndSec + 0.14)
        );
        stKey = mapVisemeToStateKeyV3('REST', act, 0, plan.liaPos, isBlink, inPrep, !inPrep, isSmilePlan);
      }

      const chosenPath = framePaths[stKey] || framePaths[defaultRestKey];
      if (frameSeq.length > 0 && frameSeq[frameSeq.length - 1].path === chosenPath) {
        frameSeq[frameSeq.length - 1].count++;
      } else {
        frameSeq.push({ path: chosenPath, count: 1 });
      }
    }

    const concatLines = [];
    for (const seg of frameSeq) {
      concatLines.push(`file '${seg.path}'`);
      concatLines.push(`duration ${(seg.count / 30).toFixed(5)}`);
    }
    concatLines.push(`file '${framePaths[defaultRestKey]}'`);

    const concatTxtPath = path.join(TEMP_DIR, `${plan.id}_v3_frames.txt`);
    fs.writeFileSync(concatTxtPath, concatLines.join('\n'));

    // 4. Codificar o vídeo MP4 (1920x1080, 30 fps, H.264 + AAC) deste plano
    const planMp4Path = path.join(TEMP_DIR, `${plan.id}_v3.mp4`).replace(/\\/g, '/');
    execFileSync(ffmpegPath, [
      '-y',
      '-f', 'concat', '-safe', '0', '-i', concatTxtPath,
      '-i', wavPath,
      '-vf', 'fps=30,scale=1920:1080,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '19',
      '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
      '-shortest',
      planMp4Path
    ], { stdio: 'ignore' });

    sceneClips[plan.scene].push(planMp4Path);

    // 5. Registrar entrada sincronizada no arquivo SRT (máximo 2 linhas)
    const subStart = globalTimelineSec + preSilenceSec;
    const subEnd = globalTimelineSec + totalDurationSec - 0.2;
    srtEntries.push(
      `${srtIndex++}\n${formatSRTTime(subStart)} --> ${formatSRTTime(subEnd)}\n${plan.sub1}\n${plan.sub2}\n`
    );
    globalTimelineSec += totalDurationSec;
  }

  // Salvar timeline fonética completa da Aula 01 para inspeção e para o player HTML5
  const lessonTimelinePath = path.join(TEMP_DIR, 'viseme_timeline_aula01_v3.json');
  fs.writeFileSync(lessonTimelinePath, JSON.stringify(fullLessonTimeline, null, 2), 'utf8');

  // 6. Concatenar os vídeos de cada uma das 6 cenas separadamente e o vídeo mestre completo
  const sceneNames = {
    1: 'cena-01-abertura.mp4',
    2: 'cena-02-o-que-significa-usar-nuvem.mp4',
    3: 'cena-03-tres-modelos-iaas-paas-saas.mp4',
    4: 'cena-04-portal-azure-e-curso.mp4',
    5: 'cena-05-participacao-do-aluno.mp4',
    6: 'cena-06-recapitulacao-e-proximo-passo.mp4'
  };

  const allSceneMp4s = [];
  for (let s = 1; s <= 6; s++) {
    const listFile = path.join(TEMP_DIR, `scene_${s}_v3_list.txt`);
    fs.writeFileSync(listFile, sceneClips[s].map(p => `file '${p}'`).join('\n'));
    const outSceneMp4 = path.join(OUT_DIR, sceneNames[s]).replace(/\\/g, '/');
    execFileSync(ffmpegPath, [
      '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
      '-c', 'copy', outSceneMp4
    ], { stdio: 'ignore' });
    allSceneMp4s.push(outSceneMp4);
    console.log(`Cena ${s} renderizada: ${outSceneMp4}`);
  }

  const masterListFile = path.join(TEMP_DIR, 'master_v3_list.txt');
  fs.writeFileSync(masterListFile, allSceneMp4s.map(p => `file '${p}'`).join('\n'));
  const masterMp4 = path.join(OUT_DIR, 'aula-01-azure-do-zero-completa.mp4').replace(/\\/g, '/');
  execFileSync(ffmpegPath, [
    '-y', '-f', 'concat', '-safe', '0', '-i', masterListFile,
    '-c', 'copy', masterMp4
  ], { stdio: 'ignore' });

  // Também extrair a faixa de áudio mestre MP3 da aula completa para uso determinístico no player HTML5 (<audio>)
  const masterAudioMp3 = path.join(OUT_DIR, 'aula-01-azure-do-zero-audio.mp3').replace(/\\/g, '/');
  execFileSync(ffmpegPath, [
    '-y', '-i', masterMp4,
    '-vn', '-c:a', 'libmp3lame', '-b:a', '128k',
    masterAudioMp3
  ], { stdio: 'ignore' });

  // Salvar SRT sincronizado com o vídeo renderizado
  const srtOutPath = path.join(OUT_DIR, 'aula-01-azure-do-zero-completa.srt');
  fs.writeFileSync(srtOutPath, srtEntries.join('\n'), 'utf8');

  console.log(`\nSUCESSO! Vídeo completo v3 renderizado em: ${masterMp4}`);
  console.log(`Áudio mestre para HTML5 exportado em: ${masterAudioMp3}`);
  console.log(`Timeline fonética completa salva em: ${lessonTimelinePath}`);
  console.log(`Duração total medida: ${(globalTimelineSec / 60).toFixed(2)} minutos (${globalTimelineSec.toFixed(1)}s)`);
}

if (require.main === module) {
  buildAll().catch(err => {
    console.error('Erro na construção dos vídeos:', err);
    process.exit(1);
  });
}

module.exports = { PLANS, buildAll };

