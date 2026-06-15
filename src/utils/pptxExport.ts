import pptxgen from 'pptxgenjs';
import type { Slide } from '../types';

const cleanColor = (hex: string): string => {
  if (!hex) return 'FFFFFF';
  // Strip '#' if present
  return hex.startsWith('#') ? hex.slice(1) : hex;
};

// Helper to pre-fetch external images and convert to base64 Data URLs client-side.
// Uses a three-layer hybrid strategy:
// 1. Attempts direct fetch first.
// 2. If blocked by CORS, uses images.weserv.nl (high-performance proxy specifically designed for images and CORS bypass).
// 3. If that also fails, uses corsproxy.io as a general backup proxy.
// If all fail, it returns null to let the exporter fall back gracefully.
const getBase64Image = async (url: string): Promise<string | null> => {
  if (!url) return null;
  const targetUrl = url.trim();

  // If it's already a base64 data URI, return it immediately
  if (targetUrl.startsWith('data:')) {
    return targetUrl;
  }

  // 1. Try direct fetch first (fastest, respects direct CORS headers)
  try {
    const response = await fetch(targetUrl);
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.log('Direct fetch blocked by CORS or network, trying image-dedicated proxy...');
  }

  // 2. Try images.weserv.nl (specifically optimized for fetching/caching images and adding CORS headers)
  try {
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch (weservError) {
    console.log('images.weserv.nl proxy failed, trying general CORS proxy as backup...');
  }

  // 3. Try fetching through a general CORS proxy (corsproxy.io) as final backup
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch (proxyError) {
    console.warn('All image fetches (direct, image-proxy, generic-proxy) failed for:', targetUrl, proxyError);
  }

  return null;
};

const parseMarkdownToPptxRuns = (text: string, baseOptions: any = {}) => {
  if (!text) return [];
  
  // Split by bold (**text**) and italic (*text*)
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  const runs: any[] = [];
  
  parts.forEach((part) => {
    if (!part) return;
    
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push({
        text: part.slice(2, -2),
        options: { ...baseOptions, bold: true }
      });
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push({
        text: part.slice(1, -1),
        options: { ...baseOptions, italic: true }
      });
    } else {
      runs.push({
        text: part,
        options: { ...baseOptions }
      });
    }
  });
  
  return runs;
};

// Helper to parse text content into lines or bullet points for PptxGenJS
const parseTextContent = (text: string) => {
  if (!text) return [];
  
  const lines = text.split('\n');
  const result: any[] = [];
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    let runs: any[] = [];
    
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      runs = parseMarkdownToPptxRuns(trimmed.slice(2), { indentLevel: 0, margin: [0, 0, 5, 0] });
      if (runs.length > 0) {
        runs[0].options = { ...runs[0].options, bullet: true };
      }
    } else if (trimmed.startsWith('  - ') || trimmed.startsWith('  * ')) {
      runs = parseMarkdownToPptxRuns(trimmed.slice(4), { indentLevel: 1, margin: [0, 0, 5, 0] });
      if (runs.length > 0) {
        runs[0].options = { ...runs[0].options, bullet: true };
      }
    } else {
      runs = parseMarkdownToPptxRuns(line);
    }
    
    if (runs.length > 0) {
      // Add breakLine on the last run of the line to separate paragraphs
      runs[runs.length - 1].options = { ...runs[runs.length - 1].options, breakLine: true };
      result.push(...runs);
    }
  });
  
  return result;
};

const getTitleFontSize = (title: string, isTitleSlide: boolean): number => {
  const len = title?.length || 0;
  if (isTitleSlide) {
    if (len > 80) return 22;
    if (len > 40) return 28;
    return 38;
  } else {
    if (len > 80) return 18;
    if (len > 50) return 22;
    return 28;
  }
};

const getContentFontSize = (content: string, defaultSize: number = 16): number => {
  const len = content?.length || 0;
  if (len > 600) return defaultSize - 5;
  if (len > 300) return defaultSize - 3;
  return defaultSize;
};

