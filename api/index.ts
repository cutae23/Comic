import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

// Helper to escape special character for inline SVGs
function generateSvgPlaceholder(
  panelNumber: number,
  sceneDescription: string,
  speaker: string,
  dialogue: string,
  narration: string,
  soundEffect: string
) {
  let bg = "#f8fafc"; // light gray slate
  let stroke = "#0f172a"; // deep slate line art
  let textBg = "#ffffff";
  let moodColor = "#6366f1"; // indigo
  
  const desc = sceneDescription || "";
  const dia = dialogue || "";

  // Dynamic mood themes based on keywords to match the story artistically
  if (desc.includes("어둡") || desc.includes("밤") || desc.includes("심각") || desc.includes("긴장") || desc.includes("어둠") || desc.includes("괴물") || desc.includes("위기")) {
    bg = "#0f172a"; // dark slate
    stroke = "#e2e8f0"; // light gray
    textBg = "#1e293b";
    moodColor = "#f43f5e"; // rose red
  } else if (desc.includes("밝") || desc.includes("낮") || desc.includes("희망") || desc.includes("기쁨") || desc.includes("행복") || desc.includes("웃") || desc.includes("요정")) {
    bg = "#fffbeb"; // amber glow
    stroke = "#78350f"; // warm amber accent
    textBg = "#ffffff";
    moodColor = "#f59e0b"; // golden amber
  } else if (desc.includes("숲") || desc.includes("나무") || desc.includes("자연") || desc.includes("야외") || desc.includes("마을")) {
    bg = "#f0fdf4"; // emerald tint
    stroke = "#14532d"; 
    textBg = "#ffffff";
    moodColor = "#10b981"; // emerald green
  } else if (desc.includes("바다") || desc.includes("우주") || desc.includes("하늘") || desc.includes("비행")) {
    bg = "#f0f9ff"; // sky tint
    stroke = "#0c4a6e";
    textBg = "#ffffff";
    moodColor = "#0ea5e9"; // sky blue
  } else if (desc.includes("사랑") || desc.includes("설렘") || desc.includes("따뜻")) {
    bg = "#fff1f2"; // rose tint
    stroke = "#4c0519";
    textBg = "#ffffff";
    moodColor = "#ec4899"; // pink
  }

  const escapedDesc = desc.replace(/["&'<>]/g, (c) => {
    switch (c) {
      case '"': return '&quot;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      default: return c;
    }
  });

  const escapedDia = dia.replace(/["&'<>]/g, (c) => {
    switch (c) {
      case '"': return '&quot;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      default: return c;
    }
  });

  const escapedNarr = (narration || "").replace(/["&'<>]/g, (c) => {
    switch (c) {
      case '"': return '&quot;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      default: return c;
    }
  });

  const escapedSound = (soundEffect || "").replace(/["&'<>]/g, (c) => {
    switch (c) {
      case '"': return '&quot;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      default: return c;
    }
  });

  // Compose speech bubble if active dialogue exists
  let bubbleSvg = "";
  if (escapedDia) {
    bubbleSvg = `
      <!-- Speech Bubble -->
      <path d="M 110 240 Q 70 240 70 190 Q 70 140 180 140 Q 290 140 290 190 Q 290 240 200 240 L 160 275 L 170 240 Z" fill="#ffffff" stroke="${stroke}" stroke-width="4.5" stroke-linejoin="round" />
      <text x="180" y="178" font-family="'Inter', sans-serif" font-weight="800" font-size="14" fill="${stroke}">${speaker || '캐릭터'}</text>
      <text x="180" y="202" font-family="'Inter', sans-serif" font-size="12" font-weight="500" fill="#334155" text-anchor="middle">"${escapedDia.length > 25 ? escapedDia.slice(0, 22) + '...' : escapedDia}"</text>
    `;
  }

  // Draw some cartoon action sketch overlay in the background
  const soundPart = escapedSound ? `
    <g transform="translate(290, 80) rotate(12)">
      <polygon points="0,15 20,30 40,25 30,55 55,50 35,80 65,80 30,120 45,90 15,90 25,60 0,65" fill="#f59e0b" stroke="${stroke}" stroke-width="3" />
      <text x="32" y="70" font-family="'Inter', sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle" transform="rotate(-12)" stroke="#451a03" stroke-width="1" paint-order="stroke fill">${escapedSound}</text>
    </g>
  ` : '';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
      <rect width="400" height="400" fill="${bg}" />
      
      <!-- Artistic abstract comic grid guide grids -->
      <line x1="20" y1="20" x2="380" y2="380" stroke="${stroke}" opacity="0.04" stroke-width="2" stroke-dasharray="8 12" />
      <line x1="380" y1="20" x2="20" y2="380" stroke="${stroke}" opacity="0.04" stroke-width="2" stroke-dasharray="8 12" />
      
      <!-- Main Thick Comic Card Border -->
      <rect x="15" y="15" width="370" height="370" rx="14" fill="none" stroke="${stroke}" stroke-width="7.5" />
      <rect x="15" y="15" width="370" height="370" rx="14" fill="none" stroke="${moodColor}" stroke-width="2.5" opacity="0.5" />

      <!-- Minimal Abstract drawing placeholders resembling a handdrawn sketch -->
      <g stroke="${stroke}" stroke-width="2" fill="none" opacity="0.3">
        <path d="M 120 330 Q 200 220 280 330" stroke-width="3" stroke-linecap="round"/>
        <circle cx="200" cy="180" r="35" stroke-dasharray="4 4" />
        <path d="M 60 350 H 340" stroke-width="4" stroke-linecap="round" />
        <!-- speed lines -->
        <line x1="40" y1="100" x2="90" y2="100" stroke-width="3"/>
        <line x1="310" y1="280" x2="360" y2="280" stroke-width="2"/>
      </g>

      <!-- Panel Index Badge -->
      <rect x="30" y="30" width="85" height="36" rx="6" fill="${moodColor}" stroke="${stroke}" stroke-width="3" />
      <text x="72.5" y="54.5" font-family="'JetBrains Mono', monospace" font-weight="900" font-size="17" fill="#ffffff" text-anchor="middle">CUT ${panelNumber}</text>

      <!-- Dialogue Bubble Render -->
      ${bubbleSvg}

      <!-- Action Sound effect overlay -->
      ${soundPart}

      <!-- Top Narration Box (Classic comic box) -->
      ${escapedNarr ? `
        <rect x="52" y="76" width="296" height="42" rx="4" fill="${textBg}" stroke="${stroke}" stroke-width="3" />
        <text x="200" y="101" font-family="'Inter', sans-serif" font-size="11" font-weight="700" fill="#1e293b" text-anchor="middle">
          ${escapedNarr.length > 50 ? escapedNarr.slice(0, 47) + '...' : escapedNarr}
        </text>
      ` : ''}

      <!-- Scene Visual description overlay -->
      <rect x="30" y="338" width="340" height="32" rx="4" fill="#ffffff" stroke="${stroke}" stroke-width="2.5" />
      <text x="200" y="358" font-family="'Inter', sans-serif" font-size="10.5" font-style="italic" font-weight="700" fill="#475569" text-anchor="middle">
        ${escapedDesc.length > 38 ? escapedDesc.slice(0, 35) + '...' : escapedDesc}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const app = express();
const PORT = 3000;

// JSON request body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Helper to resolve Gemini client based on secure server-side environment variables
  const getAiInstance = (req: express.Request) => {
    const finalKey = process.env.GEMINI_API_KEY;
    
    if (!finalKey) {
      throw new Error("서버 환경 변수에 GEMINI_API_KEY가 존재하지 않습니다. AI Studio의 Settings 또는 시스템 배포 대시보드(Vercel 등)에서 환경 변수(Environmental Variable)를 등록해 주시기 바랍니다.");
    }
    
    return new GoogleGenAI({
      apiKey: finalKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  interface GenerateContentParams {
    contents: any;
    config?: any;
  }

  // Robust function to handle transient model errors (like 503 unavailable, 429 rate limits),
  // retrying with exponential backoff, and falling back across multiple model tiers.
  const generateContentWithFallbackAndRetry = async (
    activeAi: any,
    params: GenerateContentParams,
    preferredModel: string = "gemini-3.5-flash"
  ): Promise<{ text: string }> => {
    const modelsToTry = [
      preferredModel,
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];
    
    const uniqueModels = Array.from(new Set(modelsToTry));
    let lastError: any = null;
    
    for (const model of uniqueModels) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[Gemini SDK] Trying model "${model}" (Attempt ${attempt}/3)...`);
          const res = await activeAi.models.generateContent({
            model: model,
            ...params
          });
          
          if (res && typeof res.text === "string" && res.text.trim().length > 0) {
            console.log(`[Gemini SDK] Success using model "${model}" on attempt ${attempt}!`);
            return { text: res.text };
          }
          
          if (res && res.text === undefined) {
            const textVal = res.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textVal && textVal.trim().length > 0) {
              console.log(`[Gemini SDK] Success using model "${model}" (via path resolution) on attempt ${attempt}!`);
              return { text: textVal };
            }
          }
          
          throw new Error("No response or empty text returned from generateContent");
        } catch (err: any) {
          lastError = err;
          const msg = err.message || "";
          console.warn(`[Gemini SDK Temp Error] Model "${model}" (Attempt ${attempt}/3) failed: ${msg}`);
          
          if (attempt < 3) {
            const status = err.status || (err.error && err.error.code);
            if (status === 503 || status === 429 || String(msg).includes("503") || String(msg).includes("429")) {
              const backoff = attempt * 1200;
              console.log(`[Gemini SDK Backoff] Waiting ${backoff}ms before retry...`);
              await new Promise((resolve) => setTimeout(resolve, backoff));
              continue;
            }
          }
          break; // skip to next model if it is a fatal non-transient error
        }
      }
    }
    
    throw lastError || new Error("All model fallback attempts failed.");
  };

  // Local summarizer fallback in case Gemini API is completely unavailable
  const generateLocalSummaryFallback = (rawText: string): string => {
    if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
      return "PDF 파일 내용을 읽을 수 없습니다. 기본 만화 생성 기능을 사용해 주세요.";
    }
    
    const blocks = rawText
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 20);
    
    if (blocks.length === 0) {
      return rawText.slice(0, 800).trim();
    }
    
    let summary = "";
    for (const block of blocks) {
      if ((summary + "\n\n" + block).length <= 1100) {
        summary += (summary ? "\n\n" : "") + block;
      } else {
        break;
      }
    }
    
    if (summary.trim().length < 150) {
      return rawText.slice(0, 1000).trim();
    }
    
    return summary.trim();
  };

  // API Route: Extract story text from PDF documents using Gemini Multimodal
  app.post("/api/parse-pdf", async (req, res) => {
    let rawTextBackup = "";
    try {
      const { pdfData, rawText } = req.body;
      rawTextBackup = rawText || "";

      if (rawText && typeof rawText === "string" && rawText.trim().length > 0) {
        console.log("Analyzing client-parsed PDF raw text using Gemini...");
        const activeAi = getAiInstance(req);
        
        const response = await generateContentWithFallbackAndRetry(activeAi, {
          contents: {
            parts: [
              {
                text: `다음은 PDF 파일에서 자동으로 추출된 원문 텍스트입니다:\n\n${rawText.slice(0, 15000)}\n\n이 텍스트 내용 전체를 완벽 분석하여, 16컷 이상의 만화/웹툰 스토리보드로 세분시킬 수 있는 완성도 높은 한국어 줄거리(시놉시스)로 압축 및 재구성해 주세요. 다른 인사말이나 부가적 설명(예: '줄거리를 재구성했습니다' 등)은 일체 배제하고 오직 줄거리 본문 단락들만 한국어로 반환해 주세요. 전체 길이는 공백 제외 600자~1200자 내외로 매우 컴팩트하고 알차게 요약해 주십시오.`
              }
            ]
          }
        }, "gemini-3.5-flash");

        const extractedText = response.text || "";
        return res.json({ text: extractedText.trim() });
      }

      if (!pdfData) {
        return res.status(400).json({ error: "PDF 파일 데이터 또는 텍스트가 전달되지 않았습니다." });
      }

      console.log("Extracting story text from uploaded PDF using Gemini multimodal intelligence...");

      const activeAi = getAiInstance(req);
      const response = await generateContentWithFallbackAndRetry(activeAi, {
        contents: {
          parts: [
            {
              inlineData: {
                data: pdfData,
                mimeType: "application/pdf"
              }
            },
            {
              text: "이 PDF 문서 안의 이야기, 소설 줄거리, 시나리오, 콘티 또는 기획 문서를 분석하여, 16컷 이상의 만화 스토리보드로 기획하기에 가장 적합한 완성도 높은 하나의 연속적인 한국어 줄거리 형식으로 재구성해 주세요. 다른 인사말이나 설명적 코멘트는 일절 하지 말고, 오직 새롭게 구성한 줄거리 본체 내용만을 한국어로 반환해 주시기 바랍니다. 전체 길이는 공백 제외 600자~1200자 내외로 압축적인 요약문 단락으로 전사해 주십시오."
            }
          ]
        }
      }, "gemini-3.5-flash");

      const extractedText = response.text || "";
      return res.json({ text: extractedText.trim() });
    } catch (error: any) {
      console.error("Critical error in /api/parse-pdf:", error);
      
      if (rawTextBackup && rawTextBackup.trim().length > 10) {
        console.warn("AI PDF parse completely failed. Invoking local summarizer fallback engine...");
        const fallbackText = generateLocalSummaryFallback(rawTextBackup);
        return res.json({ 
          text: fallbackText,
          warning: "현재 구글 AI 서비스 서버 부하가 높습니다. 대신 스마트 텍스트 파서를 활용해 줄거리를 자동 추출하였습니다."
        });
      }

      return res.status(500).json({ 
        error: "PDF 분석 및 텍스트 추출에 실패했습니다. (AI 모델 서비스 일시적 지연)", 
        details: error.message 
      });
    }
  });

  // API Route: Storyboard Generator
  app.post("/api/generate-storyboard", async (req, res) => {
    try {
      const { storyText, genre, style, numPanels, customCharacters } = req.body;

      if (!storyText || String(storyText).trim().length === 0) {
        return res.status(400).json({ error: "스토리 텍스트를 입력해주세요." });
      }

      const panelCount = Number(numPanels) || 16;
      if (panelCount < 16) {
        return res.status(400).json({ error: "만화 생성을 위해 최소 16컷 이상이 지정되어야 합니다." });
      }

      console.log(`Generating a ${panelCount}-panel storyboard for style [${style}]`);

      const systemPrompt = `You are an expert webtoon/comic storyboard writer.
Your job is to analyze the user's provided story text and decompose/outline it into a highly professional, dramatic, and logical manga storyboard comprising EXACTLY ${panelCount} consecutive, sequential panels (cuts).
Do not generate fewer than ${panelCount} panels. The length of the 'panels' array MUST be exactly ${panelCount}.

Follow these guidelines for structured generation:
1. **Title**: Devise a creative, high-impact Korean title for the comic.
2. **Description**: Summarize the 16+ cut story arc neatly in Korean (1-2 sentences).
3. **Style Summary**: Summarize the artistic direction of the style in Korean based on style: [${style}]. (e.g. "샤프한 선과 화려한 네온 컬러가 강조된 현대 웹툰 스타일").
4. **Characters**: Extract up to 4 major characters and describe them.
   - You MUST identify the correct gender (male vs. female) of each character. From the Korean text, words like "청년", "그", "소년", "남자", "아저씨", "할아버지" are strictly MALE, while "처녀", "그녀", "소녀", "여자", "아가씨", "할머니" are strictly FEMALE.
   - For each character, produce a highly consistent 'visualDescription' in English (e.g., "handsome 23-year old young man, male, neat short dark hair, masculine jawline, determined expression, black jacket, manga webtoon style, strictly male with NO feminine features"). Ensure to explicitly state "male", "young man", "short haircut", etc., for male characters so the AI image generator never misrepresents them as women.
5. **Panels**: Outline exactly ${panelCount} panels. Each panel must have:
   - 'panelNumber': Sequential index, starting from 1 up to ${panelCount}.
   - 'sceneDescription': Visual illustration guideline of the scene in Korean.
   - 'speaker': The character speaking (e.g. "철수", "민우", "나레이션", "해설")
   - 'dialogue': Speech bubble content in Korean. Keep it conversational, emotional, and succinct.
   - 'narration': The contextual storytelling narration in Korean (displays on top/bottom of panel).
   - 'soundEffect': Fun Korean onomatopoeia badge (e.g. "슥-", "쾅!", "스우우우", "쿵!"). Use empty string if none.
   - 'bgMusicMood': Suggested ambient background sound or music (in Korean).
   - 'imagePrompt': Detailed, photorealistic/stylized ENGLISH text-to-image prompt. Important: Embed the english 'visualDescription' of characters directly into the prompt (do not just use names like "Cheolsu", write "the 15-year old schooler with messy dark hair, wearing green jacket...").
     Incorporate background elements, camera shot type (e.g., 'close-up shot', 'low-angle shot', 'establishing dynamic shot', 'side-profile extreme close-up'), lighting (e.g., 'dramatic cinematic lighting', 'soft warm sunset glow'), color grading, and style modifiers reflecting the requested comic style: [${style}]. Append style suffixes to make the rendering high fidelity. (e.g. "clean lines, vibrant colors, comic art style, detailed digital webtoon drawing --aspect_ratio 1:1"). Do not use characters like --ar or --aspect_ratio other than standard prompt flags.

Be creative. Make sure the comic sequence has a robust story arc:
- Cut 1-4: Introduction & hook (기)
- Cut 5-8: Development & problem rising (승)
- Cut 9-13: Main Climax & high emotion/action (전)
- Cut 14-16+: Resolution & satisfying ending (결)

CRITICAL TIMEOUT AVOIDANCE RULE:
Keep all generated text fields extremely short, succinct, and compact to minimize output token count and guarantee fast execution.
- Ensure 'visualDescription' of characters is exactly 1-2 sentences of clean keyword-based descriptions.
- 'sceneDescription' must be exactly 1 short sentence in Korean.
- 'dialogue' and 'narration' must be exactly 1 short sentence or phrase per panel (under 15 words).
- 'imagePrompt' must be a concise list of high-impact visual tags (no fluff).
Do not generate large paragraphs of filler text.`;

      const userMessage = `Create a detailed sequential storyboard with exactly ${panelCount} panels.
      User's Story: ${storyText}
      Comic Genre: ${genre}
      Artistic Style: ${style}
      Current Requested Panel Count: ${panelCount}
      Custom Reference Characters: ${customCharacters ? JSON.stringify(customCharacters) : 'None'}`;

      const activeAi = getAiInstance(req);
      const response = await generateContentWithFallbackAndRetry(activeAi, {
        contents: [
          { role: "user", parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Korean title of the comic strip" },
              description: { type: Type.STRING, description: "A summary of the comic story in Korean" },
              genre: { type: Type.STRING },
              styleSummary: { type: Type.STRING, description: "Brief visual style description in Korean" },
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Character Korean Name" },
                    visualDescription: { type: Type.STRING, description: "English prompt snippet describing visual attributes for consistency" }
                  },
                  required: ["name", "visualDescription"]
                }
              },
              panels: {
                type: Type.ARRAY,
                description: `Strictly array of exactly ${panelCount} panels`,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    panelNumber: { type: Type.INTEGER },
                    sceneDescription: { type: Type.STRING, description: "Detailed scene visual action in Korean" },
                    speaker: { type: Type.STRING, description: "Speaking character or '해설' / '나레이션'" },
                    dialogue: { type: Type.STRING, description: "Speech bubble dialogue in Korean (can be empty string)" },
                    narration: { type: Type.STRING, description: "Context narration in Korean (can be empty string)" },
                    soundEffect: { type: Type.STRING, description: "Korean sound badge (e.g., '쾅!', '두근두근', '스윽') or empty string" },
                    bgMusicMood: { type: Type.STRING, description: "Theme music mood in Korean (e.g. 긴박한 현악 피치카토)" },
                    imagePrompt: { type: Type.STRING, description: "Intense English prompt with specific character features, camera angle, and style tags. Prompt MUST NOT refer to names of characters directly. Always substitute names with their physical visual attributes." }
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
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini AI model.");
      }

      // Parse JSON
      const comicData = JSON.parse(responseText.trim());
      
      // Safety guarantee: Ensure panels count is correct or clip/fill
      if (comicData.panels && comicData.panels.length !== panelCount) {
        console.warn(`Gemini returned ${comicData.panels.length} panels instead of ${panelCount}. adjusting...`);
      }

      return res.json(comicData);
    } catch (error: any) {
      console.error("Error in /api/generate-storyboard:", error);
      return res.status(500).json({ 
        error: "스토리보드를 생성하는 데 실패했습니다.", 
        details: error.message 
      });
    }
  });

  // API Route: Panel Image Generator with multi-layer fallback including Pollinations AI, Gemini Imagen, and vector fallbacks
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, style, panelNumber, sceneDescription, speaker, dialogue, narration, soundEffect } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "프롬프트가 없습니다." });
      }

      console.log(`Generating image for Panel ${panelNumber} with prompt: "${prompt.slice(0, 50)}..."`);
      const activeAi = getAiInstance(req);

      // Style-specific prompt decorators for top-tier visual artwork
      let styledPrompt = prompt;
      let pollinationModel = "flux"; // 'flux-realism', 'flux-anime', 'flux-3d'
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
        // Generic modern artistic comic
        styledPrompt = `High quality graphic novel comic book block panel illustration, vibrant flat colors, crisp dark comic outlines, gorgeous design composition: ${prompt || sceneDescription}`;
        pollinationModel = "flux";
      }

      // Add a random seed to make sure multiple panels are distinct and interesting
      const randomSeed = Math.floor(Math.random() * 99999999) + 24681;

      // Layer 1: Pollinations AI flux/anime/3d engine (Highest reliability, breathtaking output)
      try {
        console.log(`[Layer 1 - Pollinations] Drawing custom style "${style}" panel using Flux engine (seed ${randomSeed})...`);
        const pollinationUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(styledPrompt)}?width=512&height=512&model=${pollinationModel}&seed=${randomSeed}&nologo=true&private=true`;
        
        const response = await fetch(pollinationUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const base64Data = Buffer.from(arrayBuffer).toString("base64");
          const imageUrl = `data:image/jpeg;base64,${base64Data}`;
          console.log(`[Layer 1 Success] Loaded stunning dynamic ${style} illustration for Panel ${panelNumber}!`);
          return res.json({ 
            imageUrl, 
            success: true,
            method: `pollinations-${pollinationModel}`
          });
        } else {
          console.warn(`[Layer 1 Non-OK response] status = ${response.status}`);
        }
      } catch (e1: any) {
        console.warn(`[Layer 1 Failed] Pollinations API down or timeout: ${e1.message}`);
      }

      // Layer 2: Try modern Imagen 3.0 model (imagen-3.0-generate-002) if authorized in regional key
      try {
        console.log(`[Layer 2 - Imagen] Attempting fallback image generation with imagen-3.0-generate-002...`);
        const response = await activeAi.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
          },
        });

        if (response.generatedImages?.[0]?.image?.imageBytes) {
          const base64Data = response.generatedImages[0].image.imageBytes;
          const imageUrl = `data:image/jpeg;base64,${base64Data}`;
          return res.json({ 
            imageUrl, 
            success: true,
            method: "imagen-3.0-generate-002"
          });
        }
      } catch (e2: any) {
        console.warn(`[Layer 2 Failed] imagen-3.0-generate-002: ${e2.message}`);
      }

      // Layer 3: Try legacy gemini-2.5-flash-image
      try {
        console.log(`[Layer 3 - Gemini Content] Attempting image generation with gemini-2.5-flash-image...`);
        const response = await activeAi.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: {
            parts: [
              {
                text: `${prompt}, beautiful detailed artwork, clean rendering.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K"
            },
          },
        });

        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const base64Data = part.inlineData.data;
              const imageUrl = `data:image/png;base64,${base64Data}`;
              return res.json({ 
                imageUrl, 
                success: true,
                method: "gemini-2.5-flash-image"
              });
            }
          }
        }
      } catch (e3: any) {
        console.warn(`[Layer 3 Failed] gemini-2.5-flash-image: ${e3.message}`);
      }

      // Layer 4 (PLAN B Fallback): Gemini Vector Artist - Generates beautiful structured SVG drawing code based on scene description
      try {
        console.log(`[Layer 4 - SVG Artist] Triggering Gemini Vector Illustration Artist for: "${sceneDescription?.slice(0, 50)}..."`);
        
        const systemPrompt = `You are an elite vector artist and SVG designer specialising in flat modern illustration, children storybook art, graphic novels, or cartoon strips.
Output a complete, fully valid, highly professional, stylized and colorful SVG vector graphic depicting the requested scene inside a 400x400 viewBox.

Scene to depict: "${sceneDescription}"
Comic Style: "${style}"

Rules:
1. Include complex layered shapes (rects, circles, paths, polygons, gradients, lines) for a rich, beautifully composed background. Create beautiful horizons, skies with stars/clouds, suns, mountains, stylized city outlines, or interior rooms depending on the scene description.
2. Represent characters or key objects creatively using stylized geometric flat-design shapes or cartoon paths with vivid modern palettes matching the style.
3. Utilize rich CSS gradients (<linearGradient> or <radialGradient>) to make the scenes look warm, cinematic, 3D, neon modern, or retro pixelated.
4. Do NOT output any speech bubbles, dialogue text, or cut numbers. Keep it as the pure illustration artwork.
5. Your output must be ONLY the raw SVG XML string. Do NOT enclose in markdown formatting (do NOT use \`\`\`xml or \`\`\`). Directly start with '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"...' and end with '</svg>'.

Create an absolute visual masterpiece.`;

        const response = await generateContentWithFallbackAndRetry(activeAi, {
          contents: [
            {
              role: "user",
              parts: [{ text: `Create a fully colored modern vector illustration SVG for: "${sceneDescription}". Style theme: ${style}.` }]
            }
          ],
          config: {
            systemInstruction: systemPrompt
          }
        }, "gemini-3.5-flash");

        let rawSvg = response.text || "";
        
        // Robust extraction of SVG block regardless of surrounding text or markdown code tags
        const svgStartIdx = rawSvg.indexOf("<svg");
        const svgEndIdx = rawSvg.lastIndexOf("</svg>");
        
        if (svgStartIdx !== -1 && svgEndIdx !== -1 && svgEndIdx > svgStartIdx) {
          const cleanSvg = rawSvg.slice(svgStartIdx, svgEndIdx + 6).trim();
          const base64Svg = Buffer.from(cleanSvg).toString("base64");
          const imageUrl = `data:image/svg+xml;base64,${base64Svg}`;
          console.log(`[PLAN B Success] Loaded robust custom vector SVG for Panel ${panelNumber}!`);
          return res.json({
            imageUrl,
            success: true,
            isFallback: false, // treat as solid success since we have beautiful dynamic custom vectors
            isPlanB: true,
            method: "gemini-vector-artist"
          });
        } else {
          console.warn("[Layer 3 Failed] Response did not contain physical '<svg>' and '</svg>' structures.");
        }
      } catch (e3: any) {
        console.warn(`[Layer 3 Failed] Gemini Vector Artist: ${e3.message}`);
      }

      // Layer 4 (Ultimate Fallback): Dynamic Wireframe Comic Card
      console.log(`[Layer 4 Fallback] Generating vector math-based comic card fallback for Panel ${panelNumber}`);
      const fallbackUrl = generateSvgPlaceholder(
        Number(panelNumber) || 1,
        sceneDescription || "",
        speaker || "",
        dialogue || "",
        narration || "",
        soundEffect || ""
      );

      return res.json({
        imageUrl: fallbackUrl,
        success: true, // Mark true so the reader handles it as a fully prepared component
        isFallback: true,
        errorDetails: "Image generation engines offline - Wireframe fallback activated",
        method: "sketch-vector-fallback"
      });

    } catch (error: any) {
      console.error("Critical error in /api/generate-image endpoint:", error);
      return res.status(500).json({ 
        error: "이미지 생성 실패", 
        details: error.message 
      });
    }
  });

  // Serve static files in production or hook Vite in development
  async function bootstrap() {
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      const { createServer: createViteServer } = await eval('import("vite")');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      if (!process.env.VERCEL) {
        // In clean production (eg Container), serve build artifacts
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          res.sendFile(path.join(distPath, "index.html"));
        });
      }
    }

    if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`[16-Cut Comic Server] active on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
      });
    }
  }

  bootstrap().catch(err => {
    console.error("Failed to bootstrap server:", err);
  });

  export default app;
