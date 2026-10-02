# Aula 01 — Azure do zero: da nuvem ao trabalho do administrador
**Curso:** Azure do Zero ao AZ-104  
**Módulo 01:** Fundamentos, identidade e governança  
**Duração-alvo:** 12 minutos (`00:00` a `12:00` — 720 segundos)  
**Público-alvo:** Iniciantes absolutos (sem exigência de conta Azure nesta aula e sem pré-requisitos não explicados)  
**Data de revisão técnica e pedagógica:** 29/09/2026  

---

## 1. Declaração de Entrega e Status Técnico de Renderização

Em conformidade estrita com as instruções de produção:
- **Entregues integralmente neste pacote:**
  1. **Roteiro completo de narração** palavra por palavra, calibrado entre **125 e 145 palavras por minuto (ppm)** nos trechos expositivos e **~110 ppm** durante cliques de interface, com pausas reais de leitura e reflexão.
  2. **Storyboard detalhado com tempos, planos subdivididos e ações**, estruturado em **6 cenas e 22 planos contínuos** (de 15s a 40s cada) para compatibilidade com motores de renderização que possuem limite de duração por tomada, preservando continuidade de voz, avatar e telas.
  3. **Ficha de Referência Visual e Vocal Fixa da Apresentadora Lia** (para reutilização em todas as aulas do curso).
  4. **Validação de Precisão de Interface e Fontes Oficiais** (incluindo o uso exclusivo de **Microsoft Entra ID** e a matriz vigente do *Shared Responsibility Model* e do guia do exame **AZ-104**).
  5. **Arquivo de legendas sincronizadas em português brasileiro (`aula01-legendas-ptbr.srt`)**, respeitando o limite máximo de **duas linhas por bloco** e as pausas reais dos exercícios.
  6. **Aplicação Visual Interativa 1920×1080 (`simulacao-didatica-aula01.html`)**, que renderiza todas as telas, diagramas animados, cartões, matriz de responsabilidade compartilhada, a **Simulação didática** fiel do Portal Azure com textos 100% legíveis em tipografia sem serifa (zero letras inventadas por geração de imagem), cursor destacado, uma indicação visual por vez, legendas sincronizadas e o avatar da Lia posicionado dinamicamente.
- **Declaração sobre o arquivo de vídeo `.mp4`, síntese de voz neural e motor 3D de lip-sync:**
  - **O arquivo final `.mp4` NÃO foi gerado** neste ambiente local porque o sistema operacional atual não dispõe de codificador de vídeo (`ffmpeg` ausente), sintetizador de áudio neural de estúdio exportável nem motor de renderização 3D com sincronização labial (*lip-sync*) automática. Além disso, o serviço de geração de imagem por IA retornou indisponibilidade temporária de capacidade (`503 Service Unavailable`).
  - **O que falta para a exportação binária `.mp4`:** (a) gerar o áudio da locução PT-BR da Lia a partir do roteiro/SSML abaixo em motor de voz neural (ou cabine de locução); (b) animar o avatar 3D da Lia com *lip-sync* sincronizado ao áudio usando a especificação fixa abaixo; e (c) capturar/compor os quadros 1920×1080 a 30 fps a partir do simulador `simulacao-didatica-aula01.html` junto com o arquivo `aula01-legendas-ptbr.srt`.

---

## 2. Objetivos Visíveis e Cenário Contínuo

### Objetivos Visíveis da Aula 01
Ao terminar esta aula, a aluna ou o aluno será capaz de:
1. **Explicar o que está administrando na nuvem** (compreendendo que os servidores físicos continuam existindo, mas muda a divisão de tarefas entre provedor e cliente);
2. **Distinguir IaaS, PaaS e SaaS em exemplos simples** aplicados ao mesmo negócio (*Azure Virtual Machines*, *Azure App Service* e *Microsoft 365*);
3. **Identificar responsabilidades que continuam sendo suas** (dados, identidades/acessos e configurações sob controle do cliente em qualquer modelo de nuvem).

### Cenário Contínuo — Empresa Fictícia: Oficina Horizonte
A **Oficina Horizonte** é uma empresa fictícia de manutenção automotiva que precisa disponibilizar seu **sistema de ordens de serviço** para o time trabalhar com rapidez, segurança e custo controlado. *(Nenhum dado real de clientes é utilizado; todos os registros são fictícios).*
- **Ana (Atendimento / Consulta):** funcionária que atende clientes, consulta informações de serviços e registra novas ordens de serviço (ex.: `Ordem de Serviço #1042 — Revisão de Freios — Veículo Fictício Sedan`).
- **Bruno (Administrador de Recursos):** profissional técnico responsável por organizar, configurar, proteger e manter os recursos de tecnologia que sustentam o sistema da oficina.
- **Equipe de Custos / Gestão:** grupo que precisa acompanhar quanto o ambiente consome mensalmente para evitar surpresas na fatura.

---

## 3. Referência Fixa da Apresentadora: Lia (Guia de Continuidade do Curso)

> **Diretriz de Produção:** Fixar esta referência visual e vocal na Aula 01 e reutilizá-la identicamente em todas as aulas do curso *“Azure do Zero ao AZ-104”*.

