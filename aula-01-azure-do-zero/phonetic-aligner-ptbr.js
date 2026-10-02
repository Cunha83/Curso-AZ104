/**
 * PHONETIC FORCED-ALIGNMENT & TIMELINE ENGINE (PT-BR) — v3
 * =========================================================
 * 1. Synthesizes or loads master narration with `msedge-tts` (`wordBoundaryEnabled: true`).
 * 2. Decodes MP3 to 24kHz 16-bit mono PCM via `ffmpeg-static` and computes 5ms acoustic
 *    features: Root-Mean-Square energy (RMS) and Zero-Crossing Rate (ZCR).
 * 3. Converts each Portuguese word into its phonetic segment sequence (`MBP`, `FV`, `OU`,
 *    `EI`, `A`, `A_75`, `EI_50`, `EI_25`) and performs Dynamic Programming (Viterbi-style
 *    monotonic boundary alignment) inside each word's acoustic window `[(Offset - 45ms)..(Offset + Duration)]`
 *    so consonant closures (`[p,b,m,f,v,t,k]`) lock onto real PCM RMS valleys/ZCR bursts
 *    and vowels (`[a,e,i,o,u]`) lock onto real PCM RMS peaks.
 * 4. Enforces biomechanical coarticulation anticipation (35ms pre-closure on initial labial/labiodental
 *    consonants after pauses) and minimum 2-frame hold stability on key visemes (`MBP`, `FV`, `OU`, `A`)
 *    so no consonant closure is ever skipped between 30fps frames.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const SAMPLE_RATE = 24000;
const HOP_SEC = 0.005; // 5ms acoustic analysis resolution (200 Hz)
const HOP_SAMPLES = Math.round(SAMPLE_RATE * HOP_SEC); // 120 samples per 5ms hop
const EDGE_MP3_PRE_OFFSET_SEC = -0.045; // Measured constant offset between Edge WordBoundary ticks and decoded PCM

/**
 * Extracts 5ms RMS and Zero-Crossing Rate (ZCR) arrays from a 24kHz 16-bit mono PCM file.
 */
function extractAcousticFeatures(mp3Path, tempPcmPath) {
  execFileSync(ffmpegPath, [
    '-y', '-i', mp3Path,
    '-f', 's16le', '-ac', '1', '-ar', String(SAMPLE_RATE),
    tempPcmPath
  ], { stdio: 'ignore' });

  const pcmBuf = fs.readFileSync(tempPcmPath);
  const totalSamples = Math.floor(pcmBuf.length / 2);
  const numFrames = Math.floor(totalSamples / HOP_SAMPLES);
  const rmsArr = new Float32Array(numFrames);
  const zcrArr = new Float32Array(numFrames);

  let maxRms = 1.0;
  for (let f = 0; f < numFrames; f++) {
    const base = f * HOP_SAMPLES;
    let sumSq = 0;
    let zc = 0;
    let prev = pcmBuf.readInt16LE(base * 2);
    for (let i = 0; i < HOP_SAMPLES; i++) {
      const s = pcmBuf.readInt16LE((base + i) * 2);
      sumSq += s * s;
      if ((s >= 0 && prev < 0) || (s < 0 && prev >= 0)) zc++;
      prev = s;
    }
    const rms = Math.sqrt(sumSq / HOP_SAMPLES);
    rmsArr[f] = rms;
    zcrArr[f] = zc / HOP_SAMPLES;
    if (rms > maxRms) maxRms = rms;
  }

  return {
    durationSec: totalSamples / SAMPLE_RATE,
    hopSec: HOP_SEC,
    numFrames,
    maxRms,
    rmsArr,
    zcrArr
  };
}

/**
 * Portuguese (PT-BR) Grapheme-to-Phoneme (G2P) segmenter.
 * Produces an ordered array of phonetic segments with target visemes and acoustic classes.
 */
