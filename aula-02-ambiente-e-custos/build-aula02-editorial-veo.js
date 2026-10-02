/**
 * PIPELINE DE PRODUÇÃO EDITORIAL REVISADA (ANTIGRAVITY + VEO 3.1)
 * Aula 02 — Encontrando o ambiente certo e preparando o controle de custos (Revisão: 30/09/2026)
 *
 * Implementa integralmente as diretrizes editoriais:
 * 1. Preserva a Lia do vídeo Veo aprovado (`assets/lia_veo_live_anchor.png`), mantendo rosto, óculos,
 *    cabelo, blazer azul, blusa marfim, iluminação e voz em Português do Brasil.
 * 2. Enquadramento estável de peito e rosto (chest-up), mãos 100% fora do quadro (negativePrompt +
 *    crop vertical na composição).
 * 3. Demonstrações do portal e diagramas produzidos nativamente na edição em SVG 1920x1080 com
 *    badges "Simulação didática" e "Demonstração do Portal".
 * 4. 62 unidades de fala (654 palavras) geradas sem abreviação, com encadeamento contínuo nos
 *    blocos Tela: LIA e voz unificada a partir da semente U01.
 * 5. Pausa didática de 5s no Bloco 8 (U53) e Cartão de encerramento no Bloco 9 (U62).
 * 6. Geração de SRT (aula02-legendas-ptbr.srt) a partir dos timestamps reais do áudio final.
 *
 * Resolução nativa do Veo 3.1: 1280x720 @ 24 fps
 * Resolução de exportação dos vídeos finais e diagramas: 1920x1080 @ 30 fps (H.264 / AAC 48 kHz)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const {
  BLOCKS,
  UNITS,
  buildVeoPromptForUnit,
  VEO_NEGATIVE_PROMPT,
  generateClipsCsv
} = require('./aula02-roteiro-unidades');

const {
  splitSubtitleTwoLines,
  renderEditorialPngA02
} = require('./render-editorial-diagrams-a02');

const ROOT_DIR = __dirname;
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const VIDEOS_DIR = path.join(ROOT_DIR, 'videos');
const WORK_DIR = path.join(ROOT_DIR, 'temp_build', 'veo_editorial_v5');
const ANCHOR_IMG_PATH = path.join(ASSETS_DIR, 'lia_veo_live_anchor.png');

const VERTEX_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || '813840259780';
const VERTEX_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const VEO_MODEL = 'veo-3.1-generate-001';

if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true });

function findServiceAccountJson() {
  const localSa = path.join(ROOT_DIR, 'service-account.json');
  if (fs.existsSync(localSa)) {
    const data = JSON.parse(fs.readFileSync(localSa, 'utf8'));
    return { file: localSa, data };
  }
  throw new Error(`Service account não encontrada em ${localSa}`);
}

let cachedToken = null;
let cachedTokenExp = 0;

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < cachedTokenExp - 120) {
    return cachedToken;
  }
  const { data: saData } = findServiceAccountJson();
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(
    JSON.stringify({
      iss: saData.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })
  ).toString('base64url');
  const signInput = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const signature = signer.sign(saData.private_key, 'base64url');
  const jwt = `${signInput}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  if (!res.ok) {
    throw new Error(`Erro OAuth2 (${res.status}): ${await res.text()}`);
  }
  const json = await res.json();
  cachedToken = json.access_token;
  cachedTokenExp = now + 3600;
  return cachedToken;
}

/**
 * Executa chamada ao Vertex AI Veo 3.1 com suporte a imagem âncora, extensão de vídeo e negativePrompt
 */