| Atributo | Especificação Fixa (Character Bible — ID: `LIA-AZ104-V1`) |
| :--- | :--- |
| **Nome e Papel** | **Lia**, instrutora técnica de Microsoft Azure e anfitriã do curso. |
| **Aparência Geral** | Mulher adulta (~30–35 anos), brasileira, expressão acolhedora, confiante e profissional, estilo **avatar animado 3D estilizado** (estética de animação 3D contemporânea de alta definição, traços limpos e expressivos). |
| **Cabelo e Rosto** | Cabelo castanho médio na altura dos ombros, levemente ondulado nas pontas, repartido lateralmente; olhos castanhos expressivos; sorriso amigável e articulação labial nítida para sincronização fonética (*lip-sync*). |
| **Figurino Padrão** | **Blazer azul-marinho/royal** (`#1E40AF`) de corte moderno e aberto, sobre **camiseta clara** branco-gelo/creme (`#F8FAFC`), sem estampas ou logotipos que distraiam a leitura. |
| **Voz e Prosódia** | Voz feminina em **português brasileiro (PT-BR)**, natural, expressiva, animada e descontraída, com dicção clara e seriedade técnica. Humor leve e pontual (sem gírias excessivas e sem infantilização). |
| **Ritmo de Fala** | **125 a 145 palavras por minuto (ppm)** nas explicações conceituais; redução intencional para **~105 a 115 ppm** durante demonstrações de cliques e leitura de caminhos no portal. |
| **Enquadramento e Composição** | - **Abertura (Plano 1.1) e Fechamento (Plano 6.2):** Avatar em destaque central/meio-corpo (50% da área útil) sobre painel de fundo.<br>- **Explicações e Práticas:** Conteúdo didático ocupando **~80% da tela** e avatar da Lia em um **canto livre com 15% a 20% da largura da tela** (`288px` a `384px` em `1920×1080`), em moldura circular ou recorte com fundo transparente.<br>- **Regra de Reposicionamento:** Canto inferior direito como padrão; deslocamento suave para o **canto inferior esquerdo** sempre que houver cartões, colunas ou botões à direita, nunca cobrindo campos, menus, botões ou a faixa central de legendas. |
| **Prompt Técnico 3D (Sem Texto)** | `3D stylized animated character portrait of Lia, an adult Brazilian female tech instructor, warm, welcoming, and professional appearance, shoulder-length chestnut brown hair, wearing a tailored royal blue blazer over a clean light cream t-shirt, friendly confident smile, expressive eyes, studio lighting against dark navy blue background (#0A1628) with subtle cyan rim light (#00D4FF), 16:9, no text, no letters, no watermarks.` |

---

## 4. Glossário de Siglas Explicadas na Primeira Ocorrência

Para garantir que iniciantes absolutos acompanhem 100% da aula sem barreiras, **toda sigla é explicada imediatamente na sua primeira aparição**:

1. **AZ-104** *(Cena 1, Plano 1.1)*: Código oficial do exame da certificação **Microsoft Certified: Azure Administrator Associate** (Administrador do Azure).
2. **TI** *(Cena 2, Plano 2.2)*: **Tecnologia da Informação** (a área responsável pelos computadores, redes e sistemas de uma organização).
3. **AZ-900** *(Cena 3, Plano 3.1)*: Código do exame introdutório **Microsoft Certified: Azure Fundamentals** (Fundamentos do Azure).
4. **IaaS** *(Cena 3, Plano 3.1)*: *Infrastructure as a Service*, que em português significa **Infraestrutura como Serviço**.
5. **VM** *(Cena 3, Plano 3.1)*: *Virtual Machine*, que em português significa **Máquina Virtual**.
6. **PaaS** *(Cena 3, Plano 3.2)*: *Platform as a Service*, que em português significa **Plataforma como Serviço**.
7. **SaaS** *(Cena 3, Plano 3.3)*: *Software as a Service*, que em português significa **Software como Serviço**.
8. **ID** em **Microsoft Entra ID** *(Cena 4, Plano 4.4)*: Abreviação de *Identity* / *Identification* (**Identidade** ou **Identificador**), compondo o nome oficial do serviço de gerenciamento de identidades e acessos da Microsoft na nuvem.

---

## 5. Validação Técnica de Fontes e Caminhos de Interface (Revisão: 29/09/2026)

Antes da elaboração do roteiro, foram verificadas as duas fontes oficiais determinadas para a produção:
1. **Responsabilidade compartilhada e modelos de serviço:** [Shared responsibility in the cloud — Microsoft Learn](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility) *(última atualização oficial: 24/08/2026)*.
   - Confirmada a definição oficial dos três modelos:
     - **IaaS (*Infrastructure as a Service*):** O cliente gerencia máquinas virtuais (*virtual machines*), sistemas operacionais (*operating systems*) e aplicações (*applications*). Exemplo oficial citado: **Azure Virtual Machines**.
     - **PaaS (*Platform as a Service*):** O cliente implanta aplicações sem gerenciar máquinas virtuais ou sistemas operacionais. Exemplo oficial citado: **Azure App Service**.
     - **SaaS (*Software as a Service*):** O cliente utiliza aplicações prontas. Exemplo oficial citado: **Microsoft 365**.
   - Confirmada a matriz de responsabilidade compartilhada: **Dados do cliente (*Customer data*)**, **Configurações (*Configurations and settings*)** e **Identidades e usuários (*Identities and users*)** permanecem sob responsabilidade do **Cliente (*Customer*)** em todos os modelos (On-premises, IaaS, PaaS e SaaS).
