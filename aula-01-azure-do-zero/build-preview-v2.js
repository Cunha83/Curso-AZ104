const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { spawn, execFileSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const RIG_DIR = path.join(__dirname, 'assets', 'rig_v2');
const TEMP_DIR = path.join(__dirname, 'temp_build', 'preview_v2');
const VIDEOS_DIR = path.join(__dirname, 'videos');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

const FPS = 30;
const SAMPLE_RATE = 24000;

/**
 * Roteiro obrigatório da Prévia de Validação (Seção 8) dividido em cláusulas de atuação
 * com direção de voz (rate), pausas respiratórias intencionais e atuação corporal/camera.
 */
const PREVIEW_CLAUSES = [
  {
    id: 'c1_ola',
    text: 'Olá! Eu sou a Lia,',
    sub1: 'Olá! Eu sou a Lia, e hoje vamos organizar',
    sub2: 'nosso primeiro ambiente no Azure.',
    rate: '-2%',
    pauseBeforeSec: 0.65,
    pauseAfterSec: 0.35,
    shot: 'CLOSE',
    gesture: 'WELCOME',
    stageStep: 0,
    actingNote: 'Tom acolhedor e simpático na abertura (Enquadramento Próximo)'
  },
  {
    id: 'c2_hoje',
    text: 'e hoje vamos organizar nosso primeiro ambiente no Azure.',
    sub1: 'Olá! Eu sou a Lia, e hoje vamos organizar',
    sub2: 'nosso primeiro ambiente no Azure.',
    rate: '-4%',
    pauseBeforeSec: 0.0,
    pauseAfterSec: 0.85,
    shot: 'CLOSE',
    gesture: 'WELCOME',
    stageStep: 0,
    actingNote: 'Apresentação confiante do objetivo da aula'
  },
  {
    id: 'c3_conceito',
    text: 'Pense no grupo de recursos como uma forma de reunir os componentes de um projeto.',
    sub1: 'Pense no grupo de recursos como uma forma',
    sub2: 'de reunir os componentes de um projeto.',
    rate: '-6%',
    pauseBeforeSec: 0.15,
    pauseAfterSec: 0.95,
    shot: 'MED_PALM',
    gesture: 'OPEN_PALM',
    stageStep: 1,
    actingNote: 'Plano Médio: mão aberta apresentando a ideia central (Resource Group)'
  },
  {
    id: 'c4_exemplo',
    text: 'Agora, observe este exemplo na tela.',
    sub1: 'Agora, observe este exemplo na tela.',
    sub2: '',
    rate: '-6%',
    pauseBeforeSec: 0.15,
    pauseAfterSec: 0.95,
    shot: 'MED_POINT',
    gesture: 'POINT_SCREEN',
    stageStep: 2,
    actingNote: 'Plano Médio: desvio de olhar e gesto leve indicando o exemplo na tela à esquerda'
  },
  {
    id: 'c5_primeiro',
    text: 'Primeiro, conferimos a assinatura.',
    sub1: 'Primeiro, conferimos a assinatura.',
    sub2: 'Depois, escolhemos o nome do grupo.',
    rate: '-7%',
    pauseBeforeSec: 0.15,
    pauseAfterSec: 0.80,
    shot: 'MED_ENUM1',
    gesture: 'ENUM_ONE',
    stageStep: 3,
    actingNote: 'Plano Médio: enumeração discreta (1 dedo) ao falar "Primeiro"'
  },
  {
    id: 'c6_depois',
    text: 'Depois, escolhemos o nome do grupo.',
    sub1: 'Primeiro, conferimos a assinatura.',
    sub2: 'Depois, escolhemos o nome do grupo.',
    rate: '-7%',
    pauseBeforeSec: 0.10,
    pauseAfterSec: 0.95,
    shot: 'MED_ENUM2',
    gesture: 'ENUM_TWO',
    stageStep: 4,
    actingNote: 'Plano Médio: enumeração discreta (2 dedos) ao falar "Depois"'
  },
  {
    id: 'c7_atencao_1',
    text: 'E atenção:',
    sub1: 'E atenção: um orçamento gera alertas,',
    sub2: 'mas não desliga os recursos automaticamente.',
    rate: '-12%',
    pauseBeforeSec: 0.15,
    pauseAfterSec: 0.45,
    shot: 'CLOSE',
    gesture: 'CAREFUL_ALERT',
    stageStep: 5,
    actingNote: 'Enquadramento Próximo: tom cuidadoso e pausado ao iniciar alerta de custo'
  },
  {
    id: 'c8_atencao_2',
    text: 'um orçamento gera alertas, mas não desliga os recursos automaticamente.',
    sub1: 'E atenção: um orçamento gera alertas,',
    sub2: 'mas não desliga os recursos automaticamente.',
    rate: '-10%',
    pauseBeforeSec: 0.0,
    pauseAfterSec: 0.95,
    shot: 'CLOSE',
    gesture: 'CAREFUL_ALERT',
    stageStep: 5,
    actingNote: 'Enquadramento Próximo: articulação fonética precisa (MBP, FV, OU, EI, A) no alerta técnico'
  },
  {
    id: 'c9_convite',
    text: 'Vamos conferir isso juntas e juntos, passo a passo?',
    sub1: 'Vamos conferir isso juntas e juntos,',
    sub2: 'passo a passo?',
    rate: '-4%',
    pauseBeforeSec: 0.15,
    pauseAfterSec: 1.10,
    shot: 'CLOSE',
    gesture: 'INVITE_CLOSE',
    stageStep: 6,
    actingNote: 'Enquadramento Próximo: satisfação discreta e convite acolhedor finalizando em repouso'
  }
];

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Sintetiza áudio PCM 24kHz 16-bit mono via Microsoft Edge Neural TTS (pt-BR-FranciscaNeural)
 * com controle fino de velocidade (rate) por cláusula.
 */
async function synthesizeClausePCM(clause) {
  const cachePath = path.join(TEMP_DIR, `${clause.id}.pcm`);
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 1000) {
    return fs.readFileSync(cachePath);
  }
  const mp3Dir = path.join(TEMP_DIR, clause.id);
  if (!fs.existsSync(mp3Dir)) fs.mkdirSync(mp3Dir, { recursive: true });

  const tts = new MsEdgeTTS();
  await tts.setMetadata('pt-BR-FranciscaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioFilePath } = await tts.toFile(mp3Dir, clause.text, { rate: clause.rate });

  execFileSync(ffmpegPath, [
    '-y', '-i', audioFilePath,
    '-f', 's16le', '-acodec', 'pcm_s16le', '-ar', String(SAMPLE_RATE), '-ac', '1',
    cachePath
  ], { stdio: 'ignore' });

  return fs.readFileSync(cachePath);
}

/**
 * Mapeador Fonético Grafo-Fono-Visêmico para Português Brasileiro (PT-BR):
 * Converte um texto em uma sequência temporal de visemas ('MBP', 'FV', 'OU', 'EI', 'A', 'REST')
 * proporcional à duração real da fala.
 */
function textToPhoneticVisemeTimeline(text) {
  const clean = text.toLowerCase().replace(/[^a-záàâãéêíóôõúç\s,;:.!?-]/g, '');
  const tokens = [];

  let i = 0;
  while (i < clean.length) {
    const ch = clean[i];
    const next = clean[i + 1] || '';

    if (/[pbm]/.test(ch)) {
      tokens.push({ viseme: 'MBP', weight: 1.15 });
      i++;
    } else if (/[fv]/.test(ch)) {
      tokens.push({ viseme: 'FV', weight: 1.15 });
      i++;
    } else if (/[oóôõuú]/.test(ch)) {
      tokens.push({ viseme: 'OU', weight: 1.45 });
      i++;
    } else if (/[aáàâã]/.test(ch)) {
      tokens.push({ viseme: 'A', weight: 1.55 });
      i++;
    } else if (/[eéêií]/.test(ch)) {
      tokens.push({ viseme: 'EI', weight: 1.35 });
      i++;
    } else if (/[szcçtdnlrjq]/.test(ch)) {
      tokens.push({ viseme: 'EI', weight: 0.75 });
      i++;
    } else if (/[,;:.!?]/.test(ch)) {
      tokens.push({ viseme: 'REST', weight: 1.8 });
      i++;
    } else if (/\s/.test(ch)) {
      tokens.push({ viseme: 'REST', weight: 0.35 });
      i++;
    } else {
      i++;
    }
  }

  const totalWeight = tokens.reduce((acc, t) => acc + t.weight, 0) || 1;
  let cursor = 0;
  return tokens.map(t => {
    const startRatio = cursor / totalWeight;
    cursor += t.weight;
    const endRatio = cursor / totalWeight;
    return { viseme: t.viseme, startRatio, endRatio };
  });
}

/**
 * Calcula RMS normalizado por frame de 30fps sobre um buffer PCM 24kHz 16-bit mono
 */
function computeFrameRMS(pcmBuf, totalFrames) {
  const samplesPerFrame = Math.floor(SAMPLE_RATE / FPS); // 800 samples/frame
  const rmsArr = new Float32Array(totalFrames);
  let maxRms = 1;

  for (let f = 0; f < totalFrames; f++) {
    const byteStart = f * samplesPerFrame * 2;
    const byteEnd = Math.min(pcmBuf.length, (f + 1) * samplesPerFrame * 2);
    if (byteStart >= pcmBuf.length) break;
    let sumSq = 0, count = 0;
    for (let b = byteStart; b + 1 < byteEnd; b += 2) {
      const sample = pcmBuf.readInt16LE(b);
      sumSq += sample * sample;
      count++;
    }
    const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
    rmsArr[f] = rms;
    if (rms > maxRms) maxRms = rms;
  }

  const norm = new Float32Array(totalFrames);
  for (let f = 0; f < totalFrames; f++) {
    norm[f] = Math.min(1.0, rmsArr[f] / (maxRms * 0.72));
  }
  return norm;
}

/**
 * Constrói o SVG do palco educacional à esquerda (x: 48..1110, y: 82..895) e barra de legendas (y: 925..1038)
 * sincronizado com a etapa da Prévia de Validação.
 */
function buildPreviewStageSVG(stepIndex, sub1, sub2, currentVisemeLabel, currentGestureLabel) {
  const showConcept = stepIndex >= 1;
  const highlightExample = stepIndex >= 2;
  const highlightSub = stepIndex === 3;
  const highlightRg = stepIndex === 4;
  const showBudgetAlert = stepIndex >= 5;
  const showInvite = stepIndex >= 6;

  return `<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#071120"/>
      <stop offset="55%" stop-color="#0A192F"/>
      <stop offset="100%" stop-color="#071324"/>
    </linearGradient>
    <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#10233F"/>
      <stop offset="100%" stop-color="#0B192E"/>
    </linearGradient>
    <linearGradient id="warnBg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3B1D11"/>
      <stop offset="100%" stop-color="#26130C"/>
    </linearGradient>
  </defs>

  <!-- Fundo Geral 16:9 -->
  <rect width="1920" height="1080" fill="url(#bgGrad)"/>

  <!-- Barra Superior do Curso -->
  <rect x="48" y="24" width="1824" height="48" rx="10" fill="#0E223D" stroke="#1E3A5F" stroke-width="1.5"/>
  <circle cx="76" cy="48" r="8" fill="#38BDF8"/>
  <text x="96" y="54" fill="#F8FAFC" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700">AZURE DO ZERO AO AZ-104</text>
  <text x="365" y="54" fill="#94A3B8" font-family="Segoe UI, Arial, sans-serif" font-size="16">|   Prévia de Validação de Atuação 3D — Apresentadora Lia</text>
  <rect x="1510" y="33" width="345" height="30" rx="6" fill="#132F52"/>
  <text x="1682" y="53" text-anchor="middle" fill="#38BDF8" font-family="Consolas, monospace" font-size="13" font-weight="700">VISEMA: ${escapeXml(currentVisemeLabel)} | ${escapeXml(currentGestureLabel)}</text>

  <!-- Área Visual Didática à Esquerda (x=48..1120, y=88..898) -->
  <rect x="48" y="88" width="1072" height="810" rx="18" fill="#0B182B" stroke="${highlightExample ? '#38BDF8' : '#1E3A5F'}" stroke-width="${highlightExample ? '3' : '1.5'}"/>

  <!-- Cabeçalho do Painel Azure Portal -->
  <rect x="48" y="88" width="1072" height="58" rx="18" fill="#102644"/>
  <text x="82" y="124" fill="#38BDF8" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="700">Microsoft Azure Portal — Organização do Primeiro Ambiente</text>
  <rect x="890" y="102" width="205" height="30" rx="15" fill="#0A192F" stroke="#38BDF8" stroke-width="1"/>
  <text x="992" y="122" text-anchor="middle" fill="#E2E8F0" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="600">Demonstração Guiada</text>

  <!-- Card 1: Conceito de Grupo de Recursos (Resource Group) -->
  <g opacity="${showConcept ? '1.0' : '0.35'}">
    <rect x="82" y="170" width="1004" height="175" rx="14" fill="url(#cardBg)" stroke="${stepIndex === 1 ? '#38BDF8' : '#23426B'}" stroke-width="${stepIndex === 1 ? '3' : '1.5'}"/>
    <rect x="106" y="194" width="170" height="30" rx="6" fill="#0284C7"/>
    <text x="191" y="214" text-anchor="middle" fill="#FFFFFF" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700">CONCEITO CHAVE</text>
    <text x="292" y="216" fill="#F8FAFC" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700">Grupo de Recursos (Resource Group)</text>
    <text x="106" y="254" fill="#CBD5E1" font-family="Segoe UI, Arial, sans-serif" font-size="18">Recipiente lógico que reúne e organiza os componentes de um mesmo projeto no Azure:</text>

    <!-- Ícones/Pílulas dos componentes reunidos -->
    <rect x="106" y="276" width="280" height="46" rx="8" fill="#091526" stroke="#38BDF8" stroke-width="1.5"/>
    <text x="246" y="305" text-anchor="middle" fill="#38BDF8" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700">1. Máquina Virtual (VM)</text>

    <rect x="410" y="276" width="290" height="46" rx="8" fill="#091526" stroke="#38BDF8" stroke-width="1.5"/>
    <text x="555" y="305" text-anchor="middle" fill="#38BDF8" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700">2. Rede Virtual (VNet)</text>

    <rect x="724" y="276" width="330" height="46" rx="8" fill="#091526" stroke="#38BDF8" stroke-width="1.5"/>
    <text x="889" y="305" text-anchor="middle" fill="#38BDF8" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700">3. Conta de Armazenamento</text>
  </g>

  <!-- Card 2: Exemplo na Tela — Formulário de Criação (Primeiro: Assinatura / Depois: Nome do Grupo) -->
  <g opacity="${highlightExample ? '1.0' : '0.25'}">
    <rect x="82" y="368" width="1004" height="260" rx="14" fill="url(#cardBg)" stroke="${(stepIndex >= 2 && stepIndex <= 4) ? '#38BDF8' : '#23426B'}" stroke-width="${(stepIndex >= 2 && stepIndex <= 4) ? '3' : '1.5'}"/>
    <text x="108" y="406" fill="#38BDF8" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700">Create a resource group — Exemplo Prático na Tela</text>

    <!-- Passo 1: Assinatura -->
    <rect x="108" y="426" width="952" height="82" rx="10" fill="${highlightSub ? '#132F54' : '#091526'}" stroke="${highlightSub ? '#FACC15' : '#1E3A5F'}" stroke-width="${highlightSub ? '3.5' : '1.5'}"/>
    <circle cx="146" cy="467" r="20" fill="${highlightSub ? '#FACC15' : '#0284C7'}"/>
    <text x="146" y="474" text-anchor="middle" fill="${highlightSub ? '#0F172A' : '#FFFFFF'}" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="800">1</text>
    <text x="184" y="458" fill="#94A3B8" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="600">PRIMEIRO PASSO — CONFERIR A ASSINATURA (SUBSCRIPTION)</text>
    <text x="184" y="488" fill="#F8FAFC" font-family="Consolas, monospace" font-size="21" font-weight="700">Subscription: sub-oficina-horizonte-lab</text>
    ${highlightSub ? `<rect x="840" y="446" width="196" height="40" rx="8" fill="#FACC15"/><text x="938" y="472" text-anchor="middle" fill="#0F172A" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="800">1º PASSO ATIVO</text>` : ''}

    <!-- Passo 2: Nome do Grupo -->
    <rect x="108" y="524" width="952" height="82" rx="10" fill="${highlightRg ? '#132F54' : '#091526'}" stroke="${highlightRg ? '#34D399' : '#1E3A5F'}" stroke-width="${highlightRg ? '3.5' : '1.5'}"/>
    <circle cx="146" cy="565" r="20" fill="${highlightRg ? '#34D399' : '#0284C7'}"/>
    <text x="146" y="572" text-anchor="middle" fill="${highlightRg ? '#0F172A' : '#FFFFFF'}" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="800">2</text>
    <text x="184" y="556" fill="#94A3B8" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="600">DEPOIS — ESCOLHER O NOME DO GRUPO DE RECURSOS</text>
    <text x="184" y="586" fill="#34D399" font-family="Consolas, monospace" font-size="21" font-weight="700">Resource group: rg-oficina-horizonte-dev</text>
    ${highlightRg ? `<rect x="840" y="544" width="196" height="40" rx="8" fill="#34D399"/><text x="938" y="570" text-anchor="middle" fill="#0F172A" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="800">2º PASSO ATIVO</text>` : ''}
  </g>

  <!-- Card 3: Alerta Crítico de Governança e Custos (Orçamento / Budget) -->
  <g opacity="${showBudgetAlert ? '1.0' : '0.22'}">
    <rect x="82" y="650" width="1004" height="224" rx="14" fill="url(#warnBg)" stroke="${stepIndex === 5 ? '#F97316' : '#7C2D12'}" stroke-width="${stepIndex === 5 ? '3.5' : '1.5'}"/>
    <rect x="108" y="674" width="230" height="34" rx="6" fill="#F97316"/>
    <text x="223" y="697" text-anchor="middle" fill="#0F172A" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="800">ATENÇÃO — GOVERNANÇA</text>
    <text x="356" y="698" fill="#FDE68A" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700">Comportamento Real do Orçamento (Azure Budget)</text>

    <rect x="108" y="724" width="460" height="124" rx="10" fill="#091526" stroke="#34D399" stroke-width="2"/>
    <text x="132" y="758" fill="#34D399" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700">O QUE O ORÇAMENTO FAZ:</text>
    <text x="132" y="792" fill="#E2E8F0" font-family="Segoe UI, Arial, sans-serif" font-size="17">• Monitora os gastos da assinatura</text>
    <text x="132" y="822" fill="#E2E8F0" font-family="Segoe UI, Arial, sans-serif" font-size="17">• Envia alertas por e-mail (ex: 80% do limite)</text>

    <rect x="598" y="724" width="462" height="124" rx="10" fill="#091526" stroke="#F87171" stroke-width="2"/>
    <text x="622" y="758" fill="#F87171" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700">O QUE ELE NÃO FAZ SOZINHO:</text>
    <text x="622" y="792" fill="#FCA5A5" font-family="Segoe UI, Arial, sans-serif" font-size="17" font-weight="700">• NÃO desliga recursos automaticamente</text>
    <text x="622" y="822" fill="#CBD5E1" font-family="Segoe UI, Arial, sans-serif" font-size="16">• Exige ação do admin ou automação explícita</text>
  </g>

  <!-- Moldura do Palco da Apresentadora Lia à Direita (x=1148..1872, y=88..898) -->
  <rect x="1144" y="84" width="732" height="818" rx="22" fill="#081528" stroke="${showInvite ? '#34D399' : '#38BDF8'}" stroke-width="2.5"/>

  <!-- Barra de Legendas Sincronizadas (máximo 2 linhas, sem cobrir botões ou avatar) -->
  <rect x="48" y="920" width="1824" height="132" rx="16" fill="#050D1A" fill-opacity="0.94" stroke="#1E3A5F" stroke-width="2"/>
  <rect x="74" y="942" width="118" height="28" rx="6" fill="#0284C7"/>
  <text x="133" y="961" text-anchor="middle" fill="#FFFFFF" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="800">LIA (PT-BR)</text>
  <text x="960" y="${sub2 ? '972' : '994'}" text-anchor="middle" fill="#FFFFFF" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="700">${escapeXml(sub1)}</text>
  ${sub2 ? `<text x="960" y="1018" text-anchor="middle" fill="#38BDF8" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="700">${escapeXml(sub2)}</text>` : ''}
</svg>`;
}

async function loadRigImage(filename, targetW = 724, targetH = 724) {
  const fullPath = path.join(RIG_DIR, filename);
  const { data, info } = await sharp(fullPath)
    .resize(targetW, targetH, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function lerpRGB(bufA, bufB, t) {
  if (t <= 0.01) return bufA;
  if (t >= 0.99) return bufB;
  const out = Buffer.allocUnsafe(bufA.length);
  const wA = 1 - t;
  for (let i = 0; i < bufA.length; i++) {
    out[i] = (bufA[i] * wA + bufB[i] * t + 0.5) | 0;
  }
  return out;
}

async function buildValidationPreview() {
  console.log('=== 1. SINTETIZANDO NARRAÇÃO PT-BR COM PROSÓDIA INTENCIONAL ===');
  const pcmParts = [];
  const frameTimeline = [];

  for (const clause of PREVIEW_CLAUSES) {
    const speechPCM = await synthesizeClausePCM(clause);
    const pauseBeforeBytes = Math.floor(clause.pauseBeforeSec * SAMPLE_RATE) * 2;
    const pauseAfterBytes = Math.floor(clause.pauseAfterSec * SAMPLE_RATE) * 2;

    const pauseBeforeBuf = Buffer.alloc(pauseBeforeBytes, 0);
    const pauseAfterBuf = Buffer.alloc(pauseAfterBytes, 0);

    const speechSec = speechPCM.length / 2 / SAMPLE_RATE;
    const totalClausePCM = Buffer.concat([pauseBeforeBuf, speechPCM, pauseAfterBuf]);
    pcmParts.push(totalClausePCM);

    const totalClauseFrames = Math.round((totalClausePCM.length / 2 / SAMPLE_RATE) * FPS);
    const beforeFrames = Math.round(clause.pauseBeforeSec * FPS);
    const speechFrames = Math.round(speechSec * FPS);

    const rmsSpeech = computeFrameRMS(speechPCM, Math.max(1, speechFrames));
    const phoneticMap = textToPhoneticVisemeTimeline(clause.text);

    console.log(`  [${clause.id}] fala=${speechSec.toFixed(2)}s | total=${(totalClauseFrames / FPS).toFixed(2)}s | shot=${clause.shot}`);

    for (let f = 0; f < totalClauseFrames; f++) {
      let viseme = 'REST';
      let rms = 0;
      let frameShot = clause.shot;
      let frameGesture = clause.gesture;

      if (f >= beforeFrames && f < beforeFrames + speechFrames) {
        const sf = f - beforeFrames;
        const ratio = sf / Math.max(1, speechFrames);
        rms = rmsSpeech[Math.min(rmsSpeech.length - 1, sf)] || 0;

        // Em c4_exemplo ("Agora, observe este exemplo na tela."), Lia olha para a câmera articulando a frase
        // e desvia o olhar/mão para o exemplo na tela no trecho final ("na tela") + pausa de observação
        if (clause.id === 'c4_exemplo') {
          if (ratio < 0.68) {
            frameShot = 'MED_PALM';
            frameGesture = 'OPEN_PALM';
          } else {
            frameShot = 'MED_POINT';
            frameGesture = 'POINT_SCREEN';
          }
        }

        if (rms < 0.08) {
          viseme = 'REST';
        } else {
          const matched = phoneticMap.find(p => ratio >= p.startRatio && ratio <= p.endRatio);
          viseme = matched ? matched.viseme : 'EI';
          if (viseme === 'A' && rms < 0.28) viseme = 'EI';
          if (viseme === 'EI' && rms < 0.14) viseme = 'MBP';
        }
      } else {
        viseme = (clause.id === 'c1_ola' || clause.id === 'c9_convite') ? 'SMILE' : 'REST';
        if (clause.id === 'c4_exemplo' && f < beforeFrames) {
          frameShot = 'MED_PALM';
          frameGesture = 'OPEN_PALM';
        }
      }

      frameTimeline.push({
        clauseId: clause.id,
        shot: frameShot,
        gesture: frameGesture,
        stageStep: clause.stageStep,
        sub1: clause.sub1,
        sub2: clause.sub2,
        viseme,
        rms
      });
    }
  }

  const fullPCM = Buffer.concat(pcmParts);
  const fullPcmPath = path.join(TEMP_DIR, 'preview_full.pcm');
  fs.writeFileSync(fullPcmPath, fullPCM);
  const totalDurationSec = fullPCM.length / 2 / SAMPLE_RATE;
  console.log(`Duração total da Prévia de Validação: ${totalDurationSec.toFixed(2)}s (${frameTimeline.length} frames @ 30fps)`);

  // Programar piscadas naturais em intervalos não-cíclicos + nas transições de frase
  const blinkFrames = new Set();
  const halfBlinkFrames = new Set();
  const blinkTimesSec = [1.4, 4.3, 7.8, 11.2, 15.1, 18.6, 22.9, 26.4, 30.2, 33.8, 37.1];
  for (const tSec of blinkTimesSec) {
    const bf = Math.round(tSec * FPS);
    if (bf > 2 && bf < frameTimeline.length - 3) {
      halfBlinkFrames.add(bf - 1);
      blinkFrames.add(bf);
      blinkFrames.add(bf + 1);
      halfBlinkFrames.add(bf + 2);
    }
  }

  console.log('=== 2. CARREGANDO ATLAS DE RIG 3D (724x724) ===');
  const rig = {
    CLOSE_REST: await loadRigImage('close_viseme_rest.jpg'),
    CLOSE_SMILE: await loadRigImage('close_viseme_smile.jpg'),
    CLOSE_MBP: await loadRigImage('close_viseme_mbp.jpg'),
    CLOSE_FV: await loadRigImage('close_viseme_fv.jpg'),
    CLOSE_OU: await loadRigImage('close_viseme_ou.jpg'),
    CLOSE_EI: await loadRigImage('close_viseme_ei.jpg'),
    CLOSE_A: await loadRigImage('close_viseme_a.jpg'),
    CLOSE_BLINK_HALF: await loadRigImage('close_blink_half.jpg'),
    CLOSE_BLINK_FULL: await loadRigImage('close_blink_full.jpg'),

    MED_PALM_CLOSED: await loadRigImage('med_palm_closed.jpg'),
    MED_PALM_MID: await loadRigImage('med_palm_mid.jpg'),
    MED_PALM_OPEN: await loadRigImage('med_palm_open.jpg'),

    MED_ENUM1_CLOSED: await loadRigImage('med_enum1_closed.jpg'),
    MED_ENUM1_MID: await loadRigImage('med_enum1_mid.jpg'),
    MED_ENUM1_OPEN: await loadRigImage('med_enum1_open.jpg'),

    MED_ENUM2_CLOSED: await loadRigImage('med_enum2_closed.jpg'),
    MED_ENUM2_MID: await loadRigImage('med_enum2_mid.jpg'),
    MED_ENUM2_OPEN: await loadRigImage('med_enum2_open.jpg'),

    MED_POINT_SCREEN: await loadRigImage('med_point_screen.jpg')
  };

  function selectAvatarTargetBuffer(state, frameIdx) {
    const isFullBlink = blinkFrames.has(frameIdx);
    const isHalfBlink = halfBlinkFrames.has(frameIdx);

    if (state.shot === 'CLOSE') {
      if (isFullBlink) return rig.CLOSE_BLINK_FULL.data;
      if (isHalfBlink) return rig.CLOSE_BLINK_HALF.data;
      switch (state.viseme) {
        case 'MBP': return rig.CLOSE_MBP.data;
        case 'FV': return rig.CLOSE_FV.data;
        case 'OU': return rig.CLOSE_OU.data;
        case 'EI': return rig.CLOSE_EI.data;
        case 'A': return rig.CLOSE_A.data;
        case 'SMILE': return rig.CLOSE_SMILE.data;
        case 'REST':
        default: return rig.CLOSE_REST.data;
      }
    }

    if (state.shot === 'MED_POINT') {
      return rig.MED_POINT_SCREEN.data;
    }

    const prefix = state.shot; // MED_PALM, MED_ENUM1, MED_ENUM2
    const closedBuf = rig[`${prefix}_CLOSED`].data;
    const midBuf = rig[`${prefix}_MID`].data;
    const openBuf = rig[`${prefix}_OPEN`].data;

    switch (state.viseme) {
      case 'MBP':
      case 'REST':
      case 'SMILE':
        return closedBuf;
      case 'FV':
        return lerpRGB(closedBuf, midBuf, 0.65);
      case 'OU':
        return midBuf;
      case 'EI':
        return lerpRGB(midBuf, openBuf, 0.55);
      case 'A':
        return openBuf;
      default:
        return closedBuf;
    }
  }

  // Pré-renderizar os fundos SVG por combinação de (stageStep, sub1, sub2) para máxima performance
  console.log('=== 3. CODIFICANDO VÍDEO 1080p 30FPS VIA FFMPEG ===');
  const stageCache = new Map();
  async function getStageBaseBuffer(step, sub1, sub2, visemeLabel, gestureLabel) {
    // Cacheamos o palco sem o badge dinâmico ou com badge por estado
    const key = `${step}|${sub1}|${sub2}|${visemeLabel}|${gestureLabel}`;
    if (stageCache.has(key)) return stageCache.get(key);
    const svg = buildPreviewStageSVG(step, sub1, sub2, visemeLabel, gestureLabel);
    const { data } = await sharp(Buffer.from(svg))
      .resize(1920, 1080)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    stageCache.set(key, data);
    return data;
  }

  const outMp4 = path.join(VIDEOS_DIR, 'previa-validacao-lia-v2.mp4');
  const ffArgs = [
    '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-pix_fmt', 'rgb24',
    '-s', '1920x1080',
    '-r', String(FPS),
    '-i', 'pipe:0',
    '-f', 's16le',
    '-ar', String(SAMPLE_RATE),
    '-ac', '1',
    '-i', fullPcmPath,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    outMp4
  ];

  const ff = spawn(ffmpegPath, ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = '';
  ff.stderr.on('data', d => { ffErr += d.toString(); });

  let prevAvatarBuf = selectAvatarTargetBuffer(frameTimeline[0], 0);

  for (let f = 0; f < frameTimeline.length; f++) {
    const st = frameTimeline[f];
    const targetAvatarBuf = selectAvatarTargetBuffer(st, f);

    // Suavização temporal (coarticulação labial e transição suave de pose em 30fps: 58% novo + 42% anterior)
    const currAvatarBuf = lerpRGB(prevAvatarBuf, targetAvatarBuf, 0.58);
    prevAvatarBuf = currAvatarBuf;

    const visLabel = blinkFrames.has(f) ? 'BLINK' : st.viseme;
    const stageBuf = await getStageBaseBuffer(st.stageStep, st.sub1, st.sub2, visLabel, st.gesture);
    const frameBuf = Buffer.from(stageBuf);

    // Movimento orgânico sutil de respiração/postura (amplitude suave de 2px vertical, 1px horizontal)
    const tSec = f / FPS;
    const breathDy = Math.round(Math.sin(tSec * 2.1) * 2.0);
    const swayDx = Math.round(Math.cos(tSec * 1.05) * 1.0);

    // Compor o avatar 724x724 dentro da moldura direita (x=1148, y=130)
    const avW = 724, avH = 724;
    const baseX = 1148 + swayDx;
    const baseY = 132 + breathDy;

    for (let y = 0; y < avH; y++) {
      const dstY = baseY + y;
      if (dstY < 88 || dstY >= 896) continue;
      const srcRow = y * avW * 3;
      const dstRow = (dstY * 1920 + baseX) * 3;
      currAvatarBuf.copy(frameBuf, dstRow, srcRow, srcRow + avW * 3);
    }

    const canContinue = ff.stdin.write(frameBuf);
    if (!canContinue) {
      await new Promise(r => ff.stdin.once('drain', r));
    }
    if (f % 150 === 0 || f === frameTimeline.length - 1) {
      console.log(`  Renderizado frame ${f + 1}/${frameTimeline.length} (${((f + 1) / frameTimeline.length * 100).toFixed(0)}%)`);
    }
  }

  ff.stdin.end();
  await new Promise((resolve, reject) => {
    ff.on('close', code => code === 0 ? resolve() : reject(new Error(`FFmpeg code ${code}: ${ffErr.slice(-400)}`)));
  });

  console.log('Prévia de validação gerada com sucesso em:', outMp4);
}

buildValidationPreview().catch(err => {
  console.error(err);
  process.exit(1);
});