async function runVeoClip({
  unitId,
  prompt,
  negativePrompt = VEO_NEGATIVE_PROMPT,
  referenceImagePath = null,
  previousVideoPath = null,
  outputMp4Path,
  durationSeconds = 8,
  attempt = 1
}) {
  if (fs.existsSync(outputMp4Path) && fs.statSync(outputMp4Path).size > 60000) {
    console.log(`[Cache Veo] ${unitId} já existe (${path.basename(outputMp4Path)})`);
    return outputMp4Path;
  }

  const { data: saData } = findServiceAccountJson();
  const projectId = saData.project_id || VERTEX_PROJECT_ID;
  const modelUrl = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_LOCATION}/publishers/google/models/${VEO_MODEL}`;

  const instance = { prompt };
  if (previousVideoPath) {
    const videoB64 = fs.readFileSync(previousVideoPath).toString('base64');
    instance.video = { bytesBase64Encoded: videoB64, mimeType: 'video/mp4' };
  } else if (referenceImagePath && fs.existsSync(referenceImagePath)) {
    const imgB64 = fs.readFileSync(referenceImagePath).toString('base64');
    instance.image = { bytesBase64Encoded: imgB64, mimeType: 'image/png' };
  }

  const parameters = {
    aspectRatio: '16:9',
    resolution: '720p',
    sampleCount: 1
  };
  if (negativePrompt) {
    parameters.negativePrompt = negativePrompt;
  }
  if (!previousVideoPath) {
    parameters.durationSeconds = durationSeconds;
    parameters.personGeneration = 'allow_adult';
  }

  try {
    const token = await getAccessToken();
    console.log(`[Veo 3.1] Iniciando ${unitId} (${previousVideoPath ? 'EXT +7s' : 'BASE ' + durationSeconds + 's'}, tentativa ${attempt})...`);

    const startRes = await fetch(`${modelUrl}:predictLongRunning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ instances: [instance], parameters })
    });

    if (!startRes.ok) {
      const errText = await startRes.text();
      if (startRes.status === 400 && negativePrompt) {
        console.warn(`[Veo 3.1] HTTP 400 com negativePrompt em ${unitId}; retentando inline...`);
        return runVeoClip({
          unitId,
          prompt: `${prompt} Avoid: ${negativePrompt}.`,
          negativePrompt: null,
          referenceImagePath,
          previousVideoPath,
          outputMp4Path,
          durationSeconds,
          attempt
        });
      }
      if ((startRes.status === 429 || startRes.status >= 500) && attempt <= 8) {
        const waitMs = attempt * 15000;
        console.warn(`[Veo 3.1] HTTP ${startRes.status} em ${unitId}. Aguardando ${waitMs / 1000}s para retentar...`);
        await new Promise((r) => setTimeout(r, waitMs));
        return runVeoClip({ unitId, prompt, negativePrompt, referenceImagePath, previousVideoPath, outputMp4Path, durationSeconds, attempt: attempt + 1 });
      }
      throw new Error(`HTTP ${startRes.status} ao iniciar ${unitId}: ${errText}`);
    }

    const startJson = await startRes.json();
    const operationName = startJson.name;
    if (!operationName) {
      throw new Error(`Sem operation.name para ${unitId}: ${JSON.stringify(startJson)}`);
    }

    const pollStart = Date.now();
    let statusJson = null;
    while (true) {
      await new Promise((r) => setTimeout(r, 10000));
      const pollToken = await getAccessToken();
      const pollRes = await fetch(`${modelUrl}:fetchPredictOperation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pollToken}`
        },
        body: JSON.stringify({ operationName })
      });

      if (!pollRes.ok) {
        const pErr = await pollRes.text();
        throw new Error(`Erro no poll de ${unitId} (${pollRes.status}): ${pErr}`);
      }
      statusJson = await pollRes.json();
      if (statusJson.done) {
        const elapsed = Math.round((Date.now() - pollStart) / 1000);
        console.log(`[Veo 3.1] ${unitId} concluído em ${elapsed}s`);
        break;
      }
    }

    if (statusJson.error) {
      if (attempt <= 4) {
        console.warn(`[Veo 3.1] Erro de operação em ${unitId}: ${JSON.stringify(statusJson.error)}. Retentando...`);
        await new Promise((r) => setTimeout(r, 12000));
        return runVeoClip({ unitId, prompt, negativePrompt, referenceImagePath, previousVideoPath, outputMp4Path, durationSeconds, attempt: attempt + 1 });
      }
      throw new Error(`Operação falhou em ${unitId}: ${JSON.stringify(statusJson.error)}`);
    }

    const samples =
      statusJson?.response?.generateVideoResponse?.generatedSamples ||
      statusJson?.response?.generatedVideos ||
      statusJson?.response?.videos ||
      [];
    const firstVideo = samples[0]?.video || samples[0] || {};

    if (!firstVideo.bytesBase64Encoded && !firstVideo.uri && !firstVideo.gcsUri) {
      if (attempt <= 4) {
        console.warn(`[Veo 3.1] Resposta vazia/RAI em ${unitId}. Retentando com âncora da Lia (tentativa ${attempt + 1})...`);
        await new Promise((r) => setTimeout(r, 8000));
        return runVeoClip({
          unitId,
          prompt,
          negativePrompt,
          referenceImagePath: ANCHOR_IMG_PATH,
          previousVideoPath: null,
          outputMp4Path,
          durationSeconds: 8,
          attempt: attempt + 1
        });
      }
      throw new Error(`Sem bytes de vídeo em ${unitId}: ${JSON.stringify(statusJson.response)}`);
    }

    if (firstVideo.bytesBase64Encoded) {
      const buf = Buffer.from(firstVideo.bytesBase64Encoded, 'base64');
      fs.writeFileSync(outputMp4Path, buf);
      return outputMp4Path;
    }

    const videoUri = firstVideo.uri || firstVideo.gcsUri;
    const dlToken = await getAccessToken();
    const dlRes = await fetch(videoUri, {
      headers: { Authorization: `Bearer ${dlToken}` },
      redirect: 'follow'
    });
    if (!dlRes.ok) {
      throw new Error(`Falha ao baixar ${unitId} (${dlRes.status})`);
    }
    const buf = Buffer.from(await dlRes.arrayBuffer());
    fs.writeFileSync(outputMp4Path, buf);
    return outputMp4Path;
  } catch (err) {
    if (attempt <= 4) {
      console.warn(`[Veo 3.1] Exceção em ${unitId} (tentativa ${attempt}): ${err.message}. Retentando em 12s...`);
      await new Promise((r) => setTimeout(r, 12000));
      return runVeoClip({ unitId, prompt, negativePrompt, referenceImagePath, previousVideoPath, outputMp4Path, durationSeconds, attempt: attempt + 1 });
    }
    throw err;
  }
}

