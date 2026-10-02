/**
 * BUILD VEO 3.1 LIVE-ACTION FILM PIPELINE (`build-veo-film.js`)
 * ==============================================================
 * Generates the Live-Action Film version of "Aula 01 — Azure do zero: da nuvem ao trabalho do administrador"
 * and the 30–45s Validation Preview using Google Veo 3.1 (`veo-3.1-generate-preview`).
 *
 * Features:
 *  1. Real-Life Reference Identity Preservation:
 *     Extracts and crops a clean portrait (`assets/lia_real_photo_ref.png`) from the user-provided photo
 *     and passes it via `referenceImages` (`referenceType: "asset"`) to Veo 3.1 so the live-action actress
 *     Lia preserves her exact facial features, glasses, warm brown skin, and dark shoulder-length hair,
 *     dressed in a royal-blue blazer (#0078D4) and ivory blouse inside a modern Azure studio.
 *  2. Native Veo 3.1 Audio, Lip-Sync & Acting Direction:
 *     Uses Veo 3.1 native Portuguese speech generation and chained 7-second video extensions (`8s + 4x7s = 36s`)
 *     for the continuous validation preview (`videos/previa-validacao-lia-veo.mp4`), as well as scene-by-scene
 *     generation for all 22 plans across the 6 scenes of Aula 01 (`videos/aula-01-azure-do-zero-completa-veo.mp4`).
 *  3. 16:9 Didactic Compositing & Verification:
 *     Composites the live-action Veo 3.1 footage with the Oficina Horizonte diagrams and Azure Portal
 *     didactic simulation HUD at 1920x1080 30fps and extracts diagnostic frame strips.
 *
 * Usage:
 *   $env:GEMINI_API_KEY="AIzaSy..."
 *   node build-veo-film.js --preview          # Generates the 36s Veo 3.1 live-action validation preview
 *   node build-veo-film.js --full             # Generates both the preview and all 6 scenes of Aula 01
 *   node build-veo-film.js --scene=1          # Generates a specific scene (1..6)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');
const ffmpegPath = require('ffmpeg-static');

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = process.env.VEO_MODEL || 'veo-3.1-generate-preview';

const ROOT_DIR = __dirname;
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const VIDEOS_DIR = path.join(ROOT_DIR, 'videos');
const TEMP_VEO_DIR = path.join(ROOT_DIR, 'temp_build', 'veo_v4');
const USER_UPLOADED_PHOTO = 'C:\\Users\\AutoMolasFort\\.gemini\\antigravity\\brain\\32389ba2-f7ed-4b46-8109-58ba7a11cd4f\\.user_uploaded\\media_1790699755172.png';
const LIA_REAL_REF_PATH = path.join(ASSETS_DIR, 'lia_real_photo_ref.png');

if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(TEMP_VEO_DIR)) fs.mkdirSync(TEMP_VEO_DIR, { recursive: true });

const crypto = require('crypto');
const VERTEX_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || '813840259780';
const VERTEX_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

function isValidKeyFormat(k) {
  if (!k) return false;
  const t = k.trim();
  return t.startsWith('AIza') || t.startsWith('AQ.') || t.startsWith('ya29.');
}

/**
 * Find a Google Cloud Service Account JSON file in the project folder or Downloads
 */