2. **Guia de estudo oficial do exame AZ-104:** [Study guide for Exam AZ-104: Microsoft Azure Administrator — Microsoft Learn](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104) *(atualizado para o escopo vigente a partir de 17/04/2026)*.
   - Confirmados os 5 domínios de habilidades avaliadas (*Skills at a glance*):
     1. *Manage Azure identities and governance* (Gerenciar identidades e governança do Azure — 20–25%);
     2. *Implement and manage storage* (Implementar e gerenciar armazenamento — 15–20%);
     3. *Deploy and manage Azure compute resources* (Implantar e gerenciar recursos de computação do Azure — 20–25%);
     4. *Implement and manage virtual networking* (Implementar e gerenciar redes virtuais — 15–20%);
     5. *Monitor and maintain Azure resources* (Monitorar e manter recursos do Azure — 10–15%).
   - Confirmado o uso oficial do nome **Microsoft Entra ID** em todo o guia e no portal Azure (`portal.azure.com`).
3. **Caminhos validados no Portal Azure (`portal.azure.com`):**
   - Barra de busca global no topo: `Search resources, services, and docs (G+/)`
   - Busca 1: `Virtual machines` → Serviço **Virtual machines** (listagem de máquinas virtuais).
   - Busca 2: `Storage accounts` → Serviço **Storage accounts** (listagem de contas de armazenamento).
   - Busca 3: `Virtual networks` → Serviço **Virtual networks** (listagem de redes virtuais).
   - Busca 4: `Microsoft Entra ID` → Serviço **Microsoft Entra ID** (visão geral do diretório / *Overview*).

---

## 6. Padrão Visual e Composição Técnica (1920×1080, 16:9, 30 fps)

- **Resolução e Taxa de Quadros:** `1920×1080` pixels (proporção 16:9), `30 fps` (*frames per second* — quadros por segundo).
- **Paleta Cromática:**
  - Fundo principal: Azul-escuro profundo (`#0A1628` e `#0F1E36`)
  - Detalhes e destaques: Ciano vibrante (`#00D4FF` e `#38BDF8`)
  - Texto principal: Branco puro (`#FFFFFF`) e cinza-claro de leitura (`#E2E8F0`) — contraste > 12:1 (AAA)
  - Alertas/Destaques de clique: Âmbar de alto contraste (`#F59E0B`) e Verde validação (`#10B981`)
- **Tipografia Sem Serifa:** *Segoe UI*, *Inter* ou *Roboto* (renderizada nativamente por código/captura, nunca gerada por IA de imagem).
- **Regras de Direção Visual:**
  - **Uma indicação visual por vez:** apenas um elemento recebe borda luminosa ciano, seta ou zoom suave a cada momento.
  - **Cursor destacado:** ponteiro ampliado com halo ciano pulsante durante a navegação na Cena 4.
  - **Selo obrigatório na Cena 4:** etiqueta fixa no canto superior direito: `SIMULAÇÃO DIDÁTICA — PORTAL AZURE`.
  - **Áudio:** Vinheta discreta de abertura (4s) e encerramento (5s). Zero música de fundo durante explicações e demonstrações.

---

## 7. Roteiro Completo e Storyboard Detalhado (Plano a Plano)

> **Resumo de Métricas do Roteiro:**
> - **Duração total:** `12:00` (720 segundos)
> - **Tempo em vinhetas e pausas pedagógicas silenciosas:** ~42 segundos (4s vinheta inicial + 5s pausa Exercício 1 + 5s pausa Exercício 2 + 5s pausa Atividade + ~18s pausas de leitura/cliques + 5s vinheta final)
> - **Tempo efetivo de narração falada:** ~678 segundos (11,3 minutos)
> - **Total de palavras narradas:** **1.498 palavras**
> - **Velocidade média global de narração:** **132,5 palavras por minuto (ppm)** (dentro da faixa-alvo de 125–145 ppm, reduzindo para ~110 ppm nos cliques da Cena 4).

---

### CENA 1 — 00:00–01:00 | Abertura com problema concreto
**Duração da cena:** 60 segundos | **Total de palavras:** 124 palavras | **Ritmo médio:** ~133 ppm (nos 56s falados)

| Plano | Tempo | Avatar (Lia) | Tela / Ação Visual (80% Fundo) | Narração (PT-BR) |
| :--- | :--- | :--- | :--- | :--- |
| **1.1** | `00:00–00:18`<br>*(18s)* | **Destaque central** (meio-corpo, 50% da tela).Aos `00:04`, acena com simpatia e sorri. Gestos abertos e acolhedores. | **[00:00–00:04]** Vinheta visual discreta (4s) com título: *Curso: Azure do Zero ao AZ-104 — Aula 01*.<br>**[00:04–00:18]** Painel azul-escuro com detalhes ciano. Surge legenda explicativa discreta da sigla: **AZ-104 = Exame de Certificação Administrador do Microsoft Azure**. | *(00:00–00:04: Vinheta sonora discreta de 4s; cessa totalmente aos 00:04)*<br><br>**“Bem-vinda, bem-vindo! Eu sou a Lia. Se Azure ainda parece um painel cheio de nomes estranhos, fica comigo. Vamos começar do zero e transformar esses nomes em tarefas que você consegue entender e praticar.”** |
| **1.2** | `00:18–00:40`<br>*(22s)* | Move-se suavemente para o **canto inferior direito (18% da largura)**. Aponta levemente para o fluxo à esquerda. | Animação limpa em 80% da tela: o computador da atendente **Ana** envia o cartão `Ordem de Serviço #1042 (Revisão de Freios — Veículo Fictício)` até o sistema da **Oficina Horizonte**. Abaixo, aparecem os ícones dos 3 perfis: **Ana** (consulta informações), **Bruno** (administra recursos) e **Equipe de Custos** (acompanha gastos). | “Ao longo do nosso curso rumo ao **AZ-104**, que é a certificação de Administrador do Azure da Microsoft, nós vamos acompanhar um cenário real de trabalho: a empresa fictícia **Oficina Horizonte**. Lá, a **Ana** consulta informações e registra ordens de serviço no computador dela; o **Bruno** administra os recursos técnicos; e uma **equipe** precisa acompanhar os custos.” |
| **1.3** | `00:40–01:00`<br>*(20s)* | Permanece no **canto inferior direito (18%)**. Conta nos dedos (1, 2, 3) em sincronia com cada pergunta destacada. | **Uma indicação visual por vez** sobre o sistema da Oficina Horizonte:<br>1) Brilha a etiqueta ciano **“Onde roda?”** (`00:42`);<br>2) Brilha **“Quem acessa?”** (`00:46`);<br>3) Brilha **“Quanto custa?”** (`00:50`).<br>Aos `00:54`, aparece o selo: *“Não precisa de conta Azure hoje”* e os 3 objetivos da aula. | “Para colocar esse sistema no ar, três perguntas aparecem na hora: **Onde roda?**, **Quem acessa?** e **Quanto custa?**. Cada decisão da oficina vai guiar as nossas aulas. E pode relaxar: hoje você **não precisa ter conta no Azure** para acompanhar. Vamos construir a sua base!” |

