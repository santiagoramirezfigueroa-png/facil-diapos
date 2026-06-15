import React, { useEffect, useRef } from 'react';
import Reveal from 'reveal.js';
import type { Slide } from '../types';
import { X } from 'lucide-react';

// Import Reveal.js core styles
import 'reveal.js/reveal.css';
import 'reveal.js/theme/black.css';

// Helper to parse bold and italic Markdown in UI
const parseMarkdown = (text: string): React.ReactNode => {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-extrabold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

interface PresentationViewProps {
  slides: Slide[];
  onClose: () => void;
}

export const PresentationView: React.FC<PresentationViewProps> = ({ slides, onClose }) => {
  const revealContainerRef = useRef<HTMLDivElement>(null);
  const revealInstance = useRef<any>(null);

  useEffect(() => {
    const isPrintPdf = window.location.search.includes('print-pdf');

    // Enter full screen browser mode if possible (and not printing)
    if (!isPrintPdf) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      }
    } else {
      // Add Reveal.js PDF print classes
      document.documentElement.classList.add('reveal-print', 'print-pdf');
      document.body.classList.add('reveal-print', 'print-pdf');
    }

    if (revealContainerRef.current) {
      revealInstance.current = new Reveal(revealContainerRef.current, {
        controls: !isPrintPdf,
        progress: !isPrintPdf,
        center: true,
        hash: false,
        transition: 'slide',
        slideNumber: isPrintPdf ? false : 'c/t',
        keyboard: true,
        touch: !isPrintPdf,
        embedded: true,
        mouseWheel: false,
        viewDistance: 50
      });

      revealInstance.current.initialize().then(() => {
        // Adjust layout
        revealInstance.current.layout();

        if (isPrintPdf) {
          // Trigger print dialog after a brief render delay
          setTimeout(() => {
            window.print();
          }, 1200);
        }
      });
    }

    return () => {
      // Exit full screen
      if (!isPrintPdf && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      if (isPrintPdf) {
        document.documentElement.classList.remove('reveal-print', 'print-pdf');
        document.body.classList.remove('reveal-print', 'print-pdf');
      }

      if (revealInstance.current) {
        try {
          revealInstance.current.destroy();
        } catch (e) {
          console.error('Error destroying Reveal.js', e);
        }
      }
    };
  }, []);

  const renderSlideContent = (slide: Slide) => {
    const textStyle = { color: slide.textColor };

    // Format content lines (bullet points vs paragraphs)
    const formatText = (text: string) => {
      if (!text) return null;
      const lines = text.split('\n');
      const bullets = lines.filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* '));
      
      if (bullets.length > 0) {
        return (
          <ul className="text-left leading-relaxed">
            {lines.map((line, idx) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return <li key={idx}>{parseMarkdown(trimmed.substring(2))}</li>;
              } else if (trimmed.startsWith('  - ') || trimmed.startsWith('  * ')) {
                return <li key={idx} className="ml-8">{parseMarkdown(trimmed.substring(4))}</li>;
              }
              return <p key={idx} className="my-2">{parseMarkdown(line)}</p>;
            })}
          </ul>
        );
      }

      return (
        <div className="text-left space-y-4 leading-relaxed">
          {lines.map((line, idx) => (
            <p key={idx}>{parseMarkdown(line)}</p>
          ))}
        </div>
      );
    };

    switch (slide.layout) {
      case 'title':
        return (
          <div className="flex flex-col items-center justify-center text-center px-4" style={textStyle}>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8" style={textStyle}>
              {parseMarkdown(slide.title || 'Título')}
            </h1>
            {slide.content && (
              <p className="text-2xl opacity-80 max-w-3xl mt-4" style={textStyle}>
                {parseMarkdown(slide.content)}
              </p>
            )}
          </div>
        );

      case 'two-columns':
        return (
          <div className="flex flex-col h-full text-left px-8" style={textStyle}>
            <h2 className="text-4xl font-bold mb-6 border-b border-current pb-3" style={textStyle}>
              {parseMarkdown(slide.title || 'Título')}
            </h2>
            <div className="grid grid-cols-2 gap-10 mt-8">
              <div>{formatText(slide.col1Text || slide.content)}</div>
              <div>{formatText(slide.col2Text || '')}</div>
            </div>
          </div>
        );

      case 'image':
        const imgPos = slide.imagePosition || 'right';
        const imgUrl = slide.imageUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800';

        if (imgPos === 'background') {
          return (
            <div className="flex flex-col justify-end text-left h-[80vh] px-10 pb-8" style={textStyle}>
              <div className="bg-black/55 p-8 rounded-xl backdrop-blur-[2px] max-w-3xl">
                <h2 className="text-4xl font-extrabold mb-4" style={textStyle}>
                  {parseMarkdown(slide.title)}
                </h2>
                {slide.content && (
                  <div className="text-lg opacity-90">{formatText(slide.content)}</div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="flex flex-col h-full text-left px-8" style={textStyle}>
            <h2 className="text-4xl font-bold mb-6 border-b border-current pb-3" style={textStyle}>
              {parseMarkdown(slide.title)}
            </h2>
            <div className="grid grid-cols-12 gap-8 items-center mt-6">
              {imgPos === 'left' ? (
                <>
                  <div className="col-span-5 rounded-lg overflow-hidden shadow-lg border border-white/10">
                    <img src={imgUrl} alt="slide visual" className="w-full h-auto object-cover max-h-[50vh]" />
                  </div>
                  <div className="col-span-7">{formatText(slide.content)}</div>
                </>
              ) : imgPos === 'right' ? (
                <>
                  <div className="col-span-7">{formatText(slide.content)}</div>
                  <div className="col-span-5 rounded-lg overflow-hidden shadow-lg border border-white/10">
                    <img src={imgUrl} alt="slide visual" className="w-full h-auto object-cover max-h-[50vh]" />
                  </div>
                </>
              ) : (
                // Centered image
                <div className="col-span-12 flex justify-center">
                  <img src={imgUrl} alt="slide visual" className="rounded-lg max-h-[55vh] object-contain shadow-lg" />
                </div>
              )}
            </div>
          </div>
        );

      case 'code':
        return (
          <div className="flex flex-col h-full text-left px-8" style={textStyle}>
            <h2 className="text-4xl font-bold mb-6 border-b border-current pb-3" style={textStyle}>
              {parseMarkdown(slide.title || 'Código')}
            </h2>
            <div className="mt-4 rounded-xl overflow-hidden shadow-2xl border border-white/5 bg-[#1e1e1e]">
              <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>{slide.codeLanguage || 'javascript'}</span>
              </div>
              <pre className="p-6 text-sm text-emerald-400 font-mono overflow-auto max-h-[50vh] leading-relaxed">
                <code>{slide.codeContent || slide.content}</code>
              </pre>
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className="flex flex-col items-center justify-center text-center px-12" style={textStyle}>
            {slide.title && (
              <h3 className="text-xl uppercase tracking-widest opacity-60 mb-6" style={textStyle}>
                {parseMarkdown(slide.title)}
              </h3>
            )}
            <blockquote className="text-3xl md:text-4xl italic font-serif leading-relaxed max-w-4xl" style={textStyle}>
              "{parseMarkdown(slide.content)}"
            </blockquote>
            {slide.quoteAuthor && (
              <cite className="block text-xl font-semibold mt-6 not-italic" style={textStyle}>
                — {parseMarkdown(slide.quoteAuthor)}
              </cite>
            )}
          </div>
        );

      case 'table':
        const headers = slide.tableHeaders || ['Medicamento', 'Mecanismo', 'Dosis Común', 'Efectos Adversos'];
        const rows = slide.tableRows || [
          ['Risperidona', 'Antagonista 5-HT2A y D2', '2 - 6 mg/día', 'Hiperprolactinemia, sedación'],
          ['Aripiprazol', 'Agonista parcial D2', '10 - 30 mg/día', 'Acatisia, insomnio, cefalea'],
          ['Quetiapina', 'Antagonista D2, 5-HT2A, H1', '150 - 800 mg/día', 'Sedación, aumento de peso, hipotensión']
        ];
        return (
          <div className="flex flex-col h-full text-left px-8 w-full" style={textStyle}>
            <h2 className="text-4xl font-bold mb-6 border-b border-current pb-3" style={textStyle}>
              {parseMarkdown(slide.title || 'Comparación')}
            </h2>
            <div className="overflow-x-auto mt-6">
              <table className="w-full border-collapse border border-current/40 text-lg">
                <thead>
                  <tr style={{ borderBottom: '2px solid currentColor' }}>
                    {headers.map((h, idx) => {
                      const colWidths = slide.tableColWidths || Array(headers.length).fill(Math.round(100 / headers.length));
                      const w = colWidths[idx] || Math.round(100 / headers.length);
                      return (
                        <th 
                          key={idx} 
                          style={{ width: `${w}%` }}
                          className="border border-current/40 p-3 font-bold text-center"
                        >
                          {parseMarkdown(h)}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid currentColor' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="border border-current/40 p-3 text-center">
                          {parseMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'timeline':
        const events = slide.timelineEvents || [
          { date: 'Semana 1', title: 'Evaluación', desc: 'Instauración de ISRS y psicoeducación inicial' },
          { date: 'Semana 4', title: 'Ajuste', desc: 'Titulación de dosis por respuesta clínica parcial' },
          { date: 'Semana 8', title: 'Seguimiento', desc: 'Evaluación de remisión de síntomas cognitivos' }
        ];
        return (
          <div className="flex flex-col h-full text-left px-8 w-full" style={textStyle}>
            <h2 className="text-4xl font-bold mb-6 border-b border-current pb-3" style={textStyle}>
              {parseMarkdown(slide.title || 'Línea de Tiempo')}
            </h2>
            <div className="flex items-center justify-center relative py-12 mt-8 min-h-[300px]">
              {/* Horizontal line */}
              <div 
                className="absolute h-0.5 left-12 right-12 top-1/2 -translate-y-1/2 opacity-30" 
                style={{ backgroundColor: slide.textColor }}
              />
              
              <div className="grid gap-6 w-full relative z-10" style={{ gridTemplateColumns: `repeat(${events.length}, minmax(0, 1fr))` }}>
                {events.map((ev, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center px-2">
                    <span className="font-bold text-lg font-mono uppercase tracking-wider mb-2" style={{ color: slide.textColor }}>
                      {parseMarkdown(ev.date)}
                    </span>
                    <div 
                      className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center my-2" 
                      style={{ backgroundColor: slide.backgroundColor }}
                    >
                      <div className="w-2 h-2 rounded-full bg-current" />
                    </div>
                    <span className="font-semibold text-lg mt-2 block" style={{ color: slide.textColor }}>
                      {parseMarkdown(ev.title)}
                    </span>
                    <p className="text-sm opacity-80 mt-2 max-w-[200px] mx-auto leading-relaxed">
                      {parseMarkdown(ev.desc)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default: // 'text' layout
        return (
          <div className="flex flex-col h-full text-left px-8" style={textStyle}>
            <h2 className="text-4xl font-bold mb-6 border-b border-current pb-3" style={textStyle}>
              {parseMarkdown(slide.title || 'Título')}
            </h2>
            <div className="mt-8 text-xl">
              {formatText(slide.content)}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0f172a] flex flex-col select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 right-4 z-[10000] flex items-center gap-2">
        <button
          onClick={onClose}
          className="p-3 bg-slate-900/80 hover:bg-red-600 border border-slate-800 hover:border-red-500 text-slate-300 hover:text-white rounded-full transition-all duration-150 shadow-lg active:scale-95"
          title="Salir de presentación (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Reveal presentation container */}
      <div className="reveal flex-1 w-full h-full" ref={revealContainerRef}>
        <div className="slides">
          {slides.map((slide) => {
            const isBgImg = slide.layout === 'image' && slide.imagePosition === 'background';
            const bgImage = slide.backgroundImage || (isBgImg ? slide.imageUrl : undefined);
            
            return (
              <section
                key={slide.id}
                data-background-color={bgImage ? undefined : slide.backgroundColor}
                data-background-image={bgImage || undefined}
                data-transition={slide.transition || 'slide'}
                className="p-8"
                style={{ fontFamily: slide.fontFamily || undefined }}
              >
                {renderSlideContent(slide)}
                {slide.notes && (
                  <aside className="notes">
                    {slide.notes}
                  </aside>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
