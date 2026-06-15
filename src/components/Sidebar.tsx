import React from 'react';
import type { Slide } from '../types';
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, LayoutTemplate } from 'lucide-react';

interface SidebarProps {
  slides: Slide[];
  activeSlideId: string;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onDeleteSlide: (id: string, e: React.MouseEvent) => void;
  onDuplicateSlide: (slide: Slide, e: React.MouseEvent) => void;
  onMoveSlide: (index: number, direction: 'up' | 'down') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onMoveSlide,
}) => {
  return (
    <div className="w-80 flex flex-col h-full border-r border-slate-800 glass-panel">
      {/* Header */}
      <div className="p-4 border-b border-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-slate-200">Diapositivas</span>
        </div>
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
          {slides.length} {slides.length === 1 ? 'diapositiva' : 'diapositivas'}
        </span>
      </div>

      {/* Slide list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {slides.map((slide, index) => {
          const isActive = slide.id === activeSlideId;
          
          return (
            <div
              key={slide.id}
              onClick={() => onSelectSlide(slide.id)}
              className={`group relative flex flex-col rounded-lg overflow-hidden border cursor-pointer transition-all duration-200 ${
                isActive
                  ? 'border-indigo-500 ring-1 ring-indigo-500 bg-slate-900/60 shadow-lg shadow-indigo-950/20'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/20'
              }`}
            >
              {/* Slide Header with Index and Controls */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-850">
                <span className="text-xs font-medium text-slate-400">
                  {index + 1}
                </span>
                
                {/* Micro Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSlide(index, 'up');
                    }}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 rounded transition-colors"
                    title="Mover arriba"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSlide(index, 'down');
                    }}
                    disabled={index === slides.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 rounded transition-colors"
                    title="Mover abajo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => onDuplicateSlide(slide, e)}
                    className="p-1 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                    title="Duplicar diapositiva"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => onDeleteSlide(slide.id, e)}
                    disabled={slides.length <= 1}
                    className="p-1 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:hover:text-slate-400 rounded transition-colors"
                    title="Eliminar diapositiva"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Slide Thumbnail Preview Emulation */}
              <div className="p-3">
                <div 
                  className="w-full aspect-[16/9] rounded border border-slate-800 flex flex-col justify-between p-2 shadow-inner relative overflow-hidden"
                  style={{ 
                    backgroundColor: slide.backgroundColor,
                    color: slide.textColor,
                  }}
                >
                  {/* Miniature Content */}
                  {slide.layout === 'title' ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                      <div className="w-3/4 h-1.5 rounded-full opacity-80" style={{ backgroundColor: slide.textColor }} />
                      <div className="w-1/2 h-1 mt-1 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                    </div>
                  ) : slide.layout === 'two-columns' ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="w-1/3 h-1 rounded-full opacity-80 mb-1.5" style={{ backgroundColor: slide.textColor }} />
                      <div className="grid grid-cols-2 gap-1 flex-1">
                        <div className="space-y-1">
                          <div className="w-full h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                          <div className="w-5/6 h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                          <div className="w-2/3 h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                        </div>
                        <div className="space-y-1">
                          <div className="w-full h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                          <div className="w-5/6 h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                          <div className="w-3/4 h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                        </div>
                      </div>
                    </div>
                  ) : slide.layout === 'image' ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="w-1/3 h-1 rounded-full opacity-80 mb-1.5" style={{ backgroundColor: slide.textColor }} />
                      <div className="flex gap-1 flex-1">
                        {slide.imagePosition === 'left' ? (
                          <>
                            <div className="w-1/2 bg-slate-700/40 rounded flex items-center justify-center text-[6px] opacity-60">IMG</div>
                            <div className="w-1/2 space-y-1">
                              <div className="w-full h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                              <div className="w-5/6 h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-1/2 space-y-1">
                              <div className="w-full h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                              <div className="w-5/6 h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                            </div>
                            <div className="w-1/2 bg-slate-700/40 rounded flex items-center justify-center text-[6px] opacity-60">IMG</div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : slide.layout === 'code' ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="w-1/3 h-1 rounded-full opacity-80 mb-1.5" style={{ backgroundColor: slide.textColor }} />
                      <div className="bg-black/40 rounded p-1 flex-1 font-mono text-[4px] leading-[6px] text-slate-400 space-y-0.5">
                        <div className="w-3/4 h-0.5 bg-indigo-500/40 rounded" />
                        <div className="w-1/2 h-0.5 bg-emerald-500/40 rounded" />
                        <div className="w-2/3 h-0.5 bg-slate-500/40 rounded" />
                      </div>
                    </div>
                  ) : slide.layout === 'quote' ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center px-1">
                      <div className="w-full h-1 rounded-full opacity-45 italic" style={{ backgroundColor: slide.textColor }} />
                      <div className="w-3/4 h-1 mt-0.5 rounded-full opacity-45 italic" style={{ backgroundColor: slide.textColor }} />
                      <div className="w-1/3 h-0.5 mt-1 rounded-full opacity-70" style={{ backgroundColor: slide.textColor }} />
                    </div>
                  ) : slide.layout === 'table' ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="w-1/3 h-1 rounded-full opacity-80 mb-1" style={{ backgroundColor: slide.textColor }} />
                      <div className="border border-slate-700/40 rounded p-0.5 flex-1 grid grid-cols-3 gap-0.5 opacity-60">
                        <div className="h-1 bg-slate-400/30 rounded-xs" />
                        <div className="h-1 bg-slate-400/30 rounded-xs" />
                        <div className="h-1 bg-slate-400/30 rounded-xs" />
                        <div className="h-1 bg-slate-500/10 rounded-xs" />
                        <div className="h-1 bg-slate-500/10 rounded-xs" />
                        <div className="h-1 bg-slate-500/10 rounded-xs" />
                        <div className="h-1 bg-slate-500/10 rounded-xs" />
                        <div className="h-1 bg-slate-500/10 rounded-xs" />
                        <div className="h-1 bg-slate-500/10 rounded-xs" />
                      </div>
                    </div>
                  ) : slide.layout === 'timeline' ? (
                    <div className="flex-1 flex flex-col justify-between relative">
                      <div className="w-1/3 h-1 rounded-full opacity-80 mb-1" style={{ backgroundColor: slide.textColor }} />
                      <div className="flex-1 flex items-center justify-between relative px-1">
                        <div className="absolute h-0.5 left-1 right-1 top-1/2 -translate-y-1/2 opacity-30 bg-current" />
                        <div className="w-1 h-1 rounded-full bg-current relative z-10" />
                        <div className="w-1 h-1 rounded-full bg-current relative z-10" />
                        <div className="w-1 h-1 rounded-full bg-current relative z-10" />
                      </div>
                    </div>
                  ) : (
                    // standard text layout
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="w-1/3 h-1 rounded-full opacity-80 mb-1.5" style={{ backgroundColor: slide.textColor }} />
                      <div className="space-y-1 flex-1">
                        <div className="w-full h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                        <div className="w-5/6 h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                        <div className="w-4/5 h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                        <div className="w-2/3 h-0.5 rounded-full opacity-40" style={{ backgroundColor: slide.textColor }} />
                      </div>
                    </div>
                  )}

                  {/* Thumbnail Title */}
                  <div className="text-[8px] font-semibold truncate mt-1 text-center opacity-90 select-none">
                    {slide.title || 'Sin título'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Add Slide Button */}
      <div className="p-4 border-t border-slate-850">
        <button
          onClick={onAddSlide}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] shadow-md shadow-indigo-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Diapositiva</span>
        </button>
      </div>
    </div>
  );
};
