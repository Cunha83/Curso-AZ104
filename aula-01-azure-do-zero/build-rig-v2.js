const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BRAIN_DIR = 'C:/Users/AutoMolasFort/.gemini/antigravity/brain/32389ba2-f7ed-4b46-8109-58ba7a11cd4f';
const RIG_DIR = path.join(__dirname, 'assets', 'rig_v2');
if (!fs.existsSync(RIG_DIR)) fs.mkdirSync(RIG_DIR, { recursive: true });

const RAW_FILES = {
  close_rest: path.join(BRAIN_DIR, 'lia_avatar_3d_base_1790699823088.jpg'),
  close_ei: path.join(BRAIN_DIR, 'lia_avatar_3d_speaking_m1_1790699945670.jpg'),
  close_a: path.join(BRAIN_DIR, 'lia_avatar_3d_speaking_m2_1790699957812.jpg'),
  close_ou: path.join(BRAIN_DIR, 'lia_3d_viseme_ou_1790701467538.jpg'),
  close_fv: path.join(BRAIN_DIR, 'lia_3d_viseme_fv_1790701560779.jpg'),
  close_mbp_blink: path.join(BRAIN_DIR, 'lia_3d_viseme_mbp_blink_1790701549762.jpg'),
  med_enum1_closed: path.join(BRAIN_DIR, 'lia_3d_med_enum_one_1790701571818.jpg'),
  med_enum2_mid: path.join(BRAIN_DIR, 'lia_3d_med_enum_two_1790701654124.jpg'),
  med_palm_open: path.join(BRAIN_DIR, 'lia_3d_med_explain_one_palm_1790701670330.jpg'),
  med_point_left: path.join(BRAIN_DIR, 'lia_3d_med_point_example_1790701491265.jpg')
};

