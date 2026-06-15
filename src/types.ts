export interface Slide {
  id: string;
  title: string;
  content: string;
  layout: 'title' | 'text' | 'two-columns' | 'image' | 'code' | 'quote' | 'table' | 'timeline';
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
  col1Text?: string;
  col2Text?: string;
  imageUrl?: string;
  imagePosition?: 'left' | 'right' | 'background' | 'center';
  codeLanguage?: string;
  codeContent?: string;
  quoteAuthor?: string;
  transition?: 'none' | 'fade' | 'slide' | 'convex' | 'concave' | 'zoom';
  notes?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  tableColWidths?: number[];
  timelineEvents?: { date: string; title: string; desc: string }[];
  fontFamily?: string;
}

export interface PresetTheme {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  description: string;
  gradient?: string;
}

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'dark-neon',
    name: 'Neon Cyberpunk',
    backgroundColor: '#0f172a',
    textColor: '#f8fafc',
    accentColor: '#f43f5e',
    description: 'Fondo oscuro con acentos rosa neon y cian',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
  },
  {
    id: 'clean-light',
    name: 'Minimalista Claro',
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    accentColor: '#2563eb',
    description: 'Estilo limpio, profesional y altamente legible'
  },
  {
    id: 'ocean-breeze',
    name: 'Brisa del Océano',
    backgroundColor: '#0c4a6e',
    textColor: '#f0f9ff',
    accentColor: '#38bdf8',
    description: 'Azules profundos inspiradores',
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)'
  },
  {
    id: 'forest-zen',
    name: 'Zen Bosque',
    backgroundColor: '#064e3b',
    textColor: '#ecfdf5',
    accentColor: '#10b981',
    description: 'Tonos verdes relajantes y naturales',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)'
  },
  {
    id: 'sunset-glow',
    name: 'Atardecer Cálido',
    backgroundColor: '#7c2d12',
    textColor: '#fff7ed',
    accentColor: '#f97316',
    description: 'Naranjas y rojizos enérgicos',
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #4c1d95 100%)'
  },
  {
    id: 'royal-purple',
    name: 'Morado Real',
    backgroundColor: '#3b0764',
    textColor: '#faf5ff',
    accentColor: '#d8b4fe',
    description: 'Elegancia mística en tonos morados',
    gradient: 'linear-gradient(135deg, #3b0764 0%, #1e1b4b 100%)'
  }
];

export const PRESET_COLORS = [
  '#0f172a', // Slate 900
  '#f8fafc', // Slate 50
  '#1e3a8a', // Blue 900
  '#064e3b', // Green 900
  '#7c2d12', // Orange 900
  '#581c87', // Purple 900
  '#881337', // Rose 900
  '#172554', // Dark Blue
  '#27272a', // Zinc 800
  '#ffffff', // Absolute white
  '#000000', // Absolute black
];

export const PRESET_TEXT_COLORS = [
  '#f8fafc', // White/Light
  '#0f172a', // Dark slate
  '#e2e8f0', // Light slate
  '#334155', // Slate 700
  '#fed7aa', // Light orange
  '#bfdbfe', // Light blue
  '#a7f3d0', // Light green
];