---

### CENA 2 — 01:00–03:00 | O que significa usar nuvem
**Duração da cena:** 120 segundos | **Total de palavras:** 266 palavras | **Ritmo médio:** ~138 ppm (com pausas de leitura aos `01:38`, `02:18` e `02:50`)

| Plano | Tempo | Avatar (Lia) | Tela / Ação Visual (80% Fundo) | Narração (PT-BR) |
| :--- | :--- | :--- | :--- | :--- |
| **2.1** | `01:00–01:35`<br>*(35s)* | **Canto inferior direito (18%)**. Expressão didática, mãos indicando o fluxo da esquerda para a direita. | Desenho arquitetural simples em três blocos conectados por setas luminosas ciano:<br>`[Computador da Ana]` ➔ `[Internet]` ➔ `[Infraestrutura de Nuvem (Azure)]`.<br>Zoom suave no terceiro bloco mostrando três peças internas destacadas uma por vez: **Servidor**, **Aplicação** e **Armazenamento**. | “Mas o que acontece quando a Ana clica em salvar uma ordem de serviço usando a nuvem? Olha este desenho simples: o pedido sai do computador da atendente, passa pela internet e chega a uma estrutura que tem três partes essenciais. Primeiro, o **servidor**, que nada mais é do que um computador preparado para fornecer um serviço a outros computadores. Segundo, a **aplicação**, que é o software em si, o programa de ordens de serviço. E terceiro, o **armazenamento**, que é o local de persistência dos dados — onde as informações ficam gravadas para não sumirem.” |
| **2.2** | `01:35–02:05`<br>*(30s)* | **Canto inferior direito (18%)**. Tom claro e seguro ao definir o Azure e a sigla TI. | Destaque ciano envolvendo o bloco da direita com o título: **Microsoft Azure — Plataforma de nuvem da Microsoft**. Abaixo, etiqueta explicativa: **TI = Tecnologia da Informação**. A Ordem de Serviço `#1042` entra no sistema e é gravada no ícone de Armazenamento. | “E onde entra o **Azure**? O Azure é a plataforma de nuvem da Microsoft. É um conjunto imenso de servidores, redes e serviços que a empresa contrata pela internet para rodar aplicações e guardar dados. Para a equipe de **TI** — isto é, de **Tecnologia da Informação** — onde o Bruno trabalha, entender a nuvem começa comparando dois caminhos possíveis para a Oficina Horizonte.” |
| **2.3** | `02:05–02:38`<br>*(33s)* | Muda para o **canto inferior esquerdo (18%)** para deixar o lado direito da comparação totalmente livre. | Tela dividida ao meio:<br>- **Esquerda (Sala de servidores própria / Local):** rack físico na oficina, cabos, ar-condicionado, discos e servidor.<br>- **Direita (Serviços contratados na nuvem — Azure):** datacenter físico da Microsoft conectado via internet.<br>A **mesma Ordem de Serviço #1042** percorre o caminho de cima e o debaixo simultaneamente. | “Veja a mesma ordem de serviço da Ana em dois cenários. No primeiro, a Oficina Horizonte mantém uma **sala de servidores própria**: ela compra as máquinas físicas, cuida da tomada, do ar-condicionado, dos cabos e dos discos. No segundo, ela usa **serviços contratados na nuvem**. Repare bem: usar nuvem **não significa que os equipamentos físicos deixaram de existir**! Eles continuam lá, só que dentro dos centros de dados da Microsoft.” |
| **2.4** | `02:38–03:00`<br>*(22s)* | **Canto inferior esquerdo (18%)**. Leve sorriso de alerta quando fala de custos; expressão firme e convicta na frase final de transição. | Indicador visual sobre o ícone de custos (`Quanto custa?`): alerta amarelo *“Nuvem ≠ Economia automática (exige dimensionamento e controle)”*. Em seguida (`02:50`), destaque luminoso ciano sobre a frase de transição na parte inferior do diagrama. | “Outro ponto importante: ir para a nuvem **não garante economia automática**. Se o Bruno deixar recursos grandes ligados sem necessidade, a conta sobe! Na prática, a grande mudança entre a sala própria e o Azure é uma só... *(pausa 1s)* **O servidor não desapareceu. Mudou quem cuida de cada parte — e é aí que começa o trabalho de administração.**” |

---

### CENA 3 — 03:00–06:00 | Três modelos com o mesmo negócio
**Duração da cena:** 180 segundos | **Total de palavras:** 404 palavras | **Ritmo médio:** ~137 ppm

