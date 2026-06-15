/**
 * Utility to dynamically load Google Fonts on demand by injecting link tags.
 */
export const loadGoogleFont = (fontFamily: string | undefined) => {
  if (!fontFamily) return;

  // Extract the clean font name, e.g. "'Playfair Display', serif" -> "Playfair Display"
  const fontName = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
  if (!fontName) return;

  // Create a unique ID for the stylesheet to avoid duplicate injections
  const linkId = `gfont-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
  if (document.getElementById(linkId)) return;

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap`;
  document.head.appendChild(link);
};

/**
 * Curated list of premium Google Fonts grouped by category for selection.
 */
export const CURATED_FONTS = {
  sansSerif: [
    { value: "'Plus Jakarta Sans', sans-serif", label: 'Plus Jakarta Sans (Predeterminada)' },
    { value: 'Inter, sans-serif', label: 'Inter (Moderna & Limpia)' },
    { value: 'Outfit, sans-serif', label: 'Outfit (Geométrica Premium)' },
    { value: 'Poppins, sans-serif', label: 'Poppins (Amigable & Geométrica)' },
    { value: 'Montserrat, sans-serif', label: 'Montserrat (Corporativa)' },
    { value: 'Roboto, sans-serif', label: 'Roboto (Estándar Android)' },
    { value: 'Lato, sans-serif', label: 'Lato (Equilibrada)' },
    { value: "'Open Sans', sans-serif", label: 'Open Sans (Legible & Neutral)' }
  ],
  serif: [
    { value: "'Playfair Display', serif", label: 'Playfair Display (Serif Elegante / Titulares)' },
    { value: 'Merriweather, serif', label: 'Merriweather (Académica / Libro)' },
    { value: 'Lora, serif', label: 'Lora (Editorial / Artículos)' },
    { value: "'EB Garamond', serif", label: 'EB Garamond (Clásica del Renacimiento)' },
    { value: "'PT Serif', serif", label: 'PT Serif (Formal & Histórica)' },
    { value: 'Cinzel, serif', label: 'Cinzel (Inscripción Romana)' }
  ],
  display: [
    { value: "'Space Grotesk', sans-serif", label: 'Space Grotesk (Brutalista / Tech)' },
    { value: 'Oswald, sans-serif', label: 'Oswald (Condensada / Impacto)' },
    { value: 'Syncopate, sans-serif', label: 'Syncopate (Ancha & Tecnológica)' },
    { value: 'Righteous, sans-serif', label: 'Righteous (Retro / Art Deco)' },
    { value: "'Abril Fatface', serif", label: 'Abril Fatface (Contraste / Bold)' },
    { value: 'Syne, sans-serif', label: 'Syne (Artística / Excéntrica)' }
  ],
  monospace: [
    { value: "'Fira Code', monospace", label: 'Fira Code (Código / Programación)' },
    { value: "'Source Code Pro', monospace", label: 'Source Code Pro (Limpia & Técnica)' },
    { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono (Desarrollador)' },
    { value: "'Space Mono', monospace", label: 'Space Mono (Retro-Futurista)' }
  ],
  handwriting: [
    { value: 'Caveat, cursive', label: 'Caveat (Manuscrita Casual)' },
    { value: "'Dancing Script', cursive", label: 'Dancing Script (Cursiva Fluida)' },
    { value: 'Pacifico, cursive', label: 'Pacifico (Retro Americana)' },
    { value: 'Sacramento, cursive', label: 'Sacramento (Elegante & Delgada)' }
  ]
};
