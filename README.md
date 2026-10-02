# Curso Microsoft Azure Administrator (AZ-104) — Pipeline Audiovisual Didático

Repositório oficial de scripts, roteiros, diagramas e pipeline de geração audiovisual automatizada para o **Curso AZ-104 (Microsoft Azure Administrator)**, apresentado pela instrutora digital **Lia**.

---

## 📚 Estrutura do Curso

O projeto está organizado em módulos/aulas independentes:

### 🔹 [`aula-01-azure-do-zero`](./aula-01-azure-do-zero/)
- **Tema:** Introdução prática ao Azure do zero.
- **Conceitos Abordados:** Modelos de nuvem (IaaS, PaaS, SaaS), responsabilidade compartilhada, visão geral do Portal Azure e ambientação.
- **Conteúdo:**
  - Roteiro completo e storyboard (`roteiro-e-storyboard-aula01.md`).
  - Alinhamento fonético e geração de diagramas (`render-editorial-diagrams.js`, `phonetic-aligner-ptbr.js`).
  - Legendas em português perfeitamente sincronizadas (`aula01-legendas-ptbr.srt`).
  - Tabela editorial completa com minutagem e falas (`Aula_01_Clipes.csv`).

### 🔹 [`aula-02-ambiente-e-custos`](./aula-02-ambiente-e-custos/)
- **Tema:** Encontrando o ambiente certo e preparando o controle de custos.
- **Conceitos Abordados:** Relação Conta vs Diretório/Tenant (Microsoft Entra ID) vs Assinatura (`sub-az104-lab`), filtros globais, governança de Grupos de Recursos, criação de orçamentos (*Budgets*) com alertas em 50%, 80% e 100%.
- **Conteúdo:**
  - Pipeline de produção autônomo com síntese neural de alta fidelidade (`build-aula02-free-edition.js`).
  - Gerador de diagramas e simulações do Portal Azure em Full HD 1080p (`render-editorial-diagrams-a02.js`).
  - Mapeamento das 62 unidades de fala e roteiro (`aula02-roteiro-unidades.js`).
  - Legendas sincronizadas (`aula02-legendas-ptbr.srt`) e tabela editorial (`Aula_02_Clipes.csv`).

---

## 🛠️ Tecnologias Utilizadas

- **Runtime:** Node.js (v18+)
- **Renderização e Manipulação Gráfica:** Sharp, SVG dinâmico, Canvas
- **Síntese de Áudio Neural (TTS):** Microsoft Speech Neural Engine (`pt-BR-FranciscaNeural`)
- **Processamento e Montagem de Vídeo:** FFmpeg (`libx264`, `aac`, Ken Burns push-in, keyframe animation)
- **Estruturação de Dados:** CSV, SRT, JSON

---

## 🚀 Como Executar

### 1. Pré-requisitos
- Node.js instalado na máquina
- FFmpeg instalado no PATH do sistema

### 2. Executando uma aula
Entre no diretório da aula desejada e instale as dependências:

```bash
cd aula-02-ambiente-e-custos
npm install
node build-aula02-free-edition.js
```

Os blocos de vídeo e o filme consolidado serão gerados no diretório local `videos/`.

---

## 🔒 Segurança e Boas Práticas

- Arquivos de credenciais (`service-account.json`, `.env`), vídeos compilados e diretórios temporários são rigorosamente mantidos fora do controle de versão pelo `.gitignore`.
