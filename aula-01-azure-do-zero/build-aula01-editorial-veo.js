/**
 * PIPELINE DE PRODUÇÃO EDITORIAL REVISADA (ANTIGRAVITY + VEO 3.1)
 * Aula 01 — Azure do zero: entendendo o ambiente que vamos administrar (Revisão: 30/09/2026)
 *
 * Implementa integralmente as regras editoriais:
 * 1. Preserva a Lia aprovada no Veo 3.1 (`assets/lia_veo_live_anchor.png`), mantendo rosto, óculos,
 *    cabelo, blazer azul, blusa marfim, iluminação e voz em Português do Brasil.
 * 2. Enquadramento estável de peito e rosto (chest-up), mãos 100% fora do quadro (`negativePrompt` +
 *    controle de enquadramento na composição).
 * 3. Toda informação técnica exata (diagramas, textos, setas, camadas IaaS/PaaS/SaaS, pergunta e
 *    destaque de Acessos/Dados/Configurações) entra na edição em SVG nativo 1920x1080.
 * 4. 68 unidades de fala (778 palavras) geradas individualmente sem abreviação, com encadeamento
 *    contínuo nos blocos `Tela: LIA` (zero jump cuts) e voz unificada a partir da semente `U01`.
 * 5. Geração de SRT (`aula01-legendas-ptbr.srt`) a partir dos timestamps reais do áudio final.
 *
 * Resolução nativa do Veo 3.1 (com extensão de vídeo): 1280x720 @ 24 fps
 * Resolução de exportação e composição dos diagramas: 1920x1080 @ 30 fps (H.264 / AAC 48 kHz)
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
} = require('./aula01-roteiro-unidades');
const {
  ensureCleanOficinaImage,
  renderEditorialPng,
  splitSubtitleTwoLines
} = require('./render-editorial-diagrams');

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
 * Executa chamada ao Vertex AI Veo 3.1 com suporte a imagem âncora, extensão de vídeo, negativePrompt e retentativa automática
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
        console.warn(`[Veo 3.1] HTTP 400 com negativePrompt em ${unitId}; retentando sem parâmetro negativePrompt separado...`);
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
 * Obtém a duração exata de um arquivo de mídia em segundos via ffmpeg
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
 * Detecta o fim real da fala dentro de um clipe usando silencedetect para ajustar apenas o silêncio final
 */
