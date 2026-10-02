const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets');
const RIG_DIR = path.join(ASSETS_DIR, 'rig_v3');

const RIG_FILES = {
  // Retrocompatibilidade numérica
  0: 'close_rest.jpg',
  1: 'close_ei.jpg',
  2: 'close_a.jpg',
  // Estados Close-Up Fonéticos PT-BR + Piscada + Transições Geométricas
  close_rest: 'close_rest.jpg',
  close_smile: 'close_smile.jpg',
  close_mbp: 'close_mbp.jpg',
  close_fv: 'close_fv.jpg',
  close_ou_50: 'close_ou_50.jpg',
  close_ou: 'close_ou.jpg',
  close_ei_25: 'close_ei_25.jpg',
  close_ei_50: 'close_ei_50.jpg',
  close_ei: 'close_ei.jpg',
  close_a_75: 'close_a_75.jpg',
  close_a: 'close_a.jpg',
  close_blink: 'close_blink.jpg',
  // Estados Plano Médio — Repouso Natural (braço direito relaxado ao lado do corpo)
  med_rest_closed: 'med_rest_closed.jpg',
  med_rest_mbp: 'med_rest_mbp.jpg',
  med_rest_fv: 'med_rest_fv.jpg',
  med_rest_ou: 'med_rest_ou.jpg',
  med_rest_ei: 'med_rest_ei.jpg',
  med_rest_a: 'med_rest_a.jpg',
  med_rest_smile: 'med_rest_smile.jpg',
  med_rest_blink: 'med_rest_blink.jpg',
  // Estados Plano Médio — Preparação / Retorno de Gesto (arco contínuo sem fantasma)
  med_prep_palm: 'med_prep_palm.jpg',
  med_prep_enum1: 'med_prep_enum1.jpg',
  med_prep_enum2: 'med_prep_enum2.jpg',
  // Estados Plano Médio — Mão Aberta Explicativa (PALM) com 6 visemas + blink
  med_palm_closed: 'med_palm_closed.jpg',
  med_palm_mbp: 'med_palm_mbp.jpg',
  med_palm_fv: 'med_palm_fv.jpg',
  med_palm_ou: 'med_palm_ou.jpg',
  med_palm_ei: 'med_palm_ei.jpg',
  med_palm_a: 'med_palm_a.jpg',
  med_palm_blink: 'med_palm_blink.jpg',
  med_palm_mid: 'med_palm_ei.jpg',
  med_palm_open: 'med_palm_a.jpg',
  // Estados Plano Médio — Enumeração 1 (ENUM1) com 6 visemas + blink
  med_enum1_closed: 'med_enum1_closed.jpg',
  med_enum1_mbp: 'med_enum1_mbp.jpg',
  med_enum1_fv: 'med_enum1_fv.jpg',
  med_enum1_ou: 'med_enum1_ou.jpg',
  med_enum1_ei: 'med_enum1_ei.jpg',
  med_enum1_a: 'med_enum1_a.jpg',
  med_enum1_blink: 'med_enum1_blink.jpg',
  med_enum1_mid: 'med_enum1_ei.jpg',
  med_enum1_open: 'med_enum1_a.jpg',
  // Estados Plano Médio — Enumeração 2 (ENUM2) com 6 visemas + blink
  med_enum2_closed: 'med_enum2_closed.jpg',
  med_enum2_mbp: 'med_enum2_mbp.jpg',
  med_enum2_fv: 'med_enum2_fv.jpg',
  med_enum2_ou: 'med_enum2_ou.jpg',
  med_enum2_ei: 'med_enum2_ei.jpg',
  med_enum2_a: 'med_enum2_a.jpg',
  med_enum2_blink: 'med_enum2_blink.jpg',
  med_enum2_mid: 'med_enum2_ei.jpg',
  med_enum2_open: 'med_enum2_a.jpg',
  // Estados Plano Médio — Indicação à Esquerda (POINT_LEFT + gazeLeft) com 6 visemas + blink
  med_point_screen: 'med_point_closed.jpg',
  med_point_closed: 'med_point_closed.jpg',
  med_point_mbp: 'med_point_mbp.jpg',
  med_point_fv: 'med_point_fv.jpg',
  med_point_ou: 'med_point_ou.jpg',
  med_point_ei: 'med_point_ei.jpg',
  med_point_a: 'med_point_a.jpg',
  med_point_blink: 'med_point_blink.jpg'
};

