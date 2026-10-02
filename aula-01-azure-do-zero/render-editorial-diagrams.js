/**
 * RENDERIZADOR DE DIAGRAMAS E CAMADAS EDITORIAIS NATIVAS (SVG -> PNG 1920x1080)
 * Aula 01 — Azure do zero: entendendo o ambiente que vamos administrar (Revisão: 30/09/2026)
 *
 * Regras aplicadas:
 * - Todo texto, seta, diagrama e rótulo é produzido nativamente via SVG em 1920x1080.
 * - Uma relação destacada por vez, acompanhando a explicação.
 * - Legendas em camada separada na base (até 2 linhas), sem exibir parágrafos inteiros.
 * - Identificação "Simulação didática" nas telas esquemáticas.
 * - Em A01-B07 (Tela: LIA), destaca somente Acessos, Dados ou Configurações, um termo por vez.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(__dirname, 'assets');
const RAW_OFICINA_IMG = 'C:\\Users\\AutoMolasFort\\.gemini\\antigravity\\brain\\32389ba2-f7ed-4b46-8109-58ba7a11cd4f\\oficina_horizonte_recepcao_sem_texto_1790793300704.jpg';
const CLEAN_OFICINA_PATH = path.join(ASSETS_DIR, 'oficina_horizonte_recepcao_sem_texto.png');

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Divide uma frase curta (8-15 palavras) em até 2 linhas equilibradas para a camada de legenda
 */
function splitSubtitleTwoLines(text) {
  const clean = String(text || '').trim();
  if (clean.length <= 54) return [clean, ''];
  const words = clean.split(/\s+/);
  const mid = Math.ceil(words.length / 2);
  let bestSplit = mid;
  let minDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(' ');
    const l2 = words.slice(i).join(' ');
    const diff = Math.abs(l1.length - l2.length);
    if (diff < minDiff) {
      minDiff = diff;
      bestSplit = i;
    }
  }
  return [words.slice(0, bestSplit).join(' '), words.slice(bestSplit).join(' ')];
}

/**
 * Prepara a imagem da recepção da Oficina Horizonte 100% livre de texto e de logos (remove marca traseira do monitor)
 */
async function ensureCleanOficinaImage() {
  if (fs.existsSync(CLEAN_OFICINA_PATH)) {
    return CLEAN_OFICINA_PATH;
  }
  if (!fs.existsSync(RAW_OFICINA_IMG)) {
    throw new Error(`Imagem base da oficina não encontrada: ${RAW_OFICINA_IMG}`);
  }
  const resizedBuf = await sharp(RAW_OFICINA_IMG)
    .resize(1920, 1080, { fit: 'cover' })
    .png()
    .toBuffer();

  // Extrai uma faixa azul-clara limpa do próprio dorso do monitor (à esquerda do ícone) e aplica
  const cleanStrip = await sharp(resizedBuf)
    .extract({ left: 1142, top: 550, width: 10, height: 115 })
    .resize(54, 115, { fit: 'fill' })
    .blur(1.5)
    .png()
    .toBuffer();

  await sharp(resizedBuf)
    .composite([{ input: cleanStrip, left: 1148, top: 550 }])
    .png()
    .toFile(CLEAN_OFICINA_PATH);
  return CLEAN_OFICINA_PATH;
}

/**
 * Renderiza a camada de legenda inferior (até 2 linhas)
 */
function renderSubtitleLayerSvg(subtitleText) {
  if (!subtitleText) return '';
  const [line1, line2] = splitSubtitleTwoLines(subtitleText);
  const boxHeight = line2 ? 96 : 62;
  const boxY = line2 ? 956 : 974;
  return `
    <g>
      <rect x="260" y="${boxY}" width="1400" height="${boxHeight}" rx="14" fill="#070D19" fill-opacity="0.84" stroke="#334155" stroke-width="1.5"/>
      ${
        line2
          ? `<text x="960" y="${boxY + 38}" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="27" font-weight="600" fill="#F8FAFC">${escapeXml(line1)}</text>
             <text x="960" y="${boxY + 74}" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="27" font-weight="600" fill="#F8FAFC">${escapeXml(line2)}</text>`
          : `<text x="960" y="${boxY + 40}" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="27" font-weight="600" fill="#F8FAFC">${escapeXml(line1)}</text>`
      }
    </g>
  `;
}

/**
 * Renderiza cabeçalho padrão dos diagramas
 */
