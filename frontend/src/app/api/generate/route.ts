import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { GoogleGenAI } from "@google/genai";

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
    const { text, theme, provider = "auto", model } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "O texto base é obrigatório." }, { status: 400 });
    }

    // Determine effective provider
    let selectedProvider = provider;
    if (selectedProvider === "auto") {
      if (process.env.GEMINI_API_KEY) {
        selectedProvider = "gemini";
      } else if (process.env.OPENAI_API_KEY) {
        selectedProvider = "openai";
      } else {
        return NextResponse.json(
          { error: "Nenhuma chave de API configurada. Por favor, adicione GEMINI_API_KEY ou OPENAI_API_KEY no arquivo .env.local." },
          { status: 500 }
        );
      }
    }

    let aiContent = "";

    // 1. Google Gemini Provider
    if (selectedProvider === "gemini") {
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
          { error: "A chave da API (GEMINI_API_KEY) não está configurada no .env.local." },
          { status: 500 }
        );
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const geminiModel = model || "gemini-2.5-flash";

      const prompt = `Por favor, transforme o seguinte texto no formato JSON de slides. Tema/Intenção opcional do autor: ${theme || "Nenhum"}\n\nTEXTO BRUTO:\n${text.substring(0, 50000)}`;

      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      aiContent = response.text || "";
    } 
    // 2. OpenAI Provider
    else if (selectedProvider === "openai") {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: "A chave da API (OPENAI_API_KEY) não está configurada no .env.local." },
          { status: 500 }
        );
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const openaiModel = model || "gpt-4o";

      const response = await openai.chat.completions.create({
        model: openaiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Por favor, transforme o seguinte texto no formato JSON de slides. Tema/Intenção opcional do autor: ${theme || "Nenhum"}\n\nTEXTO BRUTO:\n${text.substring(0, 50000)}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      aiContent = response.choices[0].message.content || "";
    } else {
      return NextResponse.json(
        { error: `Provedor de IA desconhecido: ${selectedProvider}. Use 'gemini' ou 'openai'.` },
        { status: 400 }
      );
    }

    if (!aiContent) {
      throw new Error("A IA retornou uma resposta vazia.");
    }

    // Clean potential markdown blocks
    let cleaned = aiContent.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
    }

    let slides = [];
    try {
      const parsed = JSON.parse(cleaned);
      slides = Array.isArray(parsed) ? parsed : parsed.slides || Object.values(parsed)[0];
      if (!Array.isArray(slides)) {
        slides = [parsed];
      }
    } catch (e) {
      console.error("Falha ao parsear JSON:", e, "Raw output:", aiContent);
      return NextResponse.json({ error: "A resposta da IA não estava em formato JSON válido." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      provider: selectedProvider,
      slides,
    });

  } catch (error: unknown) {
    console.error("Generate Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao gerar roteiro com IA.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
