import React from 'react';
import { PRESET_THEMES, PRESET_COLORS, PRESET_TEXT_COLORS } from '../types';
import type { Slide } from '../types';
import { CURATED_FONTS } from '../utils/fontLoader';
import { 
  Palette, 
  Settings2, 
  Layers, 
  FileText,
  FileCode,
  Columns,
  Sparkles,
  Quote,
  Layout,
  Trash2,
  Upload,
  Table,
  Milestone,
  Type,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface PropertiesPanelProps {
  slide: Slide;
  onChangeSlide: (updatedFields: Partial<Slide>) => void;
  onApplyBgToAll: (imageUrl: string | undefined) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  slide, 
  onChangeSlide,
  onApplyBgToAll
}) => {
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    layout: true,
    theme: false,
    appearance: true,
    transition: false,
    typography: false,
    notes: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  const layouts = [
    { id: 'title', label: 'Portada', icon: Layout },
    { id: 'text', label: 'Texto', icon: FileText },
    { id: 'two-columns', label: '2 Columnas', icon: Columns },
    { id: 'image', label: 'Imagen', icon: Sparkles },
    { id: 'code', label: 'Código', icon: FileCode },
    { id: 'quote', label: 'Cita', icon: Quote },
    { id: 'table', label: 'Tabla', icon: Table },
    { id: 'timeline', label: 'Línea Temporal', icon: Milestone },
  ] as const;

  const transitions = [
    { id: 'none', label: 'Ninguna' },
    { id: 'fade', label: 'Desvanecer (Fade)' },
    { id: 'slide', label: 'Deslizar (Slide)' },
    { id: 'convex', label: 'Convexa' },
    { id: 'concave', label: 'Cóncava' },
    { id: 'zoom', label: 'Zoom' },
  ] as const;

  const applyPresetTheme = (themeId: string) => {
    const theme = PRESET_THEMES.find(t => t.id === themeId);
    if (theme) {
      onChangeSlide({
        backgroundColor: theme.backgroundColor,
        textColor: theme.textColor,
      });
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      onChangeSlide({ 
        backgroundImage: base64Url,
        textColor: '#000000' // Make text color black by default on local upload
      });
    };
  };

  return (
    <div className="w-80 flex flex-col h-full border-l border-slate-800 glass-panel overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-2 shrink-0">
        <Settings2 className="w-5 h-5 text-indigo-400" />
        <span className="font-semibold text-slate-200">Propiedades</span>
      </div>

      <div className="p-4 space-y-4 divide-y divide-slate-800/60">
        {/* Layout selection */}
        <div className="pb-4">
          <button 
            onClick={() => toggleSection('layout')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors mb-2 focus:outline-none cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Estructura / Diseño
            </span>
            {openSections.layout ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </button>
          
          {openSections.layout && (
            <div className="grid grid-cols-2 gap-2 mt-3 transition-all duration-200">
              {layouts.map((lay) => {
                const Icon = lay.icon;
                const isSelected = slide.layout === lay.id;
                return (
                  <button
                    key={lay.id}
                    onClick={() => onChangeSlide({ layout: lay.id })}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200'
                        : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-medium">{lay.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Predefined Themes */}
        <div className="pt-4 pb-4">
          <button 
            onClick={() => toggleSection('theme')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors mb-2 focus:outline-none cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              Temas Prediseñados
            </span>
            {openSections.theme ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </button>

          {openSections.theme && (
            <div className="space-y-2 mt-3 transition-all duration-200">
              {PRESET_THEMES.map((theme) => {
                return (
                  <button
                    key={theme.id}
                    onClick={() => applyPresetTheme(theme.id)}
                    className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/20 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-5 h-5 rounded border border-white/10" 
                        style={{ 
                          background: theme.gradient || theme.backgroundColor,
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-300">{theme.name}</span>
                        <span className="text-[10px] text-slate-500">{theme.description}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Colors & Backgrounds */}
        <div className="pt-4 pb-4">
          <button 
            onClick={() => toggleSection('appearance')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors mb-2 focus:outline-none cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              Colores y Fondos
            </span>
            {openSections.appearance ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </button>

          {openSections.appearance && (
            <div className="space-y-4 mt-3 transition-all duration-200">
              {/* Layout specific settings (Image position) */}
              {slide.layout === 'image' && (
                <div className="space-y-2 pb-2 border-b border-slate-800/60">
                  <span className="text-[11px] text-slate-500 block">Posición de la Imagen</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['left', 'right', 'center', 'background'] as const).map((pos) => {
                      const isSelected = slide.imagePosition === pos || (!slide.imagePosition && pos === 'right');
                      const label = 
                        pos === 'left' ? 'Izquierda' :
                        pos === 'right' ? 'Derecha' :
                        pos === 'center' ? 'Centrado' : 'Fondo Completo';
                      
                      return (
                        <button
                          key={pos}
                          onClick={() => onChangeSlide({ imagePosition: pos })}
                          className={`py-1.5 px-2.5 rounded text-xs border font-medium ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300'
                              : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Background Image Input */}
              <div className="space-y-2">
                <span className="text-[11px] text-slate-500 block">Imagen de Fondo (URL)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={slide.backgroundImage || ''}
                    onChange={(e) => onChangeSlide({ 
                      backgroundImage: e.target.value || undefined,
                      textColor: e.target.value ? '#000000' : slide.textColor
                    })}
                    placeholder="Pega la URL de una imagen..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                  {slide.backgroundImage && (
                    <button
                      onClick={() => onChangeSlide({ backgroundImage: undefined })}
                      className="p-1.5 bg-red-950/20 border border-red-900/40 text-red-400 hover:text-red-300 rounded hover:bg-red-900/10 transition-colors"
                      title="Eliminar imagen de fondo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                {/* File Upload from PC */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBgUpload}
                    className="hidden"
                    id="bg-file-upload"
                  />
                  <label
                    htmlFor="bg-file-upload"
                    className="flex-1 py-1.5 px-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded text-[11px] font-medium text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Subir desde PC</span>
                  </label>
                </div>
                
                {slide.backgroundImage && (
                  <button
                    onClick={() => onApplyBgToAll(slide.backgroundImage)}
                    className="w-full mt-1.5 py-1 px-2.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white rounded text-[10px] font-semibold transition-all duration-150 flex items-center justify-center gap-1 active:scale-[0.98]"
                    title="Aplicar esta imagen de fondo a todas las diapositivas"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Aplicar a todas las diapositivas</span>
                  </button>
                )}

                {/* Presets Background Images */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Fondos Sugeridos</span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { name: 'Cyberpunk', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000' },
                      { name: 'Tecnología', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1000' },
                      { name: 'Atardecer', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000' },
                      { name: 'Océano', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000' }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => onChangeSlide({ 
                          backgroundImage: preset.url,
                          textColor: '#000000'
                        })}
                        className="h-8 rounded border border-slate-800 hover:border-slate-700 bg-cover bg-center overflow-hidden relative group/btn cursor-pointer"
                        style={{ backgroundImage: `url(${preset.url})` }}
                        title={preset.name}
                      >
                        <div className="absolute inset-0 bg-black/40 group-hover/btn:bg-black/20 transition-colors" />
                        <span className="absolute bottom-0.5 left-0.5 right-0.5 text-[8px] text-white/80 font-bold truncate text-center">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color de Fondo */}
              <div className={slide.backgroundImage ? 'opacity-40' : ''}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-slate-500">Color de Fondo</span>
                  {slide.backgroundImage && (
                    <span className="text-[9px] text-indigo-400 font-medium">Inactivo (Imagen activa)</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => onChangeSlide({ backgroundColor: color })}
                      disabled={!!slide.backgroundImage}
                      className={`w-5 h-5 rounded-full border border-white/5 relative ${
                        slide.backgroundColor === color && !slide.backgroundImage ? 'ring-2 ring-indigo-500 scale-105' : ''
                      } disabled:cursor-not-allowed`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={slide.backgroundColor.startsWith('#') ? slide.backgroundColor : '#ffffff'}
                    onChange={(e) => onChangeSlide({ backgroundColor: e.target.value })}
                    disabled={!!slide.backgroundImage}
                    className="w-7 h-7 rounded border border-slate-800 bg-transparent cursor-pointer disabled:opacity-50"
                  />
                  <input
                    type="text"
                    value={slide.backgroundColor}
                    onChange={(e) => onChangeSlide({ backgroundColor: e.target.value })}
                    disabled={!!slide.backgroundImage}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-300 w-24 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Text color */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Color del Texto</span>
                <div className="flex flex-wrap gap-1 mb-2">
                  {PRESET_TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => onChangeSlide({ textColor: color })}
                      className={`w-5 h-5 rounded-full border border-white/5 relative ${
                        slide.textColor === color ? 'ring-2 ring-indigo-500 scale-105' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={slide.textColor.startsWith('#') ? slide.textColor : '#000000'}
                    onChange={(e) => onChangeSlide({ textColor: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-800 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={slide.textColor}
                    onChange={(e) => onChangeSlide({ textColor: e.target.value })}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-300 w-24 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transition setting */}
        <div className="pt-4 pb-4">
          <button 
            onClick={() => toggleSection('transition')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors mb-2 focus:outline-none cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Transición (Reveal.js)
            </span>
            {openSections.transition ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </button>

          {openSections.transition && (
            <div className="mt-3">
              <select
                value={slide.transition || 'fade'}
                onChange={(e) => onChangeSlide({ transition: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {transitions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Typography setting */}
        <div className="pt-4 pb-4">
          <button 
            onClick={() => toggleSection('typography')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors mb-2 focus:outline-none cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-indigo-400" />
              Tipografía Premium
            </span>
            {openSections.typography ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </button>

          {openSections.typography && (
            <div className="mt-3">
              <select
                value={slide.fontFamily || ''}
                onChange={(e) => onChangeSlide({ fontFamily: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Por defecto (Plus Jakarta Sans)</option>
                
                <optgroup label="Sans-Serif (Moderna / Corporativa)">
                  {CURATED_FONTS.sansSerif.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </optgroup>
                
                <optgroup label="Serif (Clásica / Elegante / Académica)">
                  {CURATED_FONTS.serif.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </optgroup>
                
                <optgroup label="Display / Títulos Creativos">
                  {CURATED_FONTS.display.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </optgroup>
                
                <optgroup label="Monospace (Código / Técnico)">
                  {CURATED_FONTS.monospace.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </optgroup>
                
                <optgroup label="Handwriting / Manuscrito">
                  {CURATED_FONTS.handwriting.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}
        </div>

        {/* Speaker notes */}
        <div className="pt-4 pb-4">
          <button 
            onClick={() => toggleSection('notes')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors mb-2 focus:outline-none cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Notas del Orador
            </span>
            {openSections.notes ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </button>

          {openSections.notes && (
            <div className="mt-3">
              <textarea
                value={slide.notes || ''}
                onChange={(e) => onChangeSlide({ notes: e.target.value })}
                placeholder="Escribe comentarios o notas de apoyo para esta diapositiva..."
                rows={4}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded p-2.5 text-xs focus:outline-none focus:border-indigo-500 resize-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Estas notas serán visibles al proyectar en Reveal.js y se guardarán en las notas del archivo PPTX generado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
