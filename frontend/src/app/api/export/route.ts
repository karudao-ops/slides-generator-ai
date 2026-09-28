import { NextRequest, NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";

// Helper to add Master Slides for different templates
function setupTheme(pres: PptxGenJS, theme: string) {
  // Common master slide props
  
  if (theme === "dark") {
    pres.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: "1E1E1E" },
      objects: [
        { rect: { x: 0, y: 0, w: "100%", h: "15%", fill: { color: "333333" } } },
      ],
    });
  } else if (theme === "modern") {
    pres.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: "F3F4F6" },
      objects: [
        { rect: { x: 0, y: 0, w: "100%", h: "20%", fill: { color: "2563EB" } } }, // Blue header
      ],
    });
  } else {
    // Classic/Default
    pres.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: "FFFFFF" },
      objects: [
        { line: { x: "5%", y: "15%", w: "90%", h: 0, line: { color: "000000", width: 2 } } },
      ],
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slides, theme } = await req.json();

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json({ error: "Dados de slides inválidos." }, { status: 400 });
    }

    const pres = new PptxGenJS();
    
    // Set presentation properties
    pres.layout = "LAYOUT_16x9";
    pres.author = "Gerador de Slides AI";
    pres.company = "App IA";
    
    // Config Theme
    const selectedTheme = theme || "classic";
    setupTheme(pres, selectedTheme);

    const titleColor = selectedTheme === "dark" ? "FFFFFF" : (selectedTheme === "modern" ? "FFFFFF" : "333333");
    const titleY = selectedTheme === "modern" ? "5%" : "5%";
    const textColor = selectedTheme === "dark" ? "DDDDDD" : "333333";

    slides.forEach((slideData) => {
      // Add a new slide using the master
      const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });

      // Title
      slide.addText(slideData.title || "", {
        x: "5%",
        y: titleY,
        w: "90%",
        h: "10%",
        fontSize: 32,
        bold: true,
        color: titleColor,
        valign: "middle",
      });

      let currentYOffset = 1.2; // roughly 20% down

      // Content paragraph
      if (slideData.content) {
        slide.addText(slideData.content, {
          x: "5%",
          y: currentYOffset,
          w: "90%",
          fontSize: 18,
          color: textColor,
          breakLine: true,
        });
        currentYOffset += 1.5; // space for paragraph
      }

      // Bullets
      if (slideData.bullets && Array.isArray(slideData.bullets) && slideData.bullets.length > 0) {
        slide.addText(
          slideData.bullets.map((b: string) => ({ text: b, options: { bullet: true } })),
          {
            x: "10%",
            y: currentYOffset,
            w: "85%",
            fontSize: 20,
            color: textColor,
            lineSpacing: 32,
          }
        );
      }
      
      // Notes
      if (slideData.speakerNotes) {
        slide.addNotes(slideData.speakerNotes);
      }
      
      // Imagens - In a real app we would fetch the image URL and add it:
      // slide.addImage({ x: "70%", y: "40%", w: "25%", h: "40%", data: base64Data or path });
    });

    // Generate buffer
    const buffer = await pres.write({ outputType: "nodebuffer" });

    // Send file as response
    return new NextResponse(buffer as Buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": 'attachment; filename="Apresentacao.pptx"',
      },
    });

  } catch (error: any) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: "Erro ao gerar arquivo PowerPoint." }, { status: 500 });
  }
}