function wordToPhonemesPTBR(rawWord) {
  const w = rawWord
    .toLowerCase()
    .replace(/[^a-záàâãéêíóôõúüç]/g, '');
  if (!w) return [];

  const segs = [];
  let i = 0;
  const len = w.length;
  const isVowel = (ch) => /[aáàâãeéêiíoóôõuúü]/.test(ch || '');

  while (i < len) {
    const ch = w[i];
    const next = w[i + 1] || '';
    const next2 = w[i + 2] || '';
    const rem = w.slice(i);

    // 1. Multi-character digraphs & nasal diphthongs
    if (rem.startsWith('ão') || rem.startsWith('ãe')) {
      segs.push({ ph: 'ɐ̃', viseme: 'A_75', acType: 'vowel', weight: 1.15, minSec: 0.055 });
      segs.push({ ph: 'w̃', viseme: 'OU', acType: 'rounded', weight: 0.90, minSec: 0.055 });
      i += 2;
      continue;
    }
    if (rem.startsWith('õe')) {
      segs.push({ ph: 'õ', viseme: 'OU', acType: 'rounded', weight: 1.15, minSec: 0.060 });
      segs.push({ ph: 'j̃', viseme: 'EI', acType: 'vowel', weight: 0.75, minSec: 0.045 });
      i += 2;
      continue;
    }
    if (rem.startsWith('ou')) {
      segs.push({ ph: 'o', viseme: 'OU', acType: 'rounded', weight: 1.25, minSec: 0.065 });
      i += 2;
      continue;
    }
    if (rem.startsWith('lh')) {
      segs.push({ ph: 'ʎ', viseme: 'EI_50', acType: 'consonant', weight: 0.70, minSec: 0.040 });
      i += 2;
      continue;
    }
    if (rem.startsWith('nh')) {
      segs.push({ ph: 'ɲ', viseme: 'EI_50', acType: 'consonant', weight: 0.70, minSec: 0.040 });
      i += 2;
      continue;
    }
    if (rem.startsWith('ch') || rem.startsWith('ss') || rem.startsWith('rr')) {
      const phName = rem.startsWith('rr') ? 'ʁ' : 'ʃ';
      segs.push({ ph: phName, viseme: 'EI_50', acType: 'fricative', weight: 0.75, minSec: 0.042 });
      i += 2;
      continue;
    }
    if (rem.startsWith('qu')) {
      segs.push({ ph: 'k', viseme: 'EI_25', acType: 'stop', weight: 0.65, minSec: 0.038 });
      if (/[aáoó]/.test(next2)) {
        segs.push({ ph: 'w', viseme: 'OU', acType: 'rounded', weight: 0.65, minSec: 0.045 });
      }
      i += 2;
      continue;
    }
    if (rem.startsWith('gu') && /[eéií]/.test(next2)) {
      segs.push({ ph: 'g', viseme: 'EI_25', acType: 'stop', weight: 0.65, minSec: 0.038 });
      i += 2;
      continue;
    }

    // 2. Bilabials P, B, M
    if (ch === 'p' || ch === 'b') {
      segs.push({ ph: ch, viseme: 'MBP', acType: 'bilabial', weight: 0.95, minSec: 0.056 });
      i++;
      continue;
    }
    if (ch === 'm') {
      if (isVowel(next)) {
        // Syllable-onset bilabial nasal [m] (e.g. 'Muito', 'mas', 'vamos', 'orçamento', 'consumo')
        segs.push({ ph: 'm', viseme: 'MBP', acType: 'bilabial', weight: 0.92, minSec: 0.056 });
        i++;
        continue;
      } else if (next === 'p' || next === 'b') {
        // Pre-bilabial nasal coda merges into the following bilabial closure [mp]/[mb]
        segs.push({ ph: 'm' + next, viseme: 'MBP', acType: 'bilabial', weight: 1.05, minSec: 0.062 });
        i += 2;
        continue;
      } else if (i === len - 1) {
        // Word-final '-m': in monosyllables/oxytones like 'bem', 'bom', 'com', 'um', 'também',
        // produces a labialized/bilabial nasal coda closure
        if (['bem', 'bom', 'com', 'um', 'sim', 'quem', 'também', 'alguém', 'ninguém'].includes(w)) {
          segs.push({ ph: 'm_coda', viseme: 'MBP', acType: 'bilabial', weight: 0.85, minSec: 0.055 });
        } else {
          segs.push({ ph: 'w̃', viseme: 'OU_50', acType: 'rounded', weight: 0.70, minSec: 0.045 });
        }
        i++;
        continue;
      } else {
        segs.push({ ph: 'm', viseme: 'MBP', acType: 'bilabial', weight: 0.85, minSec: 0.052 });
        i++;
        continue;
      }
    }

    // 3. Labiodentals F, V
    if (ch === 'f' || ch === 'v') {
      segs.push({ ph: ch, viseme: 'FV', acType: 'labiodental', weight: 0.95, minSec: 0.056 });
      i++;
      continue;
    }

    // 4. Vowels (with nasalization check if followed by coda 'n' or 'm' + non-vowel)
    if (/[aáàâã]/.test(ch)) {
      const isNasalCoda = (next === 'n' && !isVowel(next2)) || ch === 'ã' || ch === 'â';
      const vMode = isNasalCoda ? 'A_75' : 'A';
      segs.push({ ph: isNasalCoda ? 'ɐ̃' : 'a', viseme: vMode, acType: 'vowel', weight: 1.25, minSec: 0.060 });
      if (next === 'n' && !isVowel(next2)) i += 2;
      else i++;
      continue;
    }
    if (/[eéê]/.test(ch)) {
      // Unstressed word-final '-e' in PT-BR is raised to [i] (still EI / EI_50)
      const isFinalUnstressed = (i === len - 1 && ch === 'e');
      segs.push({
        ph: isFinalUnstressed ? 'ɪ' : 'e',
        viseme: isFinalUnstressed ? 'EI_50' : 'EI',
        acType: 'vowel',
        weight: isFinalUnstressed ? 0.85 : 1.15,
        minSec: 0.050
      });
      if (next === 'n' && !isVowel(next2)) i += 2;
      else i++;
      continue;
    }
    if (/[ií]/.test(ch)) {
      segs.push({ ph: 'i', viseme: 'EI', acType: 'vowel', weight: 1.10, minSec: 0.052 });
      if (next === 'n' && !isVowel(next2)) i += 2;
      else i++;
      continue;
    }
    if (/[oóôõuúü]/.test(ch)) {
      segs.push({ ph: ch, viseme: 'OU', acType: 'rounded', weight: 1.22, minSec: 0.060 });
      if (next === 'n' && !isVowel(next2)) i += 2;
      else i++;
      continue;
    }

    // 5. Coda '-l' in PT-BR vocalizes to rounded labiovelar glide [w] (e.g. 'portal' -> [poɾtaw])!
    if (ch === 'l') {
      if (!isVowel(next)) {
        segs.push({ ph: 'w', viseme: 'OU', acType: 'rounded', weight: 0.95, minSec: 0.055 });
      } else {
        segs.push({ ph: 'l', viseme: 'EI_50', acType: 'consonant', weight: 0.65, minSec: 0.038 });
      }
      i++;
      continue;
    }

    // 6. Stops T, D, C(hard), G(hard)
    if (ch === 't' || ch === 'd' || (ch === 'c' && !/[eéií]/.test(next)) || (ch === 'g' && !/[eéií]/.test(next))) {
      segs.push({ ph: ch, viseme: 'EI_25', acType: 'stop', weight: 0.65, minSec: 0.038 });
      i++;
      continue;
    }

    // 7. Sibilants, Fricatives, Liquids, Nasals (S, Z, C-soft, Ç, X, J, R, N)
    if (/[szçxjrn]/.test(ch) || ch === 'c' || ch === 'g') {
      segs.push({ ph: ch, viseme: 'EI_50', acType: 'fricative', weight: 0.68, minSec: 0.038 });
      i++;
      continue;
    }

    // Silent 'h' or other character
    i++;
  }

  // Merge consecutive identical visemes inside the same word (e.g. 'ee' or adjacent identical closures)
  const merged = [];
  for (const s of segs) {
    if (merged.length > 0 && merged[merged.length - 1].viseme === s.viseme && s.viseme === 'MBP') {
      merged[merged.length - 1].ph += '+' + s.ph;
      merged[merged.length - 1].weight += s.weight * 0.6;
      merged[merged.length - 1].minSec = Math.max(merged[merged.length - 1].minSec, 0.065);
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}

/**
 * Aligns a word's phoneme sequence `[seg_0 .. seg_{K-1}]` to the 5ms acoustic features
 * (`rmsArr`, `zcrArr`) inside `[wordStartSec, wordEndSec]` using Dynamic Programming.
 */
function alignWordPhonemesToPCM(segs, wordStartSec, wordEndSec, acoustics) {
  const K = segs.length;
  if (K === 0) return [];
  const { hopSec, numFrames, rmsArr, zcrArr } = acoustics;

  const fStart = Math.max(0, Math.min(numFrames - 2, Math.round(wordStartSec / hopSec)));
  const fEnd = Math.max(fStart + K, Math.min(numFrames - 1, Math.round(wordEndSec / hopSec)));
  const N = fEnd - fStart;

  if (K === 1 || N <= K * 2) {
    // Proportional allocation fallback for very short words
    const totalW = segs.reduce((acc, s) => acc + s.weight, 0);
    let cur = wordStartSec;
    return segs.map((s) => {
      const dur = (wordEndSec - wordStartSec) * (s.weight / totalW);
      const item = {
        phoneme: s.ph,
        viseme: s.viseme,
        acType: s.acType,
        startSec: Number(cur.toFixed(4)),
        endSec: Number((cur + dur).toFixed(4))
      };
      cur += dur;
      return item;
    });
  }

  // Compute local peak RMS inside this word for normalized acoustic scoring
  let localMaxRms = 100.0;
  for (let f = fStart; f < fEnd; f++) {
    if (rmsArr[f] > localMaxRms) localMaxRms = rmsArr[f];
  }

  // Acoustic frame score for assigning 5ms hop `f` to segment `seg`
  // Centered around the physical consonant-vs-vowel RMS boundary (~0.26 of word peak RMS):
  // - Stops/bilabials score POSITIVELY only in low-energy valleys (normRms < 0.28) and NEGATIVELY inside vowels.
  // - Fricatives score POSITIVELY in low/mid energy with high ZCR turbulence.
  // - Vowels score POSITIVELY in high-energy voiced nuclei (normRms > 0.24).
  function frameScore(f, seg) {
    const normRms = rmsArr[f] / localMaxRms; // 0..1
    const zcr = zcrArr[f]; // 0..0.5
    if (seg.acType === 'bilabial' || seg.acType === 'stop') {
      return (0.28 - normRms) * 3.2;
    } else if (seg.acType === 'labiodental' || seg.acType === 'fricative') {
      return (0.36 - normRms) * 2.2 + (zcr - 0.06) * 2.8;
    } else {
      return (normRms - 0.22) * 3.2;
    }
  }

  // Prefix sums of acoustic scores for each segment k
  const prefix = Array.from({ length: K }, () => new Float32Array(N + 1));
  for (let k = 0; k < K; k++) {
    for (let i = 0; i < N; i++) {
      prefix[k][i + 1] = prefix[k][i] + frameScore(fStart + i, segs[k]);
    }
  }

  const totalW = segs.reduce((acc, s) => acc + s.weight, 0);
  const idealLens = segs.map((s) => Math.max(2, (N * s.weight) / totalW));
  const minLens = segs.map((s) => Math.max(2, Math.min(Math.floor(N / K), Math.round(s.minSec / hopSec))));
  // Physiological max consonant duration (~115ms = 23 hops for stops/bilabials, ~135ms = 27 hops for fricatives)
  const maxLens = segs.map((s, idx) => {
    if (s.acType === 'bilabial' || s.acType === 'stop') return Math.max(Math.ceil(idealLens[idx] * 1.45), 22);
    if (s.acType === 'labiodental' || s.acType === 'fricative') return Math.max(Math.ceil(idealLens[idx] * 1.55), 26);
    return N;
  });

  // DP table: dp[k][i] = max score covering segments 0..k using first i frames (i in 1..N)
  const dp = Array.from({ length: K }, () => new Float32Array(N + 1).fill(-1e9));
  const back = Array.from({ length: K }, () => new Int32Array(N + 1).fill(0));

  for (let i = minLens[0]; i <= Math.min(N, maxLens[0]); i++) {
    const durPenalty = 0.45 * Math.pow(i - idealLens[0], 2) / idealLens[0];
    dp[0][i] = prefix[0][i] - durPenalty;
    back[0][i] = 0;
  }

  for (let k = 1; k < K; k++) {
    const mLen = minLens[k];
    const xLen = maxLens[k];
    for (let i = k * 2; i <= N; i++) {
      const pMin = Math.max((k - 1) * 2, i - xLen);
      const pMax = i - mLen;
      for (let p = pMin; p <= pMax; p++) {
        if (dp[k - 1][p] <= -1e8) continue;
        const len = i - p;
        const durPenalty = 0.45 * Math.pow(len - idealLens[k], 2) / idealLens[k];
        const val = dp[k - 1][p] + (prefix[k][i] - prefix[k][p]) - durPenalty;
        if (val > dp[k][i]) {
          dp[k][i] = val;
          back[k][i] = p;
        }
      }
    }
  }

  // Backtrack optimal phoneme boundaries
  const bounds = new Array(K + 1);
  bounds[K] = N;
  let curr = N;
  for (let k = K - 1; k >= 0; k--) {
    bounds[k] = back[k][curr];
    curr = bounds[k];
  }
  bounds[0] = 0;

  // Build aligned phoneme intervals with acoustic diagnostics
  const aligned = [];
  for (let k = 0; k < K; k++) {
    const i0 = bounds[k];
    const i1 = Math.max(i0 + 1, bounds[k + 1]);
    let sumRms = 0, sumZcr = 0;
    for (let f = fStart + i0; f < fStart + i1; f++) {
      sumRms += rmsArr[f];
      sumZcr += zcrArr[f];
    }
    const cnt = i1 - i0;
    aligned.push({
      phoneme: segs[k].ph,
      viseme: segs[k].viseme,
      acType: segs[k].acType,
      startSec: Number(((fStart + i0) * hopSec).toFixed(4)),
      endSec: Number(((fStart + i1) * hopSec).toFixed(4)),
      meanRms: Math.round(sumRms / cnt),
      meanZcr: Number((sumZcr / cnt).toFixed(3))
    });
  }

  return aligned;
}

/**
 * Synthesizes speech via `msedge-tts` with `WordBoundary` metadata and performs
 * full acoustic forced alignment on the resulting 24kHz PCM waveform.
 */
async function synthesizeAndAlignPTBR(text, outputMp3Path, options = {}) {
  const voice = options.voice || 'pt-BR-FranciscaNeural';
  const rate = options.rate || '+0%';
  const pitch = options.pitch || '+0Hz';

  const outDir = path.dirname(outputMp3Path);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  let audioChunks = [];
  let rawMeta = [];

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {
        wordBoundaryEnabled: true,
        sentenceBoundaryEnabled: true
      });

      const { audioStream, metadataStream } = tts.toStream(text, { rate, pitch });
      audioChunks = [];
      rawMeta = [];

      await new Promise((resolve, reject) => {
        audioStream.on('data', (c) => audioChunks.push(c));
        if (metadataStream) {
          metadataStream.on('data', (d) => {
            try {
              const obj = JSON.parse(d.toString());
              if (obj && Array.isArray(obj.Metadata)) {
                for (const m of obj.Metadata) rawMeta.push(m);
              }
            } catch (e) {}
          });
        }
        audioStream.on('end', resolve);
        audioStream.on('error', reject);
      });
      if (audioChunks.length > 0) break;
    } catch (err) {
      if (attempt === 4) throw err;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }

  fs.writeFileSync(outputMp3Path, Buffer.concat(audioChunks));

  // Extract 24kHz PCM acoustic features
  const tempPcmPath = outputMp3Path.replace(/\.mp3$/i, '.pcm');
  const acoustics = extractAcousticFeatures(outputMp3Path, tempPcmPath);
  try { fs.unlinkSync(tempPcmPath); } catch (e) {}

  // Parse WordBoundary events and refine [startSec, endSec] against actual 5ms PCM energy (rmsArr)
  // In msedge-tts, sentence-initial words often include 100ms-170ms of leading digital silence (rms < 40)
  // inside their WordBoundary span. Trimming this silence guarantees sub-frame acoustic lock!
  const words = [];
  for (const m of rawMeta) {
    if (m.Type === 'WordBoundary' && m.Data && m.Data.text) {
      const rawStart = m.Data.Offset / 1e7;
      const rawDur = m.Data.Duration / 1e7;
      let startSec = Math.max(0, rawStart + EDGE_MP3_PRE_OFFSET_SEC);
      let endSec = Math.min(acoustics.durationSec, startSec + rawDur + 0.035);

      const f0 = Math.max(0, Math.floor(startSec / acoustics.hopSec));
      const f1 = Math.min(acoustics.numFrames - 1, Math.ceil(endSec / acoustics.hopSec));

      // Find first 5ms hop with acoustic energy (rms >= 55)
      let firstActiveF = f0;
      while (firstActiveF < f1 && acoustics.rmsArr[firstActiveF] < 55) {
        firstActiveF++;
      }
      // Find last 5ms hop with acoustic energy (rms >= 45)
      let lastActiveF = f1;
      while (lastActiveF > firstActiveF + 4 && acoustics.rmsArr[lastActiveF] < 45) {
        lastActiveF--;
      }

      const cleanW = m.Data.text.Text.toLowerCase().replace(/[^a-záàâãéêíóôõúüç]/g, '');
      const startsWithVowel = /^[aáàâãeéêiíoóôõuúü]/.test(cleanW);
      // If word starts with a consonant (e.g. [p,b,m,f,v,t,k]), allow up to 55ms (11 hops) of pre-burst closure before firstActiveF;
      // if word starts with a vowel (e.g. 'Observe', 'orçamento'), start right at firstActiveF - 2 hops (10ms).
      const preHops = startsWithVowel ? 2 : 11;
      const refinedStartF = Math.max(f0, firstActiveF - preHops);
      const refinedEndF = Math.min(f1, lastActiveF + 3);

      if (refinedEndF > refinedStartF + 4) {
        startSec = refinedStartF * acoustics.hopSec;
        endSec = refinedEndF * acoustics.hopSec;
      }

      words.push({
        word: m.Data.text.Text,
        rawOffsetSec: Number(rawStart.toFixed(4)),
        startSec: Number(startSec.toFixed(4)),
        endSec: Number(endSec.toFixed(4)),
        durationSec: Number((endSec - startSec).toFixed(4))
      });
    }
  }

  // Prevent any overlap between consecutive words
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].endSec > words[i + 1].startSec) {
      words[i].endSec = words[i + 1].startSec;
      words[i].durationSec = Number((words[i].endSec - words[i].startSec).toFixed(4));
    }
  }

  // Align phonemes inside each word and build the complete viseme timeline
  const visemeEvents = [];
  let prevEndSec = 0.0;

  for (let wIdx = 0; wIdx < words.length; wIdx++) {
    const wInfo = words[wIdx];
    const gapSec = wInfo.startSec - prevEndSec;
    const rawSegs = wordToPhonemesPTBR(wInfo.word);
    const alignedSegs = alignWordPhonemesToPCM(rawSegs, wInfo.startSec, wInfo.endSec, acoustics);

    // Coarticulation anticipation: if preceded by a pause (> 65ms), start initial labial/labiodental/rounded
    // preparation 35ms before acoustic onset
    if (gapSec > 0.065) {
      const anticipate = (alignedSegs.length > 0 && ['MBP', 'FV', 'OU'].includes(alignedSegs[0].viseme)) ? 0.035 : 0.0;
      const restEnd = Math.max(prevEndSec, wInfo.startSec - anticipate);
      if (restEnd - prevEndSec > 0.025) {
        visemeEvents.push({
          word: '[PAUSA]',
          phoneme: 'sil',
          viseme: gapSec > 0.35 ? 'REST' : 'REST',
          acType: 'silence',
          startSec: Number(prevEndSec.toFixed(4)),
          endSec: Number(restEnd.toFixed(4)),
          startFrame30fps: Math.round(prevEndSec * 30),
          endFrame30fps: Math.round(restEnd * 30)
        });
      }
      if (anticipate > 0 && alignedSegs.length > 0) {
        alignedSegs[0].startSec = Number(restEnd.toFixed(4));
      }
    }

    wInfo.phonemes = alignedSegs;
    for (const seg of alignedSegs) {
      visemeEvents.push({
        word: wInfo.word,
        ...seg,
        startFrame30fps: Math.round(seg.startSec * 30),
        endFrame30fps: Math.round(seg.endSec * 30)
      });
    }
    prevEndSec = wInfo.endSec;
  }

  if (acoustics.durationSec - prevEndSec > 0.03) {
    visemeEvents.push({
      word: '[PAUSA_FINAL]',
      phoneme: 'sil',
      viseme: 'REST',
      acType: 'silence',
      startSec: Number(prevEndSec.toFixed(4)),
      endSec: Number(acoustics.durationSec.toFixed(4)),
      startFrame30fps: Math.round(prevEndSec * 30),
      endFrame30fps: Math.round(acoustics.durationSec * 30)
    });
  }

  return {
    text,
    voice,
    durationSec: Number(acoustics.durationSec.toFixed(4)),
    totalFrames30fps: Math.ceil(acoustics.durationSec * 30),
    words,
    visemeEvents,
    acoustics
  };
}

