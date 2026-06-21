import React, { useState } from 'react';
import { 
  Check, 
  Edit3, 
  HelpCircle, 
  Image as ImageIcon, 
  Play, 
  RefreshCw, 
  Save, 
  Search, 
  Sparkles, 
  X,
  AlertTriangle,
  Flame,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Panel, ComicBook } from '../types';

interface StoryboardViewProps {
  comic: ComicBook;
  onUpdatePanel: (index: number, updatedPanel: Panel) => void;
  onGenerateImageSingle: (index: number) => Promise<void>;
  onGenerateAllImages: () => Promise<void>;
  isGeneratingAll: boolean;
  onConfirmStoryboard: () => void;
}

export default function StoryboardView({
  comic,
  onUpdatePanel,
  onGenerateImageSingle,
  onGenerateAllImages,
  isGeneratingAll,
  onConfirmStoryboard
}: StoryboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPanelData, setEditPanelData] = useState<Panel | null>(null);

  // For visual tracking of selected filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'unrendered' | 'rendered'>('all');

  // Multi-panel state telemetry
  const totalPanels = comic.panels.length;
  const renderedCount = comic.panels.filter(p => !!p.imageUrl).length;
  const isAllRendered = renderedCount === totalPanels;
  const progressPercent = Math.round((renderedCount / totalPanels) * 100);

  const startEditing = (index: number, panel: Panel) => {
    setEditingIndex(index);
    setEditPanelData({ ...panel });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditPanelData(null);
  };

  const saveEditing = (index: number) => {
    if (editPanelData) {
      onUpdatePanel(index, {
        ...editPanelData,
        isCustomEdited: true
      });
      setEditingIndex(null);
      setEditPanelData(null);
    }
  };

  // Filter logic
  const filteredPanels = comic.panels.map((panel, originalIndex) => ({ panel, originalIndex }))
    .filter(({ panel }) => {
      const matchesSearch = 
        panel.sceneDescription.includes(searchTerm) || 
        panel.dialogue.includes(searchTerm) || 
        panel.narration.includes(searchTerm) || 
        panel.speaker.includes(searchTerm);
      
      if (activeFilter === 'rendered') {
        return matchesSearch && !!panel.imageUrl;
      }
      if (activeFilter === 'unrendered') {
        return matchesSearch && !panel.imageUrl;
      }
      return matchesSearch;
    });

  return (
    <div className="space-y-8">
      {/* Top telemetry status bar */}
      <div className="bg-[#F9F7F2] text-black border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden">
        {/* Abstract comic splash graphic mock background */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-black opacity-[0.03] transform skew-x-12 translate-x-10 pointer-events-none select-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <span className="bg-black text-[#FDFCFB] text-[9px] font-sans font-black px-3 py-1 border border-black uppercase tracking-widest inline-flex items-center gap-1">
              <Flame className="w-3 h-3 inline animate-pulse text-red-400" />
              STORYBOARD PLANNING STAGE
            </span>
            <h3 className="font-serif font-black text-2xl md:text-3xl tracking-tight text-black">“{comic.title}”</h3>
            <p className="font-sans text-xs text-gray-500 max-w-2xl leading-relaxed">{comic.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {renderedCount < totalPanels && (
              <button
                onClick={onGenerateAllImages}
                disabled={isGeneratingAll}
                className={`flex-1 sm:flex-initial font-sans font-black text-xs uppercase tracking-widest px-6 py-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 ${
                  isGeneratingAll 
                    ? 'bg-gray-100 text-gray-400 border-gray-350 shadow-none cursor-not-allowed'
                    : 'bg-black text-[#FDFCFB] hover:bg-neutral-800'
                }`}
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                {isGeneratingAll ? 'GENERATING SCENARIO GRIDS...' : '남은 컷 고화질 AI 일괄 생성'}
              </button>
            )}

            <button
              onClick={onConfirmStoryboard}
              disabled={isGeneratingAll}
              className={`flex-1 sm:flex-initial font-sans font-black text-xs uppercase tracking-widest px-6 py-4 border-2 border-black shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 ${
                isGeneratingAll
                  ? 'bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed'
                  : 'bg-white hover:bg-[#F9F7F2] text-black'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3px]" />
              웹툰 감상/출판 모드 열기 (READ MODE)
            </button>
          </div>
        </div>

        {/* Progress statistics bar */}
        <div className="mt-6 pt-6 border-t border-black/10 space-y-2">
          <div className="flex justify-between items-center font-sans text-[10px] font-black uppercase tracking-widest text-gray-500">
            <span>만화 생성 진행도 / TELEMETRY RENDER PROGRESS</span>
            <span className="text-black font-black bg-white px-2.5 py-0.5 border border-black">
              총 {totalPanels}컷 중 <strong className="text-sm font-black text-black">{renderedCount}컷</strong> 드로잉 완료 ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-white h-5 border-2 border-black overflow-hidden p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-black h-full"
            />
          </div>
        </div>
      </div>

      {/* Filter and search utilities board */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#F9F7F2] border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
        {/* Quick Style presets display */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 font-sans text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 active:shadow-none transition-all ${
              activeFilter === 'all' ? 'bg-black text-white' : 'bg-white hover:bg-neutral-50 text-black'
            }`}
          >
            전체 보기 {totalPanels}컷
          </button>
          <button
            onClick={() => setActiveFilter('unrendered')}
            className={`px-4 py-2 font-sans text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 active:shadow-none transition-all ${
              activeFilter === 'unrendered' ? 'bg-orange-100 text-orange-850' : 'bg-white hover:bg-neutral-50 text-black'
            }`}
          >
            미생성 {totalPanels - renderedCount}컷
          </button>
          <button
            onClick={() => setActiveFilter('rendered')}
            className={`px-4 py-2 font-sans text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 active:shadow-none transition-all ${
              activeFilter === 'rendered' ? 'bg-emerald-50 text-emerald-850' : 'bg-white hover:bg-neutral-50 text-black'
            }`}
          >
            그림 완성 {renderedCount}컷
          </button>
        </div>

        {/* Searching input */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
            <Search className="w-4 h-4 text-black stroke-[2px]" />
          </span>
          <input
            type="text"
            placeholder="컷 내 대사, 해설, 장면 설명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border-2 border-black font-sans text-xs font-bold focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      {/* Warning regarding model speed limits as advice */}
      <div className="bg-white border-2 border-black p-4.5 flex gap-3 text-[#141414] shadow-[3px_3px_0px_0px_rgba(20,20,20,0.05)]">
        <AlertTriangle className="w-6 h-6 text-black shrink-0" />
        <div className="font-sans text-xs leading-relaxed text-gray-600">
          <span className="block font-serif italic text-black text-sm mb-1 font-bold">인공지능 대기 시간 안내 (AI Generation Advice)</span>
          만화가 <strong>최소 16컷 이상</strong>으로 풍부하게 구성되어 있어, 최초 생성에 시간(장면당 약 5~15초)이 발생할 수 있습니다. 이미지가 백그라운드에서 실시간 생성되는 도중에도 개별 컷 텍스트를 연동 편집할 수 있으며, 즉시 책 감상 모드로 연계 활용 가능합니다.
        </div>
      </div>

      {/* Grid layout of storyboard panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPanels.map(({ panel, originalIndex }) => {
            const isEditing = editingIndex === originalIndex;

            return (
              <motion.div
                layout
                key={panel.panelNumber}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] hover:shadow-[5px_5px_0px_0px_rgba(20,20,20,1)] transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Panel header inside card */}
                <div className="bg-[#F9F7F2] border-b-2 border-black px-5 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="bg-black text-[#FDFCFB] font-sans font-black text-[9px] tracking-widest px-2.5 py-1">
                      CUT {panel.panelNumber}
                    </span>
                    {panel.isCustomEdited && (
                      <span className="text-[9px] uppercase font-sans font-black bg-[#FDFCFB] text-black border border-black px-1.5 py-0.5">
                        EDITED
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Speaker visual assist */}
                    <span className="font-sans text-[9px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1 bg-white border border-black/10 px-2.5 py-0.5">
                      🎤 {panel.speaker || 'NARRATOR'}
                    </span>
                  </div>
                </div>

                {/* Main panel body */}
                <div className="p-5 space-y-4 flex-1">
                  
                  {/* Combined Preview Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    {/* Visual Area */}
                    <div className="sm:col-span-12 md:col-span-5 flex flex-col justify-between items-center bg-[#F9F7F2] border border-black overflow-hidden aspect-square relative group">
                      {panel.imageUrl ? (
                        <>
                          <img
                            src={panel.imageUrl}
                            alt={`Cut ${panel.panelNumber}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {panel.method?.startsWith("pollinations") && (
                            <div className="absolute top-2 right-2 bg-black text-[#FDFCFB] border border-[#FDFCFB]/20 px-2.5 py-1 flex items-center gap-1 shadow-sm text-[8px] font-sans font-black tracking-widest uppercase">
                              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                              {comic.style || "AI 작화"}
                            </div>
                          )}
                          {panel.isPlanB && !panel.method?.startsWith("pollinations") && (
                            <div className="absolute top-2 right-2 bg-emerald-50 text-emerald-800 border-2 border-emerald-600 px-2.5 py-1 flex items-center gap-1 shadow-sm text-[8px] font-sans font-black tracking-widest uppercase">
                              <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                              Plan B: AI Vector
                            </div>
                          )}
                          {panel.isFailed && !panel.isPlanB && !panel.method?.startsWith("pollinations") && (
                            <div className="absolute top-2 right-2 bg-yellow-100 border border-black px-2 py-0.5 flex items-center gap-1 shadow-sm text-[8px] font-bold text-yellow-800">
                              <AlertTriangle className="w-3 h-3 text-yellow-600" />
                              스케치 대체
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                            <button
                              type="button"
                              onClick={() => onGenerateImageSingle(originalIndex)}
                              disabled={panel.isGenerating}
                              className="bg-white hover:bg-[#F9F7F2] text-[#141414] border border-black font-sans text-[10px] font-bold px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 transition-all flex items-center gap-1"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${panel.isGenerating ? 'animate-spin' : ''}`} />
                              재작화
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-gray-400 space-y-2">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#141414]">EMPTY PANEL</span>
                          
                          <button
                            type="button"
                            onClick={() => onGenerateImageSingle(originalIndex)}
                            disabled={panel.isGenerating}
                            className="font-sans text-[8px] font-black tracking-widest uppercase border border-black bg-white hover:bg-neutral-50 px-2 py-1 transition-all"
                          >
                            DRAFT PANEL
                          </button>
                        </div>
                      )}

                      {/* Overly spinner */}
                      {panel.isGenerating && (
                        <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-4 text-center text-black">
                          <svg className="animate-spin h-6 w-6 text-black mb-2" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="text-[8px] font-sans font-black tracking-widest text-black">AI DRAFTING...</span>
                        </div>
                      )}
                    </div>

                    {/* Meta Text details Area */}
                    <div className="sm:col-span-12 md:col-span-7 flex flex-col justify-between space-y-3">
                      {isEditing && editPanelData ? (
                        <div className="space-y-2 flex-1">
                          <div>
                            <label className="text-[8px] font-sans font-black text-gray-400 block uppercase mb-0.5">나레이션 / 해설 (Narration)</label>
                            <textarea
                              value={editPanelData.narration}
                              onChange={(e) => setEditPanelData({ ...editPanelData, narration: e.target.value })}
                              rows={2}
                              className="w-full bg-white border border-black p-1.5 text-xs font-sans focus:ring-1 focus:ring-black outline-none resize-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[8px] font-sans font-black text-gray-400 block uppercase mb-0.5">화자 (Speaker)</label>
                              <input
                                type="text"
                                value={editPanelData.speaker}
                                onChange={(e) => setEditPanelData({ ...editPanelData, speaker: e.target.value })}
                                className="w-full bg-white border border-black p-1.5 text-xs font-sans focus:ring-1 focus:ring-black outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-sans font-black text-gray-400 block uppercase mb-0.5">효과음 (Sound SFX)</label>
                              <input
                                type="text"
                                value={editPanelData.soundEffect}
                                onChange={(e) => setEditPanelData({ ...editPanelData, soundEffect: e.target.value })}
                                placeholder="생략가능"
                                className="w-full bg-white border border-black p-1.5 text-xs font-sans focus:ring-1 focus:ring-black outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[8px] font-sans font-black text-gray-400 block uppercase mb-0.5">주인공 대사 (Speech dialogue)</label>
                            <input
                              type="text"
                              value={editPanelData.dialogue}
                              onChange={(e) => setEditPanelData({ ...editPanelData, dialogue: e.target.value })}
                              className="w-full bg-white border border-black p-1.5 text-xs font-sans focus:ring-1 focus:ring-black outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5 flex-1 select-text">
                          {panel.narration && (
                            <div className="bg-[#F9F7F2] border-l-2 border-black p-2">
                              <span className="text-[8px] font-sans font-black text-gray-400 uppercase block mb-0.5">NAR (나레이션)</span>
                              <p className="text-xs text-gray-800 font-sans leading-relaxed">{panel.narration}</p>
                            </div>
                          )}

                          <div>
                            <span className="text-[8px] font-sans font-black text-gray-400 uppercase block mb-0.5">DIALOGUE (대사)</span>
                            {panel.dialogue ? (
                              <p className="text-xs font-sans tracking-wide leading-relaxed bg-[#FDFCFB] border border-black/25 p-2 text-black">
                                <strong className="font-serif italic font-bold">{panel.speaker}</strong>: “{panel.dialogue}”
                              </p>
                            ) : (
                              <span className="text-xs italic text-gray-400">말하는 대사 없음</span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {panel.soundEffect && (
                              <span className="bg-white border border-black text-[#141414] text-[9px] font-sans font-black uppercase tracking-wider px-2 py-0.5">
                                SFX: {panel.soundEffect}
                              </span>
                            )}
                            <span className="bg-[#F9F7F2] border border-black/10 text-gray-600 text-[9px] font-sans px-2 py-0.5">
                              🎵 Mood: {panel.bgMusicMood || '침묵'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scene visual detailed descriptions */}
                  <div className="border-t border-black/10 pt-3.5">
                    <span className="text-[8px] font-sans font-black text-gray-450 block uppercase mb-1">SCENE GUIDE (장면 작화 프롬프트)</span>
                    <div className="text-xs font-sans text-gray-600 leading-relaxed bg-[#F9F7F2] p-2 border border-black/5">
                      {isEditing && editPanelData ? (
                        <textarea
                          value={editPanelData.sceneDescription}
                          onChange={(e) => setEditPanelData({ ...editPanelData, sceneDescription: e.target.value })}
                          rows={2}
                          className="w-full bg-white border border-black p-1 text-xs font-sans resize-none focus:outline-none"
                        />
                      ) : (
                        panel.sceneDescription
                      )}
                    </div>
                  </div>

                  {/* English Prompt edit box (only shown when focused/editing) */}
                  {(isEditing && editPanelData) ? (
                    <div className="bg-[#FDFCFB] p-3 border border-black mt-2">
                      <label className="text-[8px] font-sans font-black text-gray-450 block uppercase mb-1">AI RAW DRAW PROMPT (영어 핵심 묘사)</label>
                      <textarea
                        value={editPanelData.imagePrompt}
                        onChange={(e) => setEditPanelData({ ...editPanelData, imagePrompt: e.target.value })}
                        rows={3}
                        className="w-full bg-white border border-black p-1.5 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  ) : null}

                </div>

                {/* Main card controls footer */}
                <div className="bg-[#F9F7F2] border-t border-black px-5 py-3.5 flex justify-between items-center">
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEditing(originalIndex)}
                          className="bg-black hover:bg-neutral-800 text-white font-sans text-[9px] font-black uppercase tracking-widest px-3.5 py-2 border border-black active:translate-y-0.5 transition-all flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="bg-white hover:bg-[#F9F7F2] text-[#141414] font-sans text-[9px] font-black uppercase tracking-widest px-3.5 py-2 border border-black active:translate-y-0.5 transition-all flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          취소
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditing(originalIndex, panel)}
                        className="bg-white hover:bg-[#F9F7F2] text-[#141414] font-sans text-[9px] font-black uppercase tracking-widest px-3.5 py-2 border border-black active:translate-y-0.5 transition-all flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        텍스트 편집
                      </button>
                    )}
                  </div>

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => onGenerateImageSingle(originalIndex)}
                      disabled={panel.isGenerating}
                      className="bg-black hover:bg-neutral-800 text-white disabled:bg-gray-150 disabled:text-gray-400 font-sans text-[9px] font-black uppercase tracking-widest px-4 py-2 border border-black transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3 h-3 ${panel.isGenerating ? 'animate-spin' : ''}`} />
                      {panel.imageUrl ? '일러스트 재시도' : 'AI 컷 그리기'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