function detectSpeechEndSec(audioOrVideoPath, totalDurSec, wordCount) {
  const minExpectedSpeech = Math.min(totalDurSec - 0.3, Math.max(2.2, (wordCount / 150) * 60 + 0.5));
  try {
    execFileSync(
      ffmpegPath,
      ['-i', audioOrVideoPath, '-af', 'silencedetect=noise=-34dB:d=0.30', '-f', 'null', '-'],
      { stdio: 'pipe' }
    );
  } catch (e) {
    const stderr = (e.stderr || '').toString();
    const starts = [...stderr.matchAll(/silence_start:\s*(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
    // Procura o último silence_start que ocorre após o tempo mínimo esperado de fala
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
 * Etapa 1: Gera todos os clipes brutos no Veo 3.1 respeitando as cadeias de continuidade e a semente U01
 */
async function generateAllRawVeoUnits() {
  // 1. Gera U01 (raiz de voz e identidade de toda a aula)
  const u01 = UNITS.find((u) => u.id === 'U01');
  const u01RawPath = path.join(WORK_DIR, 'raw_U01.mp4');
  await runVeoClip({
    unitId: 'U01',
    prompt: buildVeoPromptForUnit(u01.text),
    referenceImagePath: ANCHOR_IMG_PATH,
    outputMp4Path: u01RawPath,
    durationSeconds: 8
  });

  // 2. Define as cadeias sequenciais para os blocos Tela: LIA (zero jump cuts)
  const chains = {
    CHAIN_A: ['U02'], // estende U01
    CHAIN_B: ['U47', 'U48', 'U49', 'U50'], // estende U01 -> U47 -> U48 -> U49 -> U50
    CHAIN_C: ['U52', 'U53', 'U54'], // estende U01 -> U52 -> U53 -> U54
    CHAIN_D: ['U65', 'U66', 'U67', 'U68'] // estende U01 -> U65 -> U66 -> U67 -> U68
  };

  // Executa as 4 cadeias em paralelo entre si (cada cadeia avança sequencialmente)
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

  // 3. Unidades individuais (todas estendem U01 para preservar exatamente a mesma voz da Lia)
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

  console.log('\n[Veo 3.1] Todas as 68 unidades brutas foram geradas com sucesso!');
}

/**
 * Etapa 2: Extrai o segmento correspondente de cada unidade, compõe os diagramas/overlays em 1920x1080 30fps
 *          e monta os 9 blocos + vídeo completo + SRT sincronizado pelo áudio final.
 */
async function composeAllUnitsAndBlocks() {
  await ensureCleanOficinaImage();

  // Descobre o ponto de corte exato em cada cadeia
  // Como U01 tem ~8.00s e cada extensão adiciona ~7.03s, medimos a duração real de cada arquivo bruto na cadeia
  const rawDurations = {};
  for (const u of UNITS) {
    const rawPath = path.join(WORK_DIR, `raw_${u.id}.mp4`);
    rawDurations[u.id] = probeDurationSec(rawPath);
  }

  const chainPredecessor = {
    U01: null,
    U02: 'U01',
    U47: 'U01',
    U48: 'U47',
    U49: 'U48',
    U50: 'U49',
    U52: 'U01',
    U53: 'U52',
    U54: 'U53',
    U65: 'U01',
    U66: 'U65',
    U67: 'U66',
    U68: 'U67'
  };

  const masteredUnitClips = [];
  const srtEntries = [];
  let globalTimelineSec = 0;

  for (const unit of UNITS) {
    const rawPath = path.join(WORK_DIR, `raw_${unit.id}.mp4`);
    const totalRawDur = rawDurations[unit.id];
    const predId = unit.chainGroup === 'SINGLE' ? 'U01' : chainPredecessor[unit.id];
    const startOffsetSec = predId ? rawDurations[predId] : 0;

    // Se o clipe por algum fallback foi gerado como base de 8s (totalRawDur <= 8.5), startOffsetSec = 0
    const effectiveStartSec = totalRawDur > startOffsetSec + 2.0 ? startOffsetSec : 0;
    const rawSegmentDur = Math.max(2.0, totalRawDur - effectiveStartSec);

    // Extrai o segmento bruto da unidade (áudio + vídeo originais do Veo)
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
    const isPartOfMiddleChain =
      ['U01', 'U47', 'U48', 'U49', 'U52', 'U53', 'U65', 'U66', 'U67'].includes(unit.id);

    // Nas unidades encadeadas de Lia em que a câmera segue contínua para a próxima frase,
    // preservamos os quadros até o corte exato da extensão para zero jump cut!
    // Nas unidades de Diagrama/Oficina ou fim de cadeia, ajustamos o silêncio final excedente.
    let speechEnd = detectSpeechEndSec(segRawPath, segDur, words);
    let keepDur = isPartOfMiddleChain
      ? segDur
      : Math.min(segDur, Math.max(speechEnd + 0.35, (words / 145) * 60 + 0.6));

    // Renderiza a camada visual (Diagrama 1080p ou Overlay transparente 1080p)
    const pngPath = path.join(WORK_DIR, `visual_${unit.id}.png`);
    const isOverlayOnLia = unit.visualMode === 'LIA';
    await renderEditorialPng(unit.diagramState, unit.text, pngPath, isOverlayOnLia);

    const unitMasterPath = path.join(WORK_DIR, `master_${unit.id}.mp4`);
    const extraPause = isPartOfMiddleChain ? 0 : Math.max(0, unit.pauseAfterSec || 0);

    if (unit.visualMode === 'LIA') {
      // Vídeo da Lia em plano de peito com leve recorte superior (garante mãos 100% fora do quadro) + overlay SVG (legenda/badge)
      const vfFilter =
        `[0:v]crop=iw*0.92:ih*0.92:iw*0.04:0,scale=1920:1080:flags=lanczos,fps=30` +
        (extraPause > 0.05 ? `,tpad=stop_mode=clone:stop_duration=${extraPause.toFixed(2)}` : '') +
        `[lia];[lia][1:v]overlay=0:0:shortest=1[vout]`;
      const afFilter =
        extraPause > 0.05
          ? `apad=pad_dur=${extraPause.toFixed(2)}`
          : 'anull';

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
      // Tela: DIAGRAMA ou OFICINA em 1920x1080 30fps com a voz aprovada da Lia (extraída do clipe Veo da unidade)
      // Se for a pausa de 5s do Bloco 8 (U58), mostra o frame da pergunta e depois o frame da pausa de 5s
      if (unit.id === 'U58' && extraPause >= 4.5) {
        const pausePngPath = path.join(WORK_DIR, `visual_U58_pause.png`);
        await renderEditorialPng('b08_step_4_think_pause_hold', '', pausePngPath, false);

        const part1Path = path.join(WORK_DIR, `master_U58_part1.mp4`);
        const part2Path = path.join(WORK_DIR, `master_U58_part2.mp4`);

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

        // Pausa de 5.0 segundos com ambiente sonoro discreto e uniforme
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

        const u58List = path.join(WORK_DIR, 'u58_concat.txt');
        fs.writeFileSync(u58List, `file '${part1Path.replace(/\\/g, '/')}'\nfile '${part2Path.replace(/\\/g, '/')}'\n`);
        execFileSync(
          ffmpegPath,
          ['-y', '-f', 'concat', '-safe', '0', '-i', u58List, '-c', 'copy', unitMasterPath],
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

    // Se for a última unidade (U68), anexa o cartão de encerramento na edição (3.5s)
    if (unit.hasClosingCardAfter) {
      const cardPng = path.join(WORK_DIR, 'visual_closing_card.png');
      await renderEditorialPng('b09_closing_card', '', cardPng, false);
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
      const u68WithCard = path.join(WORK_DIR, 'master_U68_with_card.mp4');
      const u68List = path.join(WORK_DIR, 'u68_concat.txt');
      fs.writeFileSync(u68List, `file '${unitMasterPath.replace(/\\/g, '/')}'\nfile '${cardMp4.replace(/\\/g, '/')}'\n`);
      execFileSync(
        ffmpegPath,
        ['-y', '-f', 'concat', '-safe', '0', '-i', u68List, '-c', 'copy', u68WithCard],
        { stdio: 'pipe' }
      );
      fs.copyFileSync(u68WithCard, unitMasterPath);
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

  // 3. Monta os vídeos individuais dos 9 blocos (A01-B01 a A01-B09)
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

  // Também atualiza os arquivos cena-01..cena-06 para compatibilidade com players anteriores
  const legacyMapping = [
    [1, 'cena-01-abertura.mp4', 'cena-01-veo.mp4', blockFiles[0]],
    [2, 'cena-02-o-que-significa-usar-nuvem.mp4', 'cena-02-veo.mp4', blockFiles[1]],
    [3, 'cena-03-tres-modelos-com-o-mesmo-negocio.mp4', 'cena-03-veo.mp4', blockFiles[3]],
    [4, 'cena-04-quatro-servicos-no-portal-azure.mp4', 'cena-04-veo.mp4', blockFiles[4]],
    [5, 'cena-05-participacao-do-aluno.mp4', 'cena-05-veo.mp4', blockFiles[7]],
    [6, 'cena-06-recapitulacao-e-proximo-passo.mp4', 'cena-06-veo.mp4', blockFiles[8]]
  ];
  for (const [, canName, veoName, srcFile] of legacyMapping) {
    if (srcFile && fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(VIDEOS_DIR, canName));
      fs.copyFileSync(srcFile, path.join(VIDEOS_DIR, veoName));
    }
  }

  // 4. Concatena o filme completo da Aula 01 (todos os 9 blocos em sequência)
  const fullListPath = path.join(WORK_DIR, 'concat_full_aula01_editorial.txt');
  fs.writeFileSync(
    fullListPath,
    blockFiles.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n')
  );

  const fullVeoPath = path.join(VIDEOS_DIR, 'aula-01-azure-do-zero-completa-veo.mp4');
  const fullCanonicalPath = path.join(VIDEOS_DIR, 'aula-01-azure-do-zero-completa.mp4');
  execFileSync(
    ffmpegPath,
    ['-y', '-f', 'concat', '-safe', '0', '-i', fullListPath, '-c', 'copy', fullVeoPath],
    { stdio: 'pipe' }
  );
  fs.copyFileSync(fullVeoPath, fullCanonicalPath);

  // 5. Salva o arquivo SRT final medido a partir do áudio real
  const srtContent = srtEntries
    .map((e) => `${e.index}\n${e.start} --> ${e.end}\n${e.text}\n`)
    .join('\n');
  const srtPath = path.join(ROOT_DIR, 'aula01-legendas-ptbr.srt');
  fs.writeFileSync(srtPath, srtContent, 'utf8');

  // 6. Atualiza Aula_01_Clipes.csv
  generateClipsCsv(path.join(ROOT_DIR, 'Aula_01_Clipes.csv'));

  console.log(`\n=============================================================`);
  console.log(`AULA 01 REVISADA CONCLUÍDA COM SUCESSO!`);
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
    console.error('[Erro Fatal Pipeline Editorial]:', err);
    process.exit(1);
  });
}

module.exports = {
  generateAllRawVeoUnits,
  composeAllUnitsAndBlocks
};