/**
 * Given a `visemeEvents` array and a timestamp `tSec`, returns the active viseme state
 * at 30fps, ensuring priority closures (`MBP`, `FV`, `OU`) are never skipped between frames
 * and inserting natural geometric jaw transitions (`EI_25`, `EI_50`, `A_75`) instead of alpha crossfades.
 */
function sampleVisemeAtTime(alignment, tSec) {
  const events = alignment.visemeEvents;
  if (!events || events.length === 0) return { viseme: 'REST', word: '', phoneme: 'sil', rmsNorm: 0 };

  // Check if any priority consonant closure (MBP or FV) overlaps the current 30fps frame window [tSec - 0.018, tSec + 0.018]
  // This guarantees that short stops like [p] in 'portal' or [b] in 'Bianca' NEVER fall between frame ticks!
  const frameHalfWin = 0.018;
  for (const ev of events) {
    if ((ev.viseme === 'MBP' || ev.viseme === 'FV') && ev.endSec >= tSec - frameHalfWin && ev.startSec <= tSec + frameHalfWin) {
      // If we are near the center of this closure, lock onto it!
      const mid = 0.5 * (ev.startSec + ev.endSec);
      if (Math.abs(tSec - mid) <= Math.max(0.028, (ev.endSec - ev.startSec) * 0.55)) {
        return { viseme: ev.viseme, word: ev.word, phoneme: ev.phoneme, event: ev };
      }
    }
  }

  // Find active event at tSec
  let activeIdx = events.length - 1;
  for (let i = 0; i < events.length; i++) {
    if (tSec >= events[i].startSec && tSec <= events[i].endSec) {
      activeIdx = i;
      break;
    } else if (tSec < events[i].startSec) {
      activeIdx = Math.max(0, i - 1);
      break;
    }
  }

  const cur = events[activeIdx];
  const prev = activeIdx > 0 ? events[activeIdx - 1] : null;
  const next = activeIdx < events.length - 1 ? events[activeIdx + 1] : null;

  let viseme = cur.viseme;
  const intoCur = tSec - cur.startSec;
  const remainCur = cur.endSec - tSec;

  // Geometric jaw-opening / jaw-closing transition frames (1 frame = 33ms) between closed and wide-open visemes
  const isClosed = (v) => v === 'REST' || v === 'MBP' || v === 'SMILE' || v === 'FV';
  if (viseme === 'A') {
    if (prev && isClosed(prev.viseme) && intoCur < 0.026) {
      viseme = 'EI_50'; // Geometric half-open jaw on first frame after closed lips
    } else if (next && isClosed(next.viseme) && remainCur < 0.026) {
      viseme = 'A_75'; // Geometric closing jaw before lip closure
    }
  } else if (viseme === 'EI') {
    if (prev && isClosed(prev.viseme) && intoCur < 0.022) {
      viseme = 'EI_50';
    } else if (next && isClosed(next.viseme) && remainCur < 0.022) {
      viseme = 'EI_50';
    }
  } else if (viseme === 'OU') {
    if (prev && isClosed(prev.viseme) && intoCur < 0.022) {
      viseme = 'OU_50';
    } else if (next && isClosed(next.viseme) && remainCur < 0.022) {
      viseme = 'OU_50';
    }
  }

  return {
    viseme,
    word: cur.word,
    phoneme: cur.phoneme,
    event: cur
  };
}

