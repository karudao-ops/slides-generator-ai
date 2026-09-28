# Gerador de Slides AI

## Goal
Construir uma aplicação Web Completa (Next.js Fullstack) que receba arquivos (PPT, PDF, DOCX, Imagens), use IA (OpenAI/Gemini) para reescrever o conteúdo de forma educacional e gere um arquivo PPTX moderno em um processo iterativo (com aprovação humana antes de gerar).

## Tecnologias Escolhidas
- **Framework Fullstack:** Next.js (App Router, Server Actions, React, Tailwind CSS, Shadcn UI)
- **Manipulação de PPTX:** `pptxgenjs` (para gerar os slides e aplicar estilos)
- **Processamento de Arquivos:** `pdf-parse` (PDF), `mammoth` (DOCX)
- **IA:** Integração com OpenAI API / Gemini API (via Vercel AI SDK ou pacotes nativos)

## Tasks
- [ ] Task 1: Scaffolding inicial do Projeto (Next.js). -> Verify: App acessível em localhost:3000.
- [ ] Task 2: Implementar módulo de extração de conteúdo (API Routes) para suporte a PDF e DOCX. -> Verify: Endpoint `/api/upload` extrai e retorna o texto.
- [ ] Task 3: Integrar pipeline de IA (OpenAI/Gemini) para gerar o "Roteiro de Slides" iterativo. -> Verify: Endpoint retorna um array de objetos JSON (título, subtítulo, conteúdo visual sugerido).
- [ ] Task 4: Desenvolver Interface de Usuário (Iterativa). -> Verify: UI com passos de Upload -> Revisão do Roteiro Gerado pela IA -> Escolha de Template.
- [ ] Task 5: Implementar mecanismo de Enriquecimento Visual (busca de imagens royalty-free ou DALL-E). -> Verify: IA inclui links de imagens válidas no roteiro.
- [ ] Task 6: Implementar Geração de PPTX via `pptxgenjs` no servidor. -> Verify: Endpoint final compila as informações e retorna o arquivo .pptx para download.
- [ ] Task 7: Conectar Frontend ao endpoint de download. -> Verify: Usuário realiza o download do PPTX final.

## Done When
- [ ] Usuário faz upload de um material bruto.
- [ ] Interface exibe um roteiro otimizado educacionalmente pela IA para revisão.
- [ ] O usuário escolhe uma opção de design (template).
- [ ] O sistema retorna um arquivo `.pptx` profissional, com mídia inserida e layouts modernos, sem limite de tamanho.
