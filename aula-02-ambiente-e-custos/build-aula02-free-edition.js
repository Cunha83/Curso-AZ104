/**
 * PIPELINE DE PRODUÇÃO BROADCAST DIDÁTICA 100% GRATUITA (R$ 0,00)
 * Aula 02 — Encontrando o ambiente certo e preparando o controle de custos (Revisão: 30/09/2026)
 *
 * Características desta edição:
 * 1. Custo Zero (100% Free): Sem dependência de faturamento de nuvem, APIs pagas ou cotas.
 * 2. Voz e Locução de Estúdio: Gerada via Microsoft Edge Neural Speech (pt-BR-FranciscaNeural),
 *    com dicção perfeita, cadência didática e áudio estéreo cristalino (AAC 48 kHz).
 * 3. Identidade Visual da Lia Preservada: Baseada no retrato aprovado da Lia (assets/lia_veo_live_anchor.png)
 *    com plano cinematográfico de peito e rosto (chest-up), mãos 100% fora do quadro, movimento suave
 *    de câmera (Ken Burns push-in) e overlays gráficos dinâmicos.
 * 4. Demonstrações e Diagramas em 1080p Nativo: Todos os 9 blocos com interfaces reais do Azure,
 *    distinção Diretório vs. Assinatura (sub-az104-lab), filtros de Resource Groups, configuração de
 *    orçamento (budget-az104-lab, mensal, 50.00, alertas 50%, 80%, 100% para admin@oficinahorizonte.com.br).
 * 5. Pausa Didática de 5s no Bloco 8 (U53) e Cartão de Encerramento no Bloco 9 (U62).
 * 6. Todas as 62 falas integrais (654 palavras) preservadas sem abreviação.
 * 7. Legendas sincronizadas (aula02-legendas-ptbr.srt) e 9 blocos individuais + filme completo.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const {
  BLOCKS,
  UNITS,
  generateClipsCsv
} = require('./aula02-roteiro-unidades');

const {
  splitSubtitleTwoLines,
  renderEditorialPngA02
} = require('./render-editorial-diagrams-a02');

const ROOT_DIR = __dirname;
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const VIDEOS_DIR = path.join(ROOT_DIR, 'videos');
const WORK_DIR = path.join(ROOT_DIR, 'temp_build', 'free_edition_v1');
const ANCHOR_IMG_PATH = path.join(ASSETS_DIR, 'lia_veo_live_anchor.png');

if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true });

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
  return 4.0;
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
 * Etapa 1: Gera todo o áudio de estúdio de alta fidelidade para as 62 unidades via Edge Neural Speech (100% Free)
 */
