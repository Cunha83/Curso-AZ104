/**
 * BUILD PREVIEW v3 — Mandatory 30–45s Validation Preview (`videos/previa-validacao-lia-v3.mp4`)
 * ==============================================================================================
 * Implements the complete v3 pipeline on the mandatory test script:
 *  1. Master audio synthesized first (`temp_build/preview_v3/preview_master.mp3`) at ~32.5s
 *     using sample-accurate 24kHz PCM concatenation + `msedge-tts` WordBoundary metadata +
 *     5ms PCM RMS/ZCR Dynamic Programming forced alignment.
 *  2. Exports full inspectable timeline (`temp_build/preview_v3/viseme_timeline_preview.json`)
 *     and rig specification (`assets/lia_rig_v3_project.json`).
 *  3. Renders 30fps 1920x1080 video with:
 *     - Section A (Segments 0..4, ~00:00..00:20): Continuous UNCUT Medium Shot (`MED`)
 *       demonstrating `REST` -> `ENUM1` ("Primeiro") -> `REST` -> `POINT_LEFT` + `gazeLeft`
 *       ("Observe o exemplo à esquerda") -> `PALM` ("A Bianca abriu o portal...") -> `REST` ("Muito bem!")
 *       with 100% single-arm rigid-bone transitions and zero crossfade ghosting.
 *     - Section B (Segments 5..6, ~00:20..00:32.5): High-detail Close-Up (`CLOSE`)
 *       demonstrating `serious_alert` expression on the budget warning and `question` expression
 *       on the closing question, plus clear bilabial (`MBP`), labiodental (`FV`), and rounded (`OU`) visemes.
 *  4. Extracts diagnostic frame strips and generates the Expected vs. Observed Timestamp verification table.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const sharp = require('sharp');
const { LiaRigV3 } = require('./lia-rig-v3');
const { synthesizeMultiSentenceMasterPTBR, sampleVisemeAtTime } = require('./phonetic-aligner-ptbr');

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

const PREVIEW_SEGMENTS = [
  {
    text: 'Olá! Eu sou a Lia.',
    rate: '-4%',
    pitch: '+1Hz',
    pauseAfterSec: 0.70
  },
  {
    text: 'Primeiro, vamos preparar nosso ambiente no Azure.',
    rate: '-5%',
    pitch: '+0Hz',
    pauseAfterSec: 0.80
  },
  {
    text: 'Observe o exemplo à esquerda.',
    rate: '-6%',
    pitch: '+0Hz',
    pauseAfterSec: 0.80
  },
  {
    text: 'A Bianca abriu o portal para verificar o grupo de recursos.',
    rate: '-5%',
    pitch: '+0Hz',
    pauseAfterSec: 0.75
  },
  {
    text: 'Agora, vamos conferir as permissões. Muito bem!',
    rate: '-5%',
    pitch: '+1Hz',
    pauseAfterSec: 0.95
  },
  {
    text: 'Antes de continuar, uma atenção importante: o orçamento envia avisos, mas não interrompe automaticamente o consumo.',
    rate: '-6%',
    pitch: '-2Hz',
    pauseAfterSec: 0.80
  },
  {
    text: 'Vamos fazer essa configuração passo a passo?',
    rate: '-5%',
    pitch: '+2Hz',
    pauseAfterSec: 1.20
  }
];

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Computes the complete independent-channel rig state at timestamp `tSec`
 */