| Plano | Tempo | Avatar (Lia) | Tela / Ação Visual (80% Fundo) | Narração (PT-BR) |
| :--- | :--- | :--- | :--- | :--- |
| **3.1** | `03:00–03:32`<br>*(32s)* | **Canto inferior direito (18%)**. Gesto organizador apresentando a grade de três cartões. | Topo da tela exibe os três cartões vazios que vão se preencher: **IaaS**, **PaaS** e **SaaS**, e abaixo uma tabela com duas colunas: **“Exemplo”** e **“O que a equipe administra”**. Legenda na tela explica **AZ-900 (Exame Fundamentos do Azure)** e **IaaS (Infrastructure as a Service — Infraestrutura como Serviço)**. | “Se você já ouviu falar do exame inicial **AZ-900**, sabe que existem três modelos clássicos de serviço na nuvem. Aqui nós não vamos fazer uma revisão teórica longa: vamos ver como cada modelo muda o trabalho prático do Bruno na Oficina Horizonte! O primeiro modelo é o **IaaS**, sigla em inglês para *Infrastructure as a Service*, ou **Infraestrutura como Serviço**.” |
| **3.2** | `03:32–04:05`<br>*(33s)* | **Canto inferior direito (18%)**. Aponta para as camadas do Cartão 1 (IaaS) enquanto elas se acendem. | **Cartão 1 (IaaS)** ganha zoom suave. Mostra uma **VM (Virtual Machine — Máquina Virtual)** com o ícone do **Azure Virtual Machines**, contendo: `[Sistema Operacional]` + `[Aplicação da Oficina]`.<br>Na tabela abaixo, preenche-se a linha 1:<br>- **Exemplo:** `Azure Virtual Machines (Máquinas Virtuais)`<br>- **O que a equipe administra:** `Sistema operacional, aplicação da oficina, configurações de rede e dados`. | “No **IaaS**, um exemplo direto no Azure é o **Azure Virtual Machines**, ou seja, as **Máquinas Virtuais** — que você também vai ver abreviadas como **VM**, de *Virtual Machine*. Aqui a Microsoft cuida do prédio e do servidor físico, mas entrega para o Bruno um computador virtual. É a equipe da oficina que escolhe, instala e atualiza o **sistema operacional**, como Windows ou Linux, e instala dentro dele a aplicação de ordens de serviço.” |
| **3.3** | `04:05–04:38`<br>*(33s)* | **Canto inferior direito (18%)**. Gestos mostrando alívio de tarefa operacional ao passar do Cartão 1 para o Cartão 2. | **Cartão 2 (PaaS)** se acende ao centro. Legenda explica: **PaaS (Platform as a Service — Plataforma como Serviço)**. Animação mostra a aplicação da Oficina Horizonte sendo colocada diretamente sobre o ícone do **Azure App Service** (plataforma gerenciada).<br>Na tabela, preenche-se a linha 2:<br>- **Exemplo:** `Azure App Service (Serviço de Aplicativo)`<br>- **O que a equipe administra:** `Aplicação, configurações do serviço, dados e acessos (sem gerenciar o sistema operacional)`. | “Já o segundo modelo é o **PaaS**, *Platform as a Service*, ou **Plataforma como Serviço**. O exemplo no Azure é o **Azure App Service**, o Serviço de Aplicativo. Imagine que a oficina não quer perder tempo cuidando de atualizações do sistema operacional. No PaaS, a Microsoft já entrega a plataforma gerenciada pronta para receber o código. Mais adiante veremos como publicar aplicações, mas repare na tabela: aqui a equipe administra a **aplicação, as configurações e os dados**, sem gerenciar o sistema operacional.” |
| **3.4** | `04:38–05:12`<br>*(34s)* | Muda para o **canto inferior esquerdo (18%)** para não cobrir o Cartão 3 à direita. Expressão de aviso importante ao explicar o Microsoft 365. | **Cartão 3 (SaaS)** se acende à direita. Legenda explica: **SaaS (Software as a Service — Software como Serviço)**. Mostra o ícone do **Microsoft 365** com um aviso em destaque ciano/âmbar:<br>⚠️ **Exemplo de SaaS (aplicação pronta) — NÃO é um recurso que será criado neste laboratório Azure.**<br>Na tabela, preenche-se a linha 3:<br>- **Exemplo:** `Microsoft 365 (Exemplo de SaaS — fora do laboratório Azure)`<br>- **O que a equipe administra:** `Usuários/identidades, permissões e dados corporativos`. | “E o terceiro modelo é o **SaaS**, *Software as a Service*, ou **Software como Serviço**. É quando você contrata uma aplicação inteira já pronta para uso, como o **Microsoft 365** para e-mail e documentos da oficina. E atenção a um detalhe importante: nós trazemos o **Microsoft 365** aqui apenas como **exemplo claro de SaaS**; ele **não é um recurso que vamos criar dentro dos nossos laboratórios do portal Azure**, combinado?” |
| **3.5** | `05:12–05:40`<br>*(28s)* | **Canto inferior esquerdo (18%)**. Aponta para as 4 linhas da matriz que surge no centro da tela. | Transição suave para a **Matriz Simplificada de Responsabilidade Compartilhada** (baseada na documentação oficial da Microsoft) com **4 linhas** e 3 colunas (**IaaS**, **PaaS**, **SaaS**):<br>1. **Infraestrutura física:** Microsoft \| Microsoft \| Microsoft<br>2. **Sistema operacional:** Cliente (Oficina) \| Microsoft \| Microsoft<br>3. **Aplicação / configurações:** Cliente (Oficina) \| Compartilhado (Cliente configura) \| Compartilhado (Cliente configura)<br>4. **Dados / identidades:** **Cliente (Oficina)** \| **Cliente (Oficina)** \| **Cliente (Oficina)** | “Agora junte tudo nesta matriz de quatro linhas. Na primeira linha, a **infraestrutura física** fica com a Microsoft nos três modelos. Na segunda, o **sistema operacional** é tarefa da equipe da oficina no IaaS, mas passa para a Microsoft no PaaS e no SaaS. Na terceira, em **aplicação e configurações**, a responsabilidade vai sendo compartilhada conforme o modelo.” |
| **3.6** | `05:40–06:00`<br>*(20s)* | **Canto inferior esquerdo (18%)**. Olhar atento para a câmera, destacando a linha 4 da matriz. | Uma borda ciano brilhante envolve a **Linha 4 (Dados / identidades)** e a parte de configurações da Linha 3. Ícone de cadeado ao lado de **Ana** (identidade), **Bruno** (configuração) e **Registros da Oficina** (dados). | “Mas olhe com muita atenção para a quarta linha: **dados e identidades**. Muita gente acha que, ao usar PaaS ou SaaS, a Microsoft assume toda a segurança sozinha. Isso é um erro! **Os dados da oficina, as identidades dos funcionários e as configurações sob controle do cliente continuam exigindo cuidado da sua equipe sempre.**” |