const buildPPTXInstance = async (slides: Slide[], presentationTitle: string = 'Presentacion'): Promise<pptxgen> => {
  const pptx = new pptxgen();
  
  // Set layout to 16:9 Widescreen (10 x 5.625 inches)
  pptx.layout = 'LAYOUT_16x9';
  
  // Set global presentation metadata
  pptx.title = presentationTitle;
  pptx.subject = 'Reveal.js Export';
  pptx.author = 'Antigravity Slide Builder';

  // Use for...of loop instead of forEach to support async/await image loading
  for (const slide of slides) {
    const pptxSlide = pptx.addSlide();
    
    const bgColor = cleanColor(slide.backgroundColor);
    const textColor = cleanColor(slide.textColor);
    
    if (slide.backgroundImage) {
      const bgBase64 = await getBase64Image(slide.backgroundImage);
      if (bgBase64) {
        pptxSlide.background = { data: bgBase64 };
      } else {
        // Fallback to solid color if image fails to load (e.g. CORS block)
        pptxSlide.background = { color: bgColor };
      }
    } else {
      pptxSlide.background = { color: bgColor };
    }

    let fontName = 'Arial'; // Safe standard font that exists everywhere
    if (slide.fontFamily) {
      // Extract clean font name (e.g. "'Playfair Display', serif" -> "Playfair Display")
      fontName = slide.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
    }

    if (slide.layout === 'title') {
      // Title slide layout
      pptxSlide.addText(slide.title, {
        x: 1.0,
        y: 1.5,
        w: 8.0,
        h: 1.6,
        fontSize: getTitleFontSize(slide.title, true),
        bold: true,
        color: textColor,
        fontFace: fontName,
        align: 'center',
        valign: 'middle'
      });

      if (slide.content) {
        pptxSlide.addText(slide.content, {
          x: 1.0,
          y: 3.2,
          w: 8.0,
          h: 1.2,
          fontSize: getContentFontSize(slide.content, 18),
          color: textColor,
          fontFace: fontName,
          valign: 'top'
        });
      }
    } else if (slide.layout === 'two-columns') {
      // Title
      pptxSlide.addText(slide.title, {
        x: 0.8,
        y: 0.5,
        w: 8.4,
        h: 0.8,
        fontSize: getTitleFontSize(slide.title, false),
        bold: true,
        color: textColor,
        fontFace: fontName,
        align: 'left',
        valign: 'middle'
      });

      // Accent Line under Title
      pptxSlide.addShape(pptx.ShapeType.rect, {
        x: 0.8,
        y: 1.3,
        w: 8.4,
        h: 0.03,
        fill: { color: textColor }
      });

      // Column 1
      const col1Parsed = parseTextContent(slide.col1Text || slide.content || '');
      if (col1Parsed.length > 0) {
        pptxSlide.addText(col1Parsed, {
          x: 0.8,
          y: 1.6,
          w: 4.0,
          h: 3.4,
          fontSize: getContentFontSize(slide.col1Text || slide.content || '', 15),
          color: textColor,
          fontFace: fontName,
          valign: 'top',
          lineSpacing: 22
        });
      }

      // Column 2
      const col2Parsed = parseTextContent(slide.col2Text || '');
      if (col2Parsed.length > 0) {
        pptxSlide.addText(col2Parsed, {
          x: 5.2,
          y: 1.6,
          w: 4.0,
          h: 3.4,
          fontSize: getContentFontSize(slide.col2Text || '', 15),
          color: textColor,
          fontFace: fontName,
          valign: 'top',
          lineSpacing: 22
        });
      }
    } else if (slide.layout === 'image') {
      // Title
      if (slide.title) {
        pptxSlide.addText(slide.title, {
          x: 0.8,
          y: 0.5,
          w: 8.4,
          h: 0.8,
          fontSize: getTitleFontSize(slide.title, false),
          bold: true,
          color: textColor,
          fontFace: fontName,
          align: 'left',
          valign: 'middle'
        });
        
        // Accent Line
        pptxSlide.addShape(pptx.ShapeType.rect, {
          x: 0.8,
          y: 1.3,
          w: 8.4,
          h: 0.03,
          fill: { color: textColor }
        });
      }

      const imgPos = slide.imagePosition || 'right';
      const defaultImg = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800'; // fallback abstract gradient
      const imgPath = slide.imageUrl || defaultImg;
      const imgBase64 = await getBase64Image(imgPath);

      if (imgPos === 'background') {
        // Set slide background image instead of solid color
        if (imgBase64) {
          pptxSlide.background = { data: imgBase64 };
        } else {
          pptxSlide.background = { color: bgColor };
        }
        
        // Overlap a semi-transparent panel if text is present
        if (slide.title || slide.content) {
          pptxSlide.addShape(pptx.ShapeType.rect, {
            x: 0.8,
            y: 0.8,
            w: 8.4,
            h: 4.0,
            fill: { color: bgColor, alpha: 30 }
          });
          
          pptxSlide.addText(slide.title, {
            x: 1.2,
            y: 1.2,
            w: 7.6,
            h: 0.8,
            fontSize: getTitleFontSize(slide.title, false),
            bold: true,
            color: textColor,
            fontFace: fontName
          });

          const bodyParsed = parseTextContent(slide.content);
          pptxSlide.addText(bodyParsed, {
            x: 1.2,
            y: 2.2,
            w: 7.6,
            h: 2.2,
            fontSize: getContentFontSize(slide.content, 16),
            color: textColor,
            fontFace: fontName
          });
        }
      } else if (imgPos === 'left') {
        // Image on the Left (Pre-fetched Base64)
        if (imgBase64) {
          pptxSlide.addImage({
            data: imgBase64,
            x: 0.8,
            y: 1.5,
            w: 4.0,
            h: 3.4
          });
        } else {
          // Draw a placeholder border instead of throwing an error
          pptxSlide.addShape(pptx.ShapeType.rect, {
            x: 0.8,
            y: 1.5,
            w: 4.0,
            h: 3.4,
            line: { color: '888888', width: 1 }
          });
        }

        // Content on the Right
        const bodyParsed = parseTextContent(slide.content);
        pptxSlide.addText(bodyParsed, {
          x: 5.2,
          y: 1.5,
          w: 4.0,
          h: 3.4,
          fontSize: getContentFontSize(slide.content, 16),
          color: textColor,
          fontFace: fontName,
          valign: 'top',
          lineSpacing: 22
        });
      } else if (imgPos === 'right') {
        // Content on the Left
        const bodyParsed = parseTextContent(slide.content);
        pptxSlide.addText(bodyParsed, {
          x: 0.8,
          y: 1.5,
          w: 4.0,
          h: 3.4,
          fontSize: getContentFontSize(slide.content, 16),
          color: textColor,
          fontFace: fontName,
          valign: 'top',
          lineSpacing: 22
        });

        // Image on the Right (Pre-fetched Base64)
        if (imgBase64) {
          pptxSlide.addImage({
            data: imgBase64,
            x: 5.2,
            y: 1.5,
            w: 4.0,
            h: 3.4
          });
        } else {
          // Placeholder outline
          pptxSlide.addShape(pptx.ShapeType.rect, {
            x: 5.2,
            y: 1.5,
            w: 4.0,
            h: 3.4,
            line: { color: '888888', width: 1 }
          });
        }
      } else {
        // Center image
        if (imgBase64) {
          pptxSlide.addImage({
            data: imgBase64,
            x: 2.5,
            y: 1.5,
            w: 5.0,
            h: 3.4
          });
        } else {
          pptxSlide.addShape(pptx.ShapeType.rect, {
            x: 2.5,
            y: 1.5,
            w: 5.0,
            h: 3.4,
            line: { color: '888888', width: 1 }
          });
        }
      }
    } else if (slide.layout === 'code') {
      // Title
      pptxSlide.addText(slide.title, {
        x: 0.8,
        y: 0.5,
        w: 8.4,
        h: 0.8,
        fontSize: getTitleFontSize(slide.title, false),
        bold: true,
        color: textColor,
        fontFace: fontName,
        align: 'left',
        valign: 'middle'
      });

      // Accent Line
      pptxSlide.addShape(pptx.ShapeType.rect, {
        x: 0.8,
        y: 1.3,
        w: 8.4,
        h: 0.03,
        fill: { color: textColor }
      });

      // Code background box (Dark theme)
      pptxSlide.addShape(pptx.ShapeType.rect, {
        x: 0.8,
        y: 1.5,
        w: 8.4,
        h: 3.4,
        fill: { color: '1E1E1E' }
      });

      // Code content
      const codeText = slide.codeContent || slide.content || '';
      pptxSlide.addText(codeText, {
        x: 1.0,
        y: 1.6,
        w: 8.0,
        h: 3.2,
        fontSize: 12,
        color: 'D4D4D4',
        fontFace: 'Courier New',
        valign: 'top'
      });
    } else if (slide.layout === 'quote') {
      if (slide.title) {
        pptxSlide.addText(slide.title, {
          x: 0.8,
          y: 0.4,
          w: 8.4,
          h: 0.6,
          fontSize: getTitleFontSize(slide.title, false) - 4,
          bold: true,
          color: textColor,
          fontFace: fontName,
          align: 'center'
        });
      }

      // Quote in the middle
      const quoteText = `"${slide.content || ''}"`;
      pptxSlide.addText(quoteText, {
        x: 1.2,
        y: slide.title ? 1.4 : 1.2,
        w: 7.6,
        h: 2.4,
        fontSize: getContentFontSize(slide.content, 22),
        italic: true,
        color: textColor,
        fontFace: fontName,
        align: 'center',
        valign: 'middle'
      });

      // Author
      if (slide.quoteAuthor) {
        pptxSlide.addText(`— ${slide.quoteAuthor}`, {
          x: 1.2,
          y: 3.8,
          w: 7.6,
          h: 0.8,
          fontSize: getContentFontSize(slide.quoteAuthor || '', 16),
          bold: true,
          color: textColor,
          fontFace: fontName,
          align: 'center',
          valign: 'top'
        });
      }
    } else if (slide.layout === 'text') {
      // Default: Text layout
      pptxSlide.addText(slide.title, {
        x: 0.8,
        y: 0.5,
        w: 8.4,
        h: 0.8,
        fontSize: getTitleFontSize(slide.title, false),
        bold: true,
        color: textColor,
        fontFace: fontName,
        align: 'left',
        valign: 'middle'
      });

      // Accent Line
      pptxSlide.addShape(pptx.ShapeType.rect, {
        x: 0.8,
        y: 1.3,
        w: 8.4,
        h: 0.03,
        fill: { color: textColor }
      });

      // Body Text
      const bodyParsed = parseTextContent(slide.content);
      pptxSlide.addText(bodyParsed, {
        x: 0.8,
        y: 1.6,
        w: 8.4,
        h: 3.4,
        fontSize: getContentFontSize(slide.content, 16),
        color: textColor,
        fontFace: fontName,
        valign: 'top',
        lineSpacing: 22
      });
    } else if (slide.layout === 'table') {
      // Title
      pptxSlide.addText(slide.title, {
        x: 0.8,
        y: 0.5,
        w: 8.4,
        h: 0.8,
        fontSize: getTitleFontSize(slide.title, false),
        bold: true,
        color: textColor,
        fontFace: fontName,
        align: 'left',
        valign: 'middle'
      });

      // Accent Line
      pptxSlide.addShape(pptx.ShapeType.rect, {
        x: 0.8,
        y: 1.3,
        w: 8.4,
        h: 0.03,
        fill: { color: textColor }
      });

      // Add Table
      const headers = slide.tableHeaders || ['Medicamento', 'Mecanismo', 'Dosis Común', 'Efectos Adversos'];
      const rows = slide.tableRows || [
        ['Risperidona', 'Antagonista 5-HT2A y D2', '2 - 6 mg/día', 'Hiperprolactinemia, sedación'],
        ['Aripiprazol', 'Agonista parcial D2', '10 - 30 mg/día', 'Acatisia, insomnio, cefalea'],
        ['Quetiapina', 'Antagonista D2, 5-HT2A, H1', '150 - 800 mg/día', 'Sedación, aumento de peso, hipotensión']
      ];

      // Format table data for PptxGenJS:
      // Row 1: Headers
      const tableData: any[][] = [];
      const headerRow = headers.map(h => ({
        text: h,
        options: {
          bold: true,
          color: textColor,
          fill: { color: bgColor === 'FFFFFF' ? 'F1F5F9' : '1E293B' },
          align: 'center',
          valign: 'middle',
          fontFace: fontName
        }
      }));
      tableData.push(headerRow);

      // Other rows: cell data
      rows.forEach(row => {
        const rowData = row.map(cell => ({
          text: cell,
          options: {
            color: textColor,
            align: 'center',
            valign: 'middle',
            fontFace: fontName
          }
        }));
        tableData.push(rowData);
      });

      // Calculate column widths in inches if tableColWidths is defined
      let colWOption: number[] | undefined = undefined;
      if (slide.tableColWidths && slide.tableColWidths.length === headers.length) {
        colWOption = slide.tableColWidths.map((pct: number) => (pct / 100) * 8.4);
      }

      pptxSlide.addTable(tableData, {
        x: 0.8,
        y: 1.6,
        w: 8.4,
        h: 3.4,
        colW: colWOption,
        border: { type: 'solid', color: bgColor === 'FFFFFF' ? 'CBD5E1' : '475569', pt: 1 },
        fontSize: 12
      });
    } else if (slide.layout === 'timeline') {
      // Title
      pptxSlide.addText(slide.title, {
        x: 0.8,
        y: 0.5,
        w: 8.4,
        h: 0.8,
        fontSize: getTitleFontSize(slide.title, false),
        bold: true,
        color: textColor,
        fontFace: fontName,
        align: 'left',
        valign: 'middle'
      });

      // Accent Line
      pptxSlide.addShape(pptx.ShapeType.rect, {
        x: 0.8,
        y: 1.3,
        w: 8.4,
        h: 0.03,
        fill: { color: textColor }
      });

      // Timeline Events
      const events = slide.timelineEvents || [
        { date: 'Semana 1', title: 'Evaluación', desc: 'Instauración de ISRS y psicoeducación inicial' },
        { date: 'Semana 4', title: 'Ajuste', desc: 'Titulación de dosis por respuesta clínica parcial' },
        { date: 'Semana 8', title: 'Seguimiento', desc: 'Evaluación de remisión de síntomas cognitivos' }
      ];

      // Draw horizontal line
      pptxSlide.addShape(pptx.ShapeType.line, {
        x: 1.0,
        y: 3.2,
        w: 8.0,
        h: 0.0,
        line: { color: textColor, width: 2 }
      });

      const numEvents = events.length;
      const step = 8.0 / (numEvents + 1);

      events.forEach((ev, idx) => {
        const xPos = 1.0 + step * (idx + 1);

        // Date (above the node)
        pptxSlide.addText(ev.date, {
          x: xPos - 0.9,
          y: 2.2,
          w: 1.8,
          h: 0.6,
          fontSize: 12,
          bold: true,
          color: textColor,
          fontFace: fontName,
          align: 'center',
          valign: 'bottom'
        });

        // Circle marker on the line
        pptxSlide.addShape(pptx.ShapeType.ellipse, {
          x: xPos - 0.1,
          y: 3.1,
          w: 0.2,
          h: 0.2,
          fill: { color: bgColor },
          line: { color: textColor, width: 2 }
        });

        // Event Title (below the node)
        pptxSlide.addText(ev.title, {
          x: xPos - 0.9,
          y: 3.4,
          w: 1.8,
          h: 0.6,
          fontSize: 12,
          bold: true,
          color: textColor,
          fontFace: fontName,
          align: 'center',
          valign: 'top'
        });

        // Event Description (below title)
        pptxSlide.addText(ev.desc, {
          x: xPos - 0.9,
          y: 4.0,
          w: 1.8,
          h: 1.0,
          fontSize: 10,
          color: textColor,
          fontFace: fontName,
          align: 'center',
          valign: 'top'
        });
      });
    } else {
      // Fallback for unknown layouts
    }
  }

  return pptx;
};

export const exportToPPTX = async (slides: Slide[], presentationTitle: string = 'Presentacion') => {
  const pptx = await buildPPTXInstance(slides, presentationTitle);
  const fileName = `${presentationTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pptx`;
  return pptx.writeFile({ fileName });
};

export const generatePPTXBlob = async (slides: Slide[], presentationTitle: string = 'Presentacion'): Promise<Blob> => {
  const pptx = await buildPPTXInstance(slides, presentationTitle);
  return pptx.write({ outputType: 'blob' }) as Promise<Blob>;
};