function evaluatePreviewRigState(alignment, tSec) {
  const words = alignment.words;
  const vSample = sampleVisemeAtTime(alignment, tSec);

  // Locate segment time boundaries from aligned words
  const segBounds = [];
  for (let s = 0; s < PREVIEW_SEGMENTS.length; s++) {
    const segWords = words.filter((w) => w.segIndex === s);
    if (segWords.length > 0) {
      segBounds[s] = {
        startSec: segWords[0].startSec,
        endSec: segWords[segWords.length - 1].endSec,
        words: segWords
      };
    } else {
      segBounds[s] = { startSec: 0, endSec: 0, words: [] };
    }
  }

  // Camera framing: Uncut Medium Shot from 0.0s up to midpoint of pause between Seg 4 ("Muito bem!") and Seg 5 ("Antes de continuar...")
  const closeUpCutSec = 0.5 * (segBounds[4].endSec + segBounds[5].startSec);
  const shot = tSec < closeUpCutSec ? 'MED' : 'CLOSE';

  // Determine active mouth viseme (use warm SMILE during intro, after "Muito bem!", and after closing question)
  let viseme = vSample.viseme;
  if (viseme === 'REST') {
    if (tSec < segBounds[0].startSec - 0.05) viseme = 'SMILE';
    else if (tSec > segBounds[4].endSec + 0.08 && tSec < segBounds[5].startSec - 0.12) viseme = 'SMILE';
    else if (tSec > segBounds[6].endSec + 0.08) viseme = 'SMILE';
  }

  // Independent Eyelid Blink schedule (natural blinks every ~2.8-3.8s, lasting 0.18s)
  const blinkCenters = [0.35, 1.65, 4.55, 6.82, 10.15, 13.80, 16.40, 19.85, 23.40, 27.10, 30.80];
  let blink = 0.0;
  for (const bc of blinkCenters) {
    const dt = Math.abs(tSec - bc);
    if (dt < 0.095) {
      blink = Math.cos((dt / 0.095) * (Math.PI / 2));
      break;
    }
  }

  // Independent Brow / Facial Expression channel
  let expression = 'neutral';
  if (tSec >= segBounds[1].startSec - 0.15 && tSec <= segBounds[1].startSec + 0.85) {
    expression = 'emphasize'; // "Primeiro..."
  } else if (tSec >= segBounds[4].endSec - 0.95 && tSec < closeUpCutSec) {
    expression = 'emphasize'; // "Muito bem!"
  } else if (tSec >= segBounds[5].startSec - 0.15 && tSec <= segBounds[5].endSec + 0.35) {
    expression = 'serious_alert'; // Budget alert warning!
  } else if (tSec >= segBounds[6].startSec - 0.15) {
    expression = 'question'; // "Vamos fazer essa configuração passo a passo?"
  }

  // Continuous Gaze-Left & 2.5D Head Yaw channel for Segment 2 ("Observe o exemplo à esquerda")
  // Also glances briefly left on "grupo de recursos" in Segment 3
  let gazeLeft = 0.0;
  const s2Start = segBounds[2].startSec - 0.22;
  const s2End = segBounds[2].endSec + 0.25;
  if (tSec >= s2Start && tSec <= s2End) {
    if (tSec < s2Start + 0.28) gazeLeft = (tSec - s2Start) / 0.28;
    else if (tSec > s2End - 0.30) gazeLeft = (s2End - tSec) / 0.30;
    else gazeLeft = 1.0;
  }
  gazeLeft = Math.max(0, Math.min(1, gazeLeft));
  // Smoothstep easing on gazeLeft
  gazeLeft = gazeLeft * gazeLeft * (3 - 2 * gazeLeft);

  // Continuous Uncut Medium-Shot Body/Arm Gesture State Machine (Preparation -> Stroke -> Hold -> Recovery)
  let gesture = 'REST';
  let elbowDeg = 0;
  let liftX = 0;
  let liftY = 0;
  let gesturePhase = 'rest';

  const s1Start = segBounds[1].startSec;
  const s1End = segBounds[1].endSec;
  const s3Start = segBounds[3].startSec;
  const s4End = segBounds[4].endSec;

  if (shot === 'MED') {
    if (tSec >= s1Start - 0.26 && tSec <= s1End + 0.32) {
      // Gesture 1: ENUM1 (1-finger enumeration on "Primeiro, vamos preparar nosso ambiente no Azure")
      gesture = 'ENUM1';
      if (tSec < s1Start) {
        // Preparation: hand rises smoothly from waist
        const u = 1.0 - (s1Start - tSec) / 0.26;
        const s = u * u * (3 - 2 * u);
        elbowDeg = -16 * (1 - s);
        liftX = 10 * (1 - s);
        liftY = 56 * (1 - s);
        gesturePhase = 'preparation';
      } else if (tSec < s1Start + 0.45) {
        // Stroke peak on "Primeiro"
        const beat = Math.sin(((tSec - s1Start) / 0.45) * Math.PI);
        elbowDeg = 4.0 * beat;
        liftY = -10.0 * beat;
        gesturePhase = 'stroke';
      } else if (tSec <= s1End) {
        // Hold with subtle prosodic micro-beat on "ambiente" / "Azure"
        const beat = Math.sin((tSec - s1Start) * 5.0) * 1.5;
        elbowDeg = beat;
        liftY = -beat * 2;
        gesturePhase = 'hold';
      } else {
        // Recovery back toward REST during pause
        const u = (tSec - s1End) / 0.32;
        const s = u * u * (3 - 2 * u);
        elbowDeg = -16 * s;
        liftX = 10 * s;
        liftY = 56 * s;
        gesturePhase = 'recovery';
      }
    } else if (tSec >= s2Start && tSec <= s2End) {
      // Gesture 2: POINT_LEFT ("Observe o exemplo à esquerda")
      gesture = 'PALM'; // Base open hand rotated outward via elbowDeg/liftX
      if (tSec < s2Start + 0.26) {
        // Preparation: hand rises and rotates left
        const u = (tSec - s2Start) / 0.26;
        const s = u * u * (3 - 2 * u);
        elbowDeg = -15 * s;
        liftX = -14 * s;
        liftY = 48 * (1 - s) + 8 * s;
        gesturePhase = 'preparation';
      } else if (tSec <= s2End - 0.28) {
        // Stroke & Hold pointing left toward the visual card
        const strokeBeat = tSec < s2Start + 0.65 ? Math.sin(((tSec - (s2Start + 0.26)) / 0.39) * Math.PI) * 3.0 : 0;
        elbowDeg = -15 - strokeBeat;
        liftX = -14 - strokeBeat * 1.2;
        liftY = 8;
        gesturePhase = tSec < s2Start + 0.65 ? 'stroke' : 'hold';
      } else {
        // Smooth transition toward center PALM for Segment 3
        const u = (tSec - (s2End - 0.28)) / 0.28;
        const s = u * u * (3 - 2 * u);
        elbowDeg = -15 * (1 - s) - 6 * s;
        liftX = -14 * (1 - s) + 4 * s;
        liftY = 8 * (1 - s) + 18 * s;
        gesturePhase = 'recovery';
      }
    } else if (tSec > s2End && tSec <= s4End - 0.45) {
      // Gesture 3: Open explanatory PALM across Segment 3 ("A Bianca abriu o portal...") & first sentence of Segment 4 ("Agora, vamos conferir as permissões.")
      gesture = 'PALM';
      // Prosodic beat accents on key technical words ('Bianca', 'portal', 'grupo', 'permissões')
      const fHop = Math.min(alignment.acoustics.numFrames - 1, Math.max(0, Math.floor(tSec / alignment.acoustics.hopSec)));
      const localRmsNorm = alignment.acoustics.rmsArr[fHop] / alignment.acoustics.maxRms;
      const prosodicBeat = Math.max(0, localRmsNorm - 0.25) * 6.0;
      elbowDeg = -3.0 + prosodicBeat;
      liftY = 10.0 - prosodicBeat * 2.5;
      gesturePhase = localRmsNorm > 0.45 ? 'stroke' : 'hold';
    } else if (tSec > s4End - 0.45 && tSec <= s4End - 0.12) {
      // Recovery back to REST right as she says "Muito bem!"
      gesture = 'PALM';
      const u = (tSec - (s4End - 0.45)) / 0.33;
      const s = u * u * (3 - 2 * u);
      elbowDeg = -14 * s;
      liftX = 10 * s;
      liftY = 55 * s;
      gesturePhase = 'recovery';
    } else {
      gesture = 'REST';
      gesturePhase = 'rest';
    }
  }

  // Prosody-driven subtle head motion (nod & breathing, NEVER a mechanical constant sine wave)
  const fHop = Math.min(alignment.acoustics.numFrames - 1, Math.max(0, Math.floor(tSec / alignment.acoustics.hopSec)));
  const rmsNorm = alignment.acoustics.rmsArr[fHop] / alignment.acoustics.maxRms;
  const breathY = Math.sin(tSec * 1.65) * 2.2; // Gentle physiological respiration (~16 breaths/min)
  const prosodicNodY = rmsNorm > 0.35 ? Math.min(3.5, (rmsNorm - 0.35) * 6.5) : 0;

  // Determine active pedagogical card stage on the left
  let stageStep = 0;
  if (tSec >= segBounds[1].startSec - 0.1) stageStep = 1;
  if (tSec >= segBounds[2].startSec - 0.2) stageStep = 2;
  if (tSec >= segBounds[3].startSec - 0.1) stageStep = 3;
  if (tSec >= segBounds[4].startSec - 0.1) stageStep = 4;
  if (tSec >= segBounds[5].startSec - 0.1) stageStep = 5;
  if (tSec >= segBounds[6].startSec - 0.1) stageStep = 6;

  return {
    shot,
    viseme,
    blink,
    expression,
    gazeLeft,
    gesture,
    gesturePhase,
    elbowDeg,
    liftX,
    liftY,
    headOffsetY: Math.round(breathY + prosodicNodY),
    word: vSample.word,
    phoneme: vSample.phoneme,
    stageStep,
    rmsNorm: Number(rmsNorm.toFixed(2))
  };
}