---

### CENA 4 — 06:00–09:00 | O que veremos no portal e no curso
**Duração da cena:** 180 segundos | **Total de palavras:** 362 palavras | **Ritmo médio:** ~112 ppm nos cliques (`06:15–08:15`) e ~136 ppm na visão do curso (`08:15–09:00`)

| Plano | Tempo | Avatar (Lia) | Tela / Ação Visual (80% Fundo — Simulação Didática) | Narração (PT-BR — mais pausada nos cliques) |
| :--- | :--- | :--- | :--- | :--- |
| **4.1** | `06:00–06:40`<br>*(40s)* | **Canto inferior direito (16%)**, fora da área de listagem do portal. Fala mais pausada durante o clique na busca. | Abre-se a interface fiel do **Portal Azure (`portal.azure.com`)** com o selo fixo no topo direito: **`SIMULAÇÃO DIDÁTICA`**.<br>- **Estado inicial (`06:00`):** Tela *Home* do portal; barra superior `Search resources, services, and docs (G+/)` vazia.<br>- **Ação (`06:14`):** Cursor destacado clica na barra de busca, digita `Virtual machines` e clica no item **Virtual machines**.<br>- **Resultado verificável (`06:24`):** Abre a página de listagem **Virtual machines** (`No virtual machines to display`). Surge sobreposição ciano: **`Máquinas virtuais — EXECUTAR (Computação / IaaS)`**. | “Vamos ver onde essas peças moram dentro do Portal do Azure? Estamos aqui em uma **simulação didática** fiel do portal, sem precisar criar conta nem gastar nada. Olhe o estado inicial no topo da tela: a barra de busca global. *(fala mais pausada)* Eu levo o cursor até a busca, digito **Virtual machines** e clico na opção **Virtual machines**. Veja o resultado: abrimos a página de listagem de **Máquinas virtuais**. Nós não vamos clicar em criar recurso pago; queremos apenas reconhecer o terreno. No desenho da Oficina Horizonte, esta tela representa **executar** o sistema em uma máquina virtual.” |
| **4.2** | `06:40–07:12`<br>*(32s)* | **Canto inferior direito (16%)**. Acompanha com o olhar o movimento do cursor até a barra de busca. | - **Estado inicial (`06:40`):** Página de listagem *Virtual machines*, barra de busca no topo.<br>- **Ação (`06:46`):** Cursor destacado clica na barra de busca superior, digita `Storage accounts` e clica em **Storage accounts**.<br>- **Resultado verificável (`06:56`):** Abre a página de listagem **Storage accounts** (`No storage accounts to display`). Surge sobreposição ciano: **`Contas de armazenamento — GUARDAR (Persistência de Dados)`**. | “Agora vamos localizar a segunda peça. *(fala mais pausada)* Voltamos o cursor para a barra de busca no topo, digitamos **Storage accounts** e clicamos em **Storage accounts**. O resultado na tela é a listagem de **Contas de armazenamento**. Lembra que falamos que as ordens de serviço da Ana e as fotos das peças não podem sumir? É aqui que o administrador configura onde **guardar** dados e arquivos na nuvem.” |
| **4.3** | `07:12–07:42`<br>*(30s)* | **Canto inferior direito (16%)**. Gesto conectando dois pontos com as mãos. | - **Estado inicial (`07:12`):** Página *Storage accounts*, barra de busca visível.<br>- **Ação (`07:18`):** Cursor clica na barra de busca, digita `Virtual networks` e seleciona **Virtual networks**.<br>- **Resultado verificável (`07:27`):** Abre a página de listagem **Virtual networks** (`No virtual networks to display`). Surge sobreposição ciano: **`Redes virtuais — CONECTAR (Comunicação Segura)`**. | “Terceira parada na nossa busca. *(fala mais pausada)* Clicamos novamente no campo de pesquisa no topo, digitamos **Virtual networks** e selecionamos **Virtual networks**. Chegamos à listagem de **Redes virtuais**. No nosso desenho da oficina, essa área serve para **conectar** com segurança os servidores e o armazenamento, controlando por onde o tráfego pode passar.” |
| **4.4** | `07:42–08:18`<br>*(36s)* | **Canto inferior direito (16%)**. Aponta para o título *Microsoft Entra ID* no painel aberto. | - **Estado inicial (`07:42`):** Página *Virtual networks*, barra de busca no topo.<br>- **Ação (`07:48`):** Cursor clica na busca, digita `Microsoft Entra ID` e clica em **Microsoft Entra ID**.<br>- **Resultado verificável (`07:58`):** Abre o painel *Overview* (Visão geral) do **Microsoft Entra ID** (`Oficina Horizonte - Default Directory`). Surge sobreposição ciano: **`Microsoft Entra ID — IDENTIFICAR (Identidades e Acessos)`**. | “E falta uma pergunta essencial: quem controla o login da Ana e do Bruno? *(fala mais pausada)* Na barra de busca, digitamos **Microsoft Entra ID** — onde **ID** vem de *Identity*, ou Identidade — e clicamos em **Microsoft Entra ID**. Este é o nome oficial e atual do serviço de identidade da Microsoft. Veja o painel aberto: ele cumpre o papel de **identificar** pessoas e aplicações, definindo quem entra e o que cada um pode fazer.” |
| **4.5** | `08:18–09:00`<br>*(42s)* | Move-se para o **canto inferior esquerdo (18%)**. Tom motivador e transparente sobre a jornada até o AZ-104. | As 4 telas do portal se encaixam nos 4 verbos do desenho da Oficina Horizonte (**Executar**, **Guardar**, **Conectar**, **Identificar**) e se expandem para os **5 blocos do curso / Guia Oficial AZ-104**:<br>1. **Identidade e governança** (20–25%)<br>2. **Armazenamento** (15–20%)<br>3. **Computação** (20–25%)<br>4. **Redes** (15–20%)<br>5. **Monitoramento e manutenção** (10–15%)<br>Selo na base: *“As primeiras aulas constroem a base e não cobrem toda a certificação de uma vez.”* | “Olha que clareza: **executar**, **guardar**, **conectar** e **identificar**! O papel do administrador Azure — o trabalho do Bruno e o seu futuro trabalho — é planejar, configurar e manter esses blocos funcionando em conjunto. Não por acaso, esse é exatamente o percurso do nosso curso e do guia oficial do exame **AZ-104**: **identidade e governança**, **armazenamento**, **computação**, **redes** e **monitoramento e manutenção**. E vale a sinceridade: estas primeiras aulas constroem a sua base sólida; elas não cobrem toda a certificação de uma vez, porque primeiro nós aprendemos a organizar a casa antes de empilhar recursos!” |

