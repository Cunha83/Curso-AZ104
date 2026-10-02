/**
 * RENDERIZADOR DE DIAGRAMAS E DEMOS NATIVAS (SVG -> PNG 1920x1080)
 * Aula 02 — Encontrando o ambiente certo e preparando o controle de custos (Revisão: 30/09/2026)
 *
 * Implementa todas as telas dos 9 blocos:
 * - A02-B01: Overlays sobre Lia (plano de peito)
 * - A02-B02: Diagrama Conta ➔ Diretório (Tenant) ➔ Assinatura (1:1 e 1:N)
 * - A02-B03: Demonstração do Portal (Diretório ativo, busca de Subscriptions, assinatura de laboratório)
 * - A02-B04: Demonstração de Filtros e Resource Groups (área de organização futura)
 * - A02-B05: Cartão editado sobre Lia: "Orçamento = acompanhamento e alerta" (sem cadeado ou interruptor)
 * - A02-B06: Demonstração de Criação de Budget (budget-az104-lab, mensal, 50, alertas 50%, 80%, 100%)
 * - A02-B07: Verificação do Orçamento salvo na listagem e detalhes revisados
 * - A02-B08: Pergunta curta com pausa de 5s e resposta explicada
 * - A02-B09: Lia com badges "Assinatura conferida" e "Orçamento configurado", com cartão de encerramento
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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

function renderHeaderSvg(blockCode, blockTitle, isDemo = false) {
  return `
    <g>
      <rect x="72" y="44" width="1776" height="76" rx="16" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
      <rect x="92" y="60" width="130" height="44" rx="10" fill="#0078D4"/>
      <text x="157" y="89" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">${escapeXml(blockCode)}</text>
      <text x="246" y="90" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#F8FAFC">${escapeXml(blockTitle)}</text>
      <rect x="1590" y="60" width="236" height="44" rx="10" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
      <text x="1708" y="88" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="600" fill="#94A3B8">${
        isDemo ? 'Demonstração do Portal' : 'Simulação didática'
      }</text>
    </g>
  `;
}

function buildEditorialSvgA02(state, unitText = '') {
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
    </defs>
  `;

  // ==================== OVERLAYS SOBRE LIA (A02-B01, A02-B05, A02-B09) ====================
  if (state.startsWith('b01_lia_') || state.startsWith('b05_lia_') || state.startsWith('b09_lia_')) {
    let overlayG = '';
    if (state === 'b01_lia_title') {
      overlayG = `
        <rect x="72" y="52" width="670" height="68" rx="14" fill="#09111E" fill-opacity="0.84" stroke="#0078D4" stroke-width="2"/>
        <text x="102" y="94" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#F8FAFC">Aula 02 • Encontrando o ambiente e preparando custos</text>
      `;
    } else if (state.startsWith('b05_lia_card_')) {
      // Cartão editado flutuante sobre Lia: "Orçamento = acompanhamento e alerta" (SEM cadeado ou interruptor!)
      const hlNoStop = state === 'b05_lia_card_no_auto_stop';
      const hlTiming = state === 'b05_lia_card_timing';
      const hlExample = state === 'b05_lia_card_didactic_example';

      overlayG = `
        <g>
          <rect x="1240" y="140" width="580" height="390" rx="22" fill="#09111E" fill-opacity="0.88" stroke="#38BDF8" stroke-width="3"/>
          <rect x="1270" y="170" width="520" height="56" rx="12" fill="#0078D4"/>
          <text x="1530" y="206" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="800" fill="#FFFFFF">Orçamento = Acompanhamento e Alerta</text>

          <text x="1280" y="270" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="700" fill="#E2E8F0">• Define período, valor planejado e alertas</text>

          <rect x="1270" y="295" width="520" height="74" rx="10" fill="${hlNoStop ? '#451A03' : 'transparent'}" stroke="${hlNoStop ? '#F59E0B' : 'transparent'}" stroke-width="2"/>
          <text x="1280" y="328" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="${hlNoStop ? '#FDE68A' : '#94A3B8'}">• Não desliga recursos automaticamente</text>
          <text x="1280" y="354" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="600" fill="${hlNoStop ? '#FDE68A' : '#64748B'}">  (consumo e cobrança podem continuar)</text>

          <text x="1280" y="405" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="${hlTiming ? '#38BDF8' : '#94A3B8'}">• Dados de custo e avisos não são instantâneos</text>

          <rect x="1270" y="430" width="520" height="66" rx="10" fill="${hlExample ? '#064E3B' : 'transparent'}" stroke="${hlExample ? '#10B981' : 'transparent'}" stroke-width="2"/>
          <text x="1280" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="${hlExample ? '#A7F3D0' : '#94A3B8'}">• Exemplo didático no laboratório: R$ 50,00</text>
          <text x="1280" y="488" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="600" fill="${hlExample ? '#6EE7B7' : '#64748B'}">  (sem promessa de gratuidade ou bloqueio)</text>
        </g>
      `;
    } else if (state.startsWith('b09_lia_status_summary')) {
      overlayG = `
        <g>
          <rect x="1360" y="140" width="460" height="110" rx="18" fill="#09111E" fill-opacity="0.88" stroke="#34D399" stroke-width="3"/>
          <text x="1590" y="205" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="800" fill="#34D399">✓ Assinatura conferida</text>

          <rect x="1360" y="270" width="460" height="110" rx="18" fill="#09111E" fill-opacity="0.88" stroke="#38BDF8" stroke-width="3"/>
          <text x="1590" y="335" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="800" fill="#38BDF8">✓ Orçamento configurado</text>
        </g>
      `;
    }

    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${overlayG}
      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== A02-B02 (DIAGRAMA: CONTA ➔ DIRETÓRIO ➔ ASSINATURA) ====================
  if (state.startsWith('b02_')) {
    const hlAccount = state === 'b02_step_1_account';
    const hlTenant = state === 'b02_step_2_directory_tenant';
    const hlSub = state === 'b02_step_3_subscription_access' || state === 'b02_step_4_subscription_costs';
    const showMultipleSubs = ['b02_step_6_multiple_subscriptions', 'b02_step_7_distinction_summary', 'b02_step_8_link_portal'].includes(state);

    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="url(#bgCanvas)"/>
      ${renderHeaderSvg('A02-B02', 'Conta, diretório e assinatura', false)}

      <!-- Bloco 1: Conta (Identidade) -->
      <g>
        <rect x="120" y="300" width="380" height="240" rx="20" fill="#1E293B" stroke="${hlAccount ? '#38BDF8' : '#475569'}" stroke-width="${hlAccount ? '4' : '2.5'}"/>
        <text x="310" y="380" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="800" fill="#F8FAFC">Conta</text>
        <text x="310" y="425" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="600" fill="#38BDF8">Quem está entrando</text>
        <text x="310" y="465" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="500" fill="#94A3B8">Ex: admin@oficinahorizonte</text>
      </g>

      <!-- Seta Conta -> Diretório -->
      <line x1="500" y1="420" x2="630" y2="420" stroke="#38BDF8" stroke-width="4" marker-end="url(#arrowCyan)"/>

      <!-- Bloco 2: Diretório / Tenant (Microsoft Entra ID) -->
      <g>
        <rect x="650" y="270" width="460" height="300" rx="22" fill="#0F243C" stroke="${hlTenant ? '#38BDF8' : '#0078D4'}" stroke-width="${hlTenant ? '4.5' : '3'}"/>
        <rect x="730" y="300" width="300" height="48" rx="10" fill="#0078D4"/>
        <text x="880" y="333" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#FFFFFF">Microsoft Entra ID</text>
        <text x="880" y="405" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="800" fill="#F8FAFC">Diretório (Tenant)</text>
        <text x="880" y="450" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#93C5FD">Reúne identidades da organização</text>
        <text x="880" y="490" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="500" fill="#CBD5E1">Autenticação centralizada</text>
      </g>

      <!-- Relação de Confiança Diretório -> Assinatura -->
      <line x1="1110" y1="360" x2="1240" y2="360" stroke="#34D399" stroke-width="4" marker-end="url(#arrowGreen)"/>
      <text x="1175" y="345" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#34D399">Confia</text>

      <!-- Bloco 3: Assinatura Principal (Laboratório) -->
      <g>
        <rect x="1260" y="240" width="540" height="230" rx="20" fill="#1E293B" stroke="${hlSub ? '#34D399' : '#475569'}" stroke-width="${hlSub ? '4.5' : '2.5'}"/>
        <text x="1530" y="310" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="800" fill="#F8FAFC">Assinatura de Laboratório</text>
        <text x="1530" y="352" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#34D399">sub-az104-lab</text>
        <text x="1530" y="395" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="500" fill="#E2E8F0">Organiza acesso a recursos e acompanhamento de custos</text>
      </g>

      ${
        showMultipleSubs
          ? `<!-- Assinatura Adicional (1 Diretório pode ter N Assinaturas) -->
             <line x1="1110" y1="460" x2="1240" y2="540" stroke="#64748B" stroke-width="3" stroke-dasharray="6 4" marker-end="url(#arrowGreen)"/>
             <g>
               <rect x="1260" y="495" width="540" height="150" rx="18" fill="#1E293B" stroke="#64748B" stroke-width="2"/>
               <text x="1530" y="555" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" fill="#94A3B8">Outra Assinatura (Ex: Produção)</text>
               <text x="1530" y="595" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="500" fill="#64748B">Mesmo diretório pode associar múltiplas assinaturas</text>
             </g>`
          : ''
      }

      <!-- Faixa de Conclusão e Distinção -->
      <rect x="220" y="730" width="1480" height="84" rx="16" fill="#0F172A" stroke="#FBBF24" stroke-width="2.5"/>
      <text x="960" y="782" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="700" fill="#FDE68A">Diretório (identidade no Entra ID) e Assinatura (recursos e custos) não são a mesma coisa</text>

      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== A02-B03 (DEMO: CONFERINDO O AMBIENTE NO PORTAL) ====================
  if (state.startsWith('b03_demo_')) {
    const hlDir = state === 'b03_demo_1_active_directory';
    const hlSearch = state === 'b03_demo_2_lab_subscription_search' || state === 'b03_demo_3_open_subscription';
    const hlSubName = state === 'b03_demo_4_observe_name';
    const showWarning = ['b03_demo_5_work_account_environments', 'b03_demo_6_avoid_prod_subscription', 'b03_demo_7_authorized_context', 'b03_demo_8_filters_visibility'].includes(state);

    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="#0A0E17"/>

      <!-- Barra Superior do Portal Azure -->
      <rect x="0" y="0" width="1920" height="70" fill="#181A1F" stroke="#2D3139" stroke-width="1.5"/>
      <text x="32" y="44" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="800" fill="#0078D4">Microsoft Azure</text>

      <!-- Barra de Pesquisa Central -->
      <rect x="480" y="14" width="700" height="42" rx="8" fill="#252932" stroke="${hlSearch ? '#38BDF8' : '#3D4450'}" stroke-width="${hlSearch ? '2.5' : '1'}"/>
      <text x="504" y="42" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="500" fill="${hlSearch ? '#38BDF8' : '#9CA3AF'}">🔍 Subscriptions</text>

      <!-- Perfil e Diretório Ativo à Direita -->
      <rect x="1460" y="12" width="430" height="46" rx="8" fill="${hlDir ? '#0C4A6E' : '#252932'}" stroke="${hlDir ? '#38BDF8' : '#3D4450'}" stroke-width="${hlDir ? '2.5' : '1'}"/>
      <text x="1480" y="42" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#F8FAFC">👤 Oficina Horizonte</text>
      <text x="1690" y="42" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="500" fill="#93C5FD">(Default Tenant)</text>

      ${renderHeaderSvg('A02-B03', 'Conferindo o ambiente no portal', true)}

      <!-- Janela Principal do Portal: Subscriptions -->
      <rect x="120" y="160" width="1680" height="580" rx="16" fill="#111318" stroke="#262B34" stroke-width="2"/>

      <!-- Breadcrumbs e Título da Página -->
      <text x="160" y="215" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="500" fill="#9CA3AF">Home &gt; Subscriptions</text>
      <text x="160" y="260" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="700" fill="#F8FAFC">Subscriptions</text>
      <text x="160" y="295" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="500" fill="#94A3B8">Selecione a assinatura autorizada para os exercícios práticos</text>

      <!-- Tabela de Assinaturas -->
      <rect x="160" y="325" width="1600" height="50" fill="#1C2028"/>
      <text x="190" y="357" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#CBD5E1">Subscription name</text>
      <text x="650" y="357" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#CBD5E1">Subscription ID</text>
      <text x="1180" y="357" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#CBD5E1">Status</text>
      <text x="1420" y="357" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#CBD5E1">My role</text>

      <!-- Linha 1: Assinatura de Laboratório (Selecionada) -->
      <rect x="160" y="380" width="1600" height="70" fill="${hlSubName ? '#0C4A6E' : '#151922'}" stroke="${hlSubName ? '#38BDF8' : '#2D333F'}" stroke-width="${hlSubName ? '2.5' : '1'}"/>
      <text x="190" y="424" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="800" fill="#38BDF8">🔑 sub-az104-lab</text>
      <text x="650" y="424" font-family="Courier New, monospace" font-size="18" font-weight="600" fill="#94A3B8">a1b2c3d4-8901-4efa-bc92-1234567890ab</text>
      <rect x="1180" y="402" width="90" height="32" rx="6" fill="#064E3B"/>
      <text x="1225" y="424" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#34D399">Active</text>
      <text x="1420" y="424" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="600" fill="#F8FAFC">Contributor</text>

      ${
        showWarning
          ? `<!-- Alerta de Ambiente: Evitar Produção -->
             <g>
               <rect x="160" y="490" width="1600" height="190" rx="14" fill="#1C1917" stroke="#F59E0B" stroke-width="2.5"/>
               <text x="200" y="540" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="800" fill="#F59E0B">⚠️ Atenção ao Contexto de Prática</text>
               <text x="200" y="585" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#F8FAFC">• Se você usa conta corporativa, certifique-se de selecionar a assinatura de laboratório ou sandbox.</text>
               <text x="200" y="625" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="600" fill="#FDE68A">• Nunca selecione uma assinatura de produção apenas porque ela apareceu na listagem do portal.</text>
               <text x="200" y="660" font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="500" fill="#94A3B8">Contexto selecionado para a aula: sub-az104-lab (ambiente de estudo controlado)</text>
             </g>`
          : `<!-- Informação da Assinatura -->
             <rect x="160" y="490" width="1600" height="140" rx="14" fill="#161B24" stroke="#334155" stroke-width="1.5"/>
             <text x="200" y="545" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="#F8FAFC">Assinatura autorizada para o laboratório AZ-104</text>
             <text x="200" y="585" font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="500" fill="#94A3B8">Permite organizar recursos e configurar o orçamento de acompanhamento de custos</text>`
      }

      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== A02-B04 (DEMO: FILTRO DE ASSINATURAS E RESOURCE GROUPS) ====================
  if (state.startsWith('b04_demo_')) {
    const hlFilter = state === 'b04_demo_1_subscription_filter' || state === 'b04_demo_2_empty_list_reasons';
    const hlRgSearch = state === 'b04_demo_4_search_resource_groups';

    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="#0A0E17"/>

      <!-- Barra Superior do Portal -->
      <rect x="0" y="0" width="1920" height="70" fill="#181A1F" stroke="#2D3139" stroke-width="1.5"/>
      <text x="32" y="44" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="800" fill="#0078D4">Microsoft Azure</text>
      <rect x="480" y="14" width="700" height="42" rx="8" fill="#252932" stroke="${hlRgSearch ? '#38BDF8' : '#3D4450'}" stroke-width="${hlRgSearch ? '2.5' : '1'}"/>
      <text x="504" y="42" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="500" fill="${hlRgSearch ? '#38BDF8' : '#9CA3AF'}">🔍 Resource groups</text>
      <text x="1560" y="44" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#F8FAFC">👤 Oficina Horizonte (Default Tenant)</text>

      ${renderHeaderSvg('A02-B04', 'Uma lista vazia não conta toda a história', true)}

      <rect x="120" y="150" width="1680" height="600" rx="16" fill="#111318" stroke="#262B34" stroke-width="2"/>

      <!-- Barra de Filtros Globais do Portal -->
      <g>
        <rect x="160" y="180" width="1600" height="74" rx="10" fill="#181D26" stroke="${hlFilter ? '#38BDF8' : '#334155'}" stroke-width="${hlFilter ? '3' : '1.5'}"/>
        <text x="190" y="225" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#94A3B8">Filtro global de assinaturas:</text>
        <rect x="440" y="196" width="340" height="42" rx="8" fill="#0C4A6E" stroke="#38BDF8" stroke-width="1.5"/>
        <text x="460" y="224" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#F8FAFC">sub-az104-lab (1 selecionada)</text>
      </g>

      <!-- Conteúdo da Página: Resource Groups -->
      <text x="160" y="300" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#F8FAFC">Grupos de Recursos (Resource groups)</text>

      <!-- Lista Inicial Vazia no Escopo -->
      <rect x="160" y="330" width="1600" height="230" rx="14" fill="#151922" stroke="#262D3B" stroke-width="1.5"/>
      <text x="960" y="420" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" fill="#94A3B8">Nenhum grupo de recursos encontrado neste filtro</text>
      <text x="960" y="465" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="500" fill="#64748B">Uma lista vazia pode ser consequência do filtro de assinaturas, do diretório ativo ou das permissões</text>

      <!-- Painel Informativo da Próxima Aula -->
      <rect x="160" y="590" width="1600" height="130" rx="14" fill="#0F172A" stroke="#38BDF8" stroke-width="2"/>
      <text x="200" y="640" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="800" fill="#38BDF8">Reconhecendo a área de Grupos de Recursos</text>
      <text x="200" y="680" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="500" fill="#F8FAFC">É nela que organizaremos os componentes do laboratório na próxima aula (sem criar recursos hoje)</text>

      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== A02-B06 (DEMO: CONFIGURANDO O ORÇAMENTO NO ESCOPO) ====================
  if (state.startsWith('b06_demo_')) {
    const hlScope = state === 'b06_demo_2_check_scope';
    const hlName = state === 'b06_demo_3_budget_name';
    const hlAmount = state === 'b06_demo_4_period_and_amount' || state === 'b06_demo_5_currency_match';
    const hlAlerts = state === 'b06_demo_6_alert_thresholds';
    const hlRecipient = state === 'b06_demo_7_controlled_recipient';

    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="#0A0E17"/>

      <rect x="0" y="0" width="1920" height="70" fill="#181A1F" stroke="#2D3139" stroke-width="1.5"/>
      <text x="32" y="44" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="800" fill="#0078D4">Microsoft Azure</text>
      <text x="240" y="44" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="500" fill="#9CA3AF">Cost Management &gt; Budgets &gt; Create budget</text>

      ${renderHeaderSvg('A02-B06', 'Configurando com atenção ao escopo', true)}

      <rect x="120" y="150" width="1680" height="600" rx="16" fill="#111318" stroke="#262B34" stroke-width="2"/>

      <!-- Campo 1: Escopo (Subscription) -->
      <g>
        <rect x="160" y="180" width="1600" height="76" rx="10" fill="#181D26" stroke="${hlScope ? '#38BDF8' : '#334155'}" stroke-width="${hlScope ? '3' : '1.5'}"/>
        <text x="190" y="225" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#94A3B8">Escopo do orçamento:</text>
        <rect x="420" y="198" width="460" height="42" rx="8" fill="#0C4A6E" stroke="#38BDF8" stroke-width="1.5"/>
        <text x="440" y="226" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#F8FAFC">Assinatura: sub-az104-lab</text>
      </g>

      <!-- Coluna Esquerda: Dados Básicos do Orçamento -->
      <g>
        <rect x="160" y="280" width="770" height="340" rx="14" fill="#151922" stroke="#2D333F" stroke-width="1.5"/>
        <text x="190" y="325" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="#F8FAFC">Detalhes do orçamento</text>

        <!-- Nome -->
        <text x="190" y="375" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="600" fill="#94A3B8">Nome do orçamento (Budget name)</text>
        <rect x="190" y="390" width="710" height="46" rx="8" fill="#1F2430" stroke="${hlName ? '#38BDF8' : '#3B4252'}" stroke-width="${hlName ? '2.5' : '1'}"/>
        <text x="210" y="420" font-family="Courier New, monospace" font-size="20" font-weight="700" fill="#38BDF8">budget-az104-lab</text>

        <!-- Período e Valor -->
        <text x="190" y="475" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="600" fill="#94A3B8">Período de redefinição</text>
        <rect x="190" y="490" width="330" height="46" rx="8" fill="#1F2430" stroke="#3B4252" stroke-width="1"/>
        <text x="210" y="520" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="600" fill="#F8FAFC">Mensal (Monthly)</text>

        <text x="560" y="475" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="600" fill="#94A3B8">Valor planejado (Budget amount)</text>
        <rect x="560" y="490" width="340" height="46" rx="8" fill="#1F2430" stroke="${hlAmount ? '#38BDF8' : '#3B4252'}" stroke-width="${hlAmount ? '2.5' : '1'}"/>
        <text x="580" y="520" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="#34D399">50.00 (moeda do ambiente)</text>

        <text x="190" y="585" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="500" fill="#94A3B8">Valores e datas configurados conforme a seção de laboratório</text>
      </g>

      <!-- Coluna Direita: Regras de Alerta e Destinatário -->
      <g>
        <rect x="970" y="280" width="790" height="340" rx="14" fill="#151922" stroke="#2D333F" stroke-width="1.5"/>
        <text x="1000" y="325" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="#F8FAFC">Condições de Alerta</text>

        <!-- Três Percentuais Reais -->
        <g>
          <rect x="1000" y="350" width="730" height="140" rx="10" fill="#1F2430" stroke="${hlAlerts ? '#FBBF24' : '#3B4252'}" stroke-width="${hlAlerts ? '2.5' : '1'}"/>
          <text x="1030" y="385" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#FDE68A">• Alerta 1: 50% do valor planejado (Consumo real atingindo 25,00)</text>
          <text x="1030" y="425" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#FDE68A">• Alerta 2: 80% do valor planejado (Consumo real atingindo 40,00)</text>
          <text x="1030" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#FDE68A">• Alerta 3: 100% do valor planejado (Consumo real atingindo 50,00)</text>
        </g>

        <!-- Destinatário Controlado -->
        <text x="1000" y="525" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="600" fill="#94A3B8">Destinatário dos alertas de e-mail (Email recipients)</text>
        <rect x="1000" y="540" width="730" height="46" rx="8" fill="#1F2430" stroke="${hlRecipient ? '#38BDF8' : '#3B4252'}" stroke-width="${hlRecipient ? '2.5' : '1'}"/>
        <text x="1020" y="570" font-family="Courier New, monospace" font-size="18" font-weight="600" fill="#38BDF8">admin@oficinahorizonte.com.br (endereço controlado)</text>
      </g>

      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== A02-B07 (DEMO: VERIFICANDO O QUE FOI FEITO) ====================
  if (state.startsWith('b07_demo_')) {
    const showNotice = ['b07_demo_4_check_permissions', 'b07_demo_5_new_subscriptions_timing', 'b07_demo_6_follow_demo', 'b07_demo_7_no_paid_resources_needed'].includes(state);

    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="#0A0E17"/>

      <rect x="0" y="0" width="1920" height="70" fill="#181A1F" stroke="#2D3139" stroke-width="1.5"/>
      <text x="32" y="44" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="800" fill="#0078D4">Microsoft Azure</text>
      <text x="240" y="44" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="500" fill="#9CA3AF">Cost Management &gt; Budgets</text>

      ${renderHeaderSvg('A02-B07', 'Verificando o que foi feito', true)}

      <rect x="120" y="150" width="1680" height="600" rx="16" fill="#111318" stroke="#262B34" stroke-width="2"/>
      <text x="160" y="205" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#F8FAFC">Orçamentos salvos (Scope: sub-az104-lab)</text>

      <!-- Tabela de Orçamentos -->
      <rect x="160" y="240" width="1600" height="50" fill="#1C2028"/>
      <text x="190" y="272" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#CBD5E1">Name</text>
      <text x="560" y="272" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#CBD5E1">Reset period</text>
      <text x="820" y="272" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#CBD5E1">Budget amount</text>
      <text x="1100" y="272" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#CBD5E1">Progress / Status</text>
      <text x="1450" y="272" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#CBD5E1">Alerts</text>

      <!-- Linha 1: budget-az104-lab -->
      <rect x="160" y="295" width="1600" height="74" fill="#0C4A6E" stroke="#38BDF8" stroke-width="2"/>
      <text x="190" y="340" font-family="Courier New, monospace" font-size="22" font-weight="800" fill="#38BDF8">budget-az104-lab</text>
      <text x="560" y="340" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="600" fill="#F8FAFC">Monthly</text>
      <text x="820" y="340" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="#34D399">50.00</text>
      <rect x="1100" y="318" width="120" height="30" rx="6" fill="#064E3B"/>
      <text x="1160" y="339" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#34D399">Healthy (0%)</text>
      <text x="1450" y="340" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="600" fill="#FDE68A">50%, 80%, 100%</text>

      ${
        showNotice
          ? `<!-- Nota sobre Assinaturas Recentes e Permissões -->
             <g>
               <rect x="160" y="410" width="1600" height="230" rx="14" fill="#1C1917" stroke="#F59E0B" stroke-width="2"/>
               <text x="200" y="460" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="800" fill="#F59E0B">Nota sobre Disponibilidade e Assinaturas Novas</text>
               <text x="200" y="505" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="600" fill="#F8FAFC">• Assinaturas recém-criadas podem levar algumas horas para habilitar as APIs de Gerenciamento de Custos.</text>
               <text x="200" y="545" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="600" fill="#F8FAFC">• É necessário papel como Cost Management Contributor ou Contributor no escopo da assinatura.</text>
               <text x="200" y="585" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="600" fill="#FDE68A">• Não é necessário criar recursos pagos ou gastar créditos para acompanhar e compreender o fluxo.</text>
             </g>`
          : `<!-- Painel de Confirmação da Configuração -->
             <rect x="160" y="410" width="1600" height="190" rx="14" fill="#161B24" stroke="#334155" stroke-width="1.5"/>
             <text x="200" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="#34D399">✓ Orçamento verificado e ativo na assinatura</text>
             <text x="200" y="510" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="600" fill="#F8FAFC">Período: Mensal  •  Valor: 50.00  •  Destinatário: admin@oficinahorizonte.com.br</text>
             <text x="200" y="555" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="500" fill="#94A3B8">Salvar o formulário e conferir a listagem garante que o acompanhamento está pronto antes de criar recursos</text>`
      }

      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== A02-B08 (DIAGRAMA: UMA DECISÃO PARA CONFERIR O ENTENDIMENTO) ====================
  if (state.startsWith('b08_')) {
    const showAnswer = ['b08_step_3_answer_no', 'b08_step_4_action_required', 'b08_step_5_avoid_expectation', 'b08_step_6_confirm_checkpoints'].includes(state);
    const isPause = state === 'b08_step_2_question_pause_hold';

    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="url(#bgCanvas)"/>
      ${renderHeaderSvg('A02-B08', 'Uma decisão para conferir o entendimento', false)}

      <!-- Quadro da Pergunta -->
      <rect x="180" y="180" width="1560" height="300" rx="24" fill="#1E293B" stroke="#38BDF8" stroke-width="3.5"/>
      <text x="960" y="245" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" fill="#38BDF8">Decisão sobre o controle de custos</text>
      <text x="960" y="315" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700" fill="#F8FAFC">Imagine que o consumo ultrapassou o valor do orçamento.</text>
      <text x="960" y="395" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="800" fill="#FDE68A">O orçamento, sozinho, interrompe o funcionamento dos recursos?</text>
      <text x="960" y="445" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="600" fill="#94A3B8">${
        isPause ? 'Pausa para reflexão (5 segundos)...' : 'Pense no papel do alerta antes de responder.'
      }</text>

      <!-- Quadro da Resposta Revelada -->
      ${
        showAnswer
          ? `<g>
               <rect x="180" y="520" width="1560" height="290" rx="24" fill="#0F292A" stroke="#34D399" stroke-width="4"/>
               <text x="960" y="590" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="800" fill="#34D399">Não. O orçamento acompanha e emite alertas.</text>
               <text x="960" y="655" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="600" fill="#F8FAFC">Interromper ou ajustar recursos exige outra ação apropriada do administrador.</text>
               <text x="960" y="720" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="600" fill="#A7F3D0">Esse detalhe evita a falsa expectativa de bloqueio financeiro automático.</text>
             </g>`
          : ''
      }

      ${renderSubtitleLayerSvg(unitText)}
    </svg>`;
  }

  // ==================== CARTÃO DE ENCERRAMENTO (FINAL DE A02-B09) ====================
  if (state === 'b09_closing_card') {
    return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      ${bgDefs}
      <rect width="1920" height="1080" fill="url(#bgCanvas)"/>
      <rect x="220" y="240" width="1480" height="600" rx="32" fill="#1E293B" stroke="#0078D4" stroke-width="4"/>
      <rect x="760" y="320" width="400" height="60" rx="14" fill="#0078D4"/>
      <text x="960" y="360" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">Aula 02 Concluída</text>
      <text x="960" y="470" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="800" fill="#F8FAFC">Encontrando o ambiente certo e preparando</text>
      <text x="960" y="535" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="36" font-weight="700" fill="#94A3B8">o controle de custos</text>
      <line x1="460" y1="600" x2="1460" y2="600" stroke="#334155" stroke-width="2"/>
      <text x="960" y="675" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" fill="#38BDF8">Próxima aula: Criando e organizando o Grupo de Recursos do laboratório</text>
    </svg>`;
  }

  return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    ${bgDefs}
    <rect width="1920" height="1080" fill="url(#bgCanvas)"/>
    ${renderSubtitleLayerSvg(unitText)}
  </svg>`;
}

async function renderEditorialPngA02(state, unitText, outputPath) {
  const svg = buildEditorialSvgA02(state, unitText);
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  return outputPath;
}

module.exports = {
  splitSubtitleTwoLines,
  buildEditorialSvgA02,
  renderEditorialPngA02
};
