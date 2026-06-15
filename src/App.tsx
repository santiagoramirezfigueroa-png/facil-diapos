import { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { EditorCanvas } from './components/EditorCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { PresentationView } from './components/PresentationView';
import { exportToPPTX, generatePPTXBlob } from './utils/pptxExport';
import { parseTextToSlides } from './utils/textParser';
import { loadGoogleFont } from './utils/fontLoader';
import type { Slide } from './types';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Download, 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle,
  X,
  Image,
  FilePlus,
  Search,
  CloudUpload
} from 'lucide-react';

const INITIAL_SLIDES: Slide[] = [
  {
    id: 'slide-1',
    title: 'Creador de Diapositivas Inteligente',
    content: 'Diseña presentaciones interactivas en Reveal.js y expórtalas a PowerPoint editable en un clic',
    layout: 'title',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    transition: 'fade'
  },
  {
    id: 'slide-2',
    title: '¿Cómo funciona?',
    content: '- Diseña tus diapositivas visualmente en el panel central.\n- Cambia el layout en el panel derecho según tus necesidades (portada, texto, dos columnas, imágenes o código).\n- Usa colores sólidos o temas oscuros cyberpunk y minimalistas.\n- Haz clic en "Presentar" para lanzar la vista Reveal.js en pantalla completa.\n- Haz clic en "Descargar Diapositivas" para obtener un archivo PowerPoint editable.',
    layout: 'text',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    transition: 'slide'
  },
  {
    id: 'slide-3',
    title: 'Estructuras Flexibles (Dos Columnas)',
    content: '',
    layout: 'two-columns',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    col1Text: '- **Columna Izquierda**\n- Estructura limpia y organizada\n- Alineación automática\n- Ideal para comparar ventajas y desventajas',
    col2Text: '- **Columna Derecha**\n- Perfecta para añadir listas de soporte\n- Mantiene la consistencia del tema\n- Exporta como cajas de texto separadas a PowerPoint',
    transition: 'convex'
  },
  {
    id: 'slide-4',
    title: 'Visualización de Código de Programación',
    content: 'Soporta snippets de código con sintaxis resaltada y formato monoespaciado.',
    layout: 'code',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    codeLanguage: 'typescript',
    codeContent: 'interface Presentation {\n  title: string;\n  slides: Slide[];\n  exportFormat: \'pptx\' | \'pdf\' | \'html\';\n}\n\nconst startPresentation = (config: Presentation) => {\n  console.log(`Iniciando "${config.title}" con ${config.slides.length} diapositivas...`);\n  // Reveal.js initialize\n};',
    transition: 'zoom'
  },
  {
    id: 'slide-5',
    title: 'Citas Textuales e Inspiradoras',
    content: 'La mejor forma de predecir el futuro es creándolo.',
    layout: 'quote',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    quoteAuthor: 'Abraham Lincoln',
    transition: 'concave'
  }
];