/**
 * Synthesizes a multi-sentence script with controlled pedagogical pauses in 24kHz 16-bit mono PCM,
 * writes the unified master MP3, and performs sample-accurate WordBoundary + 5ms PCM forced alignment.
 * @param {Array<{text: string, rate?: string, pitch?: string, pauseAfterSec?: number}>} segments
 * @param {string} outputMp3Path
 * @param {Object} options - { voice, introSilenceSec }
 */
async function synthesizeMultiSentenceMasterPTBR(segments, outputMp3Path, options = {}) {
  const voice = options.voice || 'pt-BR-FranciscaNeural';
  const introSilenceSec = options.introSilenceSec !== undefined ? options.introSilenceSec : 0.45;

  const outDir = path.dirname(outputMp3Path);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const pcmBuffers = [];
  const allRawWords = [];
  let cumSamples = Math.round(introSilenceSec * SAMPLE_RATE);
  if (cumSamples > 0) {
    pcmBuffers.push(Buffer.alloc(cumSamples * 2, 0));
  }

  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    const seg = segments[sIdx];
    const rate = seg.rate || options.rate || '-4%';
    const pitch = seg.pitch || options.pitch || '+0Hz';
    const pauseAfterSec = seg.pauseAfterSec !== undefined ? seg.pauseAfterSec : 0.65;

    let audioChunks = [];
    let rawMeta = [];
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {
          wordBoundaryEnabled: true,
          sentenceBoundaryEnabled: true
        });
        const { audioStream, metadataStream } = tts.toStream(seg.text, { rate, pitch });
        audioChunks = [];
        rawMeta = [];
        await new Promise((resolve, reject) => {
          audioStream.on('data', (c) => audioChunks.push(c));
          if (metadataStream) {
            metadataStream.on('data', (d) => {
              try {
                const obj = JSON.parse(d.toString());
                if (obj && Array.isArray(obj.Metadata)) {
                  for (const m of obj.Metadata) rawMeta.push(m);
                }
              } catch (e) {}
            });
          }
          audioStream.on('end', resolve);
          audioStream.on('error', reject);
        });
        if (audioChunks.length > 0) break;
      } catch (err) {
        if (attempt === 4) throw err;
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
    }

    const segMp3 = outputMp3Path.replace(/\.mp3$/i, `_seg${sIdx}.mp3`);
    const segPcm = outputMp3Path.replace(/\.mp3$/i, `_seg${sIdx}.pcm`);
    fs.writeFileSync(segMp3, Buffer.concat(audioChunks));
    execFileSync(ffmpegPath, [
      '-y', '-i', segMp3,
      '-f', 's16le', '-ac', '1', '-ar', String(SAMPLE_RATE),
      segPcm
    ], { stdio: 'ignore' });

    const segPcmBuf = fs.readFileSync(segPcm);
    try { fs.unlinkSync(segMp3); fs.unlinkSync(segPcm); } catch (e) {}

    // Trim trailing silence from the individual TTS segment so pauseAfterSec is exact
    const segTotalSamples = Math.floor(segPcmBuf.length / 2);
    let trimEndSample = segTotalSamples;
    while (trimEndSample > SAMPLE_RATE * 0.2) {
      const sVal = Math.abs(segPcmBuf.readInt16LE((trimEndSample - 1) * 2));
      if (sVal > 120) break;
      trimEndSample--;
    }
    trimEndSample = Math.min(segTotalSamples, trimEndSample + Math.round(0.06 * SAMPLE_RATE));
    const trimmedSegBuf = segPcmBuf.subarray(0, trimEndSample * 2);

    const segOffsetSec = cumSamples / SAMPLE_RATE;
    const segDurSec = trimEndSample / SAMPLE_RATE;

    for (const m of rawMeta) {
      if (m.Type === 'WordBoundary' && m.Data && m.Data.text) {
        allRawWords.push({
          text: m.Data.text.Text,
          segIndex: sIdx,
          rawStartSec: segOffsetSec + (m.Data.Offset / 1e7),
          rawDurSec: m.Data.Duration / 1e7,
          segEndSec: segOffsetSec + segDurSec
        });
      }
    }

    pcmBuffers.push(trimmedSegBuf);
    cumSamples += trimEndSample;

    const pauseSamples = Math.round(pauseAfterSec * SAMPLE_RATE);
    if (pauseSamples > 0) {
      pcmBuffers.push(Buffer.alloc(pauseSamples * 2, 0));
      cumSamples += pauseSamples;
    }
  }

  // Write unified PCM and encode to master MP3
  const masterPcmPath = outputMp3Path.replace(/\.mp3$/i, '_master.pcm');
  const fullPcmBuf = Buffer.concat(pcmBuffers);
  fs.writeFileSync(masterPcmPath, fullPcmBuf);
  execFileSync(ffmpegPath, [
    '-y',
    '-f', 's16le', '-ac', '1', '-ar', String(SAMPLE_RATE),
    '-i', masterPcmPath,
    '-c:a', 'libmp3lame', '-b:a', '128k',
    outputMp3Path
  ], { stdio: 'ignore' });

  // Extract 5ms acoustic features directly from the exact master PCM
  const totalSamples = Math.floor(fullPcmBuf.length / 2);
  const numFrames = Math.floor(totalSamples / HOP_SAMPLES);
  const rmsArr = new Float32Array(numFrames);
  const zcrArr = new Float32Array(numFrames);
  let maxRms = 1.0;

  for (let f = 0; f < numFrames; f++) {
    const base = f * HOP_SAMPLES;
    let sumSq = 0, zc = 0;
    let prev = fullPcmBuf.readInt16LE(base * 2);
    for (let i = 0; i < HOP_SAMPLES; i++) {
      const s = fullPcmBuf.readInt16LE((base + i) * 2);
      sumSq += s * s;
      if ((s >= 0 && prev < 0) || (s < 0 && prev >= 0)) zc++;
      prev = s;
    }
    const rms = Math.sqrt(sumSq / HOP_SAMPLES);
    rmsArr[f] = rms;
    zcrArr[f] = zc / HOP_SAMPLES;
    if (rms > maxRms) maxRms = rms;
  }
  try { fs.unlinkSync(masterPcmPath); } catch (e) {}

  const acoustics = {
    durationSec: totalSamples / SAMPLE_RATE,
    hopSec: HOP_SEC,
    numFrames,
    maxRms,
    rmsArr,
    zcrArr
  };

  // Refine word boundaries using 5ms PCM energy
  const words = [];
  for (const rw of allRawWords) {
    let startSec = Math.max(0, rw.rawStartSec + EDGE_MP3_PRE_OFFSET_SEC);
    let endSec = Math.min(rw.segEndSec, startSec + rw.rawDurSec + 0.035);

    const f0 = Math.max(0, Math.floor(startSec / HOP_SEC));
    const f1 = Math.min(numFrames - 1, Math.ceil(endSec / HOP_SEC));

    let firstActiveF = f0;
    while (firstActiveF < f1 && rmsArr[firstActiveF] < 55) firstActiveF++;
    let lastActiveF = f1;
    while (lastActiveF > firstActiveF + 4 && rmsArr[lastActiveF] < 45) lastActiveF--;

    const cleanW = rw.text.toLowerCase().replace(/[^a-záàâãéêíóôõúüç]/g, '');
    const startsWithVowel = /^[aáàâãeéêiíoóôõuúü]/.test(cleanW);
    const preHops = startsWithVowel ? 2 : 11;
    const refinedStartF = Math.max(f0, firstActiveF - preHops);
    const refinedEndF = Math.min(f1, lastActiveF + 3);

    if (refinedEndF > refinedStartF + 4) {
      startSec = refinedStartF * HOP_SEC;
      endSec = refinedEndF * HOP_SEC;
    }

    words.push({
      word: rw.text,
      segIndex: rw.segIndex,
      rawOffsetSec: Number(rw.rawStartSec.toFixed(4)),
      startSec: Number(startSec.toFixed(4)),
      endSec: Number(endSec.toFixed(4)),
      durationSec: Number((endSec - startSec).toFixed(4))
    });
  }

  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].endSec > words[i + 1].startSec) {
      words[i].endSec = words[i + 1].startSec;
      words[i].durationSec = Number((words[i].endSec - words[i].startSec).toFixed(4));
    }
  }

  const visemeEvents = [];
  let prevEndSec = 0.0;
  for (let wIdx = 0; wIdx < words.length; wIdx++) {
    const wInfo = words[wIdx];
    const gapSec = wInfo.startSec - prevEndSec;
    const rawSegs = wordToPhonemesPTBR(wInfo.word);
    const alignedSegs = alignWordPhonemesToPCM(rawSegs, wInfo.startSec, wInfo.endSec, acoustics);

    if (gapSec > 0.065) {
      const anticipate = (alignedSegs.length > 0 && ['MBP', 'FV', 'OU'].includes(alignedSegs[0].viseme)) ? 0.035 : 0.0;
      const restEnd = Math.max(prevEndSec, wInfo.startSec - anticipate);
      if (restEnd - prevEndSec > 0.025) {
        visemeEvents.push({
          word: '[PAUSA]',
          phoneme: 'sil',
          viseme: 'REST',
          acType: 'silence',
          startSec: Number(prevEndSec.toFixed(4)),
          endSec: Number(restEnd.toFixed(4)),
          startFrame30fps: Math.round(prevEndSec * 30),
          endFrame30fps: Math.round(restEnd * 30)
        });
      }
      if (anticipate > 0 && alignedSegs.length > 0) {
        alignedSegs[0].startSec = Number(restEnd.toFixed(4));
      }
    }

    wInfo.phonemes = alignedSegs;
    for (const seg of alignedSegs) {
      visemeEvents.push({
        word: wInfo.word,
        ...seg,
        startFrame30fps: Math.round(seg.startSec * 30),
        endFrame30fps: Math.round(seg.endSec * 30)
      });
    }
    prevEndSec = wInfo.endSec;
  }

  if (acoustics.durationSec - prevEndSec > 0.03) {
    visemeEvents.push({
      word: '[PAUSA_FINAL]',
      phoneme: 'sil',
      viseme: 'REST',
      acType: 'silence',
      startSec: Number(prevEndSec.toFixed(4)),
      endSec: Number(acoustics.durationSec.toFixed(4)),
      startFrame30fps: Math.round(prevEndSec * 30),
      endFrame30fps: Math.round(acoustics.durationSec * 30)
    });
  }

  return {
    text: segments.map((s) => s.text).join(' '),
    voice,
    durationSec: Number(acoustics.durationSec.toFixed(4)),
    totalFrames30fps: Math.ceil(acoustics.durationSec * 30),
    words,
    visemeEvents,
    acoustics
  };
}

module.exports = {
  synthesizeAndAlignPTBR,
  synthesizeMultiSentenceMasterPTBR,
  sampleVisemeAtTime,
  wordToPhonemesPTBR,
  extractAcousticFeatures
};
