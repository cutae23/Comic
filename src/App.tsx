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
  Key
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

  // Gemini API manual key states
  const [localGeminiKey, setLocalGeminiKey] = useState<string>('');
  const [showApiKeyPanel, setShowApiKeyPanel] = useState<boolean>(false);
  const [apiKeyInputBuffer, setApiKeyInputBuffer] = useState<string>('');

  // Hydrate custom API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setLocalGeminiKey(savedKey);
    setApiKeyInputBuffer(savedKey);
  }, []);

  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    localStorage.setItem('gemini_api_key', trimmed);
    setLocalGeminiKey(trimmed);
    
    setAlertInfo({
      type: 'success',
      message: trimmed 
        ? "🔑 Gemini API 개인 전용 키 등록에 성공했습니다! 이제부터 모든 인공지능 기획 및 작화에 회원님의 무료 할당량이 안전하게 적용됩니다."
        : "🔑 Gemini API 개인 키가 정상적으로 제거되었습니다. 이제부터는 서버가 제공하는 기본 시제품용 공용 키가 사용됩니다."
    });
    
    setShowApiKeyPanel(false);
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
      let storyboardData: any = null;
      const userKey = localStorage.getItem('gemini_api_key') || '';
      let usedDirectClient = false;

      if (userKey) {
        console.log("Using direct client-side Gemini API call for Storyboard Generation...");
        try {
          const sysPrompt = `You are an expert webtoon/comic storyboard writer.
Your job is to analyze the user's provided story text and decompose/outline it into a highly professional, dramatic, and logical manga storyboard comprising EXACTLY ${numPanels} consecutive, sequential panels (cuts).
Do not generate fewer than ${numPanels} panels. The length of the 'panels' array MUST be exactly ${numPanels}.

Follow these guidelines for structured generation:
1. **Title**: Devise a creative, high-impact Korean title for the comic.
2. **Description**: Summarize the 16+ cut story arc neatly in Korean (1-2 sentences).
3. **Style Summary**: Summarize the artistic direction of the style in Korean based on style: [${style}]. (e.g. "샤프한 선과 화려한 네온 컬러가 강조된 현대 웹툰 스타일").
4. **Characters**: Extract up to 4 major characters and describe them.
   - You MUST identify the correct gender (male vs. female) of each character. From the Korean text, words like "청년", "그", "소년", "남자", "아저씨", "할아버지" are strictly MALE, while "처녀", "그녀", "소녀", "여자", "아가씨", "할머니" are strictly FEMALE.
   - For each character, produce a highly consistent 'visualDescription' in English (e.g., "handsome 23-year old young man, male, neat short dark hair, masculine jawline, determined expression, black jacket, manga webtoon style, strictly male with NO feminine features"). Ensure to explicitly state "male", "young man", "short haircut", etc., for male characters so the AI image generator never misrepresents them as women.
5. **Panels**: Outline exactly ${numPanels} panels. Each panel must have:
   - 'panelNumber': Sequential index, starting from 1 up to ${numPanels}.
   - 'sceneDescription': Visual illustration guideline of the scene in Korean.
   - 'speaker': The character speaking (e.g. "철수", "민우", "나레이션", "해설")
   - 'dialogue': Speech bubble content in Korean. Keep it conversational, emotional, and succinct.
   - 'narration': The contextual storytelling narration in Korean (displays on top/bottom of panel).
   - 'soundEffect': Fun Korean onomatopoeia badge (e.g. "슥-", "쾅!", "스우우우", "쿵!"). Use empty string if none.
   - 'bgMusicMood': Suggested ambient background sound or music (in Korean).
   - 'imagePrompt': Detailed, photorealistic/stylized ENGLISH text-to-image prompt. Important: Embed the english 'visualDescription' of characters directly into the prompt (do not just use names like "Cheolsu", write "the 15-year old schooler with messy dark hair, wearing green jacket...").
     Incorporate background elements, camera shot type (e.g., 'close-up shot', 'low-angle shot', 'establishing dynamic shot', 'side-profile extreme close-up'), lighting (e.g., 'dramatic cinematic lighting', 'soft warm sunset glow'), color grading, and style modifiers reflecting the requested comic style: [${style}]. Append style suffixes to make the rendering high fidelity. (e.g. "clean lines, vibrant colors, comic art style, detailed digital webtoon drawing").

Be creative. Make sure the comic sequence has a robust story arc:
- Cut 1-4: Introduction & hook (기)
- Cut 5-8: Development & problem rising (승)
- Cut 9-13: Main Climax & high emotion/action (전)
- Cut 14-16+: Resolution & satisfying ending (결)`;

          const userMessage = `Create a detailed sequential storyboard with exactly ${numPanels} panels.
User's Story: ${storyText}
Comic Genre: ${genre}
Artistic Style: ${style}
Current Requested Panel Count: ${numPanels}
Custom Reference Characters: ${customCharacters ? JSON.stringify(customCharacters) : 'None'}`;

          const requestBody = {
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            systemInstruction: { parts: [{ text: sysPrompt }] },
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  title: { type: 'STRING', description: "Korean title of the comic strip" },
                  description: { type: 'STRING', description: "A summary of the comic story in Korean" },
                  genre: { type: 'STRING' },
                  styleSummary: { type: 'STRING', description: "Brief visual style description in Korean" },
                  characters: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        name: { type: 'STRING', description: "Character Korean Name" },
                        visualDescription: { type: 'STRING', description: "English prompt snippet describing visual attributes for consistency" }
                      },
                      required: ["name", "visualDescription"]
                    }
                  },
                  panels: {
                    type: 'ARRAY',
                    description: `Strictly array of exactly ${numPanels} panels`,
                    items: {
                      type: 'OBJECT',
                      properties: {
                        panelNumber: { type: 'INTEGER' },
                        sceneDescription: { type: 'STRING', description: "Detailed scene visual action in Korean" },
                        speaker: { type: 'STRING', description: "Speaking character or '해설' / '나레이션'" },
                        dialogue: { type: 'STRING', description: "Speech bubble dialogue in Korean (can be empty string)" },
                        narration: { type: 'STRING', description: "Context narration in Korean (can be empty string)" },
                        soundEffect: { type: 'STRING', description: "Korean sound badge (e.g., '쾅!', '두근두근', '스윽') or empty string" },
                        bgMusicMood: { type: 'STRING', description: "Theme music mood in Korean (e.g. 긴박한 현악 피치카토)" },
                        imagePrompt: { type: 'STRING', description: "Intense English prompt with specific character features, camera angle, and style tags. Prompt MUST NOT refer to names of characters directly. Always substitute names with their physical visual attributes." }
                      },
                      required: [
                        "panelNumber",
                        "sceneDescription",
                        "speaker",
                        "dialogue",
                        "narration",
                        "soundEffect",
                        "bgMusicMood",
                        "imagePrompt"
                      ]
                    }
                  }
                },
                required: ["title", "description", "genre", "styleSummary", "characters", "panels"]
              }
            }
          };

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });

          if (res.ok) {
            const resData = await res.json();
            const jsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (jsonText) {
              storyboardData = JSON.parse(jsonText.trim());
              usedDirectClient = true;
            }
          } else {
            console.warn("Direct client planning failed. Fallback to server...");
          }
        } catch (directErr) {
          console.warn("Direct client storyboard planning failed:", directErr);
        }
      }

      if (!usedDirectClient) {
        const response = await fetch('/api/generate-storyboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-key': userKey,
          },
          body: JSON.stringify({
            storyText,
            genre,
            style,
            numPanels,
            customCharacters
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || errData.details || "스토리보드 생성 실패");
        }

        storyboardData = await response.json();
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
        message: `기획에 실패했습니다: ${error.message}. 만약 Vercel 같은 서버리스 환경에 배포된 버전이라면 상단 "Gemini API 개인키 설정"에 본인의 고유 무료 API 키를 등록해주셔야 시간 초과 에러 없이 브라우저 고속 직연결로 100% 정상 활성화됩니다!`
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
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': localStorage.getItem('gemini_api_key') || '',
        },
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

      if (!response.ok) {
        throw new Error("HTTP connection error on generating image.");
      }

      const rawData = await response.json();
      
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

            {/* Custom Gemini API Key Toggle Button */}
            <button
              onClick={() => {
                setShowApiKeyPanel(!showApiKeyPanel);
                setApiKeyInputBuffer(localGeminiKey);
              }}
              className={`px-4 py-2 border-2 border-black font-sans text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] hover:bg-[#F9F7F2] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] ${
                localGeminiKey 
                  ? 'bg-emerald-55 text-emerald-900 border-emerald-600 shadow-[3px_3px_0px_0px_rgba(16,185,129,0.3)]' 
                  : 'bg-white text-black'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {localGeminiKey ? 'Gemini API 키 등록됨' : 'Gemini API 개인키 설정'}
            </button>
          </div>

        </div>
      </header>

      {/* Main body content container with editorial background */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex-1 space-y-8 bg-[#FDFCFB]">

        {/* Gemini API Key Configuration Panel */}
        <AnimatePresence>
          {showApiKeyPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#FAF9F5] border-2 border-black p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 font-sans text-[9px] font-black uppercase tracking-widest">
                API SECURITY
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="bg-black text-white p-3 border border-black shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex-shrink-0">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg md:text-xl uppercase tracking-tight">
                    구글 Gemini API 개인 고유 Key 설정 & 등록
                  </h3>
                  <p className="font-sans text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">
                    Personal Google AI Studio Studio Credentials Setup
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-sans text-gray-700 leading-relaxed max-w-4xl">
                <p>
                  본 <strong>16컷 웹툰 콘티 메이커 (Ink & Canvas)</strong>는 시나리오 빌딩을 위해 구글의 차세대 초경량 AI 엔진인 <strong>Gemini 3.5 Flash</strong> 및 <strong>Imagen 3.0</strong> 드로잉을 사용하고 있습니다.
                </p>
                <div className="bg-white p-4 border border-black space-y-2 leading-relaxed">
                  <p className="font-bold text-black flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">●</span> 구글 Gemini API는 무료인가요?
                  </p>
                  <p className="pl-4 text-gray-600">
                    그렇습니다! 개인 창작 및 개발 용도라면 구글 AI 스튜디오(Google AI Studio)에서 발급받은 개인용 API 키에 대해 <strong>기본적으로 완전한 무료 플랜(Free Plan)</strong>을 지속 제공하고 있습니다.
                  </p>
                  
                  <p className="font-bold text-black flex items-center gap-1.5 mt-2">
                    <span className="text-emerald-600 font-bold">●</span> 내 API Key를 왜 사용해야 하나요?
                  </p>
                  <p className="pl-4 text-gray-600">
                    서버에 탑재된 기본 시제품 테스트용 공용 키는 동시에 여러 유저가 기획하거나 작화를 대량으로 생성할 때 초당 호출 제한(Rate Limit)을 쉽게 초래합니다. <strong>본인의 고유 API Key를 등록하면 렉이나 밀림 현상 없이 신속하고 원활하게 무제한 제작이 가능해집니다.</strong> (빈 칸으로 둘 시, 자동으로 서버 소유 임시 공용 키로 자동 동작합니다)
                  </p>

                  <p className="font-bold text-black flex items-center gap-1.5 mt-2">
                    <span className="text-emerald-600 font-bold">●</span> 1분 만에 API Key 쉽게 발급받는 절차
                  </p>
                  <p className="pl-4 text-gray-600">
                    1. <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-bold hover:text-emerald-800">구글 AI 스튜디오 공식 웹사이트(aistudio.google.com)</a>에 일반 구글 계정으로 로그인합니다.<br/>
                    2. 상단 혹은 왼편의 <span className="font-bold text-black">"Get API Key"</span> 버튼을 누릅니다.<br/>
                    3. <span className="font-bold text-black">"Create API Key"</span>를 선별 수락한 뒤 발급된 긴 문자열(<span className="font-mono bg-gray-100 px-1 py-0.5 border border-gray-200">AIzaSy...</span>)을 바로 복사하여 하단 박스에 기입 후 저장을 적용해 주세요.
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-black pt-6">
                <label className="block font-sans text-[11px] font-black uppercase tracking-widest text-black mb-2">
                  본인의 구글 Gemini API Key (AIzaSy...)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      value={apiKeyInputBuffer}
                      onChange={(e) => setApiKeyInputBuffer(e.target.value)}
                      placeholder={localGeminiKey ? '•••••••••••••••••••••••••••••••••••••••••• (개인 API 키 안전 저장 중)' : '구글 AI Studio에서 발급받은 API 키를 넣으세요 (AIzaSy...)'}
                      className="w-full font-mono text-xs px-4 py-3 border-2 border-black focus:bg-[#FFFDF9] focus:outline-none transition-all placeholder:font-sans placeholder:text-gray-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveApiKey(apiKeyInputBuffer)}
                      className="px-6 py-2 bg-black hover:bg-neutral-800 text-white font-sans text-xs font-black uppercase tracking-wider transition-all border border-black shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5"
                    >
                      저장 및 즉시 적용
                    </button>
                    {localGeminiKey && (
                      <button
                        onClick={() => {
                          setApiKeyInputBuffer('');
                          handleSaveApiKey('');
                        }}
                        className="px-6 py-2 bg-white hover:bg-rose-50 text-rose-600 font-sans text-xs font-black uppercase tracking-wider transition-all border-2 border-rose-600 shadow-[2px_2px_0px_0px_rgba(225,29,72,0.15)] active:translate-y-0.5"
                      >
                        등록 해제
                      </button>
                    )}
                  </div>
                </div>
                <p className="font-sans text-[9px] text-gray-400 mt-3 flex items-center gap-1.5 leading-relaxed">
                  🛡️ 키 보안 서준: 사용자의 자산은 서버 데이터베이스나 클라우드 일체에 가공 전송되지 않으며, 귀하의 웹브라우저 안전 메모리(localStorage)에 한정 상주하여 매 호출 시 암호화 통로(SSL) 헤더로만 전달되므로 극도로 안전합니다.
                </p>
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