export default function App() {
  const isPrintPdf = new URLSearchParams(window.location.search).has('print-pdf');

  const [slides, setSlides] = useState<Slide[]>(() => {
    try {
      const saved = localStorage.getItem('reveal_pptx_slides');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing slides from localStorage:', e);
    }
    return INITIAL_SLIDES;
  });
  const [activeSlideId, setActiveSlideId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('reveal_pptx_active_id');
      const savedSlides = localStorage.getItem('reveal_pptx_slides');
      if (saved && savedSlides) {
        const parsed = JSON.parse(savedSlides) as Slide[];
        if (parsed.some(s => s.id === saved)) {
          return saved;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return 'slide-1';
  });
  const [presentationTitle, setPresentationTitle] = useState<string>(() => {
    const saved = localStorage.getItem('reveal_pptx_title');
    return saved ? saved : 'Mi Presentación Reveal';
  });
  const [isPresenterMode, setIsPresenterMode] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isTextImportOpen, setIsTextImportOpen] = useState<boolean>(false);
  const [importRawText, setImportRawText] = useState<string>('');

  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [modalImageSrc, setModalImageSrc] = useState<string | null>(null);
  const [imageInputTab, setImageInputTab] = useState<'upload' | 'clipboard' | 'url' | 'unsplash'>('upload');
  const [modalImageUrlInput, setModalImageUrlInput] = useState<string>('');

  // Google Slides / Drive states
  const [isGoogleSlidesModalOpen, setIsGoogleSlidesModalOpen] = useState<boolean>(false);
  const [googleSlidesTab, setGoogleSlidesTab] = useState<'manual' | 'auto'>('manual');
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    return localStorage.getItem('reveal_pptx_google_client_id') || '';
  });
  const [isUploadingToDrive, setIsUploadingToDrive] = useState<boolean>(false);
  const [uploadedSlidesUrl, setUploadedSlidesUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Unsplash search integration state
  const [unsplashQuery, setUnsplashQuery] = useState<string>('');
  const [unsplashPhotos, setUnsplashPhotos] = useState<any[]>([]);
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState<boolean>(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState<boolean>(false);

  const searchUnsplash = async () => {
    if (!unsplashQuery.trim()) return;
    setIsSearchingUnsplash(true);
    try {
      const targetUrl = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(unsplashQuery)}&per_page=16`;
      const isElectron = navigator.userAgent.toLowerCase().includes('electron');
      
      let response;
      if (isElectron) {
        // Direct fetch in Electron (no proxy needed because webSecurity: false is configured)
        response = await fetch(targetUrl);
      } else {
        // In the browser, try corsproxy.io first
        try {
          response = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
          if (!response.ok) throw new Error('corsproxy.io failed');
        } catch (err) {
          // Fallback to allorigins.win if corsproxy fails
          const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
          const allOriginsResp = await fetch(allOriginsUrl);
          if (allOriginsResp.ok) {
            const allOriginsData = await allOriginsResp.json();
            const parsedContents = JSON.parse(allOriginsData.contents);
            const results = parsedContents.results || [];
            setUnsplashPhotos(results.map((p: any) => ({
              id: p.id,
              thumb: p.urls.thumb,
              full: p.urls.regular,
              alt: p.alt_description || 'Foto de Unsplash'
            })));
            return;
          }
          throw err;
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        const results = data.results || [];
        setUnsplashPhotos(results.map((p: any) => ({
          id: p.id,
          thumb: p.urls.thumb,
          full: p.urls.regular,
          alt: p.alt_description || 'Foto de Unsplash'
        })));
      }
    } catch (e) {
      console.error('Error querying Unsplash API', e);
    } finally {
      setIsSearchingUnsplash(false);
    }
  };

  const selectUnsplashPhoto = async (photoUrl: string) => {
    setIsDownloadingImage(true);
    try {
      const isElectron = navigator.userAgent.toLowerCase().includes('electron');
      const targetUrl = isElectron ? photoUrl : `https://images.weserv.nl/?url=${encodeURIComponent(photoUrl)}`;
      const response = await fetch(targetUrl);
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setModalImageSrc(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } else {
        setModalImageSrc(photoUrl);
      }
    } catch (e) {
      console.error('Error downloading Unsplash image', e);
      setModalImageSrc(photoUrl);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setModalImageSrc(event.target?.result as string);
              setImageInputTab('clipboard');
              setIsImageModalOpen(true);
            };
            reader.readAsDataURL(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('reveal_pptx_slides', JSON.stringify(slides));
    } catch (e) {
      console.error('Error writing slides to localStorage:', e);
    }
  }, [slides]);

  useEffect(() => {
    localStorage.setItem('reveal_pptx_title', presentationTitle);
  }, [presentationTitle]);

  useEffect(() => {
    localStorage.setItem('reveal_pptx_active_id', activeSlideId);
  }, [activeSlideId]);

  // Dynamically load Google Fonts for any slides that use them
  useEffect(() => {
    slides.forEach(slide => {
      if (slide.fontFamily) {
        loadGoogleFont(slide.fontFamily);
      }
    });
  }, [slides]);

  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];

  const handleNewPresentation = () => {
    if (window.confirm('¿Estás seguro de que deseas iniciar una nueva presentación? Esto eliminará todo el progreso actual.')) {
      const resetSlides: Slide[] = [
        {
          id: 'slide-1',
          title: 'Nueva Presentación',
          content: 'Subtítulo o descripción de la presentación...',
          layout: 'title',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          transition: 'fade'
        }
      ];
      setSlides(resetSlides);
      setPresentationTitle('Nueva Presentación');
      setActiveSlideId('slide-1');
      triggerNotification('Nueva presentación iniciada');
    }
  };

  const handleImportText = () => {
    if (!importRawText.trim()) return;
    const parsed = parseTextToSlides(
      importRawText,
      activeSlide.backgroundColor,
      activeSlide.textColor,
      activeSlide.backgroundImage
    );
    if (parsed.length > 0) {
      setSlides(parsed);
      setActiveSlideId(parsed[0].id);
      setIsTextImportOpen(false);
      setImportRawText('');
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      
      triggerNotification(`¡Se generaron ${parsed.length} diapositivas!`);
    } else {
      alert('No se pudieron identificar las diapositivas. Asegúrate de incluir el texto "Diapositiva 1", "Diapositiva 2", etc. al inicio de cada sección.');
    }
  };

  const triggerNotification = (message: string) => {
    setShowNotification(message);
    setTimeout(() => setShowNotification(null), 3000);
  };

  const handleUpdateSlide = (updatedFields: Partial<Slide>) => {
    setSlides(prev => prev.map(s => s.id === activeSlideId ? { ...s, ...updatedFields } : s));
  };

  const handleApplyBgToAll = (imageUrl: string | undefined) => {
    setSlides(prev => prev.map(s => ({ ...s, backgroundImage: imageUrl })));
    triggerNotification('Fondo aplicado a toda la presentación');
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      title: 'Nueva Diapositiva',
      content: '- Escribe tu contenido aquí\n- Añade viñetas adicionales',
      layout: 'text',
      backgroundColor: activeSlide.backgroundColor,
      textColor: activeSlide.textColor,
      transition: 'fade'
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveSlideId(newSlide.id);
    triggerNotification('Diapositiva añadida');
  };

  const handleDeleteSlide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return;
    
    const index = slides.findIndex(s => s.id === id);
    const updatedSlides = slides.filter(s => s.id !== id);
    setSlides(updatedSlides);
    
    if (activeSlideId === id) {
      // Set active to previous or next slide
      const nextActiveIndex = index === 0 ? 0 : index - 1;
      setActiveSlideId(updatedSlides[nextActiveIndex].id);
    }
    triggerNotification('Diapositiva eliminada');
  };

  const handleDuplicateSlide = (slide: Slide, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSlide: Slide = {
      ...slide,
      id: crypto.randomUUID(),
      title: `${slide.title} (Copia)`
    };
    const index = slides.findIndex(s => s.id === slide.id);
    const updated = [...slides];
    updated.splice(index + 1, 0, newSlide);
    
    setSlides(updated);
    setActiveSlideId(newSlide.id);
    triggerNotification('Diapositiva duplicada');
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    
    const updated = [...slides];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    
    setSlides(updated);
  };

  const handleSaveGoogleClientId = (id: string) => {
    setGoogleClientId(id);
    localStorage.setItem('reveal_pptx_google_client_id', id);
  };

  const handleExportGoogleSlides = async () => {
    if (!googleClientId.trim()) {
      setUploadError('Por favor, ingresa tu Google Client ID para continuar.');
      return;
    }
    
    setUploadError(null);
    setUploadedSlidesUrl(null);
    setIsUploadingToDrive(true);
    
    try {
      if (!(window as any).google?.accounts?.oauth2) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Google GIS script'));
          document.head.appendChild(script);
        });
      }

      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: googleClientId.trim(),
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setIsUploadingToDrive(false);
            setUploadError(`Error de autorización: ${tokenResponse.error_description || tokenResponse.error}`);
            return;
          }
          
          if (tokenResponse.access_token) {
            try {
              const pptxBlob = await generatePPTXBlob(slides, presentationTitle);

              const boundary = 'foo_bar_boundary';
              const delimiter = `\r\n--${boundary}\r\n`;
              const closeDelimiter = `\r\n--${boundary}--`;
              
              const metadata = {
                name: presentationTitle,
                mimeType: 'application/vnd.google-apps.presentation'
              };
              
              const reader = new FileReader();
              reader.onload = async () => {
                try {
                  const arrayBuffer = reader.result as ArrayBuffer;
                  
                  const header = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n${delimiter}Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation\r\n\r\n`;
                  const footer = `${closeDelimiter}`;
                  
                  const multipartBody = new Blob([
                    header,
                    new Uint8Array(arrayBuffer),
                    footer
                  ], { type: `multipart/related; boundary=${boundary}` });
                  
                  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${tokenResponse.access_token}`,
                      'Content-Type': `multipart/related; boundary=${boundary}`
                    },
                    body: multipartBody
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    if (data.id) {
                      setUploadedSlidesUrl(`https://docs.google.com/presentation/d/${data.id}/edit`);
                      confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                      });
                      triggerNotification('¡Subido con éxito a Google Slides!');
                    } else {
                      setUploadError('El servidor de Google no devolvió un ID de archivo válido.');
                    }
                  } else {
                    const errText = await response.text();
                    setUploadError(`Error de subida a Google Drive: ${response.statusText} (${errText})`);
                  }
                } catch (e: any) {
                  setUploadError(`Error en lectura de datos: ${e.message || e}`);
                } finally {
                  setIsUploadingToDrive(false);
                }
              };
              reader.readAsArrayBuffer(pptxBlob);
            } catch (e: any) {
              setUploadError(`Error al compilar la presentación: ${e.message || e}`);
              setIsUploadingToDrive(false);
            }
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      setUploadError(`Error al inicializar la autenticación de Google: ${err.message || err}`);
      setIsUploadingToDrive(false);
    }
  };

  const handleExportPPTX = async () => {
    try {
      triggerNotification('Generando PowerPoint...');
      await exportToPPTX(slides, presentationTitle);
      
      // Fire celebration confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      triggerNotification('¡PowerPoint exportado con éxito!');
    } catch (error) {
      console.error(error);
      triggerNotification('Error al exportar a PowerPoint');
    }
  };

  const handleSaveJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      title: presentationTitle,
      slides
    }, null, 2));
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${presentationTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_reveal.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerNotification('Proyecto guardado localmente');
  };

  const handleLoadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.slides && Array.isArray(parsed.slides)) {
          setSlides(parsed.slides);
          setPresentationTitle(parsed.title || 'Presentación Importada');
          setActiveSlideId(parsed.slides[0].id);
          triggerNotification('Proyecto cargado con éxito');
        } else {
          alert('El archivo JSON no tiene un formato de presentación válido');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON');
      }
    };
    reader.readAsText(file);
  };

  // Pre-built outlines generators (AI outline emulation)
  const generateOutline = (topic: 'business' | 'tech' | 'educational') => {
    let newSlidesList: Slide[] = [];
    
    if (topic === 'business') {
      newSlidesList = [
        {
          id: 'b1',
          title: 'Lanzamiento de Negocios: AlphaCorp',
          content: 'Disrupción en la nube y optimización de recursos corporativos',
          layout: 'title',
          backgroundColor: '#0f172a',
          textColor: '#f8fafc',
          transition: 'fade'
        },
        {
          id: 'b2',
          title: 'El Desafío del Mercado',
          content: '- Fragmentación de datos en sistemas heredados.\n- Pérdidas operativas de hasta un 25% anual.\n- Falta de reportabilidad móvil para tomadores de decisiones.',
          layout: 'text',
          backgroundColor: '#1e293b',
          textColor: '#f8fafc',
          transition: 'slide'
        },
        {
          id: 'b3',
          title: 'Nuestra Ventaja Competitiva',
          content: '',
          layout: 'two-columns',
          backgroundColor: '#0f172a',
          textColor: '#f8fafc',
          col1Text: '### Arquitectura Serverless\nEscalado automático según la demanda. Paga solo por el consumo real de tu equipo.',
          col2Text: '### Machine Learning Integrado\nPredicciones automatizadas de flujo de caja y alertas preventivas de inventario.',
          transition: 'zoom'
        },
        {
          id: 'b4',
          title: 'Proyección y Resultados',
          content: 'Nuestra fase beta con 15 empresas demostró un ahorro promedio del 30% en costos de infraestructura en los primeros 45 días.',
          layout: 'image',
          imagePosition: 'right',
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
          backgroundColor: '#0f172a',
          textColor: '#f8fafc',
          transition: 'convex'
        },
        {
          id: 'b5',
          title: 'Visión a Futuro',
          content: 'El valor de una idea radica en el uso de la misma.',
          layout: 'quote',
          quoteAuthor: 'Thomas Edison',
          backgroundColor: '#881337',
          textColor: '#ffe4e6',
          transition: 'fade'
        }
      ];
      setPresentationTitle('Pitch Deck AlphaCorp');
    } else if (topic === 'tech') {
      newSlidesList = [
        {
          id: 't1',
          title: 'Desarrollo Moderno con React y Vite',
          content: 'Optimizando la velocidad de compilación y la experiencia de desarrollo frontend',
          layout: 'title',
          backgroundColor: '#172554',
          textColor: '#eff6ff',
          transition: 'zoom'
        },
        {
          id: 't2',
          title: '¿Por qué elegir Vite sobre CRA?',
          content: '- Servidor de desarrollo instantáneo basado en módulos ES nativos.\n- HMR extremadamente rápido sin importar el tamaño de la app.\n- Empaquetado de producción optimizado mediante Rollup preconfigurado.',
          layout: 'text',
          backgroundColor: '#1e293b',
          textColor: '#f8fafc',
          transition: 'slide'
        },
        {
          id: 't3',
          title: 'Configuración Simple de Rutas',
          content: 'Ejemplo de router declarativo en React:',
          layout: 'code',
          codeLanguage: 'typescript',
          codeContent: 'import { createBrowserRouter, RouterProvider } from "react-router-dom";\n\nconst router = createBrowserRouter([\n  {\n    path: "/",\n    element: <HomeView />,\n    errorElement: <ErrorPage />\n  },\n  {\n    path: "/editor",\n    element: <EditorView />\n  }\n]);\n\nexport default function App() { \n  return <RouterProvider router={router} />;\n}',
          backgroundColor: '#0f172a',
          textColor: '#f8fafc',
          transition: 'fade'
        },
        {
          id: 't4',
          title: 'Comunidad y Ecosistema',
          content: 'Millones de descargas semanales respaldan el ecosistema. Es la herramienta estándar elegida por frameworks como Astro, SvelteKit y Nuxt.',
          layout: 'image',
          imagePosition: 'left',
          imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=800',
          backgroundColor: '#1e1b4b',
          textColor: '#faf5ff',
          transition: 'convex'
        }
      ];
      setPresentationTitle('Curso React + Vite');
    } else {
      newSlidesList = [
        {
          id: 'e1',
          title: 'Exploración del Sistema Solar',
          content: 'Un recorrido didáctico sobre los planetas de nuestro vecindario cósmico',
          layout: 'title',
          backgroundColor: '#0b0f19',
          textColor: '#f1f5f9',
          transition: 'zoom'
        },
        {
          id: 'e2',
          title: 'Planetas Interiores (Rocosos)',
          content: '- **Mercurio**: El más cercano al sol y extremadamente caliente.\n- **Venus**: Atmósfera densa y tóxica que retiene calor extremo.\n- **Tierra**: Nuestro hogar, el único con agua líquida confirmada.\n- **Marte**: El planeta rojo, foco de la exploración espacial actual.',
          layout: 'text',
          backgroundColor: '#1e293b',
          textColor: '#f8fafc',
          transition: 'slide'
        },
        {
          id: 'e3',
          title: 'Gigantes Gaseosos vs Helados',
          content: '',
          layout: 'two-columns',
          backgroundColor: '#0b0f19',
          textColor: '#f1f5f9',
          col1Text: '### Gigantes Gaseosos\n**Júpiter y Saturno**\nCompuestos principalmente de hidrógeno y helio. Saturno destaca por su espectacular sistema de anillos helados.',
          col2Text: '### Gigantes Helados\n**Urano y Neptuno**\nContienen más "hielos" como agua, amoníaco y metano. Neptuno posee los vientos más veloces del sistema solar.',
          transition: 'convex'
        },
        {
          id: 'e4',
          title: 'El Misterio del Universo',
          content: 'El cosmos está lleno de misterios por descubrir. Lo que sabemos es solo una gota, lo que ignoramos es el océano.',
          layout: 'quote',
          quoteAuthor: 'Isaac Newton',
          backgroundColor: '#3b0764',
          textColor: '#faf5ff',
          transition: 'fade'
        }
      ];
      setPresentationTitle('Clase de Astronomía');
    }

    setSlides(newSlidesList);
    setActiveSlideId(newSlidesList[0].id);
    triggerNotification('Plantilla cargada');
  };

  if (isPrintPdf) {
    return (
      <PresentationView
        slides={slides}
        onClose={() => window.close()}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-20 px-6 border-b border-slate-900 flex items-center justify-between shrink-0 bg-slate-950/80 backdrop-blur-md z-40">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white border border-slate-700/80 shrink-0 shadow-sm">
            <img 
              src="/logo.png" 
              alt="Fácil Diapos" 
              className="w-full h-full scale-[2.3] -translate-y-[12%] object-contain" 
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide text-slate-100">Fácil Diapos</span>
            <span className="text-[10px] text-slate-500">Editor e Importador</span>
          </div>
        </div>

        {/* Presentation Title (Editable) */}
        <div className="flex flex-col max-w-sm md:max-w-xl w-full px-4 justify-center">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
            <input
              type="text"
              value={presentationTitle}
              onChange={(e) => setPresentationTitle(e.target.value)}
              className="bg-transparent font-medium text-slate-200 border-b border-transparent hover:border-slate-800 focus:border-indigo-500 focus:outline-none w-full py-0.5 px-1 text-sm transition-colors"
              placeholder="Título de la presentación"
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-x-1.5 items-center font-medium">
            <span>Elaborado por Santiago Ramirez, Residente Psiquiatría UIS</span>
            <span className="text-slate-700">|</span>
            <span>Sígueme:</span>
            <a 
              href="https://www.instagram.com/mentesana09/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
            >
              Ig: @mentesana09
            </a>
            <span className="text-slate-700">|</span>
            <a 
              href="https://www.instagram.com/residentespsiquiatriauis/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
            >
              Ig: @residentespsiquiatriauis
            </a>
            <span className="text-slate-700">|</span>
            <a 
              href="https://github.com/mentesana09/RevealPPTX" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
            >
              Código Fuente (GitHub)
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Nueva Presentación */}
          <button
            onClick={handleNewPresentation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-900/30 bg-red-950/10 hover:bg-red-900/20 text-xs font-semibold text-red-405 hover:text-red-300 transition-colors"
            title="Iniciar nueva presentación desde cero"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Nueva Presentación</span>
          </button>

          {/* Import Text Outline (Perplexity/IA) */}
          <button
            onClick={() => setIsTextImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-medium text-indigo-300 transition-colors"
            title="Importar esquema de texto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generar desde Texto</span>
          </button>

          {/* Insert Image Button */}
          <button
            onClick={() => setIsImageModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
            title="Insertar imagen desde PC, portapapeles o URL"
          >
            <Image className="w-3.5 h-3.5 text-indigo-400" />
            <span>Insertar Imagen</span>
          </button>

          {/* Quick outline generation */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors">
              <span>Plantillas Rápidas</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-50">
              <button onClick={() => generateOutline('business')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                💼 Negocios / Pitch Deck
              </button>
              <button onClick={() => generateOutline('tech')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                💻 Curso de Tecnología
              </button>
              <button onClick={() => generateOutline('educational')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                🌌 Ciencias / Astronomía
              </button>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Import JSON */}
          <input
            type="file"
            accept=".json"
            onChange={handleLoadJSON}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Cargar proyecto (.json)"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Save JSON */}
          <button
            onClick={handleSaveJSON}
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Guardar proyecto (.json)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Present (Reveal.js) */}
          <button
            onClick={() => setIsPresenterMode(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold shadow transition-all active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Presentar</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={() => {
              const printUrl = `${window.location.origin}${window.location.pathname}?print-pdf=true`;
              window.open(printUrl, '_blank');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold shadow transition-all active:scale-[0.98]"
            title="Exportar a PDF (impresión Reveal.js)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>

          {/* Export to Google Slides */}
          <button
            onClick={() => {
              setUploadError(null);
              setUploadedSlidesUrl(null);
              setIsGoogleSlidesModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold shadow transition-all active:scale-[0.98]"
            title="Exportar a Google Slides o Google Drive"
          >
            <CloudUpload className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Google Slides</span>
          </button>

          {/* Export PowerPoint */}
          <button
            onClick={handleExportPPTX}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-900/35 transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Diapositivas</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          slides={slides}
          activeSlideId={activeSlideId}
          onSelectSlide={setActiveSlideId}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onMoveSlide={handleMoveSlide}
        />

        {/* Center Canvas */}
        <EditorCanvas
          slide={activeSlide}
          onChangeSlide={handleUpdateSlide}
        />

        {/* Right Properties Panel */}
        <PropertiesPanel
          slide={activeSlide}
          onChangeSlide={handleUpdateSlide}
          onApplyBgToAll={handleApplyBgToAll}
        />
      </div>

      {/* Presenter Mode Screen Overlay */}
      {isPresenterMode && (
        <PresentationView
          slides={slides}
          onClose={() => setIsPresenterMode(false)}
        />
      )}

      {/* Text Import Modal Overlay */}
      {isTextImportOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between bg-slate-950/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span className="font-semibold text-slate-200">Generar Diapositivas desde Texto</span>
              </div>
              <button 
                onClick={() => setIsTextImportOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Pega el esquema de tu presentación (p. ej., el texto estructurado obtenido de Perplexity o ChatGPT). Separaremos automáticamente las diapositivas por marcadores como "Diapositiva X", e identificaremos títulos y viñetas de puntos clave.
              </p>
              
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Esquema de Texto</span>
                <textarea
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  placeholder={`Ejemplo de formato:

Diapositiva 1. Título y contexto
Título sugerido:
INTEGRATE: guía internacional para el tratamiento algorítmico de la esquizofrenia

Puntos clave:
- Publicada en The Lancet Psychiatry en 2025.
- Busca resolver una limitación frecuente...`}
                  className="w-full h-80 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-4 font-mono text-[11px] text-slate-300 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-850 flex items-center justify-end gap-2 bg-slate-950/20">
              <button
                onClick={() => setIsTextImportOpen(false)}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-850 text-slate-450 hover:text-slate-200 text-xs font-semibold rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportText}
                disabled={!importRawText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generar Diapositivas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Import Modal Overlay */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between bg-slate-950/20">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-indigo-400" />
                <span className="font-semibold text-slate-200">Insertar Imagen</span>
              </div>
              <button 
                onClick={() => {
                  setIsImageModalOpen(false);
                  setModalImageSrc(null);
                  setModalImageUrlInput('');
                }}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Tabs */}
              <div className="flex border-b border-slate-800">
                {(['upload', 'clipboard', 'url', 'unsplash'] as const).map((tab) => {
                  const label = 
                    tab === 'upload' ? 'Subir Archivo' :
                    tab === 'clipboard' ? 'Pegar (Clipboard)' :
                    tab === 'url' ? 'Dirección URL' : 'Buscar Unsplash';
                  return (
                    <button
                      key={tab}
                      onClick={() => setImageInputTab(tab)}
                      className={`flex-1 pb-2 text-xs font-semibold border-b-2 transition-all ${
                        imageInputTab === tab
                          ? 'border-indigo-500 text-indigo-400'
                          : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="pt-2">
                {imageInputTab === 'upload' && (
                  <div className="border-2 border-dashed border-slate-805 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-950/20 hover:border-indigo-500/50 transition-colors cursor-pointer relative min-h-[140px]">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setModalImageSrc(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-slate-500 mb-2 stroke-[1.5]" />
                    <span className="text-xs text-slate-355 font-medium">Arrastra o haz clic para buscar</span>
                    <span className="text-[10px] text-slate-500 mt-1">Soporta PNG, JPG, GIF o WEBP</span>
                  </div>
                )}

                {imageInputTab === 'clipboard' && (
                  <div 
                    tabIndex={0}
                    onPaste={(e) => {
                      const items = e.clipboardData?.items;
                      if (!items) return;
                      for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                          const file = items[i].getAsFile();
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setModalImageSrc(ev.target?.result as string);
                            reader.readAsDataURL(file);
                            e.preventDefault();
                            break;
                          }
                        }
                      }
                    }}
                    className="border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-950/30 focus:outline-none focus:border-indigo-500 hover:border-slate-750 transition-colors cursor-pointer min-h-[140px]"
                  >
                    <div className="p-3 bg-slate-950/40 rounded-full border border-slate-800/60 mb-2">
                      <Image className="w-6 h-6 text-indigo-400 stroke-[1.5]" />
                    </div>
                    <span className="text-xs text-slate-300 font-semibold">Haz clic aquí y presiona Ctrl+V</span>
                    <span className="text-[10px] text-slate-500 mt-1">Copia cualquier imagen y pégala aquí directamente</span>
                  </div>
                )}

                {imageInputTab === 'url' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">URL de Imagen</label>
                    <input
                      type="text"
                      value={modalImageUrlInput}
                      onChange={(e) => {
                        setModalImageUrlInput(e.target.value);
                        setModalImageSrc(e.target.value);
                      }}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none font-mono"
                    />
                  </div>
                )}

                {imageInputTab === 'unsplash' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={unsplashQuery}
                        onChange={(e) => setUnsplashQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            searchUnsplash();
                          }
                        }}
                        placeholder="Buscar en Unsplash (ej. medicina, cerebro, terapia)..."
                        className="flex-1 bg-slate-955 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                      />
                      <button
                        onClick={searchUnsplash}
                        disabled={isSearchingUnsplash}
                        className="px-3 py-2 bg-indigo-605 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Buscar</span>
                      </button>
                    </div>

                    {isSearchingUnsplash ? (
                      <div className="flex items-center justify-center py-6 text-xs text-slate-500">
                        Buscando fotos en alta resolución...
                      </div>
                    ) : isDownloadingImage ? (
                      <div className="flex items-center justify-center py-6 text-xs text-indigo-400 font-semibold animate-pulse">
                        Descargando imagen y convirtiendo a base64 local...
                      </div>
                    ) : unsplashPhotos.length > 0 ? (
                      <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {unsplashPhotos.map((photo) => (
                          <button
                            key={photo.id}
                            onClick={() => selectUnsplashPhoto(photo.full)}
                            className="aspect-square rounded-md overflow-hidden border border-slate-800/80 hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 relative group"
                            title={photo.alt}
                          >
                            <img src={photo.thumb} alt={photo.alt} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-6 text-[11px] text-slate-500">
                        Escribe un término clínico o de interés y presiona Buscar.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Preview */}
              {modalImageSrc && (
                <div className="mt-4 p-4 border border-slate-850 rounded-xl bg-slate-950/20 flex flex-col items-center relative">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 self-start">Vista Previa de la Imagen</span>
                  <div className="relative max-h-48 overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950 flex items-center justify-center w-full p-2">
                    <img src={modalImageSrc} alt="Previsualización" className="max-w-full max-h-40 object-contain rounded" />
                    <button 
                      onClick={() => {
                        setModalImageSrc(null);
                        setModalImageUrlInput('');
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-950/80 hover:bg-red-600 text-red-400 hover:text-white rounded-md transition-colors shadow active:scale-95 z-20"
                      title="Eliminar preselección"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-850 flex items-center justify-between gap-2 bg-slate-950/20">
              <button
                onClick={() => {
                  setIsImageModalOpen(false);
                  setModalImageSrc(null);
                  setModalImageUrlInput('');
                }}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-850 text-slate-450 hover:text-slate-200 text-xs font-semibold rounded-lg transition-all"
              >
                Cancelar
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!modalImageSrc) return;
                    handleUpdateSlide({
                      layout: 'image',
                      imageUrl: modalImageSrc,
                      imagePosition: 'center'
                    });
                    setIsImageModalOpen(false);
                    setModalImageSrc(null);
                    setModalImageUrlInput('');
                    triggerNotification('Imagen insertada como contenido');
                  }}
                  disabled={!modalImageSrc}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Como Contenido</span>
                </button>
                <button
                  onClick={() => {
                    if (!modalImageSrc) return;
                    handleUpdateSlide({
                      backgroundImage: modalImageSrc,
                      textColor: '#000000' // Default text to black for better contrast on images
                    });
                    setIsImageModalOpen(false);
                    setModalImageSrc(null);
                    setModalImageUrlInput('');
                    triggerNotification('Imagen establecida como fondo');
                  }}
                  disabled={!modalImageSrc}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Como Fondo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Slides / Drive Export Modal */}
      {isGoogleSlidesModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <div className="flex items-center gap-2">
                <CloudUpload className="w-5 h-5 text-indigo-400" />
                <span className="font-semibold text-slate-200">Exportar a Google Slides</span>
              </div>
              <button 
                onClick={() => setIsGoogleSlidesModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Tab Selector */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setGoogleSlidesTab('manual')}
                  className={`flex-1 pb-2 text-xs font-semibold border-b-2 transition-all ${
                    googleSlidesTab === 'manual'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Importar Manual (Recomendado y Gratis)
                </button>
                <button
                  onClick={() => setGoogleSlidesTab('auto')}
                  className={`flex-1 pb-2 text-xs font-semibold border-b-2 transition-all ${
                    googleSlidesTab === 'auto'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Exportar Directo (API de Google)
                </button>
              </div>

              {/* Tab Contents */}
              <div className="pt-2">
                {googleSlidesTab === 'manual' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      La forma más rápida y confiable de editar esta presentación en **Google Slides (Presentaciones de Google)** sin configuraciones de red o API es la importación nativa de PowerPoint:
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex gap-3 items-start p-3 bg-slate-950/30 border border-slate-800/60 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-200">Descarga tu archivo</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">Haz clic en "Descargar Diapositivas" para descargar la presentación actual (.pptx) a tu computadora.</p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start p-3 bg-slate-950/30 border border-slate-800/60 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-200">Abre Google Slides</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Ve a{' '}
                            <a 
                              href="https://slides.google.com" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                            >
                              slides.google.com
                            </a>
                            {' '}e inicia sesión con tu cuenta de Google.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start p-3 bg-slate-950/30 border border-slate-800/60 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-200">Importa o Arrastra el Archivo</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Ve a <strong>Archivo &gt; Importar diapositivas</strong> y sube el archivo, o simplemente <strong>arrastra y suelta</strong> el archivo descargado en tu lista de Google Slides. ¡Se convertirá automáticamente en diapositivas editables de Google Slides!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {googleSlidesTab === 'auto' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Puedes subir tu presentación directamente a tu Google Drive. Google la convertirá automáticamente en una presentación nativa de **Google Slides**.
                    </p>
                    
                    <div className="p-3 bg-indigo-950/10 border border-indigo-900/30 rounded-xl space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Google OAuth Client ID</label>
                      <input
                        type="text"
                        value={googleClientId}
                        onChange={(e) => handleSaveGoogleClientId(e.target.value)}
                        placeholder="Ingresa tu Client ID de Google..."
                        className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs font-mono text-slate-300 focus:outline-none"
                      />
                      <span className="text-[9px] text-slate-500 block leading-tight">
                        Este ID es necesario para que el navegador autentique de forma segura tu cuenta de Google. Se almacena localmente en tu ordenador.
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-550 bg-slate-950/20 border border-slate-800 p-3 rounded-lg leading-relaxed">
                      💡 <strong>¿Cómo obtener tu Client ID?</strong><br />
                      1. Ve a la <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Google Cloud Console</a>.<br />
                      2. Crea un proyecto, ve a <strong>API y Servicios &gt; Credenciales</strong>.<br />
                      3. Crea una credencial de tipo <strong>ID de cliente OAuth</strong> (Aplicación Web).<br />
                      4. Añade <code>{window.location.origin}</code> a los Orígenes autorizados de JavaScript.
                    </div>

                    {uploadError && (
                      <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-[11px] leading-relaxed">
                        ⚠️ {uploadError}
                      </div>
                    )}

                    {uploadedSlidesUrl && (
                      <div className="p-4 bg-emerald-950/25 border border-emerald-900/40 rounded-xl text-center space-y-2">
                        <span className="text-xs font-semibold text-emerald-400 block">🎉 ¡Diapositivas exportadas con éxito!</span>
                        <a
                          href={uploadedSlidesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-605 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow transition-all active:scale-[0.98]"
                        >
                          <span>Abrir en Google Slides</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-2 bg-slate-950/20">
              <button
                onClick={() => setIsGoogleSlidesModalOpen(false)}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-855 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-lg transition-all"
              >
                Cerrar
              </button>
              
              {googleSlidesTab === 'auto' && !uploadedSlidesUrl && (
                <button
                  onClick={handleExportGoogleSlides}
                  disabled={isUploadingToDrive || !googleClientId.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow"
                >
                  {isUploadingToDrive ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Conectando y Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-3.5 h-3.5" />
                      <span>Conectar y Subir</span>
                    </>
                  )}
                </button>
              )}

              {googleSlidesTab === 'manual' && (
                <button
                  onClick={() => {
                    handleExportPPTX();
                    setIsGoogleSlidesModalOpen(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Diapositivas</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {showNotification && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex items-center gap-2 z-[99] text-xs font-medium text-slate-200 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{showNotification}</span>
        </div>
      )}
    </div>
  );
}