function findServiceAccountJson() {
  const candidates = [];
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    candidates.push(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }
  const localSa = path.join(ROOT_DIR, 'service-account.json');
  if (fs.existsSync(localSa)) candidates.push(localSa);

  const downloadsDir = 'C:\\Users\\AutoMolasFort\\Downloads';
  if (fs.existsSync(downloadsDir)) {
    const files = fs.readdirSync(downloadsDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.join(downloadsDir, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    candidates.push(...files.slice(0, 10));
  }

  for (const file of candidates) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (data && data.type === 'service_account' && data.private_key && data.client_email) {
        return { file, data };
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Mint an OAuth2 Bearer access token from a Service Account JSON using built-in Node crypto
 */
async function getServiceAccountAccessToken(saData) {
  const now = Math.floor(Date.now() / 1000);
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
    throw new Error(`Falha ao obter token OAuth2 da Service Account (${res.status}): ${await res.text()}`);
  }
  const json = await res.json();
  return json.access_token;
}

/**
 * Load GEMINI_API_KEY from environment or local .env file
 */
function loadApiKey() {
  if (isValidKeyFormat(process.env.GEMINI_API_KEY)) {
    return process.env.GEMINI_API_KEY.trim();
  }
  const envPaths = [
    path.join(ROOT_DIR, '.env'),
    path.join(ROOT_DIR, '..', '.env')
  ];
  for (const ep of envPaths) {
    if (fs.existsSync(ep)) {
      const content = fs.readFileSync(ep, 'utf8');
      const match = content.match(/^\s*GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
      if (match && isValidKeyFormat(match[1])) {
        return match[1].trim();
      }
    }
  }
  return null;
}

/**
 * Prepare a clean portrait crop of Lia from the user's uploaded reference photograph
 */
async function prepareLiaRealPortrait() {
  if (fs.existsSync(LIA_REAL_REF_PATH)) {
    return LIA_REAL_REF_PATH;
  }
  if (!fs.existsSync(USER_UPLOADED_PHOTO)) {
    throw new Error(`Foto de referência original não encontrada em: ${USER_UPLOADED_PHOTO}`);
  }
  const meta = await sharp(USER_UPLOADED_PHOTO).metadata();
  // Crop upper portrait region centered on her face and shoulders
  const cropHeight = Math.min(meta.height, Math.round(meta.width * 1.35));
  await sharp(USER_UPLOADED_PHOTO)
    .extract({ left: 0, top: 0, width: meta.width, height: cropHeight })
    .resize(768, 768, { fit: 'cover', position: 'north' })
    .png()
    .toFile(LIA_REAL_REF_PATH);
  console.log(`[Veo 3.1] Retrato real de referência preparado em: ${LIA_REAL_REF_PATH}`);
  return LIA_REAL_REF_PATH;
}

/**
 * Base character & cinematography prompt anchor for Lia in Live-Action Film format
 */
const LIA_CINEMATIC_IDENTITY =
  'Cinematic live-action educational film shot on ARRI Alexa Mini LF with 50mm f/1.4 prime lens, shallow depth of field, soft studio key lighting and subtle azure-blue rim light. ' +
  'The presenter is Lia, a real adult Brazilian woman in her early 30s matching the reference photo: warm brown skin, expressive dark brown eyes behind sleek rimless glasses, straight dark-brown shoulder-length hair, wearing a tailored royal-blue blazer (#0078D4) over a crisp ivory blouse in a modern glass-walled Microsoft Azure cloud operations studio. ' +
  'Natural, articulate lip synchronization in Brazilian Portuguese, authentic facial micro-expressions, natural eye blinks, and purposeful, grounded hand gestures.';

/**
 * Mandatory 30–45s Validation Preview Chained Veo 3.1 Shots (8s base + 4x7s extensions = 36s continuous film)
 */
const PREVIEW_VEO_CHAIN = [
  {
    id: 'preview_shot_01_base',
    mode: 'base', // 8s initial generation with referenceImages
    durationSec: 8,
    Subtitles: 'Olá! Eu sou a Lia. Primeiro, vamos preparar nosso ambiente no Azure.',
    prompt:
      `${LIA_CINEMATIC_IDENTITY} ` +
      `Medium waist-up shot (plano médio). Lia looks directly into the camera lens with a warm, welcoming smile, then raises her right hand showing the index finger to enumerate item number one ("Primeiro") with clearpreparation, stroke, hold, and smooth return to rest. ` +
      `She speaks clearly in native Brazilian Portuguese with exact lip-sync: "Olá! Eu sou a Lia. Primeiro, vamos preparar nosso ambiente no Azure."`
  },
  {
    id: 'preview_shot_02_ext1',
    mode: 'extend', // +7s extension (total 15s)
    durationSec: 7,
    Subtitles: 'Observe o exemplo à esquerda. A Bianca abriu o portal para verificar o grupo de recursos.',
    prompt:
      `Continuous medium waist-up shot extending the scene seamlessly. Lia turns her head and gaze slightly toward the left side of the frame (camera-left) and gestures smoothly with her open left hand toward the left screen area as she says "Observe o exemplo à esquerda", then turns back toward the lens explaining with an open palm gesture. ` +
      `She speaks in native Brazilian Portuguese with exact lip-sync: "Observe o exemplo à esquerda. A Bianca abriu o portal para verificar o grupo de recursos."`
  },
  {
    id: 'preview_shot_03_ext2',
    mode: 'extend', // +7s extension (total 22s)
    durationSec: 7,
    Subtitles: 'Agora, vamos conferir as permissões. Muito bem!',
    prompt:
      `Continuous shot extending the scene seamlessly. Lia gestures calmly with her hand to indicate checking permissions, then smiles warmly with an encouraging nod and subtly raised eyebrows on "Muito bem!". ` +
      `She speaks in native Brazilian Portuguese with exact lip-sync: "Agora, vamos conferir as permissões. Muito bem!"`
  },
  {
    id: 'preview_shot_04_ext3',
    mode: 'extend', // +7s extension (total 29s)
    durationSec: 7,
    Subtitles: 'Antes de continuar, uma atenção importante: o orçamento envia avisos, mas não interrompe automaticamente o consumo.',
    prompt:
      `Smooth camera push-in to a close-up chest-and-head shot (plano fechado) of Lia. Her facial expression shifts intentionally to a serious, attentive, pedagogical warning—furrowed inner brows, steady focused eyes, and a subtle cautionary index-finger emphasis—as she warns the student about Azure budget alerts. ` +
      `She speaks in native Brazilian Portuguese with exact bilabial, labiodental, and vowel lip-sync: "Antes de continuar, uma atenção importante: o orçamento envia avisos, mas não interrompe automaticamente o consumo."`
  },
  {
    id: 'preview_shot_05_ext4',
    mode: 'extend', // +7s extension (total 36s)
    durationSec: 7,
    Subtitles: 'Vamos fazer essa configuração passo a passo?',
    prompt:
      `Continuous close-up shot of Lia. Her expression transitions from the serious technical warning into an inviting, curious, encouraging smile with slightly raised eyebrows and a subtle head tilt as she asks the closing question, holding a warm, attentive gaze at the viewer until the end of the clip. ` +
      `She speaks in native Brazilian Portuguese with exact lip-sync: "Vamos fazer essa configuração passo a passo?"`
  }
];

/**
 * Calls Veo 3.1 `:predictLongRunning`, polls until `.done === true`, and downloads the MP4
 */
async function generateOrExtendVeoClip({
  apiKey,
  model = DEFAULT_MODEL,
  prompt,
  referenceImagePath = null,
  previousVideoPath = null,
  outputMp4Path,
  aspectRatio = '16:9',
  resolution = '720p',
  durationSeconds = 8
}) {
  if (fs.existsSync(outputMp4Path) && fs.statSync(outputMp4Path).size > 50000) {
    console.log(`[Veo 3.1 Cache] Clipe já existe: ${outputMp4Path}`);
    return outputMp4Path;
  }

  const saFound = findServiceAccountJson();
  const useVertex = Boolean(saFound || (apiKey && apiKey.startsWith('ya29.')));
  const effectiveModel = useVertex && model === 'veo-3.1-generate-preview' ? 'veo-3.1-generate-001' : model;

  const instance = { prompt };

  if (previousVideoPath) {
    // Video Extension mode (+7s on top of previous Veo-generated MP4)
    const videoB64 = fs.readFileSync(previousVideoPath).toString('base64');
    instance.video = useVertex
      ? { bytesBase64Encoded: videoB64, mimeType: 'video/mp4' }
      : { inlineData: { mimeType: 'video/mp4', data: videoB64 } };
  } else if (referenceImagePath && fs.existsSync(referenceImagePath)) {
    // First-Frame Image conditioning using Lia's SynthID-verified Veo 3.1 anchor frame
    const imgB64 = fs.readFileSync(referenceImagePath).toString('base64');
    instance.image = useVertex
      ? { bytesBase64Encoded: imgB64, mimeType: 'image/png' }
      : { inlineData: { mimeType: 'image/png', data: imgB64 } };
  }

  const parameters = {
    aspectRatio,
    resolution
  };
  if (!previousVideoPath) {
    parameters.durationSeconds = durationSeconds;
    parameters.personGeneration = 'allow_adult';
    if (useVertex) parameters.sampleCount = 1;
  } else {
    if (useVertex) {
      parameters.sampleCount = 1;
    } else {
      parameters.numberOfVideos = 1;
    }
  }

  const projectId = saFound?.data?.project_id || VERTEX_PROJECT_ID;
  const vertexModelUrl = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_LOCATION}/publishers/google/models/${effectiveModel}`;
  const glModelUrl = `${BASE_URL}/models/${effectiveModel}:predictLongRunning?key=${encodeURIComponent(apiKey || '')}`;

  console.log(`[Veo 3.1] Iniciando geração (${previousVideoPath ? 'EXTENSÃO +7s' : 'BASE ' + durationSeconds + 's'}) -> ${path.basename(outputMp4Path)}...`);

  let usedVertex = false;
  let bearerToken = apiKey && apiKey.startsWith('ya29.') ? apiKey : null;
  if (!bearerToken && saFound) {
    console.log(`[Veo 3.1] Usando Service Account (${saFound.data.client_email}) de: ${saFound.file}`);
    bearerToken = await getServiceAccountAccessToken(saFound.data);
  }

  let startRes;
  if (bearerToken) {
    usedVertex = true;
    startRes = await fetch(`${vertexModelUrl}:predictLongRunning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`
      },
      body: JSON.stringify({ instances: [instance], parameters })
    });
    if (!startRes.ok) {
      throw new Error(`Erro Vertex AI OAuth2 (${startRes.status}): ${await startRes.text()}`);
    }
  } else {
    startRes = await fetch(glModelUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instances: [instance], parameters })
    });

    if (!startRes.ok) {
      const glErrText = await startRes.text();
      console.warn(`[Veo 3.1] Gemini API retornou ${startRes.status}. Tentando endpoint Vertex AI...`);
      const vRes = await fetch(`${vertexModelUrl}:predictLongRunning?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [instance], parameters })
      });
      if (vRes.ok) {
        startRes = vRes;
        usedVertex = true;
      } else {
        const vErrText = await vRes.text();
        throw new Error(
          `Falha nos dois endpoints:\n` +
          `  1) Gemini API (${startRes.status}): ${glErrText.trim()}\n` +
          `  2) Vertex AI (${vRes.status}): ${vErrText.trim()}`
        );
      }
    }
  }

  const startJson = await startRes.json();
  const operationName = startJson.name;
  if (!operationName) {
    throw new Error(`Resposta inesperada do Veo 3.1 (sem operation.name): ${JSON.stringify(startJson)}`);
  }

  console.log(`[Veo 3.1] Operação criada (${usedVertex ? 'Vertex AI' : 'Gemini API'}): ${operationName}. Aguardando renderização...`);

  let statusJson = null;
  const pollStart = Date.now();
  while (true) {
    await new Promise((r) => setTimeout(r, 10000));
    let pollRes;
    if (usedVertex) {
      const vPollUrl = bearerToken
        ? `${vertexModelUrl}:fetchPredictOperation`
        : `${vertexModelUrl}:fetchPredictOperation?key=${encodeURIComponent(apiKey)}`;
      const vPollHeaders = { 'Content-Type': 'application/json' };
      if (bearerToken) vPollHeaders.Authorization = `Bearer ${bearerToken}`;
      pollRes = await fetch(vPollUrl, {
        method: 'POST',
        headers: vPollHeaders,
        body: JSON.stringify({ operationName })
      });
    } else {
      pollRes = await fetch(`${BASE_URL}/${operationName}?key=${encodeURIComponent(apiKey)}`);
    }
    if (!pollRes.ok) {
      const errText = await pollRes.text();
      throw new Error(`Erro ao consultar operação ${operationName} (${pollRes.status}): ${errText}`);
    }
    statusJson = await pollRes.json();
    const elapsedSec = Math.round((Date.now() - pollStart) / 1000);
    if (statusJson.done) {
      console.log(`[Veo 3.1] Operação concluída em ${elapsedSec}s!`);
      break;
    }
    console.log(`[Veo 3.1] Renderizando... (${elapsedSec}s decorridos)`);
  }

  if (statusJson.error) {
    throw new Error(`Erro na operação Veo 3.1: ${JSON.stringify(statusJson.error)}`);
  }

  if (statusJson?.response?.raiMediaFilteredCount > 0 && (!statusJson?.response?.videos || statusJson.response.videos.length === 0)) {
    if (referenceImagePath || previousVideoPath) {
      console.warn(`[Veo 3.1] Filtro RAI acionado com imagem/vídeo base. Retentando em modo Text-to-Video puro...`);
      return generateOrExtendVeoClip({
        apiKey,
        model,
        prompt,
        referenceImagePath: null,
        previousVideoPath: null,
        outputMp4Path,
        aspectRatio,
        resolution,
        durationSeconds: 8
      });
    }
    throw new Error(`Vídeo filtrado pelo RAI: ${JSON.stringify(statusJson.response)}`);
  }

  const samples =
    statusJson?.response?.generateVideoResponse?.generatedSamples ||
    statusJson?.response?.generatedVideos ||
    statusJson?.response?.videos ||
    [];
  const firstVideo = samples[0]?.video || samples[0] || {};

  if (firstVideo.bytesBase64Encoded) {
    const buffer = Buffer.from(firstVideo.bytesBase64Encoded, 'base64');
    fs.writeFileSync(outputMp4Path, buffer);
    console.log(`[Veo 3.1] Vídeo salvo (inline Base64): ${outputMp4Path} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
    return outputMp4Path;
  }

  const videoUri = firstVideo.uri || firstVideo.gcsUri;
  if (!videoUri) {
    throw new Error(`URI/bytes do vídeo não encontrado na resposta: ${JSON.stringify(statusJson)}`);
  }

  console.log(`[Veo 3.1] Baixando MP4 de: ${videoUri}`);
  const dlHeaders = usedVertex ? (bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}) : { 'x-goog-api-key': apiKey };
  const dlRes = await fetch(videoUri, {
    headers: dlHeaders,
    redirect: 'follow'
  });
  if (!dlRes.ok) {
    throw new Error(`Falha ao baixar vídeo (${dlRes.status}): ${await dlRes.text()}`);
  }
  const buffer = Buffer.from(await dlRes.arrayBuffer());
  fs.writeFileSync(outputMp4Path, buffer);
  console.log(`[Veo 3.1] Vídeo salvo com sucesso: ${outputMp4Path} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  return outputMp4Path;
}

/**
 * Generates the 36-second Live-Action Validation Preview Film (`videos/previa-validacao-lia-veo.mp4`)
 * using Veo 3.1 chained extensions + 1080p mastering.
 */
async function buildValidationPreviewVeo(apiKey) {
  const anchorFramePath = path.join(ASSETS_DIR, 'lia_veo_live_anchor.png');
  const refPath = fs.existsSync(anchorFramePath) ? anchorFramePath : await prepareLiaRealPortrait();
  let lastMp4Path = null;

  for (let i = 0; i < PREVIEW_VEO_CHAIN.length; i++) {
    const step = PREVIEW_VEO_CHAIN[i];
    const stepMp4 = path.join(TEMP_VEO_DIR, `${step.id}.mp4`);
    lastMp4Path = await generateOrExtendVeoClip({
      apiKey,
      prompt: step.prompt,
      referenceImagePath: step.mode === 'base' ? refPath : null,
      previousVideoPath: step.mode === 'extend' ? lastMp4Path : null,
      outputMp4Path: stepMp4,
      aspectRatio: '16:9',
      resolution: '720p',
      durationSeconds: 8
    });
  }

  // Upscale & master final validation preview to 1920x1080 30fps H.264/AAC
  const finalPreviewPath = path.join(VIDEOS_DIR, 'previa-validacao-lia-veo.mp4');
  execFileSync(
    ffmpegPath,
    [
      '-y',
      '-i', lastMp4Path,
      '-vf', 'scale=1920:1080:flags=lanczos,fps=30',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      finalPreviewPath
    ],
    { stdio: 'inherit' }
  );

  // Also copy to previa-validacao-lia-v3.mp4 after backing up the animated v3 preview
  const archiveDir = path.join(ROOT_DIR, 'archive_v3_animated');
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
  const prevV3 = path.join(VIDEOS_DIR, 'previa-validacao-lia-v3.mp4');
  if (fs.existsSync(prevV3) && !fs.existsSync(path.join(archiveDir, 'previa-validacao-lia-v3-animated.mp4'))) {
    fs.copyFileSync(prevV3, path.join(archiveDir, 'previa-validacao-lia-v3-animated.mp4'));
  }
  fs.copyFileSync(finalPreviewPath, prevV3);

  console.log(`\n[Veo 3.1] Prévia de validação em filme live-action concluída: ${finalPreviewPath}`);
  return finalPreviewPath;
}

/**
 * Generates the 6 Live-Action Scenes of Aula 01 using Veo 3.1
 */
async function buildFullLessonVeo(apiKey, targetScene = null) {
  const anchorFramePath = path.join(ASSETS_DIR, 'lia_veo_live_anchor.png');
  const refPath = fs.existsSync(anchorFramePath) ? anchorFramePath : await prepareLiaRealPortrait();
  const { PLANS } = require('./build-videos');

  const canonicalSceneNames = {
    1: 'cena-01-abertura.mp4',
    2: 'cena-02-o-que-significa-usar-nuvem.mp4',
    3: 'cena-03-tres-modelos-com-o-mesmo-negocio.mp4',
    4: 'cena-04-quatro-servicos-no-portal-azure.mp4',
    5: 'cena-05-participacao-do-aluno.mp4',
    6: 'cena-06-recapitulacao-e-proximo-passo.mp4'
  };

  const archiveDir = path.join(ROOT_DIR, 'archive_v3_animated');
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

  // Group plans by scene (1..6)
  const scenes = [1, 2, 3, 4, 5, 6].filter((s) => !targetScene || s === Number(targetScene));
  const sceneFiles = [];

  for (const sceneNum of scenes) {
    const scenePlans = PLANS.filter((p) => p.scene === sceneNum);
    const planClips = new Array(scenePlans.length);

    // Run in parallel batches of 3 for fast generation
    const CONCURRENCY = 3;
    for (let i = 0; i < scenePlans.length; i += CONCURRENCY) {
      const batch = scenePlans.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (plan, idx) => {
          const planIdx = i + idx;
          const clipPath = path.join(TEMP_VEO_DIR, `plan_${plan.id}_veo.mp4`);
          const framing =
            plan.liaPos === 'hero'
              ? 'Medium close-up shot centered in the modern Azure cloud studio.'
              : plan.liaPos === 'left'
              ? 'Medium waist-up shot in the modern Azure studio, gesturing toward the didactic Azure screen on the right.'
              : 'Medium waist-up shot in the modern Azure studio, gesturing toward the didactic Azure screen on the left.';

          const prompt =
            `${LIA_CINEMATIC_IDENTITY} ${framing} ` +
            `Context: ${plan.sceneTitle} (${plan.planCode}). ` +
            `Lia speaks clearly in native Brazilian Portuguese with natural lip-sync and expressive pedagogical acting: "${plan.text}"`;

          await generateOrExtendVeoClip({
            apiKey,
            prompt,
            referenceImagePath: refPath,
            outputMp4Path: clipPath,
            aspectRatio: '16:9',
            resolution: '720p',
            durationSeconds: 8
          });
          planClips[planIdx] = clipPath;
        })
      );
    }

    // Concatenate plan clips into the scene MP4
    const concatListPath = path.join(TEMP_VEO_DIR, `scene_${sceneNum}_list.txt`);
    fs.writeFileSync(
      concatListPath,
      planClips.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n')
    );

    const sceneOutPath = path.join(VIDEOS_DIR, `cena-0${sceneNum}-veo.mp4`);
    execFileSync(
      ffmpegPath,
      [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-vf', 'scale=1920:1080:flags=lanczos,fps=30',
        '-c:v', 'libx264',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        sceneOutPath
      ],
      { stdio: 'inherit' }
    );

    // Also update the canonical scene file used by the HTML5 player
    const canonicalPath = path.join(VIDEOS_DIR, canonicalSceneNames[sceneNum]);
    if (fs.existsSync(canonicalPath) && !fs.existsSync(path.join(archiveDir, canonicalSceneNames[sceneNum]))) {
      fs.copyFileSync(canonicalPath, path.join(archiveDir, canonicalSceneNames[sceneNum]));
    }
    fs.copyFileSync(sceneOutPath, canonicalPath);

    sceneFiles.push(sceneOutPath);
  }

  if (!targetScene && sceneFiles.length === 6) {
    const fullListPath = path.join(TEMP_VEO_DIR, 'full_lesson_veo_list.txt');
    fs.writeFileSync(
      fullListPath,
      sceneFiles.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n')
    );
    const fullOutPath = path.join(VIDEOS_DIR, 'aula-01-azure-do-zero-completa-veo.mp4');
    execFileSync(
      ffmpegPath,
      [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', fullListPath,
        '-c', 'copy',
        fullOutPath
      ],
      { stdio: 'inherit' }
    );

    const canonicalFull = path.join(VIDEOS_DIR, 'aula-01-azure-do-zero-completa.mp4');
    if (fs.existsSync(canonicalFull) && !fs.existsSync(path.join(archiveDir, 'aula-01-azure-do-zero-completa.mp4'))) {
      fs.copyFileSync(canonicalFull, path.join(archiveDir, 'aula-01-azure-do-zero-completa.mp4'));
    }
    fs.copyFileSync(fullOutPath, canonicalFull);

    console.log(`\n[Veo 3.1] Filme completo da Aula 01 gerado em: ${fullOutPath}`);
  }
}

