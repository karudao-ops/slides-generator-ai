import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let extractedText = "";
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    // Text Extraction Logic
    if (fileName.endsWith(".pdf") || mimeType === "application/pdf") {
      const parser = new PDFParse({ data: buffer });
      try {
        const data = await parser.getText();
        extractedText = data.text || "";
      } finally {
        await parser.destroy().catch(() => {});
      }
    } 
    else if (fileName.endsWith(".docx") || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } 
    else if (fileName.endsWith(".txt") || mimeType === "text/plain") {
      extractedText = buffer.toString("utf-8");
    }
    else if (fileName.endsWith(".pptx") || fileName.endsWith(".ppt")) {
      return NextResponse.json({ error: "Para processar PPTX, exporte como PDF primeiro." }, { status: 400 });
    }
    else {
      return NextResponse.json({ error: "Formato de arquivo não suportado no momento." }, { status: 400 });
    }

    // Return the extracted text
    return NextResponse.json({
      success: true,
      fileName: file.name,
      extractedText: extractedText.trim(),
    });

  } catch (error: unknown) {
    console.error("Upload Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno no servidor ao processar o arquivo.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
