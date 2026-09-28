"use client";

import { useState } from "react";
import { Upload, FileText, LayoutTemplate, Download, ChevronRight, Loader2 } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [theme, setTheme] = useState<string>("modern");
  const [loading, setLoading] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Selecione um arquivo primeiro.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // 1. Extrair texto
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      
      if (!uploadData.success) throw new Error(uploadData.error);

      // 2. Gerar com IA
      const aiRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: uploadData.extractedText })
      });
      const aiData = await aiRes.json();
      
      if (!aiData.success) throw new Error(aiData.error);

      setSlides(aiData.slides);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro no processamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides, theme }),
      });

      if (!res.ok) {
        throw new Error("Erro ao gerar o arquivo PPTX.");
      }

      // Download file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Apresentacao_Gerada.pptx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      setStep(3); // Sucesso
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-blue-600 flex items-center justify-center gap-3">
            <LayoutTemplate size={36} />
            Gerador de Slides IA
          </h1>
          <p className="text-gray-500">Transforme qualquer documento em uma apresentação imersiva.</p>
        </header>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-6">
            <div className="w-full max-w-md border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer relative">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600">
                {file ? <span className="font-semibold text-blue-600">{file.name}</span> : "Arraste ou clique para selecionar PDF, DOCX ou TXT"}
              </p>
            </div>
            <button 
              onClick={handleUpload}
              disabled={loading || !file}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-full flex items-center gap-2 transition"
            >
              {loading ? <><Loader2 className="animate-spin" /> Processando com IA...</> : <>Gerar Roteiro <ChevronRight /></>}
            </button>
          </section>
        )}

        {/* STEP 2: REVIEW & THEME */}
        {step === 2 && (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="text-blue-500" />
                Roteiro Sugerido pela IA
              </h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {slides.map((slide, idx) => (
                  <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-bold text-lg">{slide.title}</h3>
                    <p className="text-gray-700 mt-2">{slide.content}</p>
                    {slide.bullets && slide.bullets.length > 0 && (
                      <ul className="list-disc pl-5 mt-2 text-gray-600">
                        {slide.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                    {slide.imageSearchTerm && (
                      <div className="mt-3 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">
                        🖼️ Sugestão Visual: {slide.imageSearchTerm}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-2">Escolha o Tema de Design:</label>
                <div className="flex gap-4">
                  {["modern", "classic", "dark"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`px-4 py-2 rounded-lg border-2 capitalize font-medium transition ${theme === t ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleExport}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-8 rounded-full flex items-center gap-2 transition"
              >
                {loading ? <><Loader2 className="animate-spin" /> Gerando PPTX...</> : <><Download /> Baixar PowerPoint</>}
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
          <section className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <Download size={40} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Pronto!</h2>
            <p className="text-gray-600">Sua apresentação foi gerada e o download começou.</p>
            <button 
              onClick={() => { setStep(1); setFile(null); setSlides([]); }}
              className="text-blue-600 hover:underline font-medium"
            >
              Gerar outra apresentação
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