/**
 * Obtém a duração exata de um arquivo em segundos via ffmpeg
 */
function probeDurationSec(filePath) {
  try {
    execFileSync(ffmpegPath, ['-i', filePath], { stdio: 'pipe' });
  } catch (e) {
    const stderr = (e.stderr || '').toString();
    const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (m) {
      return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    }
  }
  return 8.0;
}

/**
 * Detecta o fim real da fala usando silencedetect para aparar silêncios residuais
 */
function detectSpeechEndSec(audioOrVideoPath, totalDurSec, wordCount) {
  const minExpectedSpeech = Math.min(totalDurSec - 0.3, Math.max(2.0, (wordCount / 150) * 60 + 0.4));
  try {
    execFileSync(
      ffmpegPath,
      ['-i', audioOrVideoPath, '-af', 'silencedetect=noise=-34dB:d=0.30', '-f', 'null', '-'],
      { stdio: 'pipe' }
    );
  } catch (e) {
    const stderr = (e.stderr || '').toString();
    const starts = [...stderr.matchAll(/silence_start:\s*(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
    for (let i = starts.length - 1; i >= 0; i--) {
      if (starts[i] >= minExpectedSpeech && starts[i] < totalDurSec - 0.15) {
        return starts[i];
      }
    }
  }
  return totalDurSec;
}

/**
 * Formata segundos para timestamp SRT (HH:MM:SS,mmm)
 */
function formatSrtTime(sec) {
  const totalMs = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return (
    String(h).padStart(2, '0') +
    ':' +
    String(m).padStart(2, '0') +
    ':' +
    String(s).padStart(2, '0') +
    ',' +
    String(ms).padStart(3, '0')
  );
}

/**
 * Etapa 1: Gera todos os clipes brutos no Veo 3.1
 */
async function generateAllRawVeoUnits() {
  // 1. Gera U01 (semente de voz e identidade visual da Lia)
  const u01 = UNITS.find((u) => u.id === 'U01');
  const u01RawPath = path.join(WORK_DIR, 'raw_U01.mp4');
  await runVeoClip({
    unitId: 'U01',
    prompt: buildVeoPromptForUnit(u01.text),
    referenceImagePath: ANCHOR_IMG_PATH,
    outputMp4Path: u01RawPath,
    durationSeconds: 8
  });

  // 2. Cadeias sequenciais para os blocos Tela: LIA (zero jump cuts)
  const chains = {
    CHAIN_A1: ['U02', 'U03'],
    CHAIN_A2: ['U04', 'U05', 'U06'],
    CHAIN_B1: ['U30', 'U31', 'U32'],
    CHAIN_B2: ['U33', 'U34', 'U35', 'U36'],
    CHAIN_C: ['U58', 'U59', 'U60', 'U61', 'U62']
  };

  const chainPromises = Object.entries(chains).map(async ([chainName, unitIds]) => {
    let prevPath = u01RawPath;
    for (const uid of unitIds) {
      const unit = UNITS.find((u) => u.id === uid);
      const outPath = path.join(WORK_DIR, `raw_${uid}.mp4`);
      prevPath = await runVeoClip({
        unitId: uid,
        prompt: buildVeoPromptForUnit(unit.text),
        previousVideoPath: prevPath,
        outputMp4Path: outPath
      });
    }
  });

  await Promise.all(chainPromises);

  // 3. Unidades individuais (estendem U01 para unificar voz e timbre em todos os diagramas/demos)
  const singleUnits = UNITS.filter((u) => u.chainGroup === 'SINGLE');
  const CONCURRENCY = 5;

  for (let i = 0; i < singleUnits.length; i += CONCURRENCY) {
    const batch = singleUnits.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (unit) => {
        const outPath = path.join(WORK_DIR, `raw_${unit.id}.mp4`);
        await runVeoClip({
          unitId: unit.id,
          prompt: buildVeoPromptForUnit(unit.text),
          previousVideoPath: u01RawPath,
          outputMp4Path: outPath
        });
      })
    );
  }

  console.log('\n[Veo 3.1] Todas as 62 unidades brutas foram geradas com sucesso!');
}

/**
 * Etapa 2: Extrai o segmento de cada unidade, compõe diagramas e monta blocos + vídeo completo + SRT
 */
async function composeAllUnitsAndBlocks() {
  const rawDurations = {};
  for (const u of UNITS) {
    const rawPath = path.join(WORK_DIR, `raw_${u.id}.mp4`);
    rawDurations[u.id] = probeDurationSec(rawPath);
  }

  const chainPredecessor = {
    U01: null,
    U02: 'U01',
    U03: 'U02',
    U04: 'U01',
    U05: 'U04',
    U06: 'U05',
    U30: 'U01',
    U31: 'U30',
    U32: 'U31',
    U33: 'U01',
    U34: 'U33',
    U35: 'U34',
    U36: 'U35',
    U58: 'U01',
    U59: 'U58',
    U60: 'U59',
    U61: 'U60',
    U62: 'U61'
  };

  const masteredUnitClips = [];
  const srtEntries = [];
  let globalTimelineSec = 0;

  for (const unit of UNITS) {
    const rawPath = path.join(WORK_DIR, `raw_${unit.id}.mp4`);
    const totalRawDur = rawDurations[unit.id];
    const predId = unit.chainGroup === 'SINGLE' ? 'U01' : chainPredecessor[unit.id];
    const startOffsetSec = predId ? rawDurations[predId] : 0;

    const effectiveStartSec = totalRawDur > startOffsetSec + 2.0 ? startOffsetSec : 0;
    const rawSegmentDur = Math.max(2.0, totalRawDur - effectiveStartSec);

    // Extrai o segmento bruto da unidade
    const segRawPath = path.join(WORK_DIR, `seg_${unit.id}.mp4`);
    if (!fs.existsSync(segRawPath) || fs.statSync(segRawPath).size < 10000) {
      execFileSync(
        ffmpegPath,
        [
          '-y',
          '-ss', effectiveStartSec.toFixed(3),
          '-i', rawPath,
          '-c:v', 'libx264',
          '-crf', '16',
          '-preset', 'fast',
          '-c:a', 'aac',
          '-b:a', '192k',
          segRawPath
        ],
        { stdio: 'pipe' }
      );
    }

    const segDur = probeDurationSec(segRawPath);
    const words = unit.text.trim().split(/\s+/).length;
    const isPartOfMiddleChain = [
      'U01', 'U02', 'U04', 'U05',
      'U30', 'U31', 'U33', 'U34', 'U35',
      'U58', 'U59', 'U60', 'U61'
    ].includes(unit.id);

    let speechEnd = detectSpeechEndSec(segRawPath, segDur, words);
    let keepDur = isPartOfMiddleChain
      ? segDur
      : Math.min(segDur, Math.max(speechEnd + 0.35, (words / 145) * 60 + 0.6));

    // Renderiza a camada visual (Diagrama 1080p, Demo ou Overlay transparente 1080p)
    const pngPath = path.join(WORK_DIR, `visual_${unit.id}.png`);
    await renderEditorialPngA02(unit.diagramState, unit.text, pngPath);

    const unitMasterPath = path.join(WORK_DIR, `master_${unit.id}.mp4`);
    const extraPause = isPartOfMiddleChain ? 0 : Math.max(0, unit.pauseAfterSec || 0);

    if (unit.visualMode === 'LIA') {
      // Plano de peito da Lia com crop de proteção de mãos + overlay gráfico SVG
      const vfFilter =
        `[0:v]crop=iw*0.92:ih*0.92:iw*0.04:0,scale=1920:1080:flags=lanczos,fps=30` +
        (extraPause > 0.05 ? `,tpad=stop_mode=clone:stop_duration=${extraPause.toFixed(2)}` : '') +
        `[lia];[lia][1:v]overlay=0:0:shortest=1[vout]`;
      const afFilter = extraPause > 0.05 ? `apad=pad_dur=${extraPause.toFixed(2)}` : 'anull';

      execFileSync(
        ffmpegPath,
        [
          '-y',
          '-t', keepDur.toFixed(3),
          '-i', segRawPath,
          '-loop', '1',
          '-t', (keepDur + extraPause).toFixed(3),
          '-i', pngPath,
          '-filter_complex', vfFilter,
          '-map', '[vout]',
          '-map', '0:a',
          '-af', afFilter,
          '-t', (keepDur + extraPause).toFixed(3),
          '-c:v', 'libx264',
          '-crf', '18',
          '-preset', 'fast',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-ar', '48000',
          '-ac', '2',
          '-b:a', '192k',
          unitMasterPath
        ],
        { stdio: 'pipe' }
      );
    } else {
      // DIAGRAMA ou DEMONSTRAÇÃO DO PORTAL (1920x1080 30fps)
      // Caso especial: Pausa didática de 5 segundos em U53 (Bloco 8)
      if (unit.id === 'U53' && extraPause >= 4.5) {
        const pausePngPath = path.join(WORK_DIR, `visual_U53_pause.png`);
        await renderEditorialPngA02('b08_step_2_question_pause_hold', '', pausePngPath);

        const part1Path = path.join(WORK_DIR, `master_U53_part1.mp4`);
        const part2Path = path.join(WORK_DIR, `master_U53_part2.mp4`);

        // Parte 1: Fala a pergunta
        execFileSync(
          ffmpegPath,
          [
            '-y',
            '-loop', '1',
            '-t', keepDur.toFixed(3),
            '-i', pngPath,
            '-t', keepDur.toFixed(3),
            '-i', segRawPath,
            '-map', '0:v',
            '-map', '1:a',
            '-vf', 'scale=1920:1080,fps=30',
            '-c:v', 'libx264',
            '-crf', '18',
            '-preset', 'fast',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-ar', '48000',
            '-ac', '2',
            '-b:a', '192k',
            part1Path
          ],
          { stdio: 'pipe' }
        );

        // Parte 2: Pausa didática silenciosa de 5.0 segundos
        execFileSync(
          ffmpegPath,
          [
            '-y',
            '-loop', '1',
            '-t', '5.000',
            '-i', pausePngPath,
            '-f', 'lavfi',
            '-t', '5.000',
            '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
            '-map', '0:v',
            '-map', '1:a',
            '-vf', 'scale=1920:1080,fps=30',
            '-c:v', 'libx264',
            '-crf', '18',
            '-preset', 'fast',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-ar', '48000',
            '-ac', '2',
            '-b:a', '192k',
            part2Path
          ],
          { stdio: 'pipe' }
        );

        const u53List = path.join(WORK_DIR, 'u53_concat.txt');
        fs.writeFileSync(u53List, `file '${part1Path.replace(/\\/g, '/')}'\nfile '${part2Path.replace(/\\/g, '/')}'\n`);
        execFileSync(
          ffmpegPath,
          ['-y', '-f', 'concat', '-safe', '0', '-i', u53List, '-c', 'copy', unitMasterPath],
          { stdio: 'pipe' }
        );
      } else {
        const totalUnitDur = keepDur + extraPause;
        const afFilter = extraPause > 0.05 ? `apad=pad_dur=${extraPause.toFixed(2)}` : 'anull';
        execFileSync(
          ffmpegPath,
          [
            '-y',
            '-loop', '1',
            '-t', totalUnitDur.toFixed(3),
            '-i', pngPath,
            '-t', keepDur.toFixed(3),
            '-i', segRawPath,
            '-map', '0:v',
            '-map', '1:a',
            '-vf', 'scale=1920:1080,fps=30',
            '-af', afFilter,
            '-t', totalUnitDur.toFixed(3),
            '-c:v', 'libx264',
            '-crf', '18',
            '-preset', 'fast',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-ar', '48000',
            '-ac', '2',
            '-b:a', '192k',
            unitMasterPath
          ],
          { stdio: 'pipe' }
        );
      }
    }

    // Se for a unidade final (U62), anexa o cartão de encerramento de 3.5s
    if (unit.hasClosingCardAfter) {
      const cardPng = path.join(WORK_DIR, 'visual_closing_card.png');
      await renderEditorialPngA02('b09_closing_card', '', cardPng);
      const cardMp4 = path.join(WORK_DIR, 'master_closing_card.mp4');
      execFileSync(
        ffmpegPath,
        [
          '-y',
          '-loop', '1',
          '-t', '3.500',
          '-i', cardPng,
          '-f', 'lavfi',
          '-t', '3.500',
          '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
          '-map', '0:v',
          '-map', '1:a',
          '-vf', 'scale=1920:1080,fps=30',
          '-c:v', 'libx264',
          '-crf', '18',
          '-preset', 'fast',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-ar', '48000',
          '-ac', '2',
          '-b:a', '192k',
          cardMp4
        ],
        { stdio: 'pipe' }
      );
      const u62WithCard = path.join(WORK_DIR, 'master_U62_with_card.mp4');
      const u62List = path.join(WORK_DIR, 'u62_concat.txt');
      fs.writeFileSync(u62List, `file '${unitMasterPath.replace(/\\/g, '/')}'\nfile '${cardMp4.replace(/\\/g, '/')}'\n`);
      execFileSync(
        ffmpegPath,
        ['-y', '-f', 'concat', '-safe', '0', '-i', u62List, '-c', 'copy', u62WithCard],
        { stdio: 'pipe' }
      );
      fs.copyFileSync(u62WithCard, unitMasterPath);
    }

    const finalClipDur = probeDurationSec(unitMasterPath);
    const subStart = globalTimelineSec + 0.12;
    const subEnd = globalTimelineSec + Math.min(finalClipDur - 0.12, keepDur);
    const [l1, l2] = splitSubtitleTwoLines(unit.text);
    srtEntries.push({
      index: srtEntries.length + 1,
      start: formatSrtTime(subStart),
      end: formatSrtTime(subEnd),
      text: l2 ? `${l1}\n${l2}` : l1
    });

    globalTimelineSec += finalClipDur;
    masteredUnitClips.push({
      unit,
      clipPath: unitMasterPath,
      durationSec: finalClipDur
    });
    console.log(`[Edição 1080p] ${unit.id} (${unit.blockId}, ${unit.visualMode}) -> ${finalClipDur.toFixed(2)}s`);
  }

  // 3. Monta os 9 blocos individuais (A02-B01 a A02-B09)
  const blockFiles = [];
  for (const block of BLOCKS) {
    const bUnits = masteredUnitClips.filter((m) => m.unit.blockId === block.id);
    const bListPath = path.join(WORK_DIR, `concat_${block.id}.txt`);
    fs.writeFileSync(
      bListPath,
      bUnits.map((m) => `file '${m.clipPath.replace(/\\/g, '/')}'`).join('\n')
    );
    const bOutPath = path.join(VIDEOS_DIR, block.videoFileName);
    execFileSync(
      ffmpegPath,
      ['-y', '-f', 'concat', '-safe', '0', '-i', bListPath, '-c', 'copy', bOutPath],
      { stdio: 'pipe' }
    );
    blockFiles.push(bOutPath);
    console.log(`[Bloco Concluído] ${block.id} -> ${bOutPath}`);
  }

  // 4. Concatena o filme completo da Aula 02
  const fullListPath = path.join(WORK_DIR, 'concat_full_aula02_editorial.txt');
  fs.writeFileSync(
    fullListPath,
    blockFiles.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n')
  );

  const fullVeoPath = path.join(VIDEOS_DIR, 'aula-02-ambiente-e-custos-completa-veo.mp4');
  const fullCanonicalPath = path.join(VIDEOS_DIR, 'aula-02-ambiente-e-custos-completa.mp4');
  execFileSync(
    ffmpegPath,
    ['-y', '-f', 'concat', '-safe', '0', '-i', fullListPath, '-c', 'copy', fullVeoPath],
    { stdio: 'pipe' }
  );
  fs.copyFileSync(fullVeoPath, fullCanonicalPath);

  // 5. Salva legendas SRT sincronizadas
  const srtContent = srtEntries
    .map((e) => `${e.index}\n${e.start} --> ${e.end}\n${e.text}\n`)
    .join('\n');
  const srtPath = path.join(ROOT_DIR, 'aula02-legendas-ptbr.srt');
  fs.writeFileSync(srtPath, srtContent, 'utf8');

  // 6. Atualiza Aula_02_Clipes.csv
  generateClipsCsv(path.join(ROOT_DIR, 'Aula_02_Clipes.csv'));

  console.log(`\n=============================================================`);
  console.log(`AULA 02 REVISADA CONCLUÍDA COM SUCESSO!`);
  console.log(`Filme Completo (1920x1080 @ 30fps): ${fullVeoPath}`);
  console.log(`Duração Total Final: ${(globalTimelineSec / 60).toFixed(2)} min (${globalTimelineSec.toFixed(1)}s)`);
  console.log(`Legendas SRT: ${srtPath}`);
  console.log(`=============================================================\n`);
}

async function main() {
  await generateAllRawVeoUnits();
  await composeAllUnitsAndBlocks();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[Erro Fatal Pipeline Editorial Aula 02]:', err);
    process.exit(1);
  });
}

module.exports = {
  generateAllRawVeoUnits,
  composeAllUnitsAndBlocks
};
