import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Grid, 
  HelpCircle, 
  Music, 
  Printer, 
  RefreshCw, 
  Volume2,
  Columns,
  Sparkles,
  Layers,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ComicBook, Panel } from '../types';

interface ComicReaderProps {
  comic: ComicBook;
  onBackToStoryboard: () => void;
}

type ReaderMode = 'webtoon' | 'grid' | 'slide';

export default function ComicReader({ comic, onBackToStoryboard }: ComicReaderProps) {
  const [readMode, setReadMode] = useState<ReaderMode>('webtoon');
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [showPrintHelp, setShowPrintHelp] = useState(false);

  // Trigger system print
  const handlePrint = () => {
    setShowPrintHelp(true);
  };

  const handlePrintDirect = () => {
    try {
      window.print();
    } catch (e) {
      alert("브라우저 환경에서 인쇄 기능을 실행하지 못했습니다. 상단 '새 창에서 열기'를 사용해 보세요.");
    }
  };

  const handleCopyLink = () => {
    try {
      const currentUrl = window.location.href;
      navigator.clipboard.writeText(currentUrl);
      alert("🔗 웹툰 실행 링크가 성공적으로 인터넷 주소창에 복사되었습니다!\n\n모바일 기기의 주소창(Safari / Chrome / Samsung Internet)에 이 주소를 붙여넣은 뒤, '공유(또는 더보기) -> 인쇄 / PDF 저장'을 누르시면 온전히 저장됩니다.");
    } catch (err) {
      // Fallback
      alert("클립보드 자동 복사가 차단된 환경입니다. 모바일 외부 전용 브라우저에서 직접 본 화면을 실행해 보거나 화면 위쪽에 있는 '새 창으로 열기' 버튼을 사용해주세요.");
    }
  };

  const downloadBackupText = () => {
    let content = `=============================\n`;
    content += `만화 제목: ${comic.title}\n`;
    content += `선택된 작풍: ${comic.style}\n`;
    content += `제작일자: ${new Date().toLocaleDateString()}\n`;
    content += `=============================\n\n`;
    
    comic.panels.forEach(p => {
      content += `[컷 ${p.panelNumber}]\n`;
      if (p.narration) content += `나레이션: ${p.narration}\n`;
      if (p.speaker) content += `화자: ${p.speaker}\n`;
      if (p.dialogue) content += `대사: "${p.dialogue}"\n`;
      if (p.soundEffect) content += `효과음: [${p.soundEffect}]\n`;
      content += `이미지 기획안: ${p.sceneDescription}\n`;
      if (p.imageUrl) content += `이미지 주소: ${p.imageUrl}\n`;
      content += `-----------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${comic.title.replace(/[\s\x00-\x1f\x7f-\x9f\/\?<>\\:\*\|"]/g, '_')}_만화_스크립트_백업.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadBackupJSON = () => {
    const blob = new Blob([JSON.stringify(comic, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${comic.title.replace(/[\s\x00-\x1f\x7f-\x9f\/\?<>\\:\*\|"]/g, '_')}_만화_데이터.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPanelImage = async (panel: Panel, index: number) => {
    if (!panel.imageUrl) return;
    try {
      if (panel.imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = panel.imageUrl;
        link.download = `${comic.title.replace(/[\s\x00-\x1f\x7f-\x9f\/\?<>\\:\*\|"]/g, '_')}_컷${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(panel.imageUrl, { mode: 'cors' });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${comic.title.replace(/[\s\x00-\x1f\x7f-\x9f\/\?<>\\:\*\|"]/g, '_')}_컷${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // Direct window redirect or open fallback if CORS issue
      const newTab = window.open(panel.imageUrl, '_blank');
      if (!newTab) {
        window.location.href = panel.imageUrl;
      }
    }
  };

  const downloadAllJPGs = async () => {
    let successCount = 0;
    for (let i = 0; i < comic.panels.length; i++) {
      const p = comic.panels[i];
      if (p.imageUrl) {
        await new Promise(resolve => setTimeout(resolve, i * 250));
        await downloadPanelImage(p, i);
        successCount++;
      }
    }
    if (successCount > 0) {
      alert(`🎉 총 ${successCount}개의 컷 이미지 다운로드를 완료했습니다!\n\n※ 모바일 환경이나 일부 브라우저에서는 다중 다운로드 권한 수락이 필요합니다. 이미지가 전부 받아지지 않았다면 아래 각 컷 하단의 "JPG 개별 저장" 버튼이나 이미지를 길게 눌러 수동 저장해주시면 됩니다.`);
    }
  };

  const handleNextSlide = () => {
    if (slideIndex < comic.panels.length - 1) {
      setSlideIndex(prev => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (slideIndex > 0) {
      setSlideIndex(prev => prev - 1);
    }
  };

  // Keyboard navigation for slide view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readMode !== 'slide') return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readMode, slideIndex, comic.panels.length]);

  const activePanel = comic.panels[slideIndex];

  return (
    <div className="space-y-6">
      
      {/* Immersive Top Reader Navigation Bar */}
      <div className="bg-[#F9F7F2] border-2 border-black text-black p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
        
        {/* Left section: back & title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToStoryboard}
            className="p-2.5 bg-white hover:bg-[#F9F7F2] border-2 border-black transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            title="스토리보드로 돌아가기"
          >
            <ChevronLeft className="w-5 h-5 text-black stroke-[3px]" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-sans font-black uppercase tracking-widest bg-black text-[#FDFCFB] px-2.5 py-0.5 border border-black">
                Viewer Mode
              </span>
              <span className="text-[10px] text-gray-500 font-bold font-mono uppercase tracking-wider">Style: {comic.style} ({comic.panels.length}컷)</span>
            </div>
            <h2 className="font-serif italic font-black text-xl md:text-2xl mt-0.5 max-w-xs md:max-w-md truncate text-black">{comic.title}</h2>
          </div>
        </div>

        {/* Center: Reader Layout selection controllers */}
        <div className="flex bg-white p-1 border-2 border-black gap-1">
          <button
            onClick={() => setReadMode('webtoon')}
            className={`px-4 py-2 font-sans text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer ${
              readMode === 'webtoon' 
                ? 'bg-black text-white' 
                : 'text-gray-600 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            웹툰 스크롤
          </button>
          
          <button
            onClick={() => setReadMode('grid')}
            className={`px-4 py-2 font-sans text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer ${
              readMode === 'grid' 
                ? 'bg-black text-white' 
                : 'text-gray-600 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            출판 그리드
          </button>
          
          <button
            onClick={() => {
              setReadMode('slide');
              setSlideIndex(0);
            }}
            className={`px-4 py-2 font-sans text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer ${
              readMode === 'slide' 
                ? 'bg-black text-white' 
                : 'text-gray-600 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            슬라이드 보기
          </button>
        </div>

        {/* Right utility buttons */}
        <div className="flex gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* font-size controllers */}
          <button
            onClick={() => setFontSize(prev => prev === 'normal' ? 'large' : 'normal')}
            className="px-4 py-2.5 bg-white hover:bg-[#F9F7F2] text-[#141414] border-2 border-black font-sans text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
            title="대사 글꼴 크기 조절"
          >
            글꼴: {fontSize === 'normal' ? '중간' : '크게'}
          </button>

          {/* New Live JPG Download All function */}
          <button
            onClick={downloadAllJPGs}
            className="px-4 py-2.5 bg-[#4ADE80] hover:bg-[#22C55E] text-black border-2 border-black font-sans text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all flex items-center gap-1.5 cursor-pointer"
            title="모든 만화 컷을 이미지 파일(JPG)로 전체 일괄 다운로드"
          >
            <Download className="w-4 h-4 text-black" />
            <span>JPG 전체 다운로드</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white border-2 border-black font-sans text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all flex items-center gap-1 cursor-pointer"
            title="만화 인쇄하기 (PDF 저장)"
          >
            <Printer className="w-4 h-4" />
            <span>PDF 저장/인쇄</span>
          </button>
        </div>

      </div>

      {/* Background BGM player simulation bar */}
      {isPlayingMusic && (
        <div className="bg-[#FDFCFB] border-2 border-black text-black px-5 py-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex items-center justify-between text-xs font-mono print:hidden">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4.5 h-4.5 text-black animate-pulse" />
            <span className="font-sans font-bold uppercase text-[9px] tracking-widest text-gray-500">배경 사운드 큐레이션 / Aura Mood:</span>
            <strong className="text-black font-bold font-serif italic text-xs pl-1">
              {readMode === 'slide' ? activePanel.bgMusicMood : comic.panels[0]?.bgMusicMood || '은은한 클래식'}
            </strong>
          </div>
          
          {/* Simulated mini equalizer animation */}
          <div className="flex items-end gap-0.5 h-4 select-none pointer-events-none">
            <div className="bg-black w-1 animate-[bounce_1.1s_infinite_100ms] h-full" />
            <div className="bg-neutral-400 w-1 animate-[bounce_0.8s_infinite_300ms] h-full animate-pulse" />
            <div className="bg-black w-1 animate-[bounce_1.3s_infinite_500ms] h-full" />
            <div className="bg-neutral-400 w-1 animate-[bounce_0.9s_infinite_200ms] h-full animate-pulse" />
          </div>
        </div>
      )}

      {/* READER CONTENT VIEWER BOX */}
      <div id="print-comic-target" className="relative p-1">
        
        {/* ==================================================================== */}
        {/* VIEW 1: Webtoon Vertical Strip Mode (스크롤 모드) */}
        {/* ==================================================================== */}
        {readMode === 'webtoon' && (
          <div className="max-w-xl mx-auto space-y-16 py-8 px-2 md:px-0">
            {comic.panels.map((p, index) => (
              <div 
                key={p.panelNumber} 
                className="space-y-4 print:my-4 print:break-inside-avoid relative"
              >
                {/* Narrative above if exists */}
                {p.narration && (
                  <div className="max-w-md mx-auto bg-[#F9F7F2] text-black border-2 border-black p-4.5 text-center shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] z-10 relative">
                    <p className={`font-serif italic leading-relaxed text-slate-800 ${fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                      {p.narration}
                    </p>
                  </div>
                )}

                {/* Main panel canvas border */}
                <div className="relative bg-white border-2 border-black overflow-hidden aspect-square shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] print:shadow-none">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={`Panel ${p.panelNumber}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover cursor-pointer hover:brightness-95 transition-all duration-200"
                      title="모바일 기기에서 꾹 길게 누르면 사진첩/갤러리에 한 장씩 직접 저장 및 공유 가능합니다."
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F9F7F2] flex flex-col items-center justify-center p-4 border border-black/10">
                      <span className="text-[10px] font-sans font-black tracking-widest text-[#141414] uppercase">Drawing Panel {p.panelNumber}...</span>
                    </div>
                  )}

                  {/* Cut index badge overlay */}
                  <span className="absolute top-4 left-4 bg-black text-[#FDFCFB] font-sans font-black text-[9px] tracking-widest px-3 py-1.5 border border-black">
                    CUT {p.panelNumber}
                  </span>

                  {/* SFX sound badging absolute on image */}
                  {p.soundEffect && (
                    <div className="absolute top-4 right-4 bg-yellow-100 text-black font-sans font-black text-[9px] tracking-widest uppercase px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] rotate-6 select-none animate-pulse">
                      sfx: {p.soundEffect}
                    </div>
                  )}

                  {/* Overlaid Speech Bubble directly on the image bottom-ish */}
                  {p.dialogue && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 max-w-sm">
                      <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] relative text-center">
                        <span className="block text-[8px] font-sans font-black text-gray-500 uppercase tracking-widest mb-1.5">
                          {p.speaker}
                        </span>
                        <p className={`font-serif italic font-bold text-black leading-relaxed ${fontSize === 'large' ? 'text-base' : 'text-xs'}`}>
                          “{p.dialogue}”
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtitle description and Download button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-1.5 px-3 bg-neutral-50 border border-black/15 text-center sm:text-left shadow-xs">
                  <span className="text-[10px] font-sans text-gray-500 font-bold tracking-tight">
                    🎬 Prompt: {p.sceneDescription}
                  </span>
                  <button
                    onClick={() => downloadPanelImage(p, index)}
                    className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-[#FDFCFB] border border-black font-sans text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer active:translate-y-0.5"
                    title="이 컷을 JPG 이미지 파일로 개별 저장합니다."
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-300" />
                    JPG 개별 저장
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 2: Print Comic Grid Mode (그리드 작화모드) */}
        {/* ==================================================================== */}
        {readMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-6">
            {comic.panels.map((p, index) => (
              <div 
                key={p.panelNumber} 
                className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] overflow-hidden flex flex-col justify-between print:break-inside-avoid"
              >
                <div className="p-3 bg-[#F9F7F2] border-b-2 border-black flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-black text-[#FDFCFB] font-sans font-black text-[9px] tracking-widest px-2.5 py-0.5">
                      CUT {p.panelNumber}
                    </span>
                    <button
                      onClick={() => downloadPanelImage(p, index)}
                      className="bg-white hover:bg-neutral-50 border border-black/30 text-black px-1.5 py-0.5 font-sans text-[8px] font-bold flex items-center gap-0.5 cursor-pointer shadow-xs active:translate-y-0.5"
                      title="이 컷을 JPG 이미지 파일로 개별 저장합니다."
                    >
                      <Download className="w-2.5 h-2.5 text-emerald-600" />
                      JPG 저장
                    </button>
                  </div>

                  <span className="text-[9px] font-sans font-black uppercase text-gray-500 tracking-wider">
                    🎤 {p.speaker || 'NARRATION'}
                  </span>
                </div>

                {/* Image panel visual */}
                <div className="aspect-square border-b-2 border-black bg-white relative overflow-hidden">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={`Panel ${p.panelNumber}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-white text-[10px] font-sans uppercase font-bold tracking-widest">
                      Drawing...
                    </div>
                  )}

                  {p.soundEffect && (
                    <span className="absolute top-2 right-2 bg-yellow-50 text-black font-sans font-black text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-black shadow rotate-12">
                      {p.soundEffect}
                    </span>
                  )}
                </div>

                {/* comic text boxes inside book cells */}
                <div className="p-4 space-y-3 bg-white flex-1 flex flex-col justify-between">
                  {p.narration ? (
                    <p className={`text-gray-600 leading-relaxed font-serif italic border-b border-black/10 pb-2 ${fontSize === 'large' ? 'text-xs' : 'text-[11px]'}`}>
                      {p.narration}
                    </p>
                  ) : null}

                  {p.dialogue ? (
                    <p className={`font-sans leading-relaxed text-black ${fontSize === 'large' ? 'text-sm' : 'text-xs'}`}>
                      <strong className="font-serif italic font-bold">{p.speaker}</strong>: “{p.dialogue}”
                    </p>
                  ) : (
                    <p className="text-[9px] font-sans uppercase tracking-wider text-gray-400 font-bold">지시문 감상용 장면</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 3: Immersive Slide Focus Page Mode (슬라이드 모드) */}
        {/* ==================================================================== */}
        {readMode === 'slide' && (
          <div className="max-w-2xl mx-auto py-4">
            
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              {/* Slide top status index bar */}
              <div className="bg-black text-[#FDFCFB] px-6 py-4 border-b-2 border-black flex justify-between items-center">
                <span className="font-sans text-[10px] font-black tracking-widest text-[#FDFCFB] bg-neutral-800 border border-neutral-700 px-3 py-1">
                  CUT {activePanel.panelNumber} OF {comic.panels.length}
                </span>

                <div className="flex items-center gap-1.5 text-[9px] font-sans uppercase tracking-wider text-gray-400 font-bold">
                  <span>방향키 (←, →) / 스페이스 바로 이동 가능</span>
                </div>
              </div>

              {/* Main Active Panel details in single slide screen */}
              <div className="p-6 md:p-8 space-y-6 bg-[#F9F7F2]">
                {/* Upper Narration context */}
                <AnimatePresence mode="wait">
                  {activePanel.narration ? (
                    <motion.div
                      key={`narr-${slideIndex}`}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="max-w-xl mx-auto bg-white text-black border-2 border-black p-4.5 text-center shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]"
                    >
                      <p className={`font-serif italic ${fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                        {activePanel.narration}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="h-6" /> // spacer to keep height consistency
                  )}
                </AnimatePresence>

                {/* Big Center Artwork frame */}
                <div className="max-w-md mx-auto aspect-square bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`art-${slideIndex}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="w-full h-full"
                    >
                      {activePanel.imageUrl ? (
                        <img
                          src={activePanel.imageUrl}
                          alt={`Panel ${activePanel.panelNumber}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-gray-400">
                          <span className="text-[10px] font-sans font-black tracking-widest uppercase">PANEL IN PRODUCTION</span>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Sound badge */}
                  {activePanel.soundEffect && (
                    <span className="absolute top-4 right-4 bg-yellow-50 text-black font-sans font-black text-[9px] uppercase tracking-widest px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] rotate-12">
                      SFX: {activePanel.soundEffect}
                    </span>
                  )}
                </div>

                {/* Lower Dialogue block */}
                <div className="h-28 flex items-center justify-center text-center">
                  <AnimatePresence mode="wait">
                    {activePanel.dialogue ? (
                      <motion.div
                        key={`dia-${slideIndex}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] relative max-w-xl"
                      >
                        <span className="text-[9px] font-sans font-black text-gray-500 uppercase tracking-widest block mb-1">
                          {activePanel.speaker}
                        </span>
                        <p className={`font-serif italic font-bold text-black leading-relaxed ${fontSize === 'large' ? 'text-lg' : 'text-sm'}`}>
                          “{activePanel.dialogue}”
                        </p>
                      </motion.div>
                    ) : (
                      <span className="text-xs text-gray-400 font-sans tracking-wide uppercase font-bold italic">대사 없이 감상하는 미장센 컷입니다.</span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Slide Focus Toolbar Action Block */}
              <div className="bg-white border-t-2 border-black p-3.5 flex justify-center items-center gap-2">
                <button
                  onClick={() => downloadPanelImage(activePanel, slideIndex)}
                  className="px-5 py-2.5 bg-[#4ADE80] hover:bg-[#22C55E] text-black border-2 border-black font-sans text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 active:shadow-none transition-all"
                  title="현재 보이는 컷을 JPG 이미지로 개별 다운로드합니다."
                >
                  <Download className="w-4 h-4 text-black stroke-[3px]" />
                  현재 컷 JPG 이미지 저장
                </button>
              </div>

              {/* Slider Controls block */}
              <div className="bg-[#F9F7F2] border-t-2 border-black p-4 flex justify-between items-center">
                <button
                  onClick={handlePrevSlide}
                  disabled={slideIndex === 0}
                  className={`px-4 py-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 text-[10px] font-sans font-black uppercase tracking-widest cursor-pointer ${
                    slideIndex === 0 
                      ? 'bg-gray-50 border-gray-300 text-gray-400 shadow-none pointer-events-none' 
                      : 'bg-white hover:bg-[#F9F7F2] text-black'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
                  PREV
                </button>

                <span className="text-xs font-sans font-black tracking-widest text-black">
                  <strong className="text-sm font-black">{slideIndex + 1}</strong> / {comic.panels.length}
                </span>

                <button
                  onClick={handleNextSlide}
                  disabled={slideIndex === comic.panels.length - 1}
                  className={`px-4 py-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 text-[10px] font-sans font-black uppercase tracking-widest cursor-pointer ${
                    slideIndex === comic.panels.length - 1 
                      ? 'bg-gray-50 border-gray-300 text-gray-400 shadow-none pointer-events-none' 
                      : 'bg-black text-white'
                  }`}
                >
                  NEXT
                  <ArrowRight className="w-4 h-4 stroke-[2.5px]" />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Embedded print media helper utility css styling */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #print-comic-target {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden, #settings-panel, #history-panel, footer {
            display: none !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:my-4 {
            margin-top: 1rem !important;
            margin-bottom: 1rem !important;
          }
        }
      `}</style>

      {/* 📄 PDF 저장 및 고화질 인쇄 가이드 모달 */}
      <AnimatePresence>
        {showPrintHelp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#FDFCFB] border-4 border-black p-6 md:p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] space-y-6"
            >
              {/* Header */}
              <div className="border-b-2 border-black pb-3">
                <div className="flex items-center gap-2 text-black">
                  <Printer className="w-6 h-6 stroke-[2.5px] text-black" />
                  <h3 className="font-serif italic font-black text-xl">만화 인쇄 및 PDF 저장 안내</h3>
                </div>
              </div>

              {/* Informative Body */}
              <div className="space-y-4 text-xs tracking-wide leading-relaxed text-slate-800">
                <div className="bg-[#F9F7F2] border-2 border-amber-500 p-3 flex gap-3 items-start">
                  <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-800 block mb-0.5 font-bold">💡 인쇄 창이 안 뜨거나 모바일인가요?</strong>
                    모바일 환경이나 인앱 브라우저(카카오톡, 페이스북, 인스타그램 등) 내에서는 보안 규정 때문에 <code className="bg-amber-100/60 px-1 font-mono text-[10px]">window.print()</code> 직접 호출 기능이 원천 차단됩니다.
                  </div>
                </div>

                <div className="space-y-2 border border-slate-200 p-3.5 bg-slate-50/50">
                  <strong className="text-black block text-[13px] font-black">📱 모바일 간편 저장 & PDF 내보내는 방법:</strong>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                    <li>
                      <strong className="text-black font-bold">이미지 꾹 눌러 저장:</strong> 화면의 만화 장면을 3초간 <strong className="text-amber-800 font-bold">꾹 길게(Long press) 누르면</strong> "사진첩에 저장" 또는 "이미지 다운로드"가 즉시 활성화됩니다!
                    </li>
                    <li>
                      <strong className="text-black font-bold">웹브라우저 모드로 이동 (추천):</strong> 아래 복사 버튼을 눌러 모바일 외부 브라우저(Safari, Chrome, 삼성 인터넷) 주소창에 수동 복사 후 실행해보세요.
                    </li>
                    <li>
                      이후 브라우저 메뉴의 <strong className="text-black font-bold">"공유(📤)" ➡️ "인쇄(Print)" 또는 "PDF 저장"</strong>을 클릭하면 완벽하게 전체 PDF 도서 출력이 가능합니다!
                    </li>
                  </ul>
                </div>

                {/* Direct Link Copier block */}
                <div className="bg-neutral-50 border border-black/20 p-3 space-y-2">
                  <strong className="text-black block font-bold">🔗 이 웹툰 고유 링크 복사하기:</strong>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 py-2.5 bg-black hover:bg-neutral-800 text-[#FDFCFB] border-2 border-black font-sans text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 active:shadow-none transition-all"
                    >
                      <Copy className="w-4 h-4 text-emerald-300" />
                      웹툰 복사 링크 (인터넷 실행용)
                    </button>
                  </div>
                </div>

                {/* Backups section */}
                <div className="bg-neutral-50 border border-black/20 p-3 space-y-2">
                  <strong className="text-black block font-bold">💾 모바일/미리보기 전용 대본 & 백업 다운로드:</strong>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={downloadBackupText}
                      className="px-3 py-2 bg-white hover:bg-neutral-100 text-black border border-black font-sans text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      텍스트 대본 다운로드 (.txt)
                    </button>
                    <button
                      onClick={downloadBackupJSON}
                      className="px-3 py-2 bg-white hover:bg-neutral-100 text-black border border-black font-sans text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      JSON 백업 다운로드 (.json)
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="flex gap-2 pt-2 border-t-2 border-black">
                <button
                  onClick={handlePrintDirect}
                  className="flex-1 py-3 bg-black hover:bg-neutral-800 text-[#FDFCFB] border-2 border-black font-sans text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-center"
                >
                  기기 인쇄창 열기 시도
                </button>
                <button
                  onClick={() => setShowPrintHelp(false)}
                  className="px-6 py-3 bg-white hover:bg-neutral-50 text-black border-2 border-black font-sans text-xs font-black uppercase tracking-widest cursor-pointer text-center"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