---

### CENA 5 — 09:00–11:00 | Participação do aluno
**Duração da cena:** 120 segundos | **Total de palavras:** 230 palavras | **Ritmo médio:** ~135 ppm nos trechos falados + **pausas reais cronometradas**

> **Nota Pedagógica Obrigatória (exibida no topo da tela durante toda a Cena 5):**  
> `EXERCÍCIOS AUTORAIS DE FIXAÇÃO — Não são questões reais de prova da Microsoft`

| Plano | Tempo | Avatar (Lia) | Tela / Ação Visual (80% Fundo) | Narração (PT-BR) e Pausas Reais |
| :--- | :--- | :--- | :--- | :--- |
| **5.1** | `09:00–09:42`<br>*(42s)* | **Canto inferior direito (18%)**. Faz gesto de pergunta; durante a pausa de 5s (`09:17–09:22`), aguarda sorrindo e olhando para a câmera em silêncio real. | Cartão do **Exercício Autoral 01**:<br>*“A oficina precisa instalar e manter seu próprio sistema operacional. Qual dos três modelos combina mais diretamente com essa necessidade?”*<br>Botões na tela:<br>- **A) IaaS** *(Infraestrutura como Serviço)*<br>- **B) PaaS** *(Plataforma como Serviço)*<br>- **C) SaaS** *(Software como Serviço)*<br>**[09:17–09:22]** Barra de pausa de **5 segundos**. Aos `09:22`, **A) IaaS** fica verde (`#10B981`). | “Agora é a sua vez de participar com dois desafios autorais que preparamos para fixar a base! Primeira pergunta: **A oficina precisa instalar e manter seu próprio sistema operacional. Qual dos três modelos combina mais diretamente com essa necessidade? A) IaaS, B) PaaS ou C) SaaS?** Pense por cinco segundos...<br><br>*(Pausa silenciosa real de 5 segundos: 09:17 a 09:22)*<br><br>Se você respondeu a letra **A, IaaS**, acertou em cheio! Na Infraestrutura como Serviço, como nas Máquinas Virtuais do Azure, a equipe continua administrando diretamente o **sistema operacional**.” |
| **5.2** | `09:42–10:20`<br>*(38s)* | **Canto inferior direito (18%)**. Levanta uma sobrancelha de forma expressiva na pergunta; aguarda 5s em silêncio (`09:53–09:58`); balança a cabeça negativamente com firmeza amigável no gabarito. | Cartão do **Exercício Autoral 02**:<br>*“Colocar a aplicação na nuvem elimina a necessidade de cuidar dos acessos dos funcionários?”*<br>**[09:53–09:58]** Barra de pausa de **5 segundos**.<br>Aos `09:58`, surge o gabarito em destaque: **`RESPOSTA: NÃO!`** + resumo: *“A equipe continua responsável pelas contas, identidades e acessos que administra em qualquer modelo.”* | “Vamos para a segunda pergunta: **Colocar a aplicação na nuvem elimina a necessidade de cuidar dos acessos dos funcionários?** Vou dar uma pausa para você responder...<br><br>*(Pausa silenciosa real de 5 segundos: 09:53 a 09:58)*<br><br>A resposta é **não**! Mesmo quando contratamos um serviço gerenciado na nuvem, a nossa equipe continua responsável pelos acessos, contas e permissões dos funcionários que ela administra. Serviço gerenciado nunca significa responsabilidade eliminada!” |
| **5.3** | `10:20–11:00`<br>*(40s)* | Muda para o **canto inferior esquerdo (18%)**. Aponta para as três caixas do exercício prático que se preenchem na tela. | Quadro **Mão na Massa (Sem Conta Azure)**: três caixas tracejadas intituladas **1. Aplicação**, **2. Dados** e **3. Pessoas que terão acesso**.<br>**[10:33–10:38]** Pausa de 5 segundos.<br>Aos `10:38`, as três caixas exibem o exemplo preenchido:<br>- **Aplicação:** `sistema de ordens`<br>- **Dados:** `registros da oficina`<br>- **Pessoas que terão acesso:** `equipe de atendimento` *(ex.: Ana na consulta e Bruno na administração)* | “Para fechar a prática de hoje, faça um rascunho rápido no papel ou mentalmente: desenhe três caixinhas separando **a aplicação**, **os dados** e **as pessoas que terão acesso** no nosso cenário.<br><br>*(Pausa real de 5 segundos: 10:33 a 10:38)*<br><br>Olha na tela um exemplo preenchido bem direto: na aplicação, temos o **sistema de ordens**; nos dados, os **registros da oficina**; e nas pessoas que terão acesso, a **equipe de atendimento**, como a Ana, além da administração técnica do Bruno.” |

