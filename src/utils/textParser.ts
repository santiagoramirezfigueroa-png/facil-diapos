import type { Slide } from '../types';

export const parseTextToSlides = (
  text: string,
  defaultBgColor: string = '#ffffff',
  defaultTextColor: string = '#000000',
  defaultBgImage?: string
): Slide[] => {
  const lines = text.split('\n');
  const slides: Slide[] = [];
  let currentSlide: Partial<Slide> | null = null;
  let collectContentLines: string[] = [];
  let readingKeyPoints = false;
  let nextLineIsTitle = false;

  const saveCurrentSlide = () => {
    if (currentSlide) {
      if (collectContentLines.length > 0) {
        currentSlide.content = collectContentLines.join('\n');
      }
      
      currentSlide.title = currentSlide.title?.trim() || 'Diapositiva sin título';
      currentSlide.content = currentSlide.content?.trim() || '';
      
      // Post-process layouts
      if (currentSlide.layout === 'two-columns' && currentSlide.content) {
        // If two-columns layout, split content into col1 and col2 if there's a marker
        const content = currentSlide.content;
        const col2MarkerIdx = content.search(/(?:columna\s*2|columna\s*derecha|col\s*2|col\s*derecha)/i);
        if (col2MarkerIdx !== -1) {
          const part1 = content.slice(0, col2MarkerIdx).trim();
          const part2 = content.slice(col2MarkerIdx).trim();
          // Clean up markers
          currentSlide.col1Text = part1.replace(/(?:columna\s*1|columna\s*izquierda|col\s*1|col\s*izquierda)[\s\:\-]*/i, '').trim();
          currentSlide.col2Text = part2.replace(/(?:columna\s*2|columna\s*derecha|col\s*2|col\s*derecha)[\s\:\-]*/i, '').trim();
        } else {
          // Default split in half of bullets
          const bullets = content.split('\n');
          const half = Math.ceil(bullets.length / 2);
          currentSlide.col1Text = bullets.slice(0, half).join('\n');
          currentSlide.col2Text = bullets.slice(half).join('\n');
        }
      }

      if (currentSlide.layout === 'quote') {
        // If quote layout, set quoteAuthor if we can find a dash
        const content = currentSlide.content;
        const dashIdx = content.lastIndexOf('—');
        if (dashIdx !== -1) {
          currentSlide.content = content.slice(0, dashIdx).trim().replace(/^["']|["']$/g, '');
          currentSlide.quoteAuthor = content.slice(dashIdx + 1).trim();
        }
      }
      
      slides.push(currentSlide as Slide);
    }
    collectContentLines = [];
    readingKeyPoints = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Stop parsing if we reach general advice or recommendations at the end
    if (
      line.toLowerCase().startsWith('recomendaciones de diseño') || 
      line.toLowerCase().startsWith('diseño sugerido') || 
      line.toLowerCase().startsWith('sugerencias de diseño') ||
      line.toLowerCase().startsWith('para que las')
    ) {
      saveCurrentSlide();
      currentSlide = null;
      break;
    }

    // Detect slide marker: "Diapositiva X" or "Slide X"
    const slideMatch = line.match(/^(?:Diapositiva|Slide)\s+(\d+)(?:\.|:|-)?\s*(.*)/i);
    if (slideMatch) {
      saveCurrentSlide();
      
      const slideNum = parseInt(slideMatch[1], 10);
      const suffix = slideMatch[2]?.trim();
      
      currentSlide = {
        id: crypto.randomUUID(),
        title: suffix || `Diapositiva ${slideNum}`,
        content: '',
        layout: slideNum === 1 ? 'title' : 'text',
        backgroundColor: defaultBgColor,
        textColor: defaultTextColor,
        backgroundImage: defaultBgImage,
        transition: 'fade'
      };
      
      nextLineIsTitle = false;
      continue;
    }

    if (!currentSlide) continue;

    // Detect title suggestion: "Título sugerido:"
    if (line.toLowerCase().startsWith('título sugerido:') || line.toLowerCase().startsWith('titulo sugerido:')) {
      const directTitle = line.substring(16).trim();
      if (directTitle) {
        currentSlide.title = directTitle;
      } else {
        nextLineIsTitle = true;
      }
      continue;
    }

    if (nextLineIsTitle) {
      if (line) {
        currentSlide.title = line;
        nextLineIsTitle = false;
      }
      continue;
    }

    // Detect suggested layouts: "Layout sugerido: xxx" or "Diseño sugerido: xxx"
    const layoutMatch = line.match(/(?:diseño|layout|diseno|plantilla)\s+sugerido[\s\:\-]*(.*)/i);
    if (layoutMatch) {
      const layoutType = layoutMatch[1].toLowerCase();
      if (layoutType.includes('portada') || layoutType.includes('titulo') || layoutType.includes('título')) {
        currentSlide.layout = 'title';
      } else if (layoutType.includes('columna') || layoutType.includes('2 columnas') || layoutType.includes('dos columnas')) {
        currentSlide.layout = 'two-columns';
      } else if (layoutType.includes('código') || layoutType.includes('codigo')) {
        currentSlide.layout = 'code';
      } else if (layoutType.includes('cita') || layoutType.includes('frase')) {
        currentSlide.layout = 'quote';
      } else if (layoutType.includes('imagen')) {
        currentSlide.layout = 'image';
      }
      continue;
    }

    // Detect bullet points start: "Puntos clave:"
    if (line.toLowerCase().startsWith('puntos clave:') || line.toLowerCase().startsWith('puntos clave')) {
      readingKeyPoints = true;
      continue;
    }

    if (line) {
      let formattedLine = line;
      if (readingKeyPoints && !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('•')) {
        formattedLine = `- ${line}`;
      }
      collectContentLines.push(formattedLine);
    }
  }

  saveCurrentSlide();

  // If no slides were parsed, return empty array
  return slides;
};