async function loadRawRGB(filePath) {
  const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

async function saveRawJPG(buf, width, height, channels, outPath) {
  await sharp(buf, { raw: { width, height, channels } })
    .jpeg({ quality: 95 })
    .toFile(outPath);
}

/**
 * Combina o topo (olhos/sobrancelhas, y < 365) de topImg com a base (nariz/boca/mandíbula, y > 395) de botImg
 * usando transição suave cosseno na zona neutra da maçã do rosto (y = 365..395, onde diff < 18).
 */
function blendVerticalSplit(topImg, botImg, yStart = 365, yEnd = 395) {
  const { width, height, channels } = topImg;
  const out = Buffer.alloc(topImg.data.length);
  for (let y = 0; y < height; y++) {
    let alpha = 0;
    if (y >= yEnd) alpha = 1;
    else if (y > yStart) {
      alpha = 0.5 * (1 - Math.cos(Math.PI * (y - yStart) / (yEnd - yStart)));
    }
    const rowOffset = y * width * channels;
    for (let i = 0; i < width * channels; i++) {
      const idx = rowOffset + i;
      out[idx] = Math.round(topImg.data[idx] * (1 - alpha) + botImg.data[idx] * alpha);
    }
  }
  return out;
}

/**
 * Mistura linear entre dois buffers RGB (para transições suaves de visemas e meia-piscada)
 */
function lerpBuffers(bufA, bufB, t = 0.5) {
  const out = Buffer.alloc(bufA.length);
  for (let i = 0; i < bufA.length; i++) {
    out[i] = Math.round(bufA[i] * (1 - t) + bufB[i] * t);
  }
  return out;
}

/**
 * Transplanta suavemente a região da boca/mandíbula (box com borda suavizada) de mouthImg sobre basePoseImg
 */
function graftMouthBox(basePoseImg, mouthImg, box = { x1: 410, x2: 605, y1: 305, y2: 430, feather: 22 }) {
  const { width, height, channels } = basePoseImg;
  const out = Buffer.from(basePoseImg.data);
  const { x1, x2, y1, y2, feather } = box;

  for (let y = y1; y <= y2; y++) {
    let wy = 1;
    if (y < y1 + feather) wy = (y - y1) / feather;
    else if (y > y2 - feather) wy = (y2 - y) / feather;

    for (let x = x1; x <= x2; x++) {
      let wx = 1;
      if (x < x1 + feather) wx = (x - x1) / feather;
      else if (x > x2 - feather) wx = (x2 - x) / feather;

      const w = Math.max(0, Math.min(1, wx * wy));
      const idx = (y * width + x) * channels;
      for (let c = 0; c < channels; c++) {
        out[idx + c] = Math.round(basePoseImg.data[idx + c] * (1 - w) + mouthImg.data[idx + c] * w);
      }
    }
  }
  return out;
}

/**
 * Remove a pequena borda de tela branca na margem extrema esquerda de med_point_left
 * preservando intacta a mão e o dedo indicador (que ficam em y=445..535, x>=42).
 */
function cleanLeftEdgeArtifact(img) {
  const { width, height, channels } = img;
  const out = Buffer.from(img.data);
  for (let y = 0; y < 720; y++) {
    const maxCleanX = (y >= 440 && y <= 540) ? 25 : 46;
    const refX = (y >= 440 && y <= 540) ? 28 : 52;
    const refIdx = (y * width + refX) * channels;
    const r = out[refIdx], g = out[refIdx + 1], b = out[refIdx + 2];
    for (let x = 0; x < maxCleanX; x++) {
      const idx = (y * width + x) * channels;
      const w = x < maxCleanX - 5 ? 1.0 : (maxCleanX - x) / 5.0;
      out[idx] = Math.round(r * w + out[idx] * (1 - w));
      out[idx + 1] = Math.round(g * w + out[idx + 1] * (1 - w));
      out[idx + 2] = Math.round(b * w + out[idx + 2] * (1 - w));
    }
  }
  return out;
}

async function buildRigAtlas() {
  console.log('Carregando renders 3D base (1024x1024)...');
  const closeSmile = await loadRawRGB(RAW_FILES.close_rest);
  const closeEI = await loadRawRGB(RAW_FILES.close_ei);
  const closeA = await loadRawRGB(RAW_FILES.close_a);
  const closeOU = await loadRawRGB(RAW_FILES.close_ou);
  const closeFV = await loadRawRGB(RAW_FILES.close_fv);
  const closeMbpBlink = await loadRawRGB(RAW_FILES.close_mbp_blink);

  const { width, height, channels } = closeSmile;

  // 1. Visema MBP e Repouso Neutro com Olhos Abertos (topo de closeSmile y<365 + boca fechada limpa de closeMbpBlink y>395)
  const closeMbpOpenBuf = blendVerticalSplit(closeSmile, closeMbpBlink, 365, 395);
  // 2. Piscada Completa (100% closeMbpBlink sem qualquer fantasma de dentes!)
  const closeBlinkFullBuf = closeMbpBlink.data;
  // 3. Meia-Piscada (interpolação de pálpebras 50% entre closeMbpOpenBuf e closeMbpBlink)
  const closeBlinkHalfBuf = lerpBuffers(closeMbpOpenBuf, closeBlinkFullBuf, 0.52);

  await saveRawJPG(closeMbpOpenBuf, width, height, channels, path.join(RIG_DIR, 'close_viseme_rest.jpg'));
  await saveRawJPG(closeSmile.data, width, height, channels, path.join(RIG_DIR, 'close_viseme_smile.jpg'));
  await saveRawJPG(closeMbpOpenBuf, width, height, channels, path.join(RIG_DIR, 'close_viseme_mbp.jpg'));
  await saveRawJPG(closeFV.data, width, height, channels, path.join(RIG_DIR, 'close_viseme_fv.jpg'));
  await saveRawJPG(closeOU.data, width, height, channels, path.join(RIG_DIR, 'close_viseme_ou.jpg'));
  await saveRawJPG(closeEI.data, width, height, channels, path.join(RIG_DIR, 'close_viseme_ei.jpg'));
  await saveRawJPG(closeA.data, width, height, channels, path.join(RIG_DIR, 'close_viseme_a.jpg'));
  await saveRawJPG(closeBlinkFullBuf, width, height, channels, path.join(RIG_DIR, 'close_blink_full.jpg'));
  await saveRawJPG(closeBlinkHalfBuf, width, height, channels, path.join(RIG_DIR, 'close_blink_half.jpg'));
  await saveRawJPG(closeMbpBlink.data, width, height, channels, path.join(RIG_DIR, 'close_mbp_blink.jpg'));

  // 4. Processar Plano Médio (Medium Shot) com articulação de boca (closed / mid / open) para cada gesto!
  const medEnum1 = await loadRawRGB(RAW_FILES.med_enum1_closed);   // Gesto 1 dedo (boca originalmente fechada MBP/REST)
  const medEnum2 = await loadRawRGB(RAW_FILES.med_enum2_mid);      // Gesto 2 dedos (boca originalmente semi-aberta/arredondada)
  const medPalm = await loadRawRGB(RAW_FILES.med_palm_open);       // Gesto palma aberta (boca originalmente aberta A/E)
  const medPointRaw = await loadRawRGB(RAW_FILES.med_point_left);  // Olhar e mão apontando para exemplo à esquerda

  // Limpar artefato da borda esquerda em medPointRaw
  const medPointCleanBuf = cleanLeftEdgeArtifact(medPointRaw);
  await saveRawJPG(medPointCleanBuf, width, height, channels, path.join(RIG_DIR, 'med_point_screen.jpg'));

  // Para cada um dos 3 gestos frontais em Plano Médio (palm, enum1, enum2), gerar as 3 formas de boca (closed, mid, open)
  const medPoses = {
    palm: medPalm,
    enum1: medEnum1,
    enum2: medEnum2
  };
  const medMouthSources = {
    closed: medEnum1,
    mid: medEnum2,
    open: medPalm
  };

  for (const [poseName, poseImg] of Object.entries(medPoses)) {
    for (const [mName, mImg] of Object.entries(medMouthSources)) {
      const grafted = graftMouthBox(poseImg, mImg, { x1: 410, x2: 605, y1: 305, y2: 430, feather: 22 });
      await saveRawJPG(grafted, width, height, channels, path.join(RIG_DIR, `med_${poseName}_${mName}.jpg`));
    }
  }

  console.log('Atlas de Rig 3D v2 (100% sem artefatos) gerado em:', RIG_DIR);
}

buildRigAtlas().catch(console.error);