---

### CENA 6 — 11:00–12:00 | Recapitulação e próximo passo
**Duração da cena:** 60 segundos | **Total de palavras:** 112 palavras | **Ritmo médio:** ~134 ppm (nos 50s falados + 5s pausa de leitura + 5s vinheta/fontes finais)

| Plano | Tempo | Avatar (Lia) | Tela / Ação Visual (80% Fundo) | Narração (PT-BR) |
| :--- | :--- | :--- | :--- | :--- |
| **6.1** | `11:00–11:40`<br>*(40s)* | **Canto inferior esquerdo (18%)**. Aponta para cada uma das três áreas do desenho arquitetural (uma por vez). | **Recapitulação 100% visual sobre o desenho da Oficina Horizonte** (sem blocos de texto corrido):<br>1) **Onde roda?** ➔ Ilumina o bloco de Nuvem Azure (`VM = IaaS` / `App Service = PaaS` + `Storage` + `VNet`).<br>2) **Quem acessa?** ➔ Ilumina o selo `Microsoft Entra ID` ligando Ana e Bruno.<br>3) **Quanto custa?** ➔ Ilumina o medidor de governança da Equipe de Custos (indicando `0 recursos criados hoje`). | “Viu como aquele painel cheio de nomes estranhos já ganhou sentido? Olhando apenas para o nosso desenho da Oficina Horizonte, nós já respondemos às três perguntas da abertura: **Onde roda?** Na infraestrutura do Azure, sabendo diferenciar uma máquina virtual em **IaaS** de uma plataforma em **PaaS**. **Quem acessa?** As identidades cuidadas pela nossa equipe no **Microsoft Entra ID**. E **quanto custa?** Aquilo que planejamos e monitoramos — lembrando que hoje nós apenas exploramos o portal e **nenhum recurso foi criado**.” |
| **6.2** | `11:40–12:00`<br>*(20s)* | **[11:40–11:52]** Volta ao **destaque central (50%)**, sorridente e entusiasmada.<br>**[11:52–12:00]** Permanece no canto esquerdo ao lado da cartela final de fontes e revisão. | **[11:40–11:52]** Destaque visual na frase final.<br>**[11:52–12:00]** Cartela de encerramento com vinheta discreta (5s):<br>- **Fontes Oficiais:**<br>  1. *Shared responsibility in the cloud* — `learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility`<br>  2. *Study guide for Exam AZ-104* — `learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104`<br>- **Data de revisão:** `29/09/2026`<br>- **Aviso:** *Este curso prepara você com base prática e teórica, sem prometer aprovação automática na certificação.* | **“Na próxima aula, vamos entrar no portal e entender onde você está trabalhando antes de clicar em Criar. Organização começa antes do primeiro recurso!”**<br><br>*(11:52–11:55: “Confira na tela as fontes oficiais revisadas em 29 de setembro de 2026. Até a próxima aula!”)*<br>*(11:55–12:00: Vinheta discreta de encerramento de 5s)* |

---

## 8. Checklist de Validação Pedagógica e Técnica (Auditoria de Qualidade)

- [x] **Iniciantes absolutos / Zero pré-requisitos ocultos:** Servidor, aplicação, armazenamento e nuvem definidos antes de introduzir IaaS/PaaS/SaaS.
- [x] **Siglas explicadas na primeira ocorrência:** AZ-104, TI, AZ-900, IaaS, VM, PaaS, SaaS e ID explicadas imediatamente ao surgirem.
- [x] **Validação final do aluno:** Associação explícita de uma VM (*Virtual Machine*) ao modelo **IaaS** e distinção clara entre **serviço gerenciado** e **responsabilidade eliminada**.
- [x] **Honestidade operacional:** Nenhuma criação de recurso é apresentada como realizada; o Microsoft 365 é explicitamente identificado como exemplo externo de SaaS; a navegação do portal traz o selo **“Simulação didática”**.
- [x] **Nomenclatura atualizada:** Uso exclusivo de **Microsoft Entra ID**.
- [x] **Fontes e Data de Revisão:** Exibidas no encerramento com a data **29/09/2026** e sem promessa de aprovação automática na certificação.
