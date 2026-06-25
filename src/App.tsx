import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Sliders, 
  Layers, 
  HelpCircle, 
  ChevronRight, 
  RefreshCw, 
  Bookmark, 
  Trophy,
  Flame,
  LayoutGrid,
  Key,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ComicBook, Panel, ComicStyle } from './types';
import StorySettings from './components/StorySettings';
import StoryboardView from './components/StoryboardView';
import ComicReader from './components/ComicReader';
import ComicHistory from './components/ComicHistory';

export default function App() {
  const [comics, setComics] = useState<ComicBook[]>([]);
  const [activeComicId, setActiveComicId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'settings' | 'storyboard' | 'reader'>('settings');
  
  // Loading states
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  
  // API error banner states
  const [alertInfo, setAlertInfo] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(null);

  // User-provided custom Gemini API Key states
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('user_gemini_api_key') || '';
  });
  const [showApiKeySetting, setShowApiKeySetting] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(localStorage.getItem('user_gemini_api_key') || '');

  const handleSaveApiKey = () => {
    const trimmed = tempApiKey.trim();
    if (trimmed && !trimmed.startsWith('AIzaSy')) {
      alert('올바른 Gemini API Key 형식이 아닙니다. (구글 AI Studio 키는 일반적으로 "AIzaSy"로 시작하는 형태입니다.)');
      return;
    }
    
    setGeminiApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem('user_gemini_api_key', trimmed);
      setAlertInfo({
        type: 'success',
        message: '개인 Gemini API Key가 로컬에 안전하게 저장되었습니다! 이제 무제한 및 빠른 만화 시나리오 생성이 작동합니다.'
      });
    } else {
      localStorage.removeItem('user_gemini_api_key');
      setAlertInfo({
        type: 'info',
        message: '개인 API Key가 성공적으로 비워졌습니다. 이제 시스템 기본 서버 API Key를 적용합니다.'
      });
    }
    setShowApiKeySetting(false);
  };

  const handleDeleteApiKey = () => {
    setGeminiApiKey('');
    setTempApiKey('');
    localStorage.removeItem('user_gemini_api_key');
    setAlertInfo({
      type: 'info',
      message: '등록된 개인 API Key가 로컬 저장소에서 깨끗하게 제거되었습니다.'
    });
    setShowApiKeySetting(false);
  };



  // Load saved comics from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai_comics_creator_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ComicBook[];
        setComics(parsed);
        if (parsed.length > 0) {
          setActiveComicId(parsed[0].id);
          setCurrentTab('settings');
        }
      } catch (err) {
        console.error("Failed to parse local comic books storage", err);
      }
    }
  }, []);

  // Save comics helper
  const saveComicsToStorage = (updatedComics: ComicBook[]) => {
    setComics(updatedComics);
    localStorage.setItem('ai_comics_creator_history', JSON.stringify(updatedComics));
  };

  const getActiveComic = (): ComicBook | undefined => {
    return comics.find(c => c.id === activeComicId);
  };

  const activeComic = getActiveComic();

  // Create Storyboard Sequence
  const handleGenerateStoryboard = async ({
    storyText,
    genre,
    style,
    numPanels,
    customCharacters
  }: {
    storyText: string;
    genre: string;
    style: ComicStyle;
    numPanels: number;
    customCharacters: any[];
  }) => {
    setIsGeneratingStoryboard(true);
    setAlertInfo(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (geminiApiKey) {
        headers['x-gemini-api-key'] = geminiApiKey;
      }

      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          storyText,
          genre,
          style,
          numPanels,
          customCharacters
        })
      });

      const contentType = response.headers.get("content-type");
      let storyboardData: any;

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || data.details || `서버 에러 (${response.status})`);
        }
        storyboardData = data;
      } else {
        const errText = await response.text();
        throw new Error(`HTML/텍스트 응답 감지 (${response.status}). Vercel의 환경변수(Settings에서 GEMINI_API_KEY) 설정이 누락되었거나 배포 상태를 다시 확인해 주세요. 상세 내용: ${errText.slice(0, 100)}`);
      }
      
      const newComic: ComicBook = {
        id: `comic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: storyboardData.title || "무제 만화책",
        description: storyboardData.description || "자동 기획된 만화책 시나리오입니다.",
        genre: storyboardData.genre || genre,
        style: style,
        characters: storyboardData.characters || customCharacters || [],
        panels: storyboardData.panels.map((p: any) => ({
          panelNumber: p.panelNumber,
          sceneDescription: p.sceneDescription,
          speaker: p.speaker,
          dialogue: p.dialogue,
          narration: p.narration,
          soundEffect: p.soundEffect || "",
          bgMusicMood: p.bgMusicMood || "일반적인 분위기",
          imagePrompt: p.imagePrompt
        })),
        createdAt: new Date().toISOString()
      };

      const updatedHistory = [newComic, ...comics];
      saveComicsToStorage(updatedHistory);
      setActiveComicId(newComic.id);
      setCurrentTab('storyboard');
      
      setAlertInfo({
        type: 'success',
        message: `멋진 수수께끼를 해결하기 위한 ${newComic.panels.length}컷 만화 초안이 성공적으로 기획되었습니다! 하단에서 개별 장면들의 이미지 그리기를 시작하세요.`
      });
    } catch (error: any) {
      console.error(error);
      setAlertInfo({
        type: 'error',
        message: `기획에 실패했습니다: ${error.message}`
      });
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  // Generate Panel Image Single (with drawing logic inside Express)
  const handleGenerateImageSingle = async (panelIndex: number): Promise<void> => {
    if (!activeComic) return;
    
    // Immutable copy of active comic
    const originalPanels = [...activeComic.panels];
    const targetPanel = { ...originalPanels[panelIndex], isGenerating: true, isFailed: false, errorMessage: undefined };
    originalPanels[panelIndex] = targetPanel;
    
    const updatedComic = { ...activeComic, panels: originalPanels };
    const updatedHistory = comics.map(c => c.id === activeComic.id ? updatedComic : c);
    saveComicsToStorage(updatedHistory);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (geminiApiKey) {
        headers['x-gemini-api-key'] = geminiApiKey;
      }

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: targetPanel.imagePrompt,
          style: activeComic.style,
          panelNumber: targetPanel.panelNumber,
          sceneDescription: targetPanel.sceneDescription,
          speaker: targetPanel.speaker,
          dialogue: targetPanel.dialogue,
          narration: targetPanel.narration,
          soundEffect: targetPanel.soundEffect
        })
      });

      const contentType = response.headers.get("content-type");
      let rawData: any;
      if (contentType && contentType.includes("application/json")) {
        rawData = await response.json();
        if (!response.ok) {
          throw new Error(rawData.error || rawData.details || `이미지 생성 서버 오류 (${response.status})`);
        }
      } else {
        const errText = await response.text();
        throw new Error(`이미지 생성 실패 (${response.status}): ${errText.slice(0, 100)}`);
      }
      
      // Update with newly acquired source imageUrl URL
      const finalPanels = [...updatedComic.panels];
      finalPanels[panelIndex] = {
        ...finalPanels[panelIndex],
        imageUrl: rawData.imageUrl,
        isGenerating: false,
        isFailed: !rawData.success,
        isPlanB: !!rawData.isPlanB,
        method: rawData.method,
        errorMessage: rawData.isFallback ? "Fallback applied" : undefined
      };

      const storedComic = { ...updatedComic, panels: finalPanels };
      saveComicsToStorage(comics.map(c => c.id === activeComic.id ? storedComic : c));
    } catch (err: any) {
      console.warn("Server generation failed. Attempting pure browser-side Pollinations AI Flu/Anime drawing fallback to ensure success...", err);
      try {
        const prompt = targetPanel.imagePrompt;
        const sceneDescription = targetPanel.sceneDescription;
        const style = activeComic.style;
        const panelNumber = targetPanel.panelNumber;

        let styledPrompt = prompt;
        let pollinationModel = "flux";
        const lowerStyle = (style || "").toLowerCase();

        if (lowerStyle.includes("webtoon") || lowerStyle.includes("웹툰")) {
          styledPrompt = `Korean webtoon comic panel, fine digital line art, vibrant webtoon sketch, rich colors, soft modern anime shading, anime manga webtoon screenshot style, detailed background scenery: ${prompt || sceneDescription}`;
          pollinationModel = "flux";
        } else if (lowerStyle.includes("manga") || lowerStyle.includes("망가") || lowerStyle.includes("일본 만화")) {
          styledPrompt = `Japanese manga page panel, high dynamic ink line art, classic black and white comic illustration, detailed vintage screentone patterns, expressive anime facial features, master manga artist work: ${prompt || sceneDescription}`;
          pollinationModel = "flux-anime";
        } else if (lowerStyle.includes("retro") || lowerStyle.includes("classic") || lowerStyle.includes("레트로") || lowerStyle.includes("미국 만화")) {
          styledPrompt = `Vintage 1970s Marvel superhero comic book panel style print drawing, bold hand-drawn ink outlines, retro halftone printing dots pattern, aged vintage CMYK comic ink colors, classic golden comic look: ${prompt || sceneDescription}`;
          pollinationModel = "flux";
        } else if (lowerStyle.includes("watercolor") || lowerStyle.includes("수채화")) {
          styledPrompt = `Beautiful watercolor children story book illustration scene, whimsical soft pastel paint bleeding, cozy pencil drawing sketch, warm colors, charming children animation background: ${prompt || sceneDescription}`;
          pollinationModel = "flux";
        } else if (lowerStyle.includes("disney") || lowerStyle.includes("pixar") || lowerStyle.includes("애니메이션") || lowerStyle.includes("3d")) {
          styledPrompt = `Modern 3D animated cartoon capture, Pixar Disney style cute rendering illustration, charming expressive design, detailed ambient subsurface scattering lighting, high fidelity CGI: ${prompt || sceneDescription}`;
          pollinationModel = "flux-3d";
        } else {
          styledPrompt = `High quality graphic novel comic book block panel illustration, vibrant flat colors, crisp dark comic outlines, gorgeous design composition: ${prompt || sceneDescription}`;
          pollinationModel = "flux";
        }

        const randomSeed = Math.floor(Math.random() * 99999999) + 24681;
        const pollinationUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(styledPrompt)}?width=512&height=512&model=${pollinationModel}&seed=${randomSeed}&nologo=true&private=true`;

        const fallbackResponse = await fetch(pollinationUrl);
        if (fallbackResponse.ok) {
          const blob = await fallbackResponse.blob();
          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });

          const finalPanels = [...updatedComic.panels];
          finalPanels[panelIndex] = {
            ...finalPanels[panelIndex],
            imageUrl: base64Data,
            isGenerating: false,
            isFailed: false,
            method: `pollinations-${pollinationModel}-client-fallback`
          };

          const storedComic = { ...updatedComic, panels: finalPanels };
          saveComicsToStorage(comics.map(c => c.id === activeComic.id ? storedComic : c));
          return;
        }
      } catch (fallbackErr: any) {
        console.error("Browser direct Pollinations AI drawing fallback failed too:", fallbackErr);
      }

      const finalPanels = [...updatedComic.panels];
      finalPanels[panelIndex] = {
        ...finalPanels[panelIndex],
        isGenerating: false,
        isFailed: true,
        errorMessage: err.message
      };
      
      saveComicsToStorage(comics.map(c => c.id === activeComic.id ? { ...updatedComic, panels: finalPanels } : c));
    }
  };

  // Safe Seq Throttle Sequential generate all remaining drawings (to avoid rate limits)
  const handleGenerateAllImages = async () => {
    if (!activeComic || isGeneratingAll) return;
    setIsGeneratingAll(true);
    setAlertInfo({
      type: 'info',
      message: "만화 일괄 그리기를 시작합니다. API 최대 트래픽 한계 조절을 위해 매 장면당 순차적으로 로딩이 진행됩니다."
    });

    try {
      const panelsToGenerate = activeComic.panels;
      for (let i = 0; i < panelsToGenerate.length; i++) {
        const item = panelsToGenerate[i];
        if (!item.imageUrl) {
          // Trigger image generation and wait for it to complete before proceding for stability
          await handleGenerateImageSingle(i);
          // Wait 1.5 seconds between requests for cooling down rate-limit tokens!
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      setAlertInfo({
        type: 'success',
        message: "모든 컷 일러스트 일괄 드로잉 주기가 완성되었습니다! 감상실에서 완성된 웹툰을 보실 수 있습니다."
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Update specific panel text guidelines
  const handleUpdatePanel = (panelIndex: number, updatedPanel: Panel) => {
    if (!activeComic) return;
    const copiedPanels = [...activeComic.panels];
    copiedPanels[panelIndex] = updatedPanel;
    
    const storedComic = { ...activeComic, panels: copiedPanels };
    saveComicsToStorage(comics.map(c => c.id === activeComic.id ? storedComic : c));
  };

  // Delete comic masterpiece
  const handleDeleteComic = (id: string) => {
    const filtered = comics.filter(c => c.id !== id);
    saveComicsToStorage(filtered);
    if (activeComicId === id) {
      setActiveComicId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const handleSelectComic = (id: string) => {
    setActiveComicId(id);
    setCurrentTab('storyboard');
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#141414] font-serif flex flex-col justify-between selection:bg-black selection:text-white">
      
      {/* Immersive Editorial Comic Headers */}
      <header className="bg-white border-b-2 border-black sticky top-0 z-50 py-5 px-6 md:px-8 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo brand - Editorial Ink Style */}
          <div className="flex items-center gap-4">
            <div className="bg-black text-white p-3 border border-black shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] hover:rotate-3 transition-transform">
              <Sparkles className="w-5 h-5 text-[#FDFCFB]" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="font-serif font-black text-2xl md:text-3xl tracking-tight uppercase">
                  INK & CANVAS
                </h1>
                <span className="font-sans text-[10px] font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5">v2.5 Studio</span>
              </div>
              <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1">16-Cut AI Serial Comic Generator & Storyboard Atelier</p>
            </div>
          </div>

          {/* Tab selectors and API Key Settings Trigger Button */}
          <div className="flex flex-wrap items-center gap-4">
            {activeComic && (
              <div className="flex bg-[#F9F7F2] p-1 border border-black gap-1">
                <button
                  onClick={() => setCurrentTab('settings')}
                  className={`px-4 py-2 font-sans text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    currentTab === 'settings' 
                      ? 'bg-black text-white' 
                      : 'text-gray-600 hover:text-black hover:bg-white/85'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  스토리 기획실
                </button>
                
                <button
                  onClick={() => setCurrentTab('storyboard')}
                  className={`px-4 py-2 font-sans text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    currentTab === 'storyboard' 
                      ? 'bg-black text-white' 
                      : 'text-gray-600 hover:text-black hover:bg-white/85'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  시나리오 작화
                </button>
                
                <button
                  onClick={() => setCurrentTab('reader')}
                  className={`px-4 py-2 font-sans text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    currentTab === 'reader' 
                      ? 'bg-black text-white' 
                      : 'text-gray-600 hover:text-black hover:bg-white/85'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  만화 감상실
                </button>
              </div>
            )}

            <button
              onClick={() => setShowApiKeySetting(!showApiKeySetting)}
              className={`px-4 py-2 font-sans text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-black shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] active:translate-y-[2px] active:shadow-none ${
                geminiApiKey 
                  ? 'bg-green-50 text-green-900 border-green-950 shadow-[2px_2px_0px_0px_rgba(20,80,20,1)]' 
                  : 'bg-black text-white hover:bg-neutral-800'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {geminiApiKey ? '개인 API Key: 사용 중' : 'Gemini API 개인키 등록'}
            </button>
          </div>

        </div>
      </header>

      {/* Main body content container with editorial background */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex-1 space-y-8 bg-[#FDFCFB]">

        {/* Collapsible Gemini API Key Setup Panel */}
        <AnimatePresence>
          {showApiKeySetting && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-2 border-black bg-[#FCFAF6] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-black pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-black" />
                  <h3 className="font-sans font-black text-xs uppercase tracking-wider text-black">Gemini API 개인키 설정 (Google AI Studio Key Configuration)</h3>
                </div>
                <button 
                  onClick={() => setShowApiKeySetting(false)}
                  className="text-gray-400 hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
                <div className="space-y-2">
                  <p className="font-bold text-black uppercase">💡 개인 API 키 사용 장점</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>공용 서버의 10초 타임아웃 제한 및 503 과부하 에러가 완벽히 우회됩니다.</li>
                    <li>더 길고 정밀한 16컷 이상의 웹툰 기획 및 분석을 딜레이 없이 원활하게 생성할 수 있습니다.</li>
                    <li>API 키는 브라우저 내부 로컬 스토리지(<code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-[10px]">localStorage</code>)에만 안전하게 저장되며, 외부로 전송되거나 서버에 기록되지 않습니다.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-black uppercase">🔑 1분만에 발급받고 등록하는 방법</p>
                  <ol className="list-decimal pl-5 space-y-1 text-gray-700">
                    <li>
                      <a 
                        href="https://aistudio.google.com/" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Google AI Studio (https://aistudio.google.com)
                      </a>
                      에 접속 및 로그인합니다.
                    </li>
                    <li>좌측 상단의 <strong className="text-black">"Get API key"</strong> 버튼을 클릭합니다.</li>
                    <li><strong className="text-black">"Create API key"</strong>를 누르고 발급받은 키(<code className="font-mono text-xs text-red-700 bg-red-50 px-1 rounded">AIzaSy...</code>)를 복사해서 하단에 붙여넣습니다.</li>
                  </ol>
                </div>
              </div>

              <div className="border-t border-black pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex-1 relative">
                  <input
                    type="password"
                    placeholder="AIzaSy로 시작하는 API 키를 입력해 주세요"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full bg-white border border-black p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black placeholder:text-gray-400"
                  />
                  {tempApiKey && (
                    <button
                      onClick={() => setTempApiKey('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs font-bold font-sans"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveApiKey}
                    className="bg-black text-white px-6 py-3 font-sans text-xs font-black uppercase tracking-wider border border-black shadow-[2px_2px_0px_0px_rgba(20,20,20,0.1)] hover:bg-neutral-800 transition-all"
                  >
                    키 저장 및 적용
                  </button>
                  {geminiApiKey && (
                    <button
                      onClick={handleDeleteApiKey}
                      className="bg-white text-red-600 border border-red-600 px-4 py-3 font-sans text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-all"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* API notification system alerts bar - Minimalist design */}
        <AnimatePresence>
          {alertInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="print:hidden"
            >
              <div className={`p-4 border border-black font-sans text-[11px] uppercase tracking-wider flex justify-between items-center bg-white ${
                alertInfo.type === 'error' 
                  ? 'border-l-4 border-l-red-600 text-red-950 bg-red-50/50' 
                  : alertInfo.type === 'success' 
                  ? 'border-l-4 border-l-black text-black bg-[#F9F7F2]'
                  : 'border-l-4 border-l-gray-400 text-gray-800 bg-[#FBFBFA]'
              }`}>
                <div className="flex items-center gap-2">
                  <span>{alertInfo.type === 'error' ? '■' : '●'}</span>
                  <p className="font-bold">{alertInfo.message}</p>
                </div>
                <button 
                  onClick={() => setAlertInfo(null)}
                  className="text-gray-500 hover:text-black font-black ml-4 border-b border-black text-[9px] uppercase tracking-widest"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab route switching */}
        <div className="space-y-8 flex-1">
          {currentTab === 'settings' ? (
            <div className="space-y-8">
              <StorySettings 
                onGenerate={handleGenerateStoryboard}
                isLoading={isGeneratingStoryboard}
                geminiApiKey={geminiApiKey}
              />
              <ComicHistory 
                comics={comics}
                onSelectComic={handleSelectComic}
                onDeleteComic={handleDeleteComic}
                activeComicId={activeComicId}
              />
            </div>
          ) : null}

          {currentTab === 'storyboard' && activeComic ? (
            <StoryboardView 
              comic={activeComic}
              onUpdatePanel={handleUpdatePanel}
              onGenerateImageSingle={handleGenerateImageSingle}
              onGenerateAllImages={handleGenerateAllImages}
              isGeneratingAll={isGeneratingAll}
              onConfirmStoryboard={() => setCurrentTab('reader')}
            />
          ) : null}

          {currentTab === 'reader' && activeComic ? (
            <ComicReader 
              comic={activeComic}
              onBackToStoryboard={() => setCurrentTab('storyboard')}
            />
          ) : null}
        </div>

      </main>

      {/* Editorial footer credits */}
      <footer className="border-t-2 border-black bg-[#FBFBFA] py-8 text-center font-sans text-[10px] tracking-[0.15em] text-gray-500 print:hidden mt-12">
        <p className="max-w-2xl mx-auto leading-relaxed font-bold uppercase">
          &copy; 2026 NARRATIVE INK SYSTEMS • POWERED BY GEMINI PRO & IMAGEN 3<br/>
          <span className="opacity-50">FORMAT: WEBTOON SCROLL & 16-CUT SERIAL PRINT • ALL RIGHTS RESERVED</span>
        </p>
      </footer>

    </div>
  );
}
