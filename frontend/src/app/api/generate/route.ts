import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "", // Assume user will set this in .env.local
});

const systemPrompt = `Você é um especialista em design educacional e automação de apresentações.
Sua tarefa é receber um texto extraído de um documento bruto (PDF, PPTX, DOCX, TXT) e transformá-lo em um roteiro de apresentação de slides, dividindo e reescrevendo o conteúdo de forma didática, clara, moderna e envolvente.

REGRAS:
1. Respeite o tema central do documento.
2. Seja pedagogicamente apropriado. Explique conceitos difíceis de forma simples.
3. Não crie slides muito longos. Um slide não deve passar de 3 a 4 tópicos (bullet points) ou um parágrafo conciso.
4. Você NÃO TEM limite de slides, então prefira espalhar o conteúdo por mais slides ao invés de aglomerar informações num só.
5. Para cada slide, sugira uma ideia de "imagem" (termo de busca em inglês) que reforce o texto.
6. A saída DEVE ser estritamente em JSON, seguindo a estrutura abaixo. Não retorne NADA além do JSON puro.

FORMATO DE SAÍDA ESPERADO (JSON Object):
{
  "slides": [
    {
      "title": "Título do Slide",
      "content": "Conteúdo principal ou texto do slide...",
      "bullets": ["ponto 1", "ponto 2", "ponto 3"],
      "imageSearchTerm": "termo em inglês para busca de imagem",
      "speakerNotes": "Notas (opcional)"
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { text, theme } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "O texto base é obrigatório." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
       return NextResponse.json({ error: "A chave da API (OPENAI_API_KEY) não está configurada." }, { status: 500 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Por favor, transforme o seguinte texto no formato JSON de slides. Tema/Intenção opcional do autor: ${theme || "Nenhum"}\n\nTEXTO BRUTO:\n${text.substring(0, 50000)}` }
      ],
      response_format: { type: "json_object" }, // we might need to wrap the array in an object for JSON mode to work properly
      temperature: 0.7,
    });

    const aiContent = response.choices[0].message.content;
    if (!aiContent) throw new Error("A IA retornou vazio.");

    // Parse the JSON. Because we asked for json_object, maybe the prompt needs an object root.
    // Let's parse it safely.
    let slides = [];
    try {
      const parsed = JSON.parse(aiContent);
      slides = Array.isArray(parsed) ? parsed : parsed.slides || Object.values(parsed)[0];
    } catch (e) {
      // fallback regex if it wrapped it weirdly
      console.error("Falha ao parsear JSON:", e);
      return NextResponse.json({ error: "A resposta da IA não estava em formato JSON válido." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      slides,
    });

  } catch (error: any) {
    console.error("Generate Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao gerar roteiro com IA." }, { status: 500 });
  }
}