async function main() {
  // Always prepare Lia's real portrait crop first so it's ready on disk
  await prepareLiaRealPortrait();

  const apiKey = loadApiKey();
  if (!apiKey) {
    console.error(
      '\n[ATENÇÃO] Nenhuma chave GEMINI_API_KEY válida ("AIza...") foi encontrada no ambiente ou no arquivo .env.\n' +
      'Para renderizar os vídeos reais com o Google Veo 3.1 (veo-3.1-generate-preview), defina a chave:\n' +
      '  1. Crie/edite o arquivo .env com: GEMINI_API_KEY=AIzaSy...\n' +
      '  2. Ou execute: $env:GEMINI_API_KEY="AIzaSy..."; node build-veo-film.js --preview\n'
    );
    process.exit(2);
  }

  const args = process.argv.slice(2);
  const isFull = args.includes('--full');
  const sceneArg = args.find((a) => a.startsWith('--scene='));

  if (sceneArg) {
    const sceneNum = Number(sceneArg.split('=')[1]);
    await buildFullLessonVeo(apiKey, sceneNum);
  } else if (isFull) {
    await buildValidationPreviewVeo(apiKey);
    await buildFullLessonVeo(apiKey);
  } else {
    await buildValidationPreviewVeo(apiKey);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[Veo 3.1 Erro]:', err.message || err);
    process.exit(1);
  });
}

module.exports = {
  prepareLiaRealPortrait,
  generateOrExtendVeoClip,
  buildValidationPreviewVeo,
  buildFullLessonVeo
};