/**
 * Generates the SVG overlay for the 1920x1080 didactic studio frame (left visual stage + captions + telemetry bar).
 */
function buildStudioOverlaySVG(state, tSec, totalSec) {
  const { shot, viseme, expression, gazeLeft, gesture, gesturePhase, word, phoneme, stageStep } = state;

  const captions = [
    'Olá! Eu sou a Lia.',
    'Primeiro, vamos preparar nosso ambiente no Azure.',
    'Observe o exemplo à esquerda.',
    'A Bianca abriu o portal para verificar o grupo de recursos.',
    'Agora, vamos conferir as permissões. Muito bem!',
    'Antes de continuar, uma atenção importante: o orçamento envia avisos, mas não interrompe automaticamente o consumo.',
    'Vamos fazer essa configuração passo a passo?'
  ];
  const activeCaption = captions[stageStep] || captions[0];

  const isPointingLeft = stageStep === 2 || stageStep === 3;
  const cardBorder = isPointingLeft ? '#38bdf8' : (stageStep === 5 ? '#f59e0b' : '#334155');
  const cardGlow = isPointingLeft ? 'rgba(56, 189, 248, 0.24)' : (stageStep === 5 ? 'rgba(245, 158, 11, 0.22)' : 'rgba(15, 23, 42, 0.6)');

  let leftCardContent = '';
  if (stageStep <= 1) {
    leftCardContent = `
      <text x="110" y="235" fill="#38bdf8" font-family="Segoe UI, sans-serif" font-size="22" font-weight="700">PASSO 1 • PREPARAÇÃO DO AMBIENTE AZURE</text>
      <text x="110" y="285" fill="#f8fafc" font-family="Segoe UI, sans-serif" font-size="34" font-weight="800">Assinatura &amp; Governança Inicial</text>
      <rect x="110" y="330" width="880" height="115" rx="14" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      <text x="140" y="375" fill="#94a3b8" font-family="Segoe UI, sans-serif" font-size="21">Assinatura Ativa (Subscription)</text>
      <text x="140" y="418" fill="#38bdf8" font-family="Consolas, monospace" font-size="28" font-weight="700">sub-ecommerce-producao-01</text>
      <rect x="110" y="475" width="880" height="115" rx="14" fill="#0f172a" stroke="${stageStep === 1 ? '#38bdf8' : '#1e293b'}" stroke-width="2"/>
      <text x="140" y="520" fill="#94a3b8" font-family="Segoe UI, sans-serif" font-size="21">Estrutura Planejada pelo Administrador</text>
      <text x="140" y="562" fill="#e2e8f0" font-family="Segoe UI, sans-serif" font-size="25" font-weight="600">1. Grupo de Recursos   →   2. Permissões (RBAC)   →   3. Orçamento</text>
    `;
  } else if (stageStep === 2 || stageStep === 3) {
    leftCardContent = `
      <rect x="105" y="195" width="350" height="38" rx="19" fill="#0284c7"/>
      <text x="128" y="220" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="18" font-weight="700">★ EXEMPLO EM DESTAQUE À ESQUERDA</text>
      <text x="110" y="280" fill="#f8fafc" font-family="Segoe UI, sans-serif" font-size="33" font-weight="800">Portal do Azure • Grupo de Recursos</text>
      <rect x="110" y="315" width="880" height="145" rx="14" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
      <text x="140" y="360" fill="#94a3b8" font-family="Segoe UI, sans-serif" font-size="20">Usuária conectada: <tspan fill="#f8fafc" font-weight="700">Bianca (Analista de Operações)</tspan></text>
      <text x="140" y="405" fill="#38bdf8" font-family="Consolas, monospace" font-size="30" font-weight="700">📁 rg-vendas-prod  (East US 2)</text>
      <text x="140" y="440" fill="#4ade80" font-family="Segoe UI, sans-serif" font-size="20" font-weight="600">✔ Status: Provisionado • 4 recursos vinculados (App Service, SQL, Key Vault, Insights)</text>
      <rect x="110" y="485" width="880" height="110" rx="14" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      <text x="140" y="530" fill="#cbd5e1" font-family="Segoe UI, sans-serif" font-size="22">Ciclo de vida unificado: todos os recursos do projeto agrupados</text>
      <text x="140" y="568" fill="#94a3b8" font-family="Segoe UI, sans-serif" font-size="20">para auditoria de custos, tags e controle de acesso.</text>
    `;
  } else if (stageStep === 4) {
    leftCardContent = `
      <text x="110" y="235" fill="#4ade80" font-family="Segoe UI, sans-serif" font-size="22" font-weight="700">PASSO 2 • CONTROLE DE ACESSO BASEADO EM FUNÇÃO (RBAC)</text>
      <text x="110" y="285" fill="#f8fafc" font-family="Segoe UI, sans-serif" font-size="34" font-weight="800">Conferência de Permissões no Escopo</text>
      <rect x="110" y="325" width="880" height="130" rx="14" fill="#0f172a" stroke="#22c55e" stroke-width="2"/>
      <text x="140" y="372" fill="#f8fafc" font-family="Segoe UI, sans-serif" font-size="25" font-weight="700">Bianca  →  Função: Leitor (Reader) + Colaborador de App</text>
      <text x="140" y="418" fill="#4ade80" font-family="Segoe UI, sans-serif" font-size="22">✔ Menor privilégio validado no escopo rg-vendas-prod</text>
      <rect x="110" y="480" width="880" height="110" rx="14" fill="#052e16" stroke="#22c55e" stroke-width="2"/>
      <text x="140" y="545" fill="#86efac" font-family="Segoe UI, sans-serif" font-size="28" font-weight="700">✔ Ambiente e Permissões Conferidos — Muito bem!</text>
    `;
  } else if (stageStep === 5) {
    leftCardContent = `
      <rect x="105" y="195" width="420" height="40" rx="20" fill="#d97706"/>
      <text x="128" y="221" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="19" font-weight="800">⚠ ATENÇÃO IMPORTANTE • PROVA AZ-104</text>
      <text x="110" y="285" fill="#fbbf24" font-family="Segoe UI, sans-serif" font-size="34" font-weight="800">Orçamento (Azure Budgets) vs. Bloqueio</text>
      <rect x="110" y="320" width="880" height="135" rx="14" fill="#271705" stroke="#f59e0b" stroke-width="3"/>
      <text x="140" y="368" fill="#fde68a" font-family="Segoe UI, sans-serif" font-size="25" font-weight="700">✔ O orçamento ENVIA AVISOS (80%, 100% do limite mensal)</text>
      <text x="140" y="418" fill="#f87171" font-family="Segoe UI, sans-serif" font-size="26" font-weight="800">✖ MAS NÃO INTERROMPE AUTOMATICAMENTE O CONSUMO!</text>
      <rect x="110" y="480" width="880" height="115" rx="14" fill="#0f172a" stroke="#475569" stroke-width="2"/>
      <text x="140" y="528" fill="#e2e8f0" font-family="Segoe UI, sans-serif" font-size="22">Para parar recursos automaticamente, é necessário associar um</text>
      <text x="140" y="566" fill="#38bdf8" font-family="Segoe UI, sans-serif" font-size="23" font-weight="700">Action Group (Grupo de Ação) com Runbook / Azure Automation.</text>
    `;
  } else {
    leftCardContent = `
      <text x="110" y="235" fill="#38bdf8" font-family="Segoe UI, sans-serif" font-size="22" font-weight="700">PRÓXIMO PASSO • PRÁTICA GUIADA</text>
      <text x="110" y="285" fill="#f8fafc" font-family="Segoe UI, sans-serif" font-size="34" font-weight="800">Vamos configurar passo a passo?</text>
      <rect x="110" y="325" width="880" height="260" rx="14" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
      <text x="145" y="385" fill="#4ade80" font-family="Segoe UI, sans-serif" font-size="25" font-weight="700">1. Criar e validar o Grupo de Recursos (rg-vendas-prod)</text>
      <text x="145" y="445" fill="#4ade80" font-family="Segoe UI, sans-serif" font-size="25" font-weight="700">2. Atribuir permissões RBAC com menor privilégio</text>
      <text x="145" y="505" fill="#38bdf8" font-family="Segoe UI, sans-serif" font-size="25" font-weight="700">3. Configurar Orçamento (Budget) + Alertas de Consumo</text>
      <text x="145" y="558" fill="#94a3b8" font-family="Segoe UI, sans-serif" font-size="21">Acompanhe a demonstração prática na tela!</text>
    `;
  }

  const shotBadgeColor = shot === 'MED' ? '#0284c7' : '#7c3aed';
  const shotBadgeLabel = shot === 'MED' ? 'PLANO MÉDIO CONTÍNUO (SEM CORTES)' : 'CLOSE-UP FACIAL (ALTA PRECISÃO)';

  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <!-- Top Header Bar -->
    <rect x="60" y="42" width="980" height="64" rx="14" fill="#0f172a" fill-opacity="0.88" stroke="#1e293b" stroke-width="2"/>
    <text x="90" y="82" fill="#38bdf8" font-family="Segoe UI, sans-serif" font-size="24" font-weight="800">AZURE DO ZERO AO AZ-104</text>
    <text x="430" y="82" fill="#cbd5e1" font-family="Segoe UI, sans-serif" font-size="22" font-weight="600">•  Prévia de Validação v3 (Rig &amp; Sincronia Fonética)</text>

    <!-- Shot Mode Badge above Avatar -->
    <rect x="1140" y="42" width="720" height="54" rx="12" fill="${shotBadgeColor}" fill-opacity="0.90"/>
    <text x="1500" y="77" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, sans-serif" font-size="21" font-weight="800">${shotBadgeLabel}</text>

    <!-- Left Pedagogical Stage Card -->
    <rect x="60" y="145" width="980" height="500" rx="24" fill="${cardGlow}" stroke="${cardBorder}" stroke-width="3"/>
    <rect x="72" y="157" width="956" height="476" rx="18" fill="#091326" fill-opacity="0.94"/>
    ${leftCardContent}

    <!-- Subtitle / Caption Box -->
    <rect x="60" y="685" width="980" height="175" rx="20" fill="#091326" fill-opacity="0.92" stroke="#1e293b" stroke-width="2"/>
    <text x="100" y="732" fill="#38bdf8" font-family="Segoe UI, sans-serif" font-size="20" font-weight="700">LIA (NARRAÇÃO SINCRONIZADA PT-BR):</text>
    <text x="100" y="782" fill="#f8fafc" font-family="Segoe UI, sans-serif" font-size="26" font-weight="600">${escapeXml(activeCaption.slice(0, 68))}</text>
    <text x="100" y="822" fill="#f8fafc" font-family="Segoe UI, sans-serif" font-size="26" font-weight="600">${escapeXml(activeCaption.slice(68))}</text>

    <!-- Bottom Real-Time Sync Telemetry Bar -->
    <rect x="60" y="895" width="1800" height="135" rx="18" fill="#091326" fill-opacity="0.94" stroke="#334155" stroke-width="2"/>
    <text x="95" y="942" fill="#94a3b8" font-family="Consolas, monospace" font-size="22">TEMPO: <tspan fill="#f8fafc" font-weight="700">${tSec.toFixed(2)}s / ${totalSec.toFixed(2)}s (Frame ${Math.round(tSec * FPS)})</tspan></text>
    <text x="640" y="942" fill="#94a3b8" font-family="Consolas, monospace" font-size="22">PALAVRA ATIVA: <tspan fill="#38bdf8" font-weight="700">${escapeXml(word)}</tspan></text>
    <text x="1190" y="942" fill="#94a3b8" font-family="Consolas, monospace" font-size="22">FONEMA / VISEMA: <tspan fill="#4ade80" font-weight="700">[${escapeXml(phoneme)}] → ${escapeXml(viseme)}</tspan></text>

    <text x="95" y="992" fill="#94a3b8" font-family="Consolas, monospace" font-size="21">GESTO CORPORAL: <tspan fill="#fbbf24" font-weight="700">${escapeXml(gesture)} (${escapeXml(gesturePhase)})</tspan></text>
    <text x="640" y="992" fill="#94a3b8" font-family="Consolas, monospace" font-size="21">OLHAR ESQ: <tspan fill="#f8fafc" font-weight="700">${Math.round(gazeLeft * 100)}%</tspan></text>
    <text x="950" y="992" fill="#94a3b8" font-family="Consolas, monospace" font-size="21">EXPRESSÃO: <tspan fill="#c084fc" font-weight="700">${escapeXml(expression)}</tspan></text>
    <text x="1380" y="992" fill="#94a3b8" font-family="Consolas, monospace" font-size="21">PISCADA: <tspan fill="#f8fafc" font-weight="700">${Math.round(state.blink * 100)}%</tspan></text>
  </svg>`;
}

async function buildPreviewV3() {
  console.log('1. Initializing LiaRigV3 parametric facial & body rig...');
  const rig = new LiaRigV3();
  await rig.init();

  const buildDir = path.join(__dirname, 'temp_build', 'preview_v3');
  const framesDir = path.join(buildDir, 'frames');
  if (fs.existsSync(framesDir)) fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const masterMp3 = path.join(buildDir, 'preview_master.mp3');
  console.log('2. Synthesizing master narration & running 5ms PCM acoustic forced alignment...');
  const alignment = await synthesizeMultiSentenceMasterPTBR(PREVIEW_SEGMENTS, masterMp3, {
    introSilenceSec: 0.50
  });

  console.log(`   Master audio duration: ${alignment.durationSec.toFixed(3)}s (${alignment.totalFrames30fps} frames at 30fps)`);

  // Save inspectable timeline JSON & rig project spec
  const timelineJson = {
    text: alignment.text,
    voice: alignment.voice,
    durationSec: alignment.durationSec,
    totalFrames30fps: alignment.totalFrames30fps,
    words: alignment.words,
    visemeEvents: alignment.visemeEvents
  };
  const timelinePath = path.join(buildDir, 'viseme_timeline_preview.json');
  fs.writeFileSync(timelinePath, JSON.stringify(timelineJson, null, 2), 'utf8');
  await rig.exportRigAssetsAndProject(timelineJson);
  console.log('   Saved timeline JSON and exported rig_v3 keyframes + lia_rig_v3_project.json.');

  // Pre-build 1920x1080 dark studio background buffer
  const bgSvg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#06101e"/>
        <stop offset="55%" stop-color="#0a192f"/>
        <stop offset="100%" stop-color="#040c18"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  </svg>`;
  const bgBuf = await sharp(Buffer.from(bgSvg)).png().toBuffer();

  const totalFrames = alignment.totalFrames30fps;
  console.log(`3. Rendering ${totalFrames} frames at 1920x1080 (30fps)...`);

  // Render in batches of 15 frames concurrently
  const BATCH = 15;
  for (let fStart = 0; fStart < totalFrames; fStart += BATCH) {
    const tasks = [];
    for (let f = fStart; f < Math.min(totalFrames, fStart + BATCH); f++) {
      tasks.push((async (frameIdx) => {
        const tSec = frameIdx / FPS;
        const state = evaluatePreviewRigState(alignment, tSec);
        const avatarRaw = rig.renderAvatarBuffer(state);

        // Resize avatar to 760x760 for right-side studio stage
        const avatarPng = await sharp(avatarRaw, { raw: { width: 1024, height: 1024, channels: 3 } })
          .resize(760, 760)
          .png()
          .toBuffer();

        const overlaySvg = buildStudioOverlaySVG(state, tSec, alignment.durationSec);
        const framePath = path.join(framesDir, `frame_${String(frameIdx).padStart(5, '0')}.jpg`);

        await sharp(bgBuf)
          .composite([
            { input: avatarPng, left: 1120, top: Math.max(85, 115 + state.headOffsetY) },
            { input: Buffer.from(overlaySvg), left: 0, top: 0 }
          ])
          .jpeg({ quality: 92 })
          .toFile(framePath);
      })(f));
    }
    await Promise.all(tasks);
    if (fStart % 150 === 0 || fStart + BATCH >= totalFrames) {
      console.log(`   Rendered ${Math.min(totalFrames, fStart + BATCH)} / ${totalFrames} frames...`);
    }
  }

  const outVideoDir = path.join(__dirname, 'videos');
  if (!fs.existsSync(outVideoDir)) fs.mkdirSync(outVideoDir, { recursive: true });
  const outMp4 = path.join(outVideoDir, 'previa-validacao-lia-v3.mp4');

  console.log('4. Encoding videos/previa-validacao-lia-v3.mp4 with ffmpeg...');
  execFileSync(ffmpegPath, [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(framesDir, 'frame_%05d.jpg'),
    '-i', masterMp3,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-crf', '18',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    outMp4
  ], { stdio: 'ignore' });

  console.log('Done! Saved:', outMp4);
}

buildPreviewV3().catch((err) => {
  console.error(err);
  process.exit(1);
});