const LIA_B64 = {};
for (const [stateKey, fileName] of Object.entries(RIG_FILES)) {
  const fullPath = path.join(RIG_DIR, fileName);
  if (fs.existsSync(fullPath)) {
    const buf = fs.readFileSync(fullPath);
    LIA_B64[stateKey] = `data:image/jpeg;base64,${buf.toString('base64')}`;
  }
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renderiza o Avatar 3D Estilizado da apresentadora Lia (Rig v2 com visemas fonéticos PT-BR, piscadas e gestos em plano médio)
 * preservando proporção 1:1 sem cortes nos punhos ou dedos.
 */
function renderLiaAvatarSVG(pos, mouthState = 'close_rest') {
  let x = 1535, y = 515, w = 340, h = 388;
  if (pos === 'left') {
    x = 45; y = 515; w = 340; h = 388;
  } else if (pos === 'hero') {
    x = 1320; y = 220; w = 540; h = 590;
  }

  const cx = x + w / 2;
  const imgSize = w - 16;
  const imgX = x + 8;
  const imgY = y + 8;
  const imgH = h - 56;
  const dataUri = LIA_B64[mouthState] || LIA_B64.close_rest || LIA_B64[0];
  const clipId = `liaClip_${pos}_${String(mouthState).replace(/[^a-zA-Z0-9_]/g, '')}`;

  return `
    <g id="lia-avatar-card">
      <defs>
        <clipPath id="${clipId}">
          <rect x="${imgX}" y="${imgY}" width="${imgSize}" height="${imgH}" rx="14"/>
        </clipPath>
      </defs>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#09182D" stroke="#00D4FF" stroke-width="${pos === 'hero' ? 3.5 : 2.5}"/>
      <image href="${dataUri}" x="${imgX}" y="${imgY}" width="${imgSize}" height="${imgH}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})"/>
      <rect x="${imgX}" y="${imgY}" width="${imgSize}" height="${imgH}" rx="14" fill="none" stroke="#00D4FF" stroke-opacity="0.45" stroke-width="1.5"/>

      <!-- Crachá da Lia -->
      <rect x="${x + 14}" y="${y + h - 42}" width="${w - 28}" height="32" rx="8" fill="#0F1E36" stroke="#00D4FF" stroke-width="1.2"/>
      <text x="${cx}" y="${y + h - 20}" font-family="Segoe UI, Arial, sans-serif" font-size="${pos === 'hero' ? 18 : 15}" font-weight="bold" fill="#00D4FF" text-anchor="middle">Lia • Instrutora Técnica Azure</text>
    </g>
  `;
}

/**
 * Renderiza o conteúdo de fundo (80% da tela) de acordo com a cena e o sub-estado visual
 */
function renderSceneContentSVG(sceneId, stepFocus) {
  // Cena 1: Abertura com problema concreto (Oficina Horizonte: Ana, Bruno, Custos + 3 perguntas)
  if (sceneId === 1) {
    const g1 = stepFocus === 'os' ? 'stroke="#00D4FF" stroke-width="3.5"' : 'stroke="#334155" stroke-width="1.5"';
    const q1 = stepFocus === 'q1' ? 'stroke="#00D4FF" stroke-width="4" fill="#16355D"' : 'stroke="#334155" stroke-width="1.5" fill="#132542"';
    const q2 = stepFocus === 'q2' ? 'stroke="#00D4FF" stroke-width="4" fill="#16355D"' : 'stroke="#334155" stroke-width="1.5" fill="#132542"';
    const q3 = stepFocus === 'q3' ? 'stroke="#00D4FF" stroke-width="4" fill="#16355D"' : 'stroke="#334155" stroke-width="1.5" fill="#132542"';

    if (stepFocus === 'hero') {
      return `
        <g>
          <rect x="70" y="130" width="1210" height="720" rx="20" fill="#0F1E36" stroke="#00D4FF" stroke-width="2.5"/>
          <rect x="110" y="175" width="460" height="38" rx="19" fill="#00D4FF" fill-opacity="0.18" stroke="#00D4FF" stroke-width="1.5"/>
          <text x="340" y="200" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#00D4FF" text-anchor="middle">MÓDULO 01 • FUNDAMENTOS, IDENTIDADE E GOVERNANÇA</text>

          <text x="110" y="280" font-family="Segoe UI, Arial, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF">Aula 01 — Azure do zero:</text>
          <text x="110" y="340" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="bold" fill="#00D4FF">Da nuvem ao trabalho do administrador</text>

          <rect x="110" y="390" width="1130" height="115" rx="12" fill="#15294A" stroke="#38BDF8" stroke-width="1.5"/>
          <text x="140" y="432" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#FBBF24">Primeira sigla da aula — AZ-104:</text>
          <text x="140" y="472" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#E2E8F0">Código oficial do exame de certificação Microsoft Certified: Azure Administrator Associate.</text>

          <text x="110" y="565" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#FFFFFF">Objetivos visíveis desta aula (sem exigir conta Azure hoje):</text>
          <text x="130" y="615" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#CBD5E1">1. Explicar o que você está administrando na nuvem</text>
          <text x="130" y="660" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#CBD5E1">2. Distinguir IaaS, PaaS e SaaS em exemplos simples no mesmo negócio</text>
          <text x="130" y="705" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#CBD5E1">3. Identificar as responsabilidades que continuam sendo suas</text>
        </g>
      `;
    }

    return `
      <g>
        <text x="70" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF">Cenário Contínuo: Sistema da Oficina Horizonte</text>
        <text x="70" y="162" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#CBD5E1">Acompanhando uma Ordem de Serviço fictícia desde o atendimento até a administração na nuvem</text>

        <!-- Fluxo da Ordem de Serviço -->
        <rect x="70" y="195" width="420" height="210" rx="14" fill="#15294A" ${g1}/>
        <text x="95" y="238" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="bold" fill="#00D4FF">1. Computador da Ana</text>
        <text x="95" y="272" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#FFFFFF">Atendente • Consulta informações</text>
        <rect x="95" y="295" width="370" height="82" rx="8" fill="#0A1628" stroke="#00D4FF" stroke-width="1.5"/>
        <text x="112" y="330" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#10B981">Ordem de Serviço #1042 (Fictícia)</text>
        <text x="112" y="358" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#CBD5E1">Serviço: Revisão de Freios • Modelo Sedan</text>

        <!-- Seta animada -->
        <line x1="505" y1="300" x2="585" y2="300" stroke="#00D4FF" stroke-width="5"/>
        <polygon points="585,288 612,300 585,312" fill="#00D4FF"/>

        <rect x="625" y="195" width="420" height="210" rx="14" fill="#15294A" ${g1}/>
        <text x="650" y="238" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="bold" fill="#00D4FF">2. Sistema Oficina Horizonte</text>
        <text x="650" y="272" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#FFFFFF">Bruno • Administra recursos técnicos</text>
        <text x="650" y="315" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#CBD5E1">• Mantém a aplicação disponível</text>
        <text x="650" y="348" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#CBD5E1">• Configura segurança, rede e backups</text>

        <rect x="1080" y="195" width="410" height="210" rx="14" fill="#15294A" ${g1}/>
        <text x="1105" y="238" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="bold" fill="#00D4FF">3. Equipe de Custos</text>
        <text x="1105" y="272" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#FFFFFF">Gestão • Acompanha gastos mensais</text>
        <text x="1105" y="315" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#CBD5E1">• Previsibilidade de fatura</text>
        <text x="1105" y="348" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#FBBF24">• Aula 01: Sem conta Azure exigida</text>

        <!-- Três perguntas-chave (Uma indicação visual por vez) -->
        <text x="70" y="465" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="bold" fill="#FFFFFF">As três perguntas que guiam o administrador Azure:</text>

        <rect x="70" y="495" width="445" height="225" rx="14" ${q1}/>
        <text x="100" y="550" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="bold" fill="#00D4FF">1. Onde roda?</text>
        <text x="100" y="598" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0">Em qual servidor, plataforma e</text>
        <text x="100" y="628" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0">armazenamento o sistema funciona?</text>

        <rect x="545" y="495" width="445" height="225" rx="14" ${q2}/>
        <text x="575" y="550" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="bold" fill="#00D4FF">2. Quem acessa?</text>
        <text x="575" y="598" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0">Como identificar a Ana e o Bruno</text>
        <text x="575" y="628" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0">e proteger os dados da oficina?</text>

        <rect x="1020" y="495" width="470" height="225" rx="14" ${q3}/>
        <text x="1050" y="550" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="bold" fill="#00D4FF">3. Quanto custa?</text>
        <text x="1050" y="598" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0">Como escolher o modelo certo e</text>
        <text x="1050" y="628" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0">evitar desperdício de recursos?</text>
      </g>
    `;
  }

  // Cena 2: O que significa usar nuvem
  if (sceneId === 2) {
    if (stepFocus === 'concepts') {
      return `
        <g>
          <text x="70" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF">O Caminho da Ordem de Serviço até a Nuvem</text>
          <text x="70" y="162" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#CBD5E1">Definindo cada termo sem jargão oculto • TI = Tecnologia da Informação</text>

          <!-- Diagrama de fluxo: Computador -> Internet -> Nuvem Azure -->
          <rect x="70" y="195" width="320" height="145" rx="12" fill="#15294A" stroke="#00D4FF" stroke-width="2"/>
          <text x="230" y="250" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Computador da Atendente</text>
          <text x="230" y="288" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#00D4FF" text-anchor="middle">Ana envia a Ordem #1042</text>

          <line x1="395" y1="268" x2="485" y2="268" stroke="#00D4FF" stroke-width="4"/>
          <polygon points="485,258 510,268 485,278" fill="#00D4FF"/>

          <rect x="515" y="195" width="260" height="145" rx="12" fill="#15294A" stroke="#38BDF8" stroke-width="2"/>
          <text x="645" y="255" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Internet</text>
          <text x="645" y="290" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#CBD5E1" text-anchor="middle">Transporte de rede</text>

          <line x1="780" y1="268" x2="870" y2="268" stroke="#00D4FF" stroke-width="4"/>
          <polygon points="870,258 895,268 870,278" fill="#00D4FF"/>

          <rect x="900" y="195" width="590" height="145" rx="12" fill="#16355D" stroke="#00D4FF" stroke-width="3.5"/>
          <text x="1195" y="245" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="bold" fill="#00D4FF" text-anchor="middle">Microsoft Azure (Plataforma de Nuvem)</text>
          <text x="1195" y="285" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#FFFFFF" text-anchor="middle">Infraestrutura de nuvem da Microsoft contratada pela oficina</text>

          <!-- Três definições fundamentais -->
          <rect x="70" y="385" width="450" height="330" rx="14" fill="#132542" stroke="#00D4FF" stroke-width="2.5"/>
          <text x="100" y="438" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="bold" fill="#00D4FF">1. Servidor</text>
          <text x="100" y="488" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#FFFFFF">É o computador preparado para</text>
          <text x="100" y="520" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#FFFFFF">fornecer um serviço a outros</text>
          <text x="100" y="552" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#FFFFFF">computadores pela rede.</text>
          <text x="100" y="620" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#94A3B8">Processa os pedidos da oficina.</text>

          <rect x="545" y="385" width="450" height="330" rx="14" fill="#132542" stroke="#00D4FF" stroke-width="2.5"/>
          <text x="575" y="438" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="bold" fill="#00D4FF">2. Aplicação</text>
          <text x="575" y="488" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#FFFFFF">É o software em si: o programa</text>
          <text x="575" y="520" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#FFFFFF">de ordens de serviço onde a Ana</text>
          <text x="575" y="552" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#FFFFFF">consulta e cadastra atendimentos.</text>
          <text x="575" y="620" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#94A3B8">A regra de negócio da Oficina Horizonte.</text>

          <rect x="1020" y="385" width="470" height="330" rx="14" fill="#132542" stroke="#00D4FF" stroke-width="2.5"/>
          <text x="1050" y="438" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="bold" fill="#00D4FF">3. Armazenamento</text>
          <text x="1050" y="488" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#FFFFFF">É o local de persistência dos dados:</text>
          <text x="1050" y="520" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#FFFFFF">onde as ordens ficam gravadas para</text>
          <text x="1050" y="552" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#FFFFFF">não sumirem ao fechar a tela.</text>
          <text x="1050" y="620" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#94A3B8">Histórico, arquivos e backups.</text>
        </g>
      `;
    }

    // Comparação Sala de Servidores vs Nuvem (Lia à esquerda: conteúdo de x=410 a 1860)
    return `
      <g>
        <text x="415" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="33" font-weight="bold" fill="#FFFFFF">Mesma Ordem de Serviço #1042: Sala Própria vs. Nuvem Azure</text>
        <text x="415" y="162" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#CBD5E1">Nuvem NÃO é ausência de equipamentos físicos e NÃO garante economia automática</text>

        <!-- Lado 1: Sala de servidores própria -->
        <rect x="415" y="190" width="700" height="410" rx="14" fill="#15294A" stroke="#64748B" stroke-width="2"/>
        <text x="445" y="238" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="bold" fill="#F8FAFC">A) Sala de Servidores Mantida pela Empresa</text>
        <text x="445" y="275" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#00D4FF">Fluxo: [Ana] ➔ [Rede Local] ➔ [Servidor Físico na Oficina]</text>
        <text x="445" y="325" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0">• A oficina compra e conserta as máquinas físicas</text>
        <text x="445" y="365" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0">• Cuida de energia elétrica, refrigeração e cabos</text>
        <text x="445" y="405" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0">• Instala sistema operacional, aplicação e bancos</text>
        <text x="445" y="445" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0">• Se um disco físico pifar, o Bruno precisa trocar</text>

        <!-- Lado 2: Serviços contratados na nuvem -->
        <rect x="1145" y="190" width="715" height="410" rx="14" fill="#16355D" stroke="#00D4FF" stroke-width="3.5"/>
        <text x="1175" y="238" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="bold" fill="#00D4FF">B) Serviços Contratados na Nuvem (Azure)</text>
        <text x="1175" y="275" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#10B981">Fluxo: [Ana] ➔ [Internet] ➔ [Datacenter Microsoft Azure]</text>
        <text x="1175" y="325" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FFFFFF">• Os servidores físicos continuam existindo (na Microsoft)</text>
        <text x="1175" y="365" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FFFFFF">• A Microsoft mantém prédio, energia e hardware físico</text>
        <text x="1175" y="405" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FBBF24">• Custo: não há economia automática sem gestão!</text>
        <text x="1175" y="445" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FFFFFF">• O Bruno administra configurações, acessos e dados</text>

        <!-- Frase de transição obrigatória -->
        <rect x="415" y="630" width="1445" height="130" rx="14" fill="#0F1E36" stroke="#00D4FF" stroke-width="3"/>
        <text x="1137" y="685" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="bold" fill="#00D4FF" text-anchor="middle">“O servidor não desapareceu. Mudou quem cuida de cada parte —</text>
        <text x="1137" y="725" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="bold" fill="#FFFFFF" text-anchor="middle">e é aí que começa o trabalho de administração.”</text>
      </g>
    `;
  }

  // Cena 3: Três modelos com o mesmo negócio (IaaS, PaaS, SaaS + Tabela + Matriz de 4 linhas)
  if (sceneId === 3) {
    if (stepFocus === 'cards') {
      return `
        <g>
          <text x="70" y="120" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="bold" fill="#FFFFFF">Três Modelos de Nuvem para a Oficina Horizonte</text>
          <text x="70" y="156" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#CBD5E1">IaaS (Infraestrutura como Serviço) • VM (Máquina Virtual) • PaaS (Plataforma como Serviço) • SaaS (Software como Serviço)</text>

          <!-- 3 Cartões Animados -->
          <rect x="70" y="182" width="455" height="250" rx="12" fill="#15294A" stroke="#00D4FF" stroke-width="2.5"/>
          <text x="95" y="222" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="bold" fill="#00D4FF">1. IaaS • Azure Virtual Machines</text>
          <text x="95" y="254" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#94A3B8">Infrastructure as a Service (Máquina Virtual / VM)</text>
          <text x="95" y="292" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#FFFFFF">• Máquina Virtual + Sistema Operacional</text>
          <text x="95" y="322" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#FFFFFF">• Aplicação de Ordens da Oficina</text>
          <text x="95" y="362" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#10B981">Equipe administra: SO + Aplicação + Dados</text>

          <rect x="545" y="182" width="455" height="250" rx="12" fill="#15294A" stroke="#00D4FF" stroke-width="2.5"/>
          <text x="570" y="222" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="bold" fill="#00D4FF">2. PaaS • Azure App Service</text>
          <text x="570" y="254" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#94A3B8">Platform as a Service (Plataforma Gerenciada)</text>
          <text x="570" y="292" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#FFFFFF">• Aplicação publicada na plataforma</text>
          <text x="570" y="322" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#FFFFFF">• Microsoft gerencia a VM e o Sistema Operacional</text>
          <text x="570" y="362" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#10B981">Equipe administra: Aplicação + Configs + Dados</text>

          <rect x="1020" y="182" width="475" height="250" rx="12" fill="#15294A" stroke="#F59E0B" stroke-width="2.5"/>
          <text x="1045" y="222" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="bold" fill="#FBBF24">3. SaaS • Exemplo: Microsoft 365</text>
          <text x="1045" y="254" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#94A3B8">Software as a Service (Aplicação Pronta)</text>
          <text x="1045" y="292" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#FFFFFF">• Software completo pronto para uso</text>
          <rect x="1045" y="310" width="425" height="54" rx="6" fill="#3B2506" stroke="#F59E0B" stroke-width="1.5"/>
          <text x="1058" y="334" font-family="Segoe UI, Arial, sans-serif" font-size="15.5" font-weight="bold" fill="#FDE68A">Atenção: Exemplo de SaaS — NÃO é um recurso</text>
          <text x="1058" y="355" font-family="Segoe UI, Arial, sans-serif" font-size="15.5" font-weight="bold" fill="#FDE68A">que será criado neste laboratório Azure.</text>

          <!-- Tabela Obrigatória: Colunas "Exemplo" e "O que a equipe administra" -->
          <rect x="70" y="455" width="1425" height="285" rx="12" fill="#0F1E36" stroke="#00D4FF" stroke-width="2"/>
          <rect x="70" y="455" width="1425" height="52" rx="12" fill="#16355D"/>
          <text x="95" y="488" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="bold" fill="#00D4FF">Modelo</text>
          <text x="270" y="488" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="bold" fill="#00D4FF">Exemplo</text>
          <text x="720" y="488" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="bold" fill="#00D4FF">O que a equipe administra</text>

          <line x1="70" y1="575" x2="1495" y2="575" stroke="#334155" stroke-width="1.5"/>
          <text x="95" y="548" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">IaaS</text>
          <text x="270" y="548" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0">Azure Virtual Machines (VM)</text>
          <text x="720" y="548" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#10B981">Sistema operacional, aplicação da oficina, rede virtual e dados</text>

          <line x1="70" y1="650" x2="1495" y2="650" stroke="#334155" stroke-width="1.5"/>
          <text x="95" y="622" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">PaaS</text>
          <text x="270" y="622" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0">Azure App Service</text>
          <text x="720" y="622" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#10B981">Aplicação, configurações da plataforma, acessos e dados</text>

          <text x="95" y="700" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">SaaS</text>
          <text x="270" y="700" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FBBF24">Microsoft 365 (Exemplo de SaaS)</text>
          <text x="720" y="700" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#10B981">Identidades/usuários, permissões, configurações e dados</text>
        </g>
      `;
    }

    // Matriz de 4 linhas (Lia à esquerda: x=415..1860)
    return `
      <g>
        <text x="415" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="33" font-weight="bold" fill="#FFFFFF">Matriz Simplificada de Responsabilidade Compartilhada</text>
        <text x="415" y="162" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#CBD5E1">Fonte: Microsoft Learn — Shared responsibility in the cloud (4 camadas fundamentais)</text>

        <rect x="415" y="195" width="1445" height="420" rx="14" fill="#0F1E36" stroke="#00D4FF" stroke-width="2.5"/>
        <rect x="415" y="195" width="1445" height="64" rx="14" fill="#16355D"/>
        <text x="445" y="236" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#00D4FF">Camada (4 Linhas)</text>
        <text x="865" y="236" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#00D4FF">IaaS (Virtual Machines)</text>
        <text x="1215" y="236" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#00D4FF">PaaS (App Service)</text>
        <text x="1550" y="236" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#00D4FF">SaaS (Microsoft 365)</text>

        <!-- Linha 1: Infraestrutura física -->
        <line x1="415" y1="345" x2="1860" y2="345" stroke="#334155" stroke-width="1.5"/>
        <text x="445" y="312" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF">1. Infraestrutura física</text>
        <text x="865" y="312" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#94A3B8">Microsoft</text>
        <text x="1215" y="312" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#94A3B8">Microsoft</text>
        <text x="1550" y="312" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#94A3B8">Microsoft</text>

        <!-- Linha 2: Sistema operacional -->
        <line x1="415" y1="435" x2="1860" y2="435" stroke="#334155" stroke-width="1.5"/>
        <text x="445" y="400" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF">2. Sistema operacional</text>
        <text x="865" y="400" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#00D4FF">Cliente (Oficina)</text>
        <text x="1215" y="400" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#94A3B8">Microsoft</text>
        <text x="1550" y="400" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#94A3B8">Microsoft</text>

        <!-- Linha 3: Aplicação / configurações -->
        <line x1="415" y1="525" x2="1860" y2="525" stroke="#334155" stroke-width="1.5"/>
        <text x="445" y="490" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF">3. Aplicação / configurações</text>
        <text x="865" y="490" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#00D4FF">Cliente (Oficina)</text>
        <text x="1215" y="490" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="bold" fill="#FBBF24">Compartilhado (Cliente config.)</text>
        <text x="1550" y="490" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="bold" fill="#FBBF24">Compartilhado (Cliente config.)</text>

        <!-- Linha 4: Dados / identidades (Destaque luminoso) -->
        <rect x="419" y="527" width="1437" height="85" rx="10" fill="#00D4FF" fill-opacity="0.16" stroke="#00D4FF" stroke-width="3"/>
        <text x="445" y="580" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="bold" fill="#00D4FF">4. Dados / identidades</text>
        <text x="865" y="580" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#10B981">SEMPRE Cliente (Oficina)</text>
        <text x="1215" y="580" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#10B981">SEMPRE Cliente (Oficina)</text>
        <text x="1550" y="580" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#10B981">SEMPRE Cliente (Oficina)</text>

        <rect x="415" y="640" width="1445" height="95" rx="12" fill="#15294A" stroke="#F59E0B" stroke-width="2.5"/>
        <text x="1137" y="682" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#FBBF24" text-anchor="middle">Regra de Ouro: A Microsoft NUNCA assume toda a segurança sozinha no PaaS ou SaaS.</text>
        <text x="1137" y="715" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FFFFFF" text-anchor="middle">Dados, identidades e configurações sob controle do cliente continuam exigindo cuidado da sua equipe!</text>
      </g>
    `;
  }

  // Cena 4: O que veremos no portal e no curso (Simulação Didática fiel do Portal Azure)
  if (sceneId === 4) {
    if (stepFocus === 'roadmap') {
      return `
        <g>
          <text x="415" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="33" font-weight="bold" fill="#FFFFFF">O Papel do Administrador e o Percurso do Curso AZ-104</text>
          <text x="415" y="162" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#CBD5E1">Conectando as 4 buscas do portal aos 5 domínios oficiais do exame AZ-104</text>

          <rect x="415" y="195" width="1445" height="415" rx="14" fill="#132542" stroke="#00D4FF" stroke-width="2.5"/>
          <text x="450" y="250" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="bold" fill="#00D4FF">Percurso Oficial do Curso (Alinhado ao Guia de Estudo AZ-104):</text>

          <text x="465" y="310" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="bold" fill="#10B981">1. Identidade e governança (20–25%) ➔ IDENTIFICAR e ORGANIZAR (Microsoft Entra ID)</text>
          <text x="465" y="365" font-family="Segoe UI, Arial, sans-serif" font-size="23" fill="#FFFFFF">2. Armazenamento (15–20%) ➔ GUARDAR dados com segurança (Storage accounts)</text>
          <text x="465" y="420" font-family="Segoe UI, Arial, sans-serif" font-size="23" fill="#FFFFFF">3. Computação (20–25%) ➔ EXECUTAR aplicações e máquinas (Virtual machines / App Service)</text>
          <text x="465" y="475" font-family="Segoe UI, Arial, sans-serif" font-size="23" fill="#FFFFFF">4. Redes virtuais (15–20%) ➔ CONECTAR recursos com isolamento (Virtual networks)</text>
          <text x="465" y="530" font-family="Segoe UI, Arial, sans-serif" font-size="23" fill="#FFFFFF">5. Monitoramento e manutenção (10–15%) ➔ Acompanhar saúde, alertas e backups</text>

          <rect x="415" y="635" width="1445" height="95" rx="12" fill="#15294A" stroke="#38BDF8" stroke-width="2"/>
          <text x="1137" y="678" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#00D4FF" text-anchor="middle">Importante: As primeiras aulas constroem a base fundamental de organização e governança;</text>
          <text x="1137" y="712" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#E2E8F0" text-anchor="middle">elas não cobrem toda a certificação de uma só vez. Primeiro organizamos antes de criar recursos!</text>
        </g>
      `;
    }

    const portalMap = {
      vm: {
        query: 'Virtual machines',
        enTitle: 'Virtual machines',
        ptTitle: 'Máquinas virtuais — EXECUTAR',
        emptyMsg: 'No virtual machines to display (Nenhuma máquina virtual criada)',
        roleDesc: 'Conecta ao desenho da Oficina Horizonte: EXECUTAR o sistema de ordens em uma máquina virtual (IaaS).'
      },
      storage: {
        query: 'Storage accounts',
        enTitle: 'Storage accounts',
        ptTitle: 'Contas de armazenamento — GUARDAR',
        emptyMsg: 'No storage accounts to display (Nenhuma conta de armazenamento criada)',
        roleDesc: 'Conecta ao desenho da Oficina Horizonte: GUARDAR os registros, arquivos e backups das ordens de serviço.'
      },
      vnet: {
        query: 'Virtual networks',
        enTitle: 'Virtual networks',
        ptTitle: 'Redes virtuais — CONECTAR',
        emptyMsg: 'No virtual networks to display (Nenhuma rede virtual criada)',
        roleDesc: 'Conecta ao desenho da Oficina Horizonte: CONECTAR com segurança servidores e armazenamento na nuvem.'
      },
      entra: {
        query: 'Microsoft Entra ID',
        enTitle: 'Microsoft Entra ID (Overview — Oficina Horizonte)',
        ptTitle: 'Microsoft Entra ID (Identidade e acesso) — IDENTIFICAR',
        emptyMsg: 'Tenant: Oficina Horizonte (Default Directory) • ID = Identity (Identidade)',
        roleDesc: 'Conecta ao desenho da Oficina Horizonte: IDENTIFICAR a Ana, o Bruno e controlar quem acessa cada recurso.'
      }
    };

    const item = portalMap[stepFocus] || portalMap.vm;

    return `
      <g>
        <!-- Moldura da Simulação Didática do Portal Azure (80% da tela) -->
        <rect x="65" y="105" width="1440" height="665" rx="12" fill="#0F172A" stroke="#00D4FF" stroke-width="3"/>

        <!-- Barra Superior Azul do Portal Azure -->
        <rect x="65" y="105" width="1440" height="62" rx="10" fill="#0078D4"/>
        <text x="95" y="144" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF">≡   Microsoft Azure</text>

        <!-- Barra de Busca Global com Indicação Visual e Cursor Destacado -->
        <rect x="360" y="115" width="640" height="42" rx="6" fill="#FFFFFF" stroke="#F59E0B" stroke-width="3.5"/>
        <text x="380" y="143" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#0F172A">🔍  ${esc(item.query)}</text>

        <!-- Cursor Destacado (Halo Amarelo/Ciano) -->
        <circle cx="965" cy="136" r="16" fill="#F59E0B" fill-opacity="0.35" stroke="#F59E0B" stroke-width="3"/>
        <polygon points="965,134 982,146 973,149 977,159 971,161 967,151 960,156" fill="#FBBF24" stroke="#000" stroke-width="1.2"/>

        <!-- Selo Obrigatório: Simulação Didática -->
        <rect x="1195" y="116" width="290" height="40" rx="6" fill="#F59E0B"/>
        <text x="1340" y="143" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#0A1628" text-anchor="middle">SIMULAÇÃO DIDÁTICA</text>

        <!-- Menu Lateral do Portal -->
        <rect x="68" y="167" width="250" height="600" fill="#1E293B"/>
        <text x="90" y="210" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#94A3B8">NAVEGAÇÃO NO PORTAL</text>
        <text x="90" y="255" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="${stepFocus === 'vm' ? '#00D4FF' : '#CBD5E1'}" font-weight="${stepFocus === 'vm' ? 'bold' : 'normal'}">• Virtual machines</text>
        <text x="90" y="300" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="${stepFocus === 'storage' ? '#00D4FF' : '#CBD5E1'}" font-weight="${stepFocus === 'storage' ? 'bold' : 'normal'}">• Storage accounts</text>
        <text x="90" y="345" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="${stepFocus === 'vnet' ? '#00D4FF' : '#CBD5E1'}" font-weight="${stepFocus === 'vnet' ? 'bold' : 'normal'}">• Virtual networks</text>
        <text x="90" y="390" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="${stepFocus === 'entra' ? '#00D4FF' : '#CBD5E1'}" font-weight="${stepFocus === 'entra' ? 'bold' : 'normal'}">• Microsoft Entra ID</text>

        <!-- Área Principal de Listagem (Estado Inicial -> Ação -> Resultado Verificável) -->
        <text x="350" y="220" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="bold" fill="#FFFFFF">${esc(item.enTitle)}</text>
        <text x="350" y="252" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#94A3B8">Estado inicial: Busca global  ➔  Ação: Clique no serviço  ➔  Resultado verificável: Página de listagem aberta</text>

        <!-- Barra de botões desabilitados (Sem clicar em + Create) -->
        <rect x="350" y="275" width="140" height="36" rx="5" fill="#334155"/>
        <text x="420" y="299" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#94A3B8" text-anchor="middle">+ Create (Não clicar)</text>
        <rect x="510" y="275" width="380" height="36" rx="5" fill="#064E3B" stroke="#10B981" stroke-width="1.5"/>
        <text x="700" y="299" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#A7F3D0" text-anchor="middle">Apenas reconhecimento (Zero custo gerado)</text>

        <!-- Lista de Recursos Verificável -->
        <rect x="350" y="335" width="1120" height="175" rx="8" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
        <text x="380" y="385" font-family="Segoe UI, Arial, sans-serif" font-size="21" font-weight="bold" fill="#E2E8F0">Resultado na Página de Listagem:</text>
        <text x="380" y="430" font-family="Consolas, monospace" font-size="20" fill="#38BDF8">${esc(item.emptyMsg)}</text>
        <text x="380" y="475" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#94A3B8">Nenhum assistente pago foi iniciado nesta aula.</text>

        <!-- Sobreposição em Português + Papel no Desenho do Negócio -->
        <rect x="350" y="535" width="1120" height="195" rx="10" fill="#16355D" stroke="#00D4FF" stroke-width="3"/>
        <text x="380" y="585" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="bold" fill="#00D4FF">Tradução e Função: ${esc(item.ptTitle)}</text>
        <text x="380" y="635" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#FFFFFF">${esc(item.roleDesc)}</text>
        <text x="380" y="685" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#FBBF24">Dica AZ-104: Guardamos tanto o termo em português quanto o rótulo original em inglês do portal.</text>
      </g>
    `;
  }

  // Cena 5: Participação do aluno (Exercícios autorais com pausa antes do gabarito + Atividade de desenho)
  if (sceneId === 5) {
    if (stepFocus === 'q1_ask' || stepFocus === 'q1_pause' || stepFocus === 'q1_ans') {
      const isAns = stepFocus === 'q1_ans';
      const isPause = stepFocus === 'q1_pause';
      return `
        <g>
          <rect x="70" y="100" width="900" height="38" rx="8" fill="#3B2506" stroke="#F59E0B" stroke-width="1.5"/>
          <text x="520" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#FDE68A" text-anchor="middle">EXERCÍCIO AUTORAL DE FIXAÇÃO 01 • NÃO É QUESTÃO OFICIAL DE PROVA DA MICROSOFT</text>

          <text x="70" y="190" font-family="Segoe UI, Arial, sans-serif" font-size="31" font-weight="bold" fill="#FFFFFF">“A oficina precisa instalar e manter seu próprio sistema operacional.</text>
          <text x="70" y="232" font-family="Segoe UI, Arial, sans-serif" font-size="31" font-weight="bold" fill="#00D4FF">Qual dos três modelos combina mais diretamente com essa necessidade?”</text>

          <!-- Alternativa A -->
          <rect x="70" y="275" width="1420" height="105" rx="12" fill="${isAns ? '#064E3B' : '#15294A'}" stroke="${isAns ? '#10B981' : '#00D4FF'}" stroke-width="${isAns ? '4' : '2'}"/>
          <text x="105" y="338" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="bold" fill="${isAns ? '#A7F3D0' : '#FFFFFF'}">A) IaaS (Infraestrutura como Serviço) ${isAns ? '  ✅ GABARITO CORRETO!' : ''}</text>

          <!-- Alternativa B -->
          <rect x="70" y="400" width="1420" height="95" rx="12" fill="#15294A" stroke="#334155" stroke-width="2"/>
          <text x="105" y="458" font-family="Segoe UI, Arial, sans-serif" font-size="26" fill="#CBD5E1">B) PaaS (Plataforma como Serviço)</text>

          <!-- Alternativa C -->
          <rect x="70" y="515" width="1420" height="95" rx="12" fill="#15294A" stroke="#334155" stroke-width="2"/>
          <text x="105" y="573" font-family="Segoe UI, Arial, sans-serif" font-size="26" fill="#CBD5E1">C) SaaS (Software como Serviço)</text>

          ${isPause ? `
            <rect x="70" y="640" width="1420" height="110" rx="12" fill="#16355D" stroke="#F59E0B" stroke-width="3"/>
            <text x="780" y="705" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="bold" fill="#FBBF24" text-anchor="middle">⏳ Pausa de 5 segundos para você responder...</text>
          ` : ''}

          ${isAns ? `
            <rect x="70" y="640" width="1420" height="120" rx="12" fill="#0F1E36" stroke="#10B981" stroke-width="3"/>
            <text x="105" y="688" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#10B981">Justificativa: Resposta A (IaaS)!</text>
            <text x="105" y="728" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#FFFFFF">No IaaS (ex.: Azure Virtual Machines / VM), a equipe da oficina administra o sistema operacional e a aplicação.</text>
          ` : ''}
        </g>
      `;
    }

    if (stepFocus === 'q2_ask' || stepFocus === 'q2_pause' || stepFocus === 'q2_ans') {
      const isAns = stepFocus === 'q2_ans';
      const isPause = stepFocus === 'q2_pause';
      return `
        <g>
          <rect x="70" y="100" width="900" height="38" rx="8" fill="#3B2506" stroke="#F59E0B" stroke-width="1.5"/>
          <text x="520" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="bold" fill="#FDE68A" text-anchor="middle">EXERCÍCIO AUTORAL DE FIXAÇÃO 02 • NÃO É QUESTÃO OFICIAL DE PROVA DA MICROSOFT</text>

          <rect x="70" y="170" width="1420" height="175" rx="14" fill="#15294A" stroke="#00D4FF" stroke-width="2.5"/>
          <text x="105" y="235" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="bold" fill="#FFFFFF">Pergunta 2:</text>
          <text x="105" y="290" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="bold" fill="#00D4FF">“Colocar a aplicação na nuvem elimina a necessidade de cuidar dos acessos dos funcionários?”</text>

          ${isPause ? `
            <rect x="70" y="385" width="1420" height="130" rx="14" fill="#16355D" stroke="#F59E0B" stroke-width="3"/>
            <text x="780" y="460" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="bold" fill="#FBBF24" text-anchor="middle">⏳ Pausa de 5 segundos para reflexão...</text>
          ` : ''}

          ${isAns ? `
            <rect x="70" y="380" width="1420" height="340" rx="14" fill="#064E3B" stroke="#10B981" stroke-width="3.5"/>
            <text x="105" y="445" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="bold" fill="#A7F3D0">✅ Resposta: NÃO!</text>
            <text x="105" y="510" font-family="Segoe UI, Arial, sans-serif" font-size="25" fill="#FFFFFF">• A equipe continua responsável pelas contas, identidades e acessos que administra.</text>
            <text x="105" y="560" font-family="Segoe UI, Arial, sans-serif" font-size="25" fill="#FFFFFF">• Mesmo em PaaS ou SaaS, quem define se a Ana ou o Bruno podem acessar o sistema é a oficina.</text>
            <text x="105" y="630" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#FBBF24">Conclusão: Serviço gerenciado NUNCA é responsabilidade eliminada!</text>
          ` : ''}
        </g>
      `;
    }

    // Atividade prática de desenho (Lia à esquerda: x=415..1860)
    const filled = stepFocus === 'act_ans';
    return `
      <g>
        <text x="415" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="33" font-weight="bold" fill="#FFFFFF">Atividade Prática: Desenhe os 3 Blocos do Ambiente</text>
        <text x="415" y="162" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#CBD5E1">Anote ou desenhe: 1) A aplicação, 2) Os dados e 3) As pessoas que terão acesso</text>

        <rect x="415" y="205" width="455" height="380" rx="14" fill="#15294A" stroke="${filled ? '#10B981' : '#00D4FF'}" stroke-width="3"/>
        <text x="642" y="265" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#00D4FF" text-anchor="middle">1. Aplicação</text>
        <text x="642" y="365" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="bold" fill="${filled ? '#10B981' : '#94A3B8'}" text-anchor="middle">${filled ? '“sistema de ordens”' : '[ Desenhe aqui ]'}</text>
        <text x="642" y="435" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#CBD5E1" text-anchor="middle">${filled ? 'Software onde as ordens rodam' : ''}</text>

        <rect x="910" y="205" width="455" height="380" rx="14" fill="#15294A" stroke="${filled ? '#10B981' : '#00D4FF'}" stroke-width="3"/>
        <text x="1137" y="265" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#00D4FF" text-anchor="middle">2. Dados</text>
        <text x="1137" y="365" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="bold" fill="${filled ? '#10B981' : '#94A3B8'}" text-anchor="middle">${filled ? '“registros da oficina”' : '[ Desenhe aqui ]'}</text>
        <text x="1137" y="435" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#CBD5E1" text-anchor="middle">${filled ? 'Histórico persistido no armazenamento' : ''}</text>

        <rect x="1405" y="205" width="455" height="380" rx="14" fill="#15294A" stroke="${filled ? '#10B981' : '#00D4FF'}" stroke-width="3"/>
        <text x="1632" y="265" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="bold" fill="#00D4FF" text-anchor="middle">3. Pessoas com Acesso</text>
        <text x="1632" y="365" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="bold" fill="${filled ? '#10B981' : '#94A3B8'}" text-anchor="middle">${filled ? '“equipe de atendimento”' : '[ Desenhe aqui ]'}</text>
        <text x="1632" y="435" font-family="Segoe UI, Arial, sans-serif" font-size="19" fill="#CBD5E1" text-anchor="middle">${filled ? 'Ana (consulta) e Bruno (admin)' : ''}</text>
      </g>
    `;
  }

  // Cena 6: Recapitulação no desenho e próximo passo + Fontes Oficiais (29/09/2026)
  if (sceneId === 6) {
    if (stepFocus === 'recap') {
      return `
        <g>
          <text x="415" y="125" font-family="Segoe UI, Arial, sans-serif" font-size="33" font-weight="bold" fill="#FFFFFF">Recapitulação Visual: O Desenho da Oficina Horizonte</text>
          <text x="415" y="162" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#CBD5E1">Respondendo às três perguntas da abertura diretamente na arquitetura (0 recursos criados hoje)</text>

          <!-- Desenho Arquitetural Respondendo às 3 Perguntas -->
          <rect x="415" y="200" width="455" height="320" rx="14" fill="#16355D" stroke="#00D4FF" stroke-width="3"/>
          <text x="445" y="252" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="bold" fill="#00D4FF">1. Onde roda?</text>
          <text x="445" y="305" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FFFFFF">• Executar: VM (IaaS) ou App Service (PaaS)</text>
          <text x="445" y="350" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FFFFFF">• Guardar: Storage accounts</text>
          <text x="445" y="395" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FFFFFF">• Conectar: Virtual networks</text>
          <text x="445" y="455" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#10B981">Infraestrutura Azure sob medida</text>

          <rect x="905" y="200" width="455" height="320" rx="14" fill="#16355D" stroke="#00D4FF" stroke-width="3"/>
          <text x="935" y="252" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="bold" fill="#00D4FF">2. Quem acessa?</text>
          <text x="935" y="305" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FFFFFF">• Identificar: Microsoft Entra ID</text>
          <text x="935" y="350" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FFFFFF">• Ana: consulta e registra ordens</text>
          <text x="935" y="395" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FFFFFF">• Bruno: administra recursos</text>
          <text x="935" y="455" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#10B981">Responsabilidade sempre da equipe!</text>

          <rect x="1395" y="200" width="465" height="320" rx="14" fill="#16355D" stroke="#00D4FF" stroke-width="3"/>
          <text x="1425" y="252" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="bold" fill="#00D4FF">3. Quanto custa?</text>
          <text x="1425" y="305" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FFFFFF">• Governança e acompanhamento</text>
          <text x="1425" y="350" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FFFFFF">• Sem economia automática</text>
          <text x="1425" y="395" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#FBBF24">• Hoje: Nenhum recurso foi criado</text>
          <text x="1425" y="455" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#10B981">Controle antes do primeiro clique</text>
        </g>
      `;
    }

    // Fechamento + Fontes Oficiais e Data de Revisão 29/09/2026 (Lia Hero à direita: x=70..1280)
    return `
      <g>
        <rect x="70" y="120" width="1210" height="310" rx="18" fill="#16355D" stroke="#00D4FF" stroke-width="3.5"/>
        <text x="110" y="180" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="bold" fill="#00D4FF">PRÓXIMO PASSO — AULA 02:</text>
        <text x="110" y="245" font-family="Segoe UI, Arial, sans-serif" font-size="31" font-weight="bold" fill="#FFFFFF">“Na próxima aula, vamos entrar no portal e entender</text>
        <text x="110" y="292" font-family="Segoe UI, Arial, sans-serif" font-size="31" font-weight="bold" fill="#FFFFFF">onde você está trabalhando antes de clicar em Criar.</text>
        <text x="110" y="355" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="bold" fill="#10B981">Organização começa antes do primeiro recurso!”</text>

        <!-- Cartela Obrigatória de Fontes e Data de Revisão -->
        <rect x="70" y="460" width="1210" height="390" rx="16" fill="#0F1E36" stroke="#38BDF8" stroke-width="2"/>
        <text x="110" y="515" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="bold" fill="#00D4FF">Fontes Oficiais de Produção • Data de Revisão: 29/09/2026</text>

        <text x="110" y="575" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">1. Responsabilidade compartilhada e modelos de serviço (Microsoft Learn):</text>
        <text x="110" y="610" font-family="Consolas, monospace" font-size="18" fill="#38BDF8">https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility</text>

        <text x="110" y="670" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">2. Guia de estudo vigente do Exame AZ-104 (Microsoft Learn):</text>
        <text x="110" y="705" font-family="Consolas, monospace" font-size="18" fill="#38BDF8">https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104</text>

        <rect x="110" y="745" width="1130" height="72" rx="8" fill="#15294A"/>
        <text x="675" y="788" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#CBD5E1" text-anchor="middle">Nota: Este curso oferece formação técnica prática e teórica, sem prometer aprovação automática na certificação.</text>
      </g>
    `;
  }

  return '';
}

/**
 * Monta o SVG completo 1920x1080 de um quadro (com o novo avatar 3D baseado na foto) e converte para PNG via sharp
 */
async function renderFramePNG(outPath, { sceneId, sceneTitle, planCode, stepFocus, liaPos, mouthState, sub1, sub2 }) {
  const svg = `
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgRad" cx="75%" cy="20%" r="75%">
          <stop offset="0%" stop-color="#142C52"/>
          <stop offset="100%" stop-color="#0A1628"/>
        </radialGradient>
      </defs>

      <!-- Fundo 16:9 Azul-Escuro (#0A1628) -->
      <rect width="1920" height="1080" fill="url(#bgRad)"/>

      <!-- Barra de Topo -->
      <rect x="0" y="0" width="1920" height="68" fill="#07101E" stroke="#00D4FF" stroke-width="1.5"/>
      <text x="50" y="43" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="bold" fill="#00D4FF">AZURE DO ZERO AO AZ-104</text>
      <text x="380" y="43" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#CBD5E1">|   Aula 01 — Da nuvem ao trabalho do administrador</text>

      <rect x="1290" y="14" width="580" height="40" rx="20" fill="#15294A" stroke="#00D4FF" stroke-width="1.5"/>
      <text x="1580" y="40" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${esc(sceneTitle)} • ${esc(planCode)}</text>

      <!-- Conteúdo Principal (80% da tela) -->
      ${renderSceneContentSVG(sceneId, stepFocus)}

      <!-- Avatar 3D Estilizado da Lia (baseado na foto enviada) -->
      ${renderLiaAvatarSVG(liaPos, mouthState)}

      <!-- Barra de Legendas Sincronizadas PT-BR (Máximo 2 linhas) -->
      <rect x="395" y="925" width="1130" height="125" rx="14" fill="#050B14" fill-opacity="0.94" stroke="#00D4FF" stroke-width="2"/>
      <text x="960" y="975" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${esc(sub1)}</text>
      <text x="960" y="1020" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="bold" fill="#00D4FF" text-anchor="middle">${esc(sub2)}</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).png({ compressionLevel: 6 }).toFile(outPath);
}

module.exports = { renderFramePNG };
