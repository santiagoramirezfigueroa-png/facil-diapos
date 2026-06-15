import React from 'react';
import type { Slide } from '../types';
import { Image, Code, MessageSquare, AlertCircle, Trash2, Upload, X } from 'lucide-react';

interface EditorCanvasProps {
  slide: Slide;
  onChangeSlide: (updatedFields: Partial<Slide>) => void;
}

const getTitleFontSizeClass = (title: string, isTitleSlide: boolean) => {
  const len = title?.length || 0;
  if (isTitleSlide) {
    if (len > 80) return 'text-2xl md:text-3xl';
    if (len > 40) return 'text-3xl md:text-4xl';
    return 'text-4xl md:text-5xl';
  } else {
    if (len > 80) return 'text-xl md:text-2xl';
    if (len > 50) return 'text-2xl';
    return 'text-3xl';
  }
};

const getContentFontSizeClass = (content: string) => {
  const len = content?.length || 0;
  if (len > 600) return 'text-xs md:text-sm';
  if (len > 300) return 'text-sm md:text-base';
  return 'text-base md:text-lg';
};

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ slide, onChangeSlide }) => {
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChangeSlide({ title: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChangeSlide({ content: e.target.value });
  };

  const handleCol2Change = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChangeSlide({ col2Text: e.target.value });
  };

  const handleQuoteAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeSlide({ quoteAuthor: e.target.value });
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeSlide({ imageUrl: e.target.value });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      onChangeSlide({ imageUrl: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleImagePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            onChangeSlide({ imageUrl: event.target?.result as string });
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const renderImageSelector = (aspectClass: string = "h-full w-full") => {
    const fileInputId = `content-image-upload-${slide.id}`;
    
    return (
      <div 
        className={`${aspectClass} rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900/40 flex flex-col items-center justify-center relative group/img focus:outline-none focus:ring-1 focus:ring-indigo-500`}
        onPaste={handleImagePaste}
        tabIndex={0}
        title="Haz clic aquí y presiona Ctrl+V para pegar una imagen"
      >
        {slide.imageUrl ? (
          <>
            <img 
              src={slide.imageUrl} 
              alt="Slide content" 
              className="w-full h-full object-cover rounded" 
            />
            {/* Delete button on hover */}
            <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/img:opacity-100 transition-opacity duration-150 z-30">
              <button 
                onClick={(e) => { e.stopPropagation(); onChangeSlide({ imageUrl: undefined }); }}
                className="p-1.5 bg-red-950/85 hover:bg-red-600 border border-red-900/40 text-red-300 hover:text-white rounded-md shadow transition-colors active:scale-95"
                title="Eliminar imagen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center p-4 text-center space-y-3">
            <div className="p-3 bg-slate-950/40 rounded-full border border-slate-800">
              <Image className="w-8 h-8 text-indigo-400 stroke-[1.5]" />
            </div>
            
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-300 block">Añadir Imagen</span>
              <span className="text-[10px] text-slate-500 block max-w-[200px]">
                Presiona Ctrl+V aquí para pegar, pega una URL o sube un archivo
              </span>
            </div>

            <div className="flex flex-col space-y-2 w-full max-w-[180px]">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
                id={fileInputId}
              />
              <label
                htmlFor={fileInputId}
                className="py-1 px-3 bg-indigo-650 hover:bg-indigo-650 text-white rounded text-[10px] font-semibold text-center cursor-pointer transition-colors flex items-center justify-center gap-1 shadow"
              >
                <Upload className="w-3 h-3" />
                <span>Subir desde PC</span>
              </label>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- TABLE LAYOUT HANDLERS ---
  const tableHeaders = slide.tableHeaders || ['Medicamento', 'Mecanismo', 'Dosis Común', 'Efectos Adversos'];
  const tableRows = slide.tableRows || [
    ['Risperidona', 'Antagonista 5-HT2A y D2', '2 - 6 mg/día', 'Hiperprolactinemia, sedación'],
    ['Aripiprazol', 'Agonista parcial D2', '10 - 30 mg/día', 'Acatisia, insomnio, cefalea'],
    ['Quetiapina', 'Antagonista D2, 5-HT2A, H1', '150 - 800 mg/día', 'Sedación, aumento de peso, hipotensión']
  ];

  const handleHeaderChange = (index: number, val: string) => {
    const newHeaders = [...tableHeaders];
    newHeaders[index] = val;
    onChangeSlide({ tableHeaders: newHeaders });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    const newRows = tableRows.map((r, rIdx) => 
      rIdx === rowIndex ? r.map((c, cIdx) => cIdx === colIndex ? val : c) : r
    );
    onChangeSlide({ tableRows: newRows });
  };

  const addRow = () => {
    const newRow = Array(tableHeaders.length).fill('Nuevo dato');
    onChangeSlide({ tableRows: [...tableRows, newRow] });
  };

  const deleteRow = (index: number) => {
    if (tableRows.length <= 1) return;
    const newRows = tableRows.filter((_, idx) => idx !== index);
    onChangeSlide({ tableRows: newRows });
  };

  const addColumn = () => {
    const newHeaders = [...tableHeaders, `Columna ${tableHeaders.length + 1}`];
    const newRows = tableRows.map(r => [...r, 'Nuevo dato']);
    onChangeSlide({ tableHeaders: newHeaders, tableRows: newRows });
  };

  const deleteColumn = (colIndex: number) => {
    if (tableHeaders.length <= 1) return;
    const newHeaders = tableHeaders.filter((_, idx) => idx !== colIndex);
    const newRows = tableRows.map(r => r.filter((_, idx) => idx !== colIndex));
    onChangeSlide({ tableHeaders: newHeaders, tableRows: newRows });
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const parsedRows: string[][] = [];

      // Detect delimiter (, or ;) based on frequency in the first row
      const firstLine = lines[0] || '';
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semicolonCount = (firstLine.match(/;/g) || []).length;
      const delimiterChar = semicolonCount > commaCount ? ';' : ',';

      lines.forEach((line) => {
        if (!line.trim()) return;

        const row: string[] = [];
        let inQuotes = false;
        let currentCell = '';

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiterChar && !inQuotes) {
            row.push(currentCell.trim().replace(/^"|"$/g, ''));
            currentCell = '';
          } else {
            currentCell += char;
          }
        }
        row.push(currentCell.trim().replace(/^"|"$/g, ''));
        parsedRows.push(row);
      });

      if (parsedRows.length > 0) {
        const headers = parsedRows[0];
        const rows = parsedRows.slice(1);

        const paddedRows = rows.map(r => {
          const padded = [...r];
          while (padded.length < headers.length) {
            padded.push('');
          }
          return padded.slice(0, headers.length);
        });

        onChangeSlide({
          tableHeaders: headers,
          tableRows: paddedRows.length > 0 ? paddedRows : [Array(headers.length).fill('')]
        });
      }
    };
    reader.readAsText(file);
  };

  const handleColWidthChange = (colIdx: number, newPct: number) => {
    const currentWidths = slide.tableColWidths || Array(tableHeaders.length).fill(Math.round(100 / tableHeaders.length));
    const updatedWidths = [...currentWidths];
    updatedWidths[colIdx] = newPct;
    onChangeSlide({ tableColWidths: updatedWidths });
  };

  // --- TIMELINE LAYOUT HANDLERS ---
  const timelineEvents = slide.timelineEvents || [
    { date: 'Semana 1', title: 'Evaluación', desc: 'Instauración de ISRS y psicoeducación inicial' },
    { date: 'Semana 4', title: 'Ajuste', desc: 'Titulación de dosis por respuesta clínica parcial' },
    { date: 'Semana 8', title: 'Seguimiento', desc: 'Evaluación de remisión de síntomas cognitivos' }
  ];

  const handleEventChange = (index: number, field: 'date' | 'title' | 'desc', val: string) => {
    const newEvents = timelineEvents.map((ev, idx) => 
      idx === index ? { ...ev, [field]: val } : ev
    );
    onChangeSlide({ timelineEvents: newEvents });
  };

  const addEvent = () => {
    const newEvent = { date: `Hito ${timelineEvents.length + 1}`, title: 'Nuevo Evento', desc: 'Descripción del evento...' };
    onChangeSlide({ timelineEvents: [...timelineEvents, newEvent] });
  };

  const deleteEvent = (index: number) => {
    if (timelineEvents.length <= 1) return;
    const newEvents = timelineEvents.filter((_, idx) => idx !== index);
    onChangeSlide({ timelineEvents: newEvents });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/40 relative overflow-y-auto">
      {/* 16:9 Canvas Emulation */}
      <div 
        className="w-full max-w-4xl aspect-[16/9] rounded-xl shadow-2xl overflow-hidden relative flex flex-col p-8 transition-all duration-300 border border-white/5"
        style={{ 
          backgroundColor: slide.backgroundColor,
          color: slide.textColor,
          fontFamily: slide.fontFamily || undefined
        }}
      >
        {/* Background Image if set globally or in background image layout mode */}
        {(slide.backgroundImage || (slide.layout === 'image' && slide.imagePosition === 'background' && slide.imageUrl)) && (
          <div 
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ 
              backgroundImage: `url(${slide.backgroundImage || slide.imageUrl})` 
            }}
          />
        )}
        

        {/* Content Area (positioned relative to be on top of background image) */}
        <div className="relative z-20 flex-1 flex flex-col h-full">
          {/* LAYOUTS: TITLE SLIDE */}
          {slide.layout === 'title' && (
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <textarea
                value={slide.title}
                onChange={handleTitleChange}
                placeholder="Título Principal"
                rows={2}
                className={`w-full ${getTitleFontSizeClass(slide.title, true)} font-extrabold text-center bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-2 focus:outline-none resize-none overflow-hidden`}
                style={{ color: slide.textColor }}
              />
              <textarea
                value={slide.content}
                onChange={handleContentChange}
                placeholder="Subtítulo o descripción de la presentación..."
                rows={4}
                className={`w-4/5 ${getContentFontSizeClass(slide.content)} mt-4 text-center bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-2 focus:outline-none resize-none overflow-y-auto opacity-80`}
                style={{ color: slide.textColor }}
              />
            </div>
          )}

          {/* LAYOUTS: STANDARD TEXT SLIDE */}
          {slide.layout === 'text' && (
            <div className="flex-1 flex flex-col">
              <textarea
                value={slide.title}
                onChange={handleTitleChange}
                placeholder="Título de la diapositiva"
                rows={2}
                className={`w-full ${getTitleFontSizeClass(slide.title, false)} font-bold bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-1.5 focus:outline-none resize-none overflow-hidden`}
                style={{ color: slide.textColor }}
              />
              <div className="h-0.5 w-full my-4 bg-current opacity-20" />
              <textarea
                value={slide.content}
                onChange={handleContentChange}
                placeholder="Escribe tu contenido aquí... Puedes usar '-' para crear puntos de viñeta."
                className={`flex-1 ${getContentFontSizeClass(slide.content)} bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-2 focus:outline-none resize-none`}
                style={{ color: slide.textColor }}
              />
            </div>
          )}

          {/* LAYOUTS: TWO COLUMNS */}
          {slide.layout === 'two-columns' && (
            <div className="flex-1 flex flex-col h-full">
              <textarea
                value={slide.title}
                onChange={handleTitleChange}
                placeholder="Título de la diapositiva"
                rows={2}
                className={`w-full ${getTitleFontSizeClass(slide.title, false)} font-bold bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-1.5 focus:outline-none resize-none overflow-hidden`}
                style={{ color: slide.textColor }}
              />
              <div className="h-0.5 w-full my-4 bg-current opacity-20" />
              
              <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
                <div className="flex flex-col h-full">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Columna 1</span>
                  <textarea
                    value={slide.col1Text || slide.content}
                    onChange={(e) => {
                      onChangeSlide({ 
                        col1Text: e.target.value,
                        content: e.target.value // Sync with standard content as fallback
                      });
                    }}
                    placeholder="Contenido de la columna izquierda..."
                    className={`flex-1 ${getContentFontSizeClass(slide.col1Text || slide.content)} bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-2 focus:outline-none resize-none`}
                    style={{ color: slide.textColor }}
                  />
                </div>
                <div className="flex flex-col h-full">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Columna 2</span>
                  <textarea
                    value={slide.col2Text || ''}
                    onChange={handleCol2Change}
                    placeholder="Contenido de la columna derecha..."
                    className={`flex-1 ${getContentFontSizeClass(slide.col2Text || '')} bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-2 focus:outline-none resize-none`}
                    style={{ color: slide.textColor }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* LAYOUTS: IMAGE VIEW */}
          {slide.layout === 'image' && (
            <div className="flex-1 flex flex-col h-full">
              {slide.imagePosition !== 'background' && (
                <>
                  <textarea
                    value={slide.title}
                    onChange={handleTitleChange}
                    placeholder="Título con Imagen"
                    rows={2}
                    className={`w-full ${getTitleFontSizeClass(slide.title, false)} font-bold bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-1.5 focus:outline-none resize-none overflow-hidden`}
                    style={{ color: slide.textColor }}
                  />
                  <div className="h-0.5 w-full my-3 bg-current opacity-20" />
                </>
              )}

              {/* Side-by-Side Content */}
              {slide.imagePosition === 'left' && (
                <div className="grid grid-cols-2 gap-6 flex-1 min-h-0 items-center">
                  {renderImageSelector("h-full")}
                  <textarea
                    value={slide.content}
                    onChange={handleContentChange}
                    placeholder="Escribe tu texto descriptivo aquí..."
                    className={`h-full ${getContentFontSizeClass(slide.content)} bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-2 focus:outline-none resize-none`}
                    style={{ color: slide.textColor }}
                  />
                </div>
              )}

              {slide.imagePosition === 'right' && (
                <div className="grid grid-cols-2 gap-6 flex-1 min-h-0 items-center">
                  <textarea
                    value={slide.content}
                    onChange={handleContentChange}
                    placeholder="Escribe tu texto descriptivo aquí..."
                    className={`h-full ${getContentFontSizeClass(slide.content)} bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-2 focus:outline-none resize-none`}
                    style={{ color: slide.textColor }}
                  />
                  {renderImageSelector("h-full")}
                </div>
              )}

              {slide.imagePosition === 'center' && (
                <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                  {renderImageSelector("h-4/5 w-2/3")}
                </div>
              )}

              {slide.imagePosition === 'background' && (
                <div className="flex-1 flex flex-col justify-end pb-4">
                  <textarea
                    value={slide.title}
                    onChange={handleTitleChange}
                    placeholder="Título de diapositiva (Fondo)"
                    rows={2}
                    className={`w-full ${getTitleFontSizeClass(slide.title, false)} font-extrabold bg-transparent border border-dashed border-transparent hover:border-white/30 focus:border-indigo-500 rounded p-1.5 focus:outline-none resize-none overflow-hidden`}
                    style={{ color: slide.textColor }}
                  />
                  <textarea
                    value={slide.content}
                    onChange={handleContentChange}
                    placeholder="Escribe el texto de superposición aquí..."
                    rows={3}
                    className={`w-full ${getContentFontSizeClass(slide.content)} mt-2 bg-transparent border border-dashed border-transparent hover:border-white/30 focus:border-indigo-500 rounded p-2 focus:outline-none resize-none`}
                    style={{ color: slide.textColor }}
                  />
                </div>
              )}

              {/* URL input overlay at bottom of editor */}
              <div className="mt-3 flex items-center gap-2 bg-black/60 border border-slate-800 rounded-lg p-2 max-w-lg mx-auto w-full z-30">
                <Image className="w-4 h-4 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  value={slide.imageUrl || ''}
                  onChange={handleImageUrlChange}
                  placeholder="URL de Imagen (Unsplash, etc.)"
                  className="bg-transparent text-xs w-full text-slate-300 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* LAYOUTS: CODE EDIT */}
          {slide.layout === 'code' && (
            <div className="flex-1 flex flex-col h-full">
              <textarea
                value={slide.title}
                onChange={handleTitleChange}
                placeholder="Título de la diapositiva de Código"
                rows={2}
                className={`w-full ${getTitleFontSizeClass(slide.title, false)} font-bold bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-1.5 focus:outline-none resize-none overflow-hidden`}
                style={{ color: slide.textColor }}
              />
              <div className="h-0.5 w-full my-3 bg-current opacity-20" />
              
              <div className="flex-1 flex flex-col rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shadow-inner font-mono text-sm min-h-0">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-slate-400 font-medium">Consola de Código</span>
                  </div>
                  <input
                    type="text"
                    value={slide.codeLanguage || 'javascript'}
                    onChange={(e) => onChangeSlide({ codeLanguage: e.target.value })}
                    placeholder="javascript"
                    className="bg-slate-800 px-2 py-0.5 text-[10px] rounded text-slate-300 border border-slate-700 focus:outline-none max-w-[80px] text-center"
                  />
                </div>
                <textarea
                  value={slide.codeContent || slide.content || ''}
                  onChange={(e) => {
                    onChangeSlide({ 
                      codeContent: e.target.value,
                      content: e.target.value // Sync with standard content
                    });
                  }}
                  placeholder="// Escribe o pega tu código aquí..."
                  className="flex-1 p-4 bg-slate-950/80 text-emerald-400 focus:outline-none font-mono resize-none overflow-y-auto w-full"
                />
              </div>
            </div>
          )}

          {/* LAYOUTS: QUOTE VIEW */}
          {slide.layout === 'quote' && (
            <div className="flex-1 flex flex-col justify-center text-center px-8">
              <textarea
                value={slide.title}
                onChange={handleTitleChange}
                placeholder="Título superior (opcional)"
                rows={2}
                className={`w-full ${getTitleFontSizeClass(slide.title, false)} text-center bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-1 focus:outline-none resize-none overflow-hidden opacity-60`}
                style={{ color: slide.textColor }}
              />
              
              <div className="flex justify-center my-2 text-indigo-500/30">
                <MessageSquare className="w-12 h-12 stroke-[1.5]" />
              </div>

              <textarea
                value={slide.content}
                onChange={handleContentChange}
                placeholder="Escribe la frase célebre o cita textual aquí..."
                rows={3}
                className={`w-full ${getContentFontSizeClass(slide.content)} italic font-serif text-center bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-2 focus:outline-none resize-none overflow-hidden`}
                style={{ color: slide.textColor }}
              />
              
              <div className="flex items-center justify-center gap-2 mt-4 max-w-sm mx-auto w-full">
                <span className="text-slate-400 font-semibold text-lg">—</span>
                <input
                  type="text"
                  value={slide.quoteAuthor || ''}
                  onChange={handleQuoteAuthorChange}
                  placeholder="Autor de la cita"
                  className="bg-transparent text-lg font-semibold text-center border-b border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 focus:outline-none w-full p-0.5"
                  style={{ color: slide.textColor }}
                />
              </div>
            </div>
          )}

          {/* LAYOUTS: TABLE VIEW */}
          {slide.layout === 'table' && (
            <div className="flex-1 flex flex-col h-full min-h-0">
              <textarea
                value={slide.title}
                onChange={handleTitleChange}
                placeholder="Título de la diapositiva"
                rows={2}
                className={`w-full ${getTitleFontSizeClass(slide.title, false)} font-bold bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-1.5 focus:outline-none resize-none overflow-hidden`}
                style={{ color: slide.textColor }}
              />
              <div className="h-0.5 w-full my-2 bg-current opacity-20" />
              
              <div className="flex-1 overflow-auto min-h-0 py-2">
                <table className="w-full border-collapse border border-slate-700/40 text-xs md:text-sm">
                  <thead>
                    <tr className="bg-slate-900/10">
                      {tableHeaders.map((h, idx) => {
                        const colWidths = slide.tableColWidths || Array(tableHeaders.length).fill(Math.round(100 / tableHeaders.length));
                        const w = colWidths[idx] || Math.round(100 / tableHeaders.length);
                        return (
                          <th 
                            key={idx} 
                            style={{ width: `${w}%` }}
                            className="border border-slate-700/40 p-2 relative group/th"
                          >
                            <input
                              type="text"
                              value={h}
                              onChange={(e) => handleHeaderChange(idx, e.target.value)}
                              className="bg-transparent font-bold w-full text-center focus:outline-none border-b border-transparent focus:border-indigo-500"
                              style={{ color: slide.textColor }}
                            />
                            <button
                              onClick={() => deleteColumn(idx)}
                              className="absolute -top-1.5 -right-1.5 hidden group-hover/th:flex items-center justify-center p-0.5 bg-red-650 hover:bg-red-650 text-white rounded-full shadow active:scale-95 z-30"
                              title="Eliminar columna"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="border border-slate-700/40 p-2 relative group/td">
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                              className="bg-transparent w-full text-center focus:outline-none border-b border-transparent focus:border-indigo-500"
                              style={{ color: slide.textColor }}
                            />
                            {cIdx === row.length - 1 && (
                              <button
                                onClick={() => deleteRow(rIdx)}
                                className="absolute top-1/2 -translate-y-1/2 -right-1.5 hidden group-hover/td:flex items-center justify-center p-0.5 bg-red-650 hover:bg-red-650 text-white rounded-full shadow active:scale-95 z-30"
                                title="Eliminar fila"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Table controls */}
              <div className="flex gap-2 mt-2 justify-end">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  id={`csv-upload-${slide.id}`}
                />
                <label
                  htmlFor={`csv-upload-${slide.id}`}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 hover:border-slate-600 text-slate-200 text-[10px] rounded font-semibold transition-colors active:scale-95 shadow cursor-pointer flex items-center gap-1"
                >
                  <Upload className="w-3 h-3 text-indigo-400" />
                  <span>Importar CSV</span>
                </label>

                <button 
                  onClick={addRow} 
                  className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-600 text-white text-[10px] rounded font-semibold transition-colors active:scale-95 shadow"
                >
                  + Fila
                </button>
                <button 
                  onClick={addColumn} 
                  className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-600 text-white text-[10px] rounded font-semibold transition-colors active:scale-95 shadow"
                >
                  + Columna
                </button>
              </div>

              {/* Column width settings */}
              <div className="mt-2.5 p-2 bg-slate-950/20 border border-slate-800/80 rounded-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Anchos (%):</span>
                  <button
                    onClick={() => onChangeSlide({ tableColWidths: undefined })}
                    className="px-1.5 py-0.5 bg-slate-900/60 hover:bg-slate-800 text-[9px] text-indigo-400 hover:text-indigo-300 border border-slate-800 rounded font-semibold transition-colors cursor-pointer"
                    title="Restablecer todas las columnas al mismo tamaño"
                  >
                    Restablecer
                  </button>
                </div>
                <div className="flex-1 flex gap-3 overflow-x-auto pr-1 select-none">
                  {tableHeaders.map((h, idx) => {
                    const colWidths = slide.tableColWidths || Array(tableHeaders.length).fill(Math.round(100 / tableHeaders.length));
                    const w = colWidths[idx] || Math.round(100 / tableHeaders.length);
                    return (
                      <div key={idx} className="flex items-center gap-1 text-[10px] min-w-[75px] max-w-[120px] flex-1">
                        <span className="font-semibold truncate text-slate-400 max-w-[45px]">{h || `Col ${idx+1}`}:</span>
                        <input
                          type="range"
                          min="5"
                          max="85"
                          value={w}
                          onChange={(e) => handleColWidthChange(idx, parseInt(e.target.value))}
                          className="w-12 accent-indigo-500 h-1 rounded-lg bg-slate-850 cursor-pointer"
                        />
                        <span className="font-mono text-slate-500">{w}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* LAYOUTS: TIMELINE VIEW */}
          {slide.layout === 'timeline' && (
            <div className="flex-1 flex flex-col h-full min-h-0">
              <textarea
                value={slide.title}
                onChange={handleTitleChange}
                placeholder="Título de la línea de tiempo"
                rows={2}
                className={`w-full ${getTitleFontSizeClass(slide.title, false)} font-bold bg-transparent border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 rounded p-1.5 focus:outline-none resize-none overflow-hidden`}
                style={{ color: slide.textColor }}
              />
              <div className="h-0.5 w-full my-2 bg-current opacity-20" />
              
              <div className="flex-1 flex items-center justify-center min-h-0 relative py-4">
                {/* Horizontal line */}
                <div 
                  className="absolute h-0.5 left-8 right-8 top-1/2 -translate-y-1/2 opacity-25 rounded" 
                  style={{ backgroundColor: slide.textColor }}
                />
                
                <div className="grid gap-2 w-full relative z-10" style={{ gridTemplateColumns: `repeat(${timelineEvents.length}, minmax(0, 1fr))` }}>
                  {timelineEvents.map((ev, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center relative group/ev px-1">
                      <button
                        onClick={() => deleteEvent(idx)}
                        className="absolute -top-4 right-1/2 translate-x-1/2 hidden group-hover/ev:flex items-center justify-center p-0.5 bg-red-650 hover:bg-red-650 text-white rounded-full shadow active:scale-95 z-30"
                        title="Eliminar hito"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      
                      <input
                        type="text"
                        value={ev.date}
                        onChange={(e) => handleEventChange(idx, 'date', e.target.value)}
                        className="bg-transparent font-bold text-xs text-center w-full focus:outline-none border-b border-transparent focus:border-indigo-500 mb-1 font-mono uppercase tracking-wider"
                        style={{ color: slide.textColor }}
                        placeholder="Fecha/Semana"
                      />
                      
                      <div 
                        className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center my-1" 
                        style={{ backgroundColor: slide.backgroundColor }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      </div>
                      
                      <input
                        type="text"
                        value={ev.title}
                        onChange={(e) => handleEventChange(idx, 'title', e.target.value)}
                        className="bg-transparent font-semibold text-xs text-center w-full focus:outline-none border-b border-transparent focus:border-indigo-500"
                        style={{ color: slide.textColor }}
                        placeholder="Título del hito"
                      />
                      
                      <textarea
                        value={ev.desc}
                        onChange={(e) => handleEventChange(idx, 'desc', e.target.value)}
                        className="bg-transparent text-[10px] text-center w-full focus:outline-none border border-dashed border-transparent hover:border-slate-700/50 focus:border-indigo-500 mt-1 resize-none opacity-85 h-12"
                        style={{ color: slide.textColor }}
                        placeholder="Descripción..."
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Timeline controls */}
              <div className="flex gap-2 mt-2 justify-end">
                <button 
                  onClick={addEvent} 
                  className="px-2 py-1 bg-indigo-650 hover:bg-indigo-650 text-white text-[10px] rounded font-semibold transition-colors active:scale-95 shadow"
                >
                  + Añadir Hito
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Informative Tip */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
        <span>Puedes hacer clic y editar directamente los campos de texto sobre la diapositiva.</span>
      </div>
    </div>
  );
};