async function generateAllAudioUnits() {
  console.log('[Áudio Neural 100% Free] Inicializando motor de síntese neural da Microsoft...');
  const tts = new MsEdgeTTS();
  await tts.setMetadata('pt-BR-FranciscaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  for (let i = 0; i < UNITS.length; i++) {
    const unit = UNITS[i];
    const outAudioPath = path.join(WORK_DIR, `audio_${unit.id}.mp3`);

    if (fs.existsSync(outAudioPath) && fs.statSync(outAudioPath).size > 1000) {
      continue;
    }

    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { audioStream } = tts.toStream(unit.text);
        await new Promise((resolve, reject) => {
          const ws = fs.createWriteStream(outAudioPath);
          audioStream.pipe(ws);
          ws.on('finish', resolve);
          ws.on('error', reject);
        });
        if (fs.existsSync(outAudioPath) && fs.statSync(outAudioPath).size > 1000) {
          success = true;
          break;
        }
      } catch (err) {
        console.warn(`[Áudio Neural] Tentativa ${attempt} falhou em ${unit.id}: ${err.message}. Retentando...`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    if (!success) {
      throw new Error(`Falha ao gerar áudio para a unidade ${unit.id}`);
    }
  }

  console.log(`[Áudio Neural 100% Free] Todas as ${UNITS.length} unidades de fala foram geradas com sucesso!`);
}

/**
 * Etapa 2: Renderiza os visuais (diagramas, demos e Lia em plano cinematográfico) e masteriza os clipes e blocos
 */
async function renderAndMasterAllUnits() {
  const masteredUnitClips = [];
  const srtEntries = [];
  let globalTimelineSec = 0;

  for (let i = 0; i < UNITS.length; i++) {
    const unit = UNITS[i];
    const audioPath = path.join(WORK_DIR, `audio_${unit.id}.mp3`);
    const audioDur = probeDurationSec(audioPath);
    const extraPause = Math.max(0, unit.pauseAfterSec || 0);

    // Renderiza a tela visual em PNG 1920x1080 nativo
    const pngPath = path.join(WORK_DIR, `visual_${unit.id}.png`);
    await renderEditorialPngA02(unit.diagramState, unit.text, pngPath);

    const unitMasterPath = path.join(WORK_DIR, `master_${unit.id}.mp4`);

    if (unit.visualMode === 'LIA') {
      // Plano Cinematográfico da Lia:
      // Imagem aprovada (assets/lia_veo_live_anchor.png) com zoom suave de câmera (push-in sutil)
      // sobreposta pelo HUD com o título ou cartões pedagógicos da aula
      const totalDur = audioDur + extraPause;
      const zoomFactor = 'min(zoom+0.0003,1.03)';
      const vfFilter =
        `[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,` +
        `zoompan=z='${zoomFactor}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=300:s=1920x1080:fps=30[lia];` +
        `[lia][1:v]overlay=0:0[vout]`;

      const afFilter = extraPause > 0.05 ? `apad=pad_dur=${extraPause.toFixed(2)}` : 'anull';

      execFileSync(
        ffmpegPath,
        [
          '-y',
          '-loop', '1',
          '-t', totalDur.toFixed(3),
          '-i', ANCHOR_IMG_PATH,
          '-loop', '1',
          '-t', totalDur.toFixed(3),
          '-i', pngPath,
          '-i', audioPath,
          '-filter_complex', vfFilter,
          '-map', '[vout]',
          '-map', '2:a',
          '-af', afFilter,
          '-t', totalDur.toFixed(3),
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
      // Caso especial: Pausa didática reflexiva de 5 segundos no Bloco 8 (U53)
      if (unit.id === 'U53' && extraPause >= 4.5) {
        const pausePngPath = path.join(WORK_DIR, `visual_U53_pause.png`);
        await renderEditorialPngA02('b08_step_2_question_pause_hold', '', pausePngPath);

        const part1Path = path.join(WORK_DIR, `master_U53_part1.mp4`);
        const part2Path = path.join(WORK_DIR, `master_U53_part2.mp4`);

        // Parte 1: Pergunta falada
        execFileSync(
          ffmpegPath,
          [
            '-y',
            '-loop', '1',
            '-t', audioDur.toFixed(3),
            '-i', pngPath,
            '-i', audioPath,
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
        const totalDur = audioDur + extraPause;
        const afFilter = extraPause > 0.05 ? `apad=pad_dur=${extraPause.toFixed(2)}` : 'anull';
        execFileSync(
          ffmpegPath,
          [
            '-y',
            '-loop', '1',
            '-t', totalDur.toFixed(3),
            '-i', pngPath,
            '-i', audioPath,
            '-map', '0:v',
            '-map', '1:a',
            '-vf', 'scale=1920:1080,fps=30',
            '-af', afFilter,
            '-t', totalDur.toFixed(3),
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
    const subStart = globalTimelineSec + 0.10;
    const subEnd = globalTimelineSec + Math.min(finalClipDur - 0.10, audioDur);
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

    console.log(`[Master 1080p] ${unit.id} (${unit.blockId}, ${unit.visualMode}) -> ${finalClipDur.toFixed(2)}s`);
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

  // 4. Concatena o filme unificado completo da Aula 02
  const fullListPath = path.join(WORK_DIR, 'concat_full_aula02_free.txt');
  fs.writeFileSync(
    fullListPath,
    blockFiles.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n')
  );

  const fullCanonicalPath = path.join(VIDEOS_DIR, 'aula-02-ambiente-e-custos-completa.mp4');
  const fullVeoAliasPath = path.join(VIDEOS_DIR, 'aula-02-ambiente-e-custos-completa-veo.mp4');
  execFileSync(
    ffmpegPath,
    ['-y', '-f', 'concat', '-safe', '0', '-i', fullListPath, '-c', 'copy', fullCanonicalPath],
    { stdio: 'pipe' }
  );
  fs.copyFileSync(fullCanonicalPath, fullVeoAliasPath);

  // 5. Salva as legendas SRT sincronizadas
  const srtContent = srtEntries
    .map((e) => `${e.index}\n${e.start} --> ${e.end}\n${e.text}\n`)
    .join('\n');
  const srtPath = path.join(ROOT_DIR, 'aula02-legendas-ptbr.srt');
  fs.writeFileSync(srtPath, srtContent, 'utf8');

  // 6. Atualiza o arquivo de metadados Aula_02_Clipes.csv
  generateClipsCsv(path.join(ROOT_DIR, 'Aula_02_Clipes.csv'));

  console.log(`\n=============================================================`);
  console.log(`AULA 02 (EDIÇÃO 100% GRATUITA) CONCLUÍDA COM SUCESSO!`);
  console.log(`Filme Completo (1920x1080 @ 30fps): ${fullCanonicalPath}`);
  console.log(`Duração Total Final: ${(globalTimelineSec / 60).toFixed(2)} min (${globalTimelineSec.toFixed(1)}s)`);
  console.log(`Legendas SRT: ${srtPath}`);
  console.log(`Total de Blocos: 9 blocos gerados`);
  console.log(`Custo Total de Produção: R$ 0,00`);
  console.log(`=============================================================\n`);
}

async function main() {
  await generateAllAudioUnits();
  await renderAndMasterAllUnits();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[Erro Fatal Pipeline 100% Free Aula 02]:', err);
    process.exit(1);
  });
}

module.exports = {
  generateAllAudioUnits,
  renderAndMasterAllUnits
};