function renderDiagramHeaderSvg(blockCode, blockTitle, showSimBadge = true) {
  return `
    <g>
      <rect x="72" y="44" width="1776" height="76" rx="16" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <rect x="92" y="60" width="130" height="44" rx="10" fill="#0078D4"/>
      <text x="157" y="89" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">${escapeXml(blockCode)}</text>
      <text x="246" y="90" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#F8FAFC">${escapeXml(blockTitle)}</text>
      ${
        showSimBadge
          ? `<rect x="1590" y="60" width="236" height="44" rx="10" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
             <text x="1708" y="88" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="600" fill="#94A3B8">Simulação didática</text>`
          : ''
      }
    </g>
  `;
}

/**
 * Gera o SVG completo (1920x1080) para estados de DIAGRAMA (tela cheia) ou OVERLAY (transparente sobre Lia/Oficina)
 */
function buildEditorialSvg(state, unitText = '') {
  const bgDefs = `
    <defs>
      <linearGradient id="bgCanvas" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#09111E"/>
        <stop offset="100%" stop-color="#0F1C30"/>
      </linearGradient>
      <linearGradient id="azureBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0078D4" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#005A9E" stop-opacity="0.08"/>
      </linearGradient>
      <marker id="arrowCyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 8 5 L 0 9 z" fill="#38BDF8"/>
      </marker>
      <marker id="arrowGreen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 8 5 L 0 9 z" fill="#34D399"/>
      </marker>
      <marker id="arrowMuted" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748B"/>
      </marker>
    </defs>
  `;

  // ==================== OVERLAYS SOBRE LIA OU OFICINA ====================
  if (state.startsWith('b01_lia_') || state.startsWith('b07_lia_') || state.startsWith('b09_lia_')) {
    let badgeSvg = '';
    if (state === 'b01_lia_intro') {
      badgeSvg = `
        <g>
          <rect x="72" y="52" width="640" height="68" rx="14" fill="#09111E" fill-opacity="0.82" stroke="#0078D4" stroke-width="2"/>
          <text x="102" y="94" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#F8FAFC">Aula 01 • Entendendo o ambiente que vamos administrar</text>
        </g>
      `;
    } else if (state === 'b07_lia_acessos') {
      badgeSvg = `
        <g>
          <rect x="1380" y="140" width="440" height="130" rx="18" fill="#09111E" fill-opacity="0.88" stroke="#38BDF8" stroke-width="3"/>
          <text x="1600" y="192" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="600" fill="#94A3B8">Responsabilidade da equipe</text>
          <text x="1600" y="242" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="800" fill="#38BDF8">Acessos</text>
        </g>
      `;
    } else if (state === 'b07_lia_dados') {
      badgeSvg = `
        <g>
          <rect x="1380" y="140" width="440" height="130" rx="18" fill="#09111E" fill-opacity="0.88" stroke="#34D399" stroke-width="3"/>
          <text x="1600" y="192" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="600" fill="#94A3B8">Responsabilidade da equipe</text>
          <text x="1600" y="242" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="800" fill="#34D399">Dados</text>
        </g>
      `;
    } else if (state === 'b07_lia_configuracoes') {
      badgeSvg = `
        <g>
          <rect x="1380" y="140" width="440" height="130" rx="18" fill="#09111E" fill-opacity="0.88" stroke="#FBBF24" stroke-width="3"/>
          <text x="1600" y="192" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="600" fill="#94A3B8">Responsabilidade da equipe</text>
          <text x="1600" y="242" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="800" fill="#FBBF24">Configurações</text>
        </g>
      `;
    }

    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${badgeSvg}
      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  if (state.startsWith('b01_oficina_')) {
    // Na ilustração da oficina: manter sem texto sobre a cena, apenas a camada separada de legenda na base
    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== BLOCO A01-B02 & B03 & B09 (CAMINHO DA INFORMAÇÃO E AZURE) ====================
  if (state.startsWith('b02_') || state.startsWith('b03_') || state === 'b09_initial_path_recap') {
    const isB03 = state.startsWith('b03_');
    const isB09 = state === 'b09_initial_path_recap';
    const blockCode = isB09 ? 'A01-B09' : isB03 ? 'A01-B03' : 'A01-B02';
    const blockTitle = isB09
      ? 'Caminho da informação e divisão do trabalho'
      : isB03
      ? 'Onde entra o Azure'
      : 'O caminho da informação';

    const showApp = true;
    const showStorage = !['b02_step_1_pc_to_app', 'b02_step_2_app_focus'].includes(state);
    const showServer = !['b02_step_1_pc_to_app', 'b02_step_2_app_focus', 'b02_step_3_app_to_storage'].includes(state);
    const showServerTypes = state === 'b02_step_5_server_types';
    const showResponse = ['b02_step_6_response_to_pc', 'b02_step_7_internet', 'b02_step_8_real_infra', 'b02_step_9_question'].includes(state) || isB03 || isB09;
    const showInternet = ['b02_step_7_internet', 'b02_step_8_real_infra', 'b02_step_9_question'].includes(state) || isB03 || isB09;
    const showRealInfraBox = ['b02_step_8_real_infra', 'b02_step_9_question'].includes(state);
    const showAzureBox = isB03 || isB09;

    const hlPc = state === 'b02_step_1_pc_to_app' || state === 'b02_step_6_response_to_pc';
    const hlApp = state === 'b02_step_1_pc_to_app' || state === 'b02_step_2_app_focus';
    const hlStorage = state === 'b02_step_3_app_to_storage';
    const hlServer = state === 'b02_step_4_server_base' || state === 'b02_step_5_server_types';
    const hlInternet = state === 'b02_step_7_internet';

    // Coordenadas dos nós
    const pcX = 120, pcY = 330, pcW = 330, pcH = 210;
    const netX = 540, netY = 355, netW = 240, netH = 160;
    const appX = 910, appY = 330, appW = 360, appH = 210;
    const stoX = 1420, stoY = 330, stoW = 360, stoH = 210;

    let bottomCallout = '';
    if (showServerTypes) {
      bottomCallout = `
        <g>
          <rect x="910" y="715" width="410" height="72" rx="12" fill="#1E293B" stroke="#38BDF8" stroke-width="2.5"/>
          <text x="1115" y="760" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="700" fill="#F8FAFC">Máquina física</text>
          <rect x="1370" y="715" width="410" height="72" rx="12" fill="#1E293B" stroke="#38BDF8" stroke-width="2.5"/>
          <text x="1575" y="760" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="700" fill="#F8FAFC">Ambiente virtualizado</text>
        </g>
      `;
    } else if (state === 'b02_step_9_question') {
      bottomCallout = `
        <rect x="360" y="755" width="1200" height="84" rx="16" fill="#1E293B" stroke="#FBBF24" stroke-width="3"/>
        <text x="960" y="807" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="29" font-weight="700" fill="#FDE68A">Quem mantém essa infraestrutura e quais partes a oficina administra?</text>
      `;
    } else if (state === 'b03_step_2_azure_services') {
      bottomCallout = `
        <g>
          <rect x="860" y="750" width="940" height="82" rx="14" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5"/>
          <text x="1330" y="800" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="700" fill="#38BDF8">Executar aplicações   •   Armazenar dados   •   Conectar ambientes</text>
        </g>
      `;
    } else if (state === 'b03_step_4_admin_needed' || state === 'b03_step_5_admin_tasks') {
      bottomCallout = `
        <g>
          <rect x="240" y="750" width="1440" height="86" rx="16" fill="#1E293B" stroke="#34D399" stroke-width="2.5"/>
          <text x="960" y="803" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#F8FAFC">Responsabilidade da administração: Configurações  •  Controle de acessos  •  Acompanhamento</text>
        </g>
      `;
    } else if (state === 'b03_step_6_cost_watch' || state === 'b03_step_7_no_auto_savings') {
      bottomCallout = `
        <g>
          <rect x="310" y="750" width="1300" height="86" rx="16" fill="#1E293B" stroke="#FBBF24" stroke-width="2.5"/>
          <text x="960" y="803" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#FDE68A">Acompanhamento de custos: conforme recursos escolhidos e consumo</text>
        </g>
      `;
    } else if (state === 'b03_step_8_work_division' || isB09) {
      bottomCallout = `
        <g>
          <rect x="340" y="750" width="1240" height="86" rx="16" fill="#1E293B" stroke="#38BDF8" stroke-width="2.5"/>
          <text x="960" y="803" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#F8FAFC">Divisão do trabalho: O que a solução precisa e quem administra cada parte</text>
        </g>
      `;
    }

    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="url(#bgCanvas)"/>
      ${renderDiagramHeaderSvg(blockCode, blockTitle, true)}

      ${
        showRealInfraBox
          ? `<g>
               <rect x="855" y="210" width="975" height="515" rx="24" fill="#0F172A" fill-opacity="0.55" stroke="#94A3B8" stroke-width="3" stroke-dasharray="12 8"/>
               <text x="1342" y="262" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#E2E8F0">Infraestrutura</text>
             </g>`
          : ''
      }

      ${
        showAzureBox
          ? `<g>
               <rect x="855" y="195" width="975" height="530" rx="24" fill="url(#azureBoxGrad)" stroke="#0078D4" stroke-width="4"/>
               <rect x="885" y="218" width="240" height="52" rx="12" fill="#0078D4"/>
               <text x="1005" y="253" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">Azure</text>
               <text x="1150" y="253" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="600" fill="#93C5FD">Plataforma de nuvem da Microsoft</text>
             </g>`
          : ''
      }

      <!-- Nó 1: Computador da Ana -->
      <g>
        <rect x="${pcX}" y="${pcY}" width="${pcW}" height="${pcH}" rx="20" fill="#1E293B" stroke="${hlPc ? '#38BDF8' : '#475569'}" stroke-width="${hlPc ? '4' : '2.5'}"/>
        <text x="${pcX + pcW / 2}" y="${pcY + 85}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="800" fill="#F8FAFC">Computador</text>
        <text x="${pcX + pcW / 2}" y="${pcY + 128}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="600" fill="#94A3B8">Ana • Oficina Horizonte</text>
      </g>

      <!-- Conexão Computador -> Aplicação (com ou sem Internet) -->
      ${
        showInternet
          ? `<g>
               <line x1="${pcX + pcW}" y1="${pcY + 80}" x2="${netX - 10}" y2="${pcY + 80}" stroke="#38BDF8" stroke-width="4" marker-end="url(#arrowCyan)"/>
               <line x1="${netX + netW}" y1="${pcY + 80}" x2="${appX - 10}" y2="${pcY + 80}" stroke="#38BDF8" stroke-width="4" marker-end="url(#arrowCyan)"/>
               <line x1="${appX}" y1="${pcY + 140}" x2="${netX + netW + 10}" y2="${pcY + 140}" stroke="#34D399" stroke-width="3.5" marker-end="url(#arrowGreen)"/>
               <line x1="${netX}" y1="${pcY + 140}" x2="${pcX + pcW + 10}" y2="${pcY + 140}" stroke="#34D399" stroke-width="3.5" marker-end="url(#arrowGreen)"/>
               <rect x="${netX}" y="${netY}" width="${netW}" height="${netH}" rx="20" fill="#0F172A" stroke="${hlInternet ? '#38BDF8' : '#64748B'}" stroke-width="${hlInternet ? '4' : '2.5'}"/>
               <text x="${netX + netW / 2}" y="${netY + 75}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="800" fill="#38BDF8">Internet</text>
               <text x="${netX + netW / 2}" y="${netY + 115}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="600" fill="#94A3B8">Acesso remoto</text>
             </g>`
          : `<g>
               <line x1="${pcX + pcW}" y1="${pcY + 80}" x2="${appX - 12}" y2="${pcY + 80}" stroke="#38BDF8" stroke-width="4" marker-end="url(#arrowCyan)"/>
               <text x="${(pcX + pcW + appX) / 2}" y="${pcY + 62}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="#38BDF8">Solicitação</text>
               ${
                 showResponse
                   ? `<line x1="${appX}" y1="${pcY + 145}" x2="${pcX + pcW + 12}" y2="${pcY + 145}" stroke="#34D399" stroke-width="4" marker-end="url(#arrowGreen)"/>
                      <text x="${(pcX + pcW + appX) / 2}" y="${pcY + 180}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="#34D399">Resposta</text>`
                   : ''
               }
             </g>`
      }

      <!-- Nó 2: Aplicação -->
      ${
        showApp
          ? `<g>
               <rect x="${appX}" y="${appY}" width="${appW}" height="${appH}" rx="20" fill="#1E293B" stroke="${hlApp ? '#38BDF8' : '#475569'}" stroke-width="${hlApp ? '4.5' : '2.5'}"/>
               <text x="${appX + appW / 2}" y="${appY + 85}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="800" fill="#F8FAFC">Aplicação</text>
               <text x="${appX + appW / 2}" y="${appY + 128}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="600" fill="#94A3B8">Processa o atendimento</text>
             </g>`
          : ''
      }

      <!-- Nó 3: Armazenamento -->
      ${
        showStorage
          ? `<g>
               <line x1="${appX + appW}" y1="${appY + 105}" x2="${stoX - 12}" y2="${stoY + 105}" stroke="#38BDF8" stroke-width="4" marker-end="url(#arrowCyan)"/>
               <text x="${(appX + appW + stoX) / 2}" y="${appY + 85}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="700" fill="#38BDF8">Grava dados</text>
               <rect x="${stoX}" y="${stoY}" width="${stoW}" height="${stoH}" rx="20" fill="#1E293B" stroke="${hlStorage ? '#38BDF8' : '#475569'}" stroke-width="${hlStorage ? '4.5' : '2.5'}"/>
               <text x="${stoX + stoW / 2}" y="${stoY + 85}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="800" fill="#F8FAFC">Armazenamento</text>
               <text x="${stoX + stoW / 2}" y="${stoY + 128}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="600" fill="#94A3B8">Ordem de serviço salva</text>
             </g>`
          : ''
      }

      <!-- Base: Servidor -->
      ${
        showServer
          ? `<g>
               <rect x="${appX}" y="580" width="870" height="110" rx="18" fill="#1E293B" stroke="${hlServer ? '#38BDF8' : '#475569'}" stroke-width="${hlServer ? '4.5' : '2.5'}"/>
               <text x="${appX + 435}" y="630" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="800" fill="#F8FAFC">Servidor</text>
               <text x="${appX + 435}" y="668" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#94A3B8">Fornece a capacidade de execução</text>
             </g>`
          : ''
      }

      ${bottomCallout}
      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== BLOCO A01-B04 & B05 (CAMADAS: VM / IaaS vs App Service / PaaS) ====================
  if (state.startsWith('b04_') || state.startsWith('b05_')) {
    const isB05 = state.startsWith('b05_');
    const blockCode = isB05 ? 'A01-B05' : 'A01-B04';
    const blockTitle = isB05
      ? 'Quando a plataforma assume parte do trabalho'
      : 'Quando a equipe administra o sistema operacional';

    const showIaaSLabel = ['b04_step_5_iaas_label', 'b04_step_6_azure_vm', 'b04_step_7_flexibility_tradeoff', 'b04_step_8_link_paas'].includes(state);
    const showVmLabel = state !== 'b04_step_1_os_requirement' && !isB05;
    const showPaaSLabel = ['b05_step_4_paas_label', 'b05_step_5_team_code_config_access', 'b05_step_6_choice_criteria', 'b05_step_7_link_saas'].includes(state);
    const showAppServiceLabel = isB05 && state !== 'b05_step_1_managed_platform';

    // Em IaaS: Equipe cuida de Aplicação + Sistema Operacional; Microsoft cuida de Infraestrutura
    // Em PaaS: Equipe cuida de Aplicação (código, configurações, acessos); Microsoft cuida de Plataforma/SO + Infraestrutura
    const osManagedByMicrosoft = isB05 && state !== 'b05_step_1_managed_platform';

    const topBadgeText = isB05
      ? showPaaSLabel
        ? 'PaaS — Plataforma como Serviço'
        : 'Plataforma Gerenciada'
      : showIaaSLabel
      ? 'IaaS — Infraestrutura como Serviço'
      : 'Modelo com controle do Sistema Operacional';

    const subServiceText = isB05
      ? showAppServiceLabel
        ? 'Exemplo no Azure: Azure App Service'
        : ''
      : showVmLabel
      ? 'Exemplo no Azure: Máquina Virtual (VM)'
      : '';

    let footerNote = '';
    if (state === 'b04_step_7_flexibility_tradeoff') {
      footerNote = 'Mais flexibilidade técnica  •  Mais tarefas de administração para a equipe';
    } else if (state === 'b04_step_8_link_paas') {
      footerNote = 'E se a oficina quiser publicar a aplicação sem administrar o sistema operacional?';
    } else if (state === 'b05_step_5_team_code_config_access') {
      footerNote = 'A equipe continua cuidando do código, das configurações e dos acessos';
    } else if (state === 'b05_step_6_choice_criteria') {
      footerNote = 'A escolha depende do que a aplicação precisa e do trabalho que a equipe assumirá';
    } else if (state === 'b05_step_7_link_saas') {
      footerNote = 'E quando a oficina não quer desenvolver nem hospedar uma aplicação própria?';
    }

    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="url(#bgCanvas)"/>
      ${renderDiagramHeaderSvg(blockCode, blockTitle, true)}

      <!-- Título do Modelo (IaaS / PaaS) -->
      <rect x="380" y="150" width="1160" height="100" rx="18" fill="#1E293B" stroke="${isB05 ? '#38BDF8' : '#0078D4'}" stroke-width="3"/>
      <text x="960" y="196" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="800" fill="#F8FAFC">${escapeXml(topBadgeText)}</text>
      ${
        subServiceText
          ? `<text x="960" y="234" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="600" fill="#38BDF8">${escapeXml(subServiceText)}</text>`
          : ''
      }

      <!-- Camada 1: Aplicação -->
      <rect x="420" y="290" width="680" height="130" rx="18" fill="#0F292A" stroke="#34D399" stroke-width="3.5"/>
      <text x="760" y="348" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="800" fill="#F8FAFC">Aplicação</text>
      <text x="760" y="390" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#6EE7B7">${
        isB05 ? 'Código, configurações e acessos' : 'Sistema da Oficina Horizonte'
      }</text>

      <!-- Camada 2: Sistema Operacional -->
      <rect x="420" y="450" width="680" height="130" rx="18" fill="${osManagedByMicrosoft ? '#0F243C' : '#0F292A'}" stroke="${
      osManagedByMicrosoft ? '#0078D4' : '#34D399'
    }" stroke-width="3.5"/>
      <text x="760" y="508" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="800" fill="#F8FAFC">Sistema Operacional</text>
      <text x="760" y="550" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="${
        osManagedByMicrosoft ? '#93C5FD' : '#6EE7B7'
      }">${osManagedByMicrosoft ? 'Gerenciado pela plataforma (Azure)' : 'Configurado e mantido pela equipe'}</text>

      <!-- Camada 3: Infraestrutura -->
      <rect x="420" y="610" width="680" height="130" rx="18" fill="#0F243C" stroke="#0078D4" stroke-width="3.5"/>
      <text x="760" y="668" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="800" fill="#F8FAFC">Infraestrutura</text>
      <text x="760" y="710" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#93C5FD">Servidores físicos e estrutura de nuvem</text>

      <!-- Chaves de Responsabilidade à direita -->
      ${
        osManagedByMicrosoft
          ? `<!-- PaaS: Equipe (Aplicação) | Microsoft (SO + Infra) -->
             <rect x="1150" y="290" width="430" height="130" rx="18" fill="#1E293B" stroke="#34D399" stroke-width="3"/>
             <text x="1365" y="348" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="800" fill="#34D399">Equipe da Oficina</text>
             <text x="1365" y="388" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#E2E8F0">Administra a aplicação</text>

             <rect x="1150" y="450" width="430" height="290" rx="18" fill="#1E293B" stroke="#0078D4" stroke-width="3"/>
             <text x="1365" y="582" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="800" fill="#38BDF8">Microsoft (Azure)</text>
             <text x="1365" y="622" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#E2E8F0">Cuida da plataforma e infra</text>`
          : `<!-- IaaS: Equipe (Aplicação + SO) | Microsoft (Infra) -->
             <rect x="1150" y="290" width="430" height="290" rx="18" fill="#1E293B" stroke="#34D399" stroke-width="3"/>
             <text x="1365" y="422" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="800" fill="#34D399">Equipe da Oficina</text>
             <text x="1365" y="462" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#E2E8F0">Administra aplicação e SO</text>

             <rect x="1150" y="610" width="430" height="130" rx="18" fill="#1E293B" stroke="#0078D4" stroke-width="3"/>
             <text x="1365" y="668" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="800" fill="#38BDF8">Microsoft (Azure)</text>
             <text x="1365" y="708" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#E2E8F0">Cuida da infraestrutura física</text>`
      }

      ${
        footerNote
          ? `<rect x="300" y="780" width="1320" height="72" rx="14" fill="#1E293B" stroke="#FBBF24" stroke-width="2.5"/>
             <text x="960" y="826" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" fill="#FDE68A">${escapeXml(footerNote)}</text>`
          : ''
      }

      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== BLOCO A01-B06 (SOFTWARE PRONTO / SaaS) ====================
  if (state.startsWith('b06_')) {
    const showComparison = ['b06_step_5_three_models_diff', 'b06_step_6_users_info_remain', 'b06_step_7_link_ana'].includes(state);
    const showM365 = state !== 'b06_step_1_ready_software';
    const showNote = ['b06_step_4_m365_note', 'b06_step_5_three_models_diff', 'b06_step_6_users_info_remain', 'b06_step_7_link_ana'].includes(state);

    if (!showComparison) {
      return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
        ${bgDefs}
        <rect width="1920" height="1080" fill="url(#bgCanvas)"/>
        ${renderDiagramHeaderSvg('A01-B06', 'Quando a empresa usa um software pronto', true)}

        <!-- Cartão Único: Software pronto -->
        <rect x="460" y="230" width="1000" height="480" rx="28" fill="#1E293B" stroke="#38BDF8" stroke-width="4"/>
        <rect x="730" y="275" width="460" height="58" rx="14" fill="#0078D4"/>
        <text x="960" y="314" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">SaaS — Software como Serviço</text>

        <text x="960" y="415" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="48" font-weight="800" fill="#F8FAFC">Software pronto</text>
        <text x="960" y="468" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="600" fill="#94A3B8">Contratado e utilizado como serviço</text>

        ${
          showM365
            ? `<rect x="640" y="515" width="640" height="86" rx="16" fill="#0F172A" stroke="#34D399" stroke-width="3"/>
               <text x="960" y="570" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="800" fill="#34D399">Exemplo: Microsoft 365</text>`
            : ''
        }

        ${
          showNote
            ? `<text x="960" y="658" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#FDE68A">Exemplo para comparação entre modelos (não implantado neste laboratório Azure)</text>`
            : ''
        }

        ${renderSubtitleLayerSvg(unitText)}
      </svg>`;
    }

    // Visão comparativa enxuta dos 3 modelos (IaaS, PaaS, SaaS) e o que continua com a oficina
    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="url(#bgCanvas)"/>
      ${renderDiagramHeaderSvg('A01-B06', 'Comparação dos três modelos de serviço', true)}

      <!-- Coluna 1: IaaS -->
      <rect x="140" y="180" width="500" height="510" rx="22" fill="#1E293B" stroke="#475569" stroke-width="2.5"/>
      <text x="390" y="240" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="800" fill="#F8FAFC">IaaS</text>
      <text x="390" y="278" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#38BDF8">Máquinas Virtuais (VM)</text>
      <rect x="180" y="320" width="420" height="90" rx="12" fill="#0F292A" stroke="#34D399" stroke-width="2.5"/>
      <text x="390" y="375" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#6EE7B7">Equipe: Aplicação + SO</text>
      <rect x="180" y="430" width="420" height="90" rx="12" fill="#0F243C" stroke="#0078D4" stroke-width="2.5"/>
      <text x="390" y="485" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#93C5FD">Microsoft: Infraestrutura</text>

      <!-- Coluna 2: PaaS -->
      <rect x="710" y="180" width="500" height="510" rx="22" fill="#1E293B" stroke="#475569" stroke-width="2.5"/>
      <text x="960" y="240" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="800" fill="#F8FAFC">PaaS</text>
      <text x="960" y="278" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#38BDF8">Azure App Service</text>
      <rect x="750" y="320" width="420" height="90" rx="12" fill="#0F292A" stroke="#34D399" stroke-width="2.5"/>
      <text x="960" y="375" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#6EE7B7">Equipe: Aplicação e Código</text>
      <rect x="750" y="430" width="420" height="90" rx="12" fill="#0F243C" stroke="#0078D4" stroke-width="2.5"/>
      <text x="960" y="485" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#93C5FD">Microsoft: Plataforma + Infra</text>

      <!-- Coluna 3: SaaS -->
      <rect x="1280" y="180" width="500" height="510" rx="22" fill="#1E293B" stroke="#38BDF8" stroke-width="3.5"/>
      <text x="1530" y="240" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="800" fill="#F8FAFC">SaaS</text>
      <text x="1530" y="278" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#38BDF8">Software pronto (Microsoft 365)</text>
      <rect x="1320" y="320" width="420" height="90" rx="12" fill="#0F292A" stroke="#34D399" stroke-width="2.5"/>
      <text x="1530" y="375" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#6EE7B7">Equipe: Uso, Acessos e Dados</text>
      <rect x="1320" y="430" width="420" height="90" rx="12" fill="#0F243C" stroke="#0078D4" stroke-width="2.5"/>
      <text x="1530" y="485" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#93C5FD">Fornecedor: Software completo</text>

      <!-- Faixa de responsabilidade permanente -->
      <rect x="140" y="735" width="1640" height="92" rx="18" fill="#0F172A" stroke="#FBBF24" stroke-width="3"/>
      <text x="960" y="791" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="29" font-weight="800" fill="#FDE68A">Em todos os modelos: cuidados com Usuários, Acessos e Informações continuam com a Oficina</text>

      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== BLOCO A01-B07 (CARTÃO DE SÍNTESE DO ADMINISTRADOR — U51) ====================
  if (state === 'b07_admin_synthesis_card') {
    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="url(#bgCanvas)"/>
      ${renderDiagramHeaderSvg('A01-B07', 'O que continua sendo responsabilidade da equipe', true)}

      <rect x="160" y="240" width="480" height="340" rx="22" fill="#1E293B" stroke="#38BDF8" stroke-width="3.5"/>
      <text x="400" y="380" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="800" fill="#38BDF8">Acessos</text>
      <text x="400" y="440" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="600" fill="#CBD5E1">Permissões da Ana e revisão</text>

      <rect x="720" y="240" width="480" height="340" rx="22" fill="#1E293B" stroke="#34D399" stroke-width="3.5"/>
      <text x="960" y="380" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="800" fill="#34D399">Dados</text>
      <text x="960" y="440" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="600" fill="#CBD5E1">Proteção das ordens de serviço</text>

      <rect x="1280" y="240" width="480" height="340" rx="22" fill="#1E293B" stroke="#FBBF24" stroke-width="3.5"/>
      <text x="1520" y="380" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="800" fill="#FBBF24">Configurações</text>
      <text x="1520" y="440" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="600" fill="#CBD5E1">Acompanhamento e ajustes</text>

      <rect x="260" y="660" width="1400" height="110" rx="20" fill="#0F172A" stroke="#0078D4" stroke-width="3"/>
      <text x="960" y="726" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="700" fill="#F8FAFC">O administrador acompanha o ambiente, investiga problemas e ajusta recursos</text>

      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== BLOCO A01-B08 (PERGUNTA E RESPOSTA — SEM ALTERNATIVAS DECORADAS) ====================
  if (state.startsWith('b08_')) {
    const showAnswer = ['b08_step_5_answer_iaas', 'b08_step_6_not_always_iaas', 'b08_step_7_matches_need', 'b08_step_8_context_changes'].includes(state);
    const isPause = state === 'b08_step_4_think_pause_hold';

    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="url(#bgCanvas)"/>
      ${renderDiagramHeaderSvg('A01-B08', 'Aplicando a comparação', true)}

      <!-- Quadro da Pergunta em Texto Nativo -->
      <rect x="180" y="175" width="1560" height="320" rx="24" fill="#1E293B" stroke="#38BDF8" stroke-width="3.5"/>
      <text x="960" y="245" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" fill="#38BDF8">Decisão na Oficina Horizonte</text>
      <text x="960" y="315" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700" fill="#F8FAFC">O programa exige que a equipe instale componentes no próprio sistema operacional.</text>
      <text x="960" y="395" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="800" fill="#FDE68A">Qual modelo discutido oferece esse tipo de controle de forma mais direta?</text>
      <text x="960" y="455" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="600" fill="#94A3B8">${
        isPause ? 'Pausa para reflexão (5 segundos)...' : 'Considere quem administra o sistema operacional.'
      }</text>

      <!-- Quadro da Resposta (revelado após a pausa de 5s) -->
      ${
        showAnswer
          ? `<g>
               <rect x="180" y="540" width="1560" height="280" rx="24" fill="#0F292A" stroke="#34D399" stroke-width="4"/>
               <text x="960" y="615" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="800" fill="#34D399">Máquina Virtual no modelo IaaS (Infraestrutura como Serviço)</text>
               <text x="960" y="685" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="29" font-weight="600" fill="#F8FAFC">Atende diretamente à necessidade apresentada: administrar o sistema operacional.</text>
               <text x="960" y="750" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="600" fill="#A7F3D0">Se a necessidade mudar, a comparação entre os serviços também pode mudar.</text>
             </g>`
          : ''
      }

      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== CARTÃO DE ENCERRAMENTO (FINAL DE A01-B09) ====================
  if (state === 'b09_closing_card') {
    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="url(#bgCanvas)"/>
      <rect x="220" y="240" width="1480" height="600" rx="32" fill="#1E293B" stroke="#0078D4" stroke-width="4"/>
      <rect x="760" y="320" width="400" height="60" rx="14" fill="#0078D4"/>
      <text x="960" y="360" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">Aula 01 Concluída</text>
      <text x="960" y="470" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="800" fill="#F8FAFC">Azure do zero: entendendo o ambiente</text>
      <text x="960" y="535" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="700" fill="#94A3B8">que vamos administrar</text>
      <line x1="460" y1="600" x2="1460" y2="600" stroke="#334155" stroke-width="2"/>
      <text x="960" y="675" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#38BDF8">Próxima aula: Portal do Azure, assinatura e acompanhamento de custos</text>
    </svg>`;
  }

  return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    ${bgDefs}
    <rect width="1920" height="1080" fill="url(#bgCanvas)"/>
    ${renderSubtitleLayerSvg(unitText)}
  </svg>`;
}

/**
 * Renderiza um frame PNG 1920x1080 para um estado de diagrama ou overlay
 */
async function renderEditorialPng(state, unitText, outputPath, isOverlay = false) {
  const svg = buildEditorialSvg(state, unitText);
  if (!isOverlay && state.startsWith('b01_oficina_')) {
    const cleanOficina = await ensureCleanOficinaImage();
    await sharp(cleanOficina)
      .resize(1920, 1080)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toFile(outputPath);
    return outputPath;
  }
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  return outputPath;
}

module.exports = {
  splitSubtitleTwoLines,
  ensureCleanOficinaImage,
  buildEditorialSvg,
  renderEditorialPng
};
