import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Upload, 
  HelpCircle, 
  Sliders, 
  Sparkles, 
  FileText, 
  X, 
  ChevronRight,
  Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  STYLE_PRESETS, 
  SAMPLE_STORIES, 
  ComicStyle, 
  Character 
} from '../types';

interface StorySettingsProps {
  onGenerate: (params: {
    storyText: string;
    genre: string;
    style: ComicStyle;
    numPanels: number;
    customCharacters: Character[];
  }) => void;
  isLoading: boolean;
}

// Client-side PDF Parser Helpers (Bypasses Vercel's 4.5MB upload limits and 10s gateway timeouts)
const loadPdfJs = async (): Promise<any> => {
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = () => {
      reject(new Error('PDF 파서 다운로드에 실패했습니다.'));
    };
    document.head.appendChild(script);
  });
};

const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  let fullText = '';
  // Limit parsing to top 40 pages to stay within token budgets and maintain lightning-fast UI speed
  const maxPages = Math.min(pdf.numPages, 40);
  for (let i = 1; i <= maxPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    } catch (e) {
      console.warn(`[PDF Parser] ${i}페이지 텍스트 추출 중 오류가 발생했으나 건너뜁니다:`, e);
    }
  }
  return fullText.trim();
};

export default function StorySettings({ onGenerate, isLoading }: StorySettingsProps) {
  const [storyText, setStoryText] = useState('');
  const [genre, setGenre] = useState('판타지 / 모험');
  const [style, setStyle] = useState<ComicStyle>('K-Webtoon');
  const [numPanels, setNumPanels] = useState<number>(16);
  const [customCharacters, setCustomCharacters] = useState<Character[]>([]);
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const genres = [
    '판타지 / 모험',
    'SF / 디스토피아',
    '일상 / 힐링',
    '미스터리 / 스릴러',
    '코믹 / 명랑',
    '로맨스 / 정통 드라마'
  ];

  const handleSelectSample = (id: string) => {
    const sample = SAMPLE_STORIES.find(s => s.id === id);
    if (sample) {
      setStoryText(sample.content);
      setGenre(sample.genre);
      setSelectedSampleId(id);
    }
  };

  // Text / PDF File reader logic
  const handleFileUpload = (file: File) => {
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pdf')) {
      setIsParsingPdf(true);

      const arrayBufferReader = new FileReader();
      
      arrayBufferReader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          setIsParsingPdf(false);
          alert('PDF 파일을 불려오는 과정에서 리더가 응답을 반환하지 않았습니다.');
          return;
        }

        let extractedPdfText = '';
        let clientParseSuccessful = false;

        try {
          console.log("Starting client-side text extraction for", file.name);
          extractedPdfText = await extractTextFromPdf(arrayBuffer);
          if (extractedPdfText && extractedPdfText.trim().length > 10) {
            clientParseSuccessful = true;
          }
        } catch (err) {
          console.warn("Client-side PDF extraction failed, will attempt fallback base64 API mode...", err);
        }

        // Helper to POST to PDF API
        const sendParseRequest = async (payload: { pdfData?: string; rawText?: string }) => {
          try {
            const res = await fetch('/api/parse-pdf', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await res.json();
              if (res.ok) {
                if (data.text) {
                  setStoryText(data.text);
                  setSelectedSampleId(null);
                } else {
                  alert(`PDF 분석 실패: ${data.error || '응답 텍스트가 비어있습니다.'}`);
                }
              } else {
                alert(`PDF 분석 에러 (${res.status}): ${data.error || data.details || '알 수 없는 서버 에러'}`);
              }
            } else {
              const errText = await res.text();
              throw new Error(`HTML/텍스트 응답 감지 (${res.status}): ${errText.slice(0, 100)}`);
            }
          } catch (error: any) {
            console.error(error);
            alert(`PDF 파일을 분석하는 중 오류가 발생했습니다:\n${error.message || error}`);
          } finally {
            setIsParsingPdf(false);
          }
        };

        // If client-side parse succeeded, send the light-weight rawText to Vercel/Serverless backend (Safe from 4.5MB Vercel Body limit!)
        if (clientParseSuccessful) {
          console.log("Client-side PDF parser extracted text successfully. Byte-size:", extractedPdfText.length);
          await sendParseRequest({ rawText: extractedPdfText });
        } else {
          // Fallback to old base64 binary POST (Will work in local boxes, or for smaller PDFs on Vercel)
          console.log("Falling back to full binary base64 parsing...");
          const base64Reader = new FileReader();
          base64Reader.onload = async (ev) => {
            const dataUrl = ev.target?.result as string;
            if (!dataUrl) {
              alert("PDF 로드 실패: 파일을 읽을 수 없습니다.");
              setIsParsingPdf(false);
              return;
            }
            const base64Data = dataUrl.split(',')[1];
            await sendParseRequest({ pdfData: base64Data });
          };
          base64Reader.readAsDataURL(file);
        }
      };

      arrayBufferReader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setStoryText(text);
          setSelectedSampleId(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAddCharacter = () => {
    if (!newCharName.trim() || !newCharDesc.trim()) return;
    setCustomCharacters(prev => [
      ...prev, 
      { name: newCharName.trim(), visualDescription: newCharDesc.trim() }
    ]);
    setNewCharName('');
    setNewCharDesc('');
  };

  const handleRemoveCharacter = (index: number) => {
    setCustomCharacters(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyText.trim()) return;
    onGenerate({
      storyText: storyText.trim(),
      genre,
      style,
      numPanels,
      customCharacters
    });
  };

  return (
    <div id="settings-panel" className="bg-[#FDFCFB] text-[#141414] border-2 border-black shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] p-6 md:p-8">
      <div className="flex items-center gap-4 mb-6 border-b-2 border-black pb-4">
        <div className="p-2.5 bg-black text-[#FDFCFB] border border-black inline-block">
          <Sliders className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="font-serif font-black text-2xl uppercase tracking-tight">만화 기획실 <span className="font-light italic not-uppercase text-gray-500">Storyboard Atelier</span></h2>
          <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">스토리를 기획하고 순차적인 16컷 이상의 고품질 만화의 장치들을 설계하세요</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Sample select prefillers */}
        <div>
          <span className="block font-sans text-xs font-black uppercase tracking-widest text-gray-600 mb-3 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            스토리 프리셋으로 시작하기 / Quick Start Presets
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SAMPLE_STORIES.map((sample) => {
              const isSelected = selectedSampleId === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample.id)}
                  className={`p-4 border-2 text-left transition-all flex flex-col justify-between h-36 relative ${
                    isSelected
                      ? 'bg-black text-[#FDFCFB] border-black shadow-[4px_4px_0px_0px_rgba(20,20,20,0.15)]'
                      : 'bg-[#F9F7F2] border-black text-[#141414] hover:bg-white'
                  }`}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className={`text-[9px] font-sans font-black uppercase tracking-widest px-2 py-0.5 border ${
                        isSelected ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                      }`}>
                        {sample.genre}
                      </span>
                      <span className="text-xl">{sample.emoji}</span>
                    </div>
                    <h4 className={`font-serif font-bold text-sm mt-2 line-clamp-1 ${isSelected ? 'text-[#FDFCFB]' : 'text-black'}`}>{sample.title}</h4>
                    <p className={`font-sans text-[11px] leading-relaxed mt-1 line-clamp-2 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                      {sample.summary}
                    </p>
                  </div>
                  <div className={`flex items-center justify-end w-full font-black text-[10px] tracking-widest uppercase pt-1 ${isSelected ? 'text-[#FDFCFB]' : 'text-neutral-700'}`}>
                    Select <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Story details input */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="block font-sans text-xs font-black uppercase tracking-widest text-[#141414] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              나만의 만화 스토리 또는 문서 시나리오 입력 <span className="text-red-500">*</span>
            </label>
            <span className="font-sans text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              스토리가 길어지면 더 정교한 16컷 만화가 설계됩니다.
            </span>
          </div>

          {/* Drag & Drop File input - Editorial Style */}
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative border-2 border-black p-4 transition-all duration-200 ${
              isDragOver 
                ? 'bg-[#F9F7F2]' 
                : 'bg-white hover:bg-[#F9F7F2]/30'
            }`}
          >
            {isParsingPdf && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 border border-dashed border-black/20 z-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-black text-[#FDFCFB]">
                    <svg className="animate-spin h-6 w-6 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <span className="block font-serif italic text-black font-bold text-sm">기획안 PDF 텍스트 추출 중...</span>
                    <span className="block font-sans text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      Gemini가 PDF 전체 내용을 전사하고 한국어로 재구성하는 중입니다 (최대 10초)
                    </span>
                  </div>
                </div>
              </div>
            )}

            <textarea
              value={storyText}
              onChange={(e) => {
                setStoryText(e.target.value);
                setSelectedSampleId(null);
              }}
              rows={8}
              placeholder="여기에 생각하고 있는 소설 줄거리, 일상 이야기, 드라마 시나리오, 동화 스토리를 마음껏 붙여넣거나 적어주세요! (영어/한국어 모두 완벽 지원)"
              className="w-full border-0 p-1 text-[#141414] bg-transparent focus:ring-0 text-base font-sans leading-relaxed resize-y focus:outline-none placeholder:text-gray-400"
              required
            />
            
            <div className="mt-3 pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-gray-400">
                CHARACTER COUNT: <strong className="text-black font-black">{storyText.length}</strong>
              </span>
              
              <button
                type="button"
                disabled={isParsingPdf}
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center gap-1.5 font-sans text-[10px] font-black uppercase tracking-widest text-[#141414] hover:bg-black hover:text-white border-2 border-black px-4 py-2 transition-all active:translate-y-0.5 ${
                  isParsingPdf ? 'opacity-50 cursor-not-allowed bg-gray-150' : ''
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                문서 / PDF 올리기 (Drop File)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Tuning Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Genre Selection */}
          <div className="space-y-3">
            <label className="block font-sans text-xs font-black uppercase tracking-widest text-[#141414]">
              작품 장르 / MANGA GENRE
            </label>
            <div className="relative">
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-white border-2 border-black px-4 py-3 font-sans text-xs font-bold uppercase tracking-wider text-gray-800 focus:outline-none focus:border-black appearance-none"
              >
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Cuts / Panels Selector */}
          <div className="space-y-3">
            <label className="block font-sans text-xs font-black uppercase tracking-widest text-[#141414] flex justify-between">
              <span>만화 총 컷 수 / PANEL COUNT</span>
              <span className="text-black font-black text-[10px] bg-[#F9F7F2] px-2.5 py-0.5 border border-black">
                ★ 16컷 이상 고품질 설계
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[16, 18, 20, 24].map((cuts) => (
                <button
                  key={cuts}
                  type="button"
                  onClick={() => setNumPanels(cuts)}
                  className={`py-3 font-sans text-xs font-black tracking-widest uppercase transition-all border-2 border-black ${
                    numPanels === cuts
                      ? 'bg-black text-white shadow-none'
                      : 'bg-white hover:bg-neutral-50 text-black'
                  }`}
                >
                  {cuts}컷
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Style presets visual picker - Editorial design */}
        <div className="space-y-4">
          <label className="block font-sans text-xs font-black uppercase tracking-widest text-[#141414]">
            그림체 스타일 지정 / VISUAL ART PRESETS
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {STYLE_PRESETS.map((p) => {
              const isSelected = style === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setStyle(p.id)}
                  className={`p-4 border border-black text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-black text-[#FDFCFB] border-black shadow-[3px_3px_0px_0px_rgba(20,20,20,0.15)] scale-[1.01]' 
                      : 'bg-[#F9F7F2] border-black text-[#141414] hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[9px] font-sans font-black uppercase tracking-widest px-2 py-0.5 border ${
                        isSelected ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                      }`}>
                        {p.id}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-sans font-black uppercase tracking-widest opacity-60">
                          ✓ ACTIVE
                        </span>
                      )}
                    </div>
                    <h4 className={`font-serif font-black text-md ${isSelected ? 'text-[#FDFCFB]' : 'text-[#141414]'}`}>{p.name}</h4>
                    <p className={`font-sans text-[11px] mt-1.5 leading-relaxed ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                      {p.description}
                    </p>
                  </div>
                  <div className="mt-3 border-t border-black/10 pt-2 text-[9px] font-mono truncate tracking-wider">
                    PROMPT: {p.promptAdditions}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced: Consistent Character Reference Definition */}
        <div className="bg-[#F9F7F2] border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-black text-white p-1 text-xs">👤</span>
            <h3 className="font-serif font-black text-base uppercase text-black">맞춤 캐릭터 외모 지정 <span className="font-sans font-light italic not-uppercase text-gray-500 text-xs ml-2">[선택사항]</span></h3>
          </div>
          <p className="font-sans text-xs text-gray-500 leading-relaxed mb-4">
            핵심 인물들의 생김새 장식, 코디 등을 영어로 미리 지정해 놓으면, 16장의 컷을 그릴 때 주인공의 얼굴과 모습이 매우 일관되게 생성됩니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="font-sans text-[9px] font-black uppercase tracking-widest text-[#141414]">캐릭터 이름 (Character Name)</label>
              <input
                type="text"
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                placeholder="예: 철수"
                className="w-full bg-white border border-black px-3 py-2 font-sans font-bold text-xs focus:ring-1 focus:ring-black outline-none"
              />
            </div>
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-sans text-[9px] font-black uppercase tracking-widest text-[#141414] flex justify-between">
                <span>외모 상세 묘사 (영어 권장 - Visual Description)</span>
                <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest">★ MATCH KEYWORD IN SEQUENCE</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  placeholder="예: a 15yo Korean boy, bright messy orange hair, red glasses, black hoodie, determined smile"
                  className="w-full bg-white border border-black px-3 py-2 font-sans text-xs focus:ring-1 focus:ring-black outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCharacter}
                  className="bg-black text-white border border-black font-sans text-[10px] font-black uppercase tracking-widest px-4 transition-colors hover:bg-neutral-800"
                >
                  ADD
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {customCharacters.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 border-t border-black/10 pt-3"
              >
                {customCharacters.map((char, index) => (
                  <div 
                    key={index}
                    className="inline-flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 text-xs font-sans font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
                  >
                    <span><strong>{char.name}</strong>: <span className="font-mono text-gray-500 font-medium">{char.visualDescription}</span></span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveCharacter(index)}
                      className="text-gray-400 hover:text-black transition-colors"
                    >
                      <X className="w-3.5 h-3.5 stroke-[3px]" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Big Action Button */}
        <div className="pt-4 border-t border-black flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !storyText.trim()}
            className={`w-full font-sans text-[12px] font-black uppercase tracking-[0.2em] py-5 transition-all flex items-center justify-center gap-3 border-2 border-black ${
              isLoading || !storyText.trim()
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-black text-[#FDFCFB] hover:bg-neutral-800 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>GENERATING SEQUENCE SCENARIO... / 최대 1분 소요</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 animate-pulse text-[#FDFCFB]" />
                <span>AI 만화 스토리보드 자동 기획하기 (16컷+) / GENERATE SEQUENCE</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
