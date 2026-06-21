import React from 'react';
import { 
  FolderOpen, 
  Trash2, 
  Clock, 
  Layers, 
  Grid, 
  Sparkles, 
  ChevronRight,
  Bookmark
} from 'lucide-react';
import { ComicBook } from '../types';

interface ComicHistoryProps {
  comics: ComicBook[];
  onSelectComic: (id: string) => void;
  onDeleteComic: (id: string) => void;
  activeComicId: string | null;
}

export default function ComicHistory({
  comics,
  onSelectComic,
  onDeleteComic,
  activeComicId
}: ComicHistoryProps) {
  if (comics.length === 0) {
    return (
      <div id="history-panel" className="bg-slate-50 rounded-2xl border-3 border-dashed border-slate-350 p-6 text-center text-slate-400 space-y-2 select-none">
        <Bookmark className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
        <h4 className="font-black text-sm text-slate-700">작성 완료된 만화 보관함이 비어있습니다.</h4>
        <p className="text-xs font-bold leading-relaxed text-slate-400">
          위 기획실에서 만화를 설계하면 여기에 당신만의 16컷 명작 만화책들이 영구 보관됩니다!
        </p>
      </div>
    );
  }

  return (
    <div id="history-panel" className="bg-white rounded-2xl border-4 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-100">
        <FolderOpen className="w-5 h-5 text-rose-500 stroke-[2.5px]" />
        <h3 className="font-heading font-black text-base text-slate-900">내 창작 일지 / 만화 서랍장 ({comics.length}개의 작품)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comics.map((comic) => {
          const isActive = activeComicId === comic.id;
          const renderedCutsCount = comic.panels.filter(p => !!p.imageUrl).length;
          
          return (
            <div
              key={comic.id}
              className={`p-4.5 rounded-xl border-3 transition-all flex flex-col justify-between h-44 relative ${
                isActive
                  ? 'bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 border-indigo-500 shadow-[3px_3px_0px_0px_rgba(99,102,241,1)]'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[9px] font-black uppercase bg-slate-900 text-white px-1.5 py-0.5 rounded">
                    {comic.genre}
                  </span>

                  <span className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(comic.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="font-black text-sm text-slate-900 mt-2.5 line-clamp-1">
                  {comic.title}
                </h4>
                
                <p className="text-xs font-bold text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {comic.description}
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200/10 mt-2">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                  🎨 {renderedCutsCount} / {comic.panels.length}컷 완성
                </span>

                <div className="flex gap-1">
                  <button
                    onClick={() => onDeleteComic(comic.id)}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    title="이 작품 영구 삭제하기"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5px]" />
                  </button>

                  <button
                    onClick={() => onSelectComic(comic.id)}
                    className="pl-3 pr-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-lg active:scale-95 transition-all flex items-center gap-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,0.5)]"
                  >
                    불러오기
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
