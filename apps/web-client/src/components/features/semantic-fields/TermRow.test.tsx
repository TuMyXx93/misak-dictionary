import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Term } from '@/types/semanticField';
import { TermRow } from './TermRow';

vi.mock('@/contexts/AudioPlayerContext', () => ({
  useAudioPlayer: () => ({
    currentTrackId: null,
    playbackState: 'idle',
    errorMessage: null,
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    isPlaying: () => false,
    isLoading: () => false,
  }),
  useOptionalAudioPlayer: () => ({
    currentTrackId: null,
    playbackState: 'idle',
    errorMessage: null,
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    isPlaying: () => false,
    isLoading: () => false,
  }),
}));

vi.mock('@/components/ui/LazyImage', () => ({
  LazyImage: ({
    src,
    alt,
    className,
    imgClassName,
    fit,
  }: {
    src: string;
    alt: string;
    className?: string;
    imgClassName?: string;
    fit?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      className={imgClassName ?? className}
      data-wrapper-class={className}
      data-fit={fit}
      data-testid="mock-lazy-image"
    />
  ),
}));

const baseTerm: Term = {
  id: 'test-term',
  misak: 'Shɵka',
  spanish: 'Totuma',
};

describe('TermRow', () => {
  it('renders misak and spanish terms', () => {
    render(<TermRow term={baseTerm} />);
    expect(screen.getByText('Shɵka')).toBeInTheDocument();
    expect(screen.getByText('Totuma')).toBeInTheDocument();
  });

  it('renders with part of speech', () => {
    const termWithPos: Term = { ...baseTerm, partOfSpeech: 'sustantivo' };
    render(<TermRow term={termWithPos} />);
    expect(screen.getByRole('button', { name: /s\.: Sustantivo/i })).toBeInTheDocument();
  });

  it('renders semantic description in Namtrik without the "ej." prefix and with upright sans typography', () => {
    const termWithDescription: Term = { ...baseTerm, exampleMisak: 'ej. ashi shɵka' };
    render(<TermRow term={termWithDescription} />);
    const desc = screen.getByText('ashi shɵka');
    expect(desc).toBeInTheDocument();
    expect(desc.textContent).not.toMatch(/^ej\./i);
    expect(desc.className).toContain('font-sans');
    expect(desc.className).not.toContain('italic');
  });

  it('renders multiple forms with variants, homonyms, and neologism badge (Spec 005)', () => {
    const multiFormTerm: Term = {
      id: 'term-multi',
      misak: 'Murarap, Kirap',
      spanish: 'Duro',
      formas: [
        {
          orden: 1,
          lema: 'Murarap',
          acepcionHomonima: 1,
          categoriaGramatical: 'adj.',
          variante: 'V.1',
          esNeologismo: false,
          rasgosGramaticales: ['adj.'],
        },
        {
          orden: 2,
          lema: 'Kirap',
          acepcionHomonima: null,
          categoriaGramatical: 'adj.',
          variante: 'V.2',
          esNeologismo: true,
          rasgosGramaticales: ['adj.', 'neol.'],
        },
      ],
    };

    render(<TermRow term={multiFormTerm} />);
    expect(screen.getByText('Murarap')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('V. 1')).toBeInTheDocument();
    expect(screen.getByText('Kirap')).toBeInTheDocument();
    expect(screen.getByText('V. 2')).toBeInTheDocument();
    expect(screen.getByText('neol.')).toBeInTheDocument();
    expect(screen.getByText('Duro')).toBeInTheDocument();
  });

  it('renders scientific name in green inside white parentheses next to the Spanish term (Spec 012)', () => {
    const termWithSci: Term = {
      id: 'pil-kushi',
      misak: 'Pil kushi',
      spanish: 'Oruga de la mazorca',
      exampleMisak: 'Pil map kushi, pɵñinkau, pil uturchiku, sruk pɵlɵpen, kushi misrik.',
      scientificName: 'Helicoverpa zea',
    };
    render(<TermRow term={termWithSci} />);

    const sciSpan = screen.getByText('Helicoverpa zea');
    expect(sciSpan).toBeInTheDocument();
    expect(sciSpan.className).toContain('text-emerald-300');
    expect(sciSpan.className).toContain('font-sans');

    // El contenedor padre inmediato encierra entre paréntesis blancos junto al término en español
    const parenWrapper = sciSpan.parentElement;
    expect(parenWrapper).not.toBeNull();
    expect(parenWrapper?.className).toContain('text-white/95');
    expect(parenWrapper?.textContent).toBe(' (Helicoverpa zea)');

    const spanishParagraph = parenWrapper?.parentElement;
    expect(spanishParagraph?.textContent).toBe('Oruga de la mazorca (Helicoverpa zea)');
  });

  it('deduplicates scientific name if spanish gloss already contains it in parentheses', () => {
    const termDuplicatedSci: Term = {
      id: 'milu-kalik',
      misak: 'Milu kalik',
      spanish: 'Caracol (Gastropoda)',
      scientificName: 'Gastropoda',
    };
    render(<TermRow term={termDuplicatedSci} />);

    const sciSpan = screen.getByText('Gastropoda');
    expect(sciSpan.parentElement?.parentElement?.textContent).toBe('Caracol (Gastropoda)');
  });

  it('renders dialogue greeting pairs with question and response blocks (Spec 005)', () => {
    const greetingTerm: Term = {
      id: 'term-dialogue',
      codigo: 'C1.S1.M21.SENT.1',
      tipo: 'dialogico',
      misak: 'Munásrɵ?',
      spanish: '¿Cómo amaneció?',
      descriptionMisak: 'Saludo matutino',
      descriptionSpanish: 'Pregunta sobre el amanecer',
      dialogo: {
        respuestaNamtrik: 'Yúsrɵ',
        respuestaNamtrikContexto: 'Respuesta afirmativa',
        respuestaEspanolGlosa: 'Amanecí bien',
        respuestaEspanolExplicacion: 'Respuesta al saludo',
      },
    };

    render(<TermRow term={greetingTerm} />);
    expect(screen.getByText('Munásrɵ?')).toBeInTheDocument();
    expect(screen.getByText('¿Cómo amaneció?')).toBeInTheDocument();
    expect(screen.getByText('Saludo matutino')).toBeInTheDocument();
    expect(screen.getByText('Respuesta')).toBeInTheDocument();
    expect(screen.getByText('Yúsrɵ')).toBeInTheDocument();
    expect(screen.getByText('Amanecí bien')).toBeInTheDocument();
    expect(screen.getByText('Respuesta afirmativa')).toBeInTheDocument();
  });

  describe('Insignia «En revisión» (R-026, R-021)', () => {
    it('muestra la insignia accesible cuando el término está en estado borrador', () => {
      const termBorrador: Term = {
        ...baseTerm,
        estado: 'borrador',
      };

      render(<TermRow term={termBorrador} />);
      const badge = screen.getByRole('status', {
        name: 'Término en revisión editorial',
      });
      expect(badge).toBeInTheDocument();
      expect(screen.getByText('En revisión')).toBeInTheDocument();
    });

    it('no muestra la insignia cuando el término está ratificado', () => {
      const termRatificado: Term = {
        ...baseTerm,
        estado: 'ratificado',
      };

      render(<TermRow term={termRatificado} />);
      expect(screen.queryByText('En revisión')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('status', { name: 'Término en revisión editorial' }),
      ).not.toBeInTheDocument();
    });

    it('no muestra la insignia cuando estado no está definido (legacy)', () => {
      render(<TermRow term={baseTerm} />);
      expect(screen.queryByText('En revisión')).not.toBeInTheDocument();
    });

    it('muestra la insignia en término dialógico en estado borrador', () => {
      const greetingBorrador: Term = {
        id: 'term-dialogue-draft',
        tipo: 'dialogico',
        estado: 'borrador',
        misak: 'Munásrɵ?',
        spanish: '¿Cómo amaneció?',
        dialogo: {
          respuestaNamtrik: 'Yúsrɵ',
          respuestaNamtrikContexto: null,
          respuestaEspanolGlosa: 'Bien',
          respuestaEspanolExplicacion: null,
        },
      };

      render(<TermRow term={greetingBorrador} />);
      expect(screen.getByText('En revisión')).toBeInTheDocument();
      expect(
        screen.getByRole('status', { name: 'Término en revisión editorial' }),
      ).toBeInTheDocument();
    });
  });

  describe('Medios Culturales (R-009, R-010, R-011 · Spec 007)', () => {
    it('renderiza el botón accesible de audio cuando el término incluye audioUrl', () => {
      const termWithAudio: Term = {
        ...baseTerm,
        audioUrl: '/api/media/audio-uuid-1/stream',
      };

      render(<TermRow term={termWithAudio} />);
      const audioBtn = screen.getByRole('button', {
        name: 'Reproducir pronunciación en Namtrik de Shɵka',
      });
      expect(audioBtn).toBeInTheDocument();
      expect(audioBtn.className).toContain('min-w-[48px]');
      expect(audioBtn.className).toContain('min-h-[48px]');
    });

    it('renderiza la miniatura con LazyImage y abre el lightbox al interactuar', () => {
      const termWithMedia: Term = {
        ...baseTerm,
        medios: [
          {
            uuid: 'img-uuid-1',
            tipo: 'imagen',
            proposito: 'ilustracion_cultural',
            streamUrl: '/api/media/img-uuid-1/stream',
            descripcionEspanol: 'Totuma ceremonial decorada',
            descripcionNamtrik: 'Shɵka p+r+',
            hablanteAutor: 'Taita Lorenzo',
            licenciaComunitaria: 'Propiedad Intelectual Colectiva del Pueblo Misak',
          },
        ],
      };

      render(<TermRow term={termWithMedia} />);

      // Verificar miniatura accesible
      const thumbnailBtn = screen.getByRole('button', {
        name: 'Abrir ilustración cultural de Shɵka',
      });
      expect(thumbnailBtn).toBeInTheDocument();
      expect(screen.getByTestId('mock-lazy-image')).toBeInTheDocument();

      // Al hacer clic, abre el lightbox
      fireEvent.click(thumbnailBtn);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getAllByText('Totuma ceremonial decorada').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('«Shɵka p+r+»')).toBeInTheDocument();
      expect(screen.getByText('Taita Lorenzo')).toBeInTheDocument();

      // Al presionar Escape, se cierra
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('mantiene CSS Grid equilibrado @container y text-left ante definiciones largas (>300 chars)', () => {
      const longSpanishExplanation =
        'Recipiente tradicional elaborado a partir del fruto maduro del totumo, curado y tallado por sabedores mayores para compartir bebidas ceremoniales y alimentos durante el trabajo comunitario del minga en el territorio ancestral de Guambía, conservando el equilibrio entre palabra, agua y fogón.';
      const longTerm: Term = {
        id: 'term-long',
        misak: 'Shɵka pɵrɵ',
        spanish: 'Totuma ceremonial de uso comunitario',
        descriptionSpanish: longSpanishExplanation,
        estado: 'borrador',
      };

      const { container } = render(<TermRow term={longTerm} />);
      const article = container.querySelector('article');
      expect(article?.className).toContain('@container');
      expect(screen.getByText(longSpanishExplanation)).toBeInTheDocument();
      expect(
        screen.getByRole('status', { name: 'Término en revisión editorial' }),
      ).toBeInTheDocument();
    });

    it('soporta video cultural abriendo el visor con reproductor nativo HTML5 y recursos futuros extensibles', () => {
      const termWithVideoAndFuture: Term = {
        ...baseTerm,
        medios: [
          {
            uuid: 'vid-uuid-1',
            tipo: 'video',
            proposito: 'registro_practica_cultural',
            mimetype: 'video/mp4',
            streamUrl: '/api/media/vid-uuid-1/stream',
            descripcionEspanol: 'Elaboración artesanal de la totuma',
            duracionSegundos: 45,
          },
          {
            uuid: 'doc-uuid-1',
            tipo: 'documento_etnolinguistico',
            proposito: 'documento_etnolinguistico',
            streamUrl: '/api/media/doc-uuid-1/stream',
            descripcionEspanol: 'Ficha etnolingüística complementaria',
          },
        ],
      };

      render(<TermRow term={termWithVideoAndFuture} />);

      const videoBtn = screen.getByRole('button', {
        name: 'Abrir video cultural de Shɵka',
      });
      expect(videoBtn).toBeInTheDocument();

      const futureBtn = screen.getByRole('button', {
        name: 'Abrir documento etnolinguistico de Shɵka',
      });
      expect(futureBtn).toBeInTheDocument();

      fireEvent.click(videoBtn);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog.querySelector('video')).not.toBeNull();
    });

    it('expone id="term-{id}" y scroll-mt-28 tanto en modo estándar como en modo dialógico (Spec 012 v0.3.0 / R-018)', () => {
      const { container: stdContainer } = render(<TermRow term={{ ...baseTerm, id: '745' }} />);
      const stdArticle = stdContainer.querySelector('article');
      expect(stdArticle).toHaveAttribute('id', 'term-745');
      expect(stdArticle?.className).toContain('scroll-mt-28');

      const { container: dlgContainer } = render(
        <TermRow
          term={{
            id: '902',
            tipo: 'dialogico',
            misak: 'Munásrɵ?',
            spanish: '¿Cómo amaneció?',
            dialogo: {
              respuestaNamtrik: 'Yúsrɵ',
              respuestaNamtrikContexto: null,
              respuestaEspanolGlosa: 'Amanecí bien',
              respuestaEspanolExplicacion: null,
            },
          }}
        />,
      );
      const dlgArticle = dlgContainer.querySelector('article');
      expect(dlgArticle).toHaveAttribute('id', 'term-902');
      expect(dlgArticle?.className).toContain('scroll-mt-28');
    });

    it('ubica los audios según propósito cultural (lema, forma, oración y diálogo) y muestra múltiples imágenes/videos (Spec 014 R-009)', () => {
      const multimodalTerm: Term = {
        id: 'term-mm-1',
        misak: 'Pisindɵ',
        spanish: 'Caracol grande',
        descriptionMisak: 'Pisindɵ nuikø waramik.',
        formas: [
          {
            id: 'forma-a',
            orden: 1,
            lema: 'Pisindɵ',
            categoriaGramatical: 's.',
            variante: 'Guambía',
            esNeologismo: false,
            rasgosGramaticales: ['s.'],
          },
          {
            id: 'forma-b',
            orden: 2,
            lema: 'Pishindɵ',
            categoriaGramatical: 's.',
            variante: 'Silvia',
            esNeologismo: false,
            rasgosGramaticales: ['s.'],
          },
        ],
        medios: [
          {
            uuid: 'aud-forma-a',
            tipo: 'audio',
            proposito: 'pronunciacion_lema',
            formaId: 'forma-a',
            streamUrl: '/api/media/aud-forma-a/stream',
            descripcionEspanol: 'Audio forma Guambía',
          },
          {
            uuid: 'aud-forma-b',
            tipo: 'audio',
            proposito: 'pronunciacion_lema',
            formaId: 'forma-b',
            streamUrl: '/api/media/aud-forma-b/stream',
            descripcionEspanol: 'Audio forma Silvia',
          },
          {
            uuid: 'aud-ctx-1',
            tipo: 'audio',
            proposito: 'contexto_oracion',
            streamUrl: '/api/media/aud-ctx-1/stream',
            descripcionEspanol: 'Audio oración contextual',
          },
          {
            uuid: 'img-1',
            tipo: 'imagen',
            proposito: 'ilustracion_cultural',
            streamUrl: '/api/media/img-1/stream',
            descripcionEspanol: 'Dibujo 1',
          },
          {
            uuid: 'img-2',
            tipo: 'imagen',
            proposito: 'fotografia_territorio',
            streamUrl: '/api/media/img-2/stream',
            descripcionEspanol: 'Foto 2',
          },
          {
            uuid: 'vid-1',
            tipo: 'video',
            proposito: 'registro_practica_cultural',
            streamUrl: '/api/media/vid-1/stream',
            descripcionEspanol: 'Video 1',
          },
          {
            uuid: 'vid-2',
            tipo: 'video',
            proposito: 'relato_oral_video',
            streamUrl: '/api/media/vid-2/stream',
            descripcionEspanol: 'Video 2',
          },
        ],
      };

      render(<TermRow term={multimodalTerm} />);

      expect(
        screen.getByRole('button', {
          name: /Reproducir pronunciación en Namtrik de Audio forma Guambía/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: /Reproducir pronunciación en Namtrik de Audio forma Silvia/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: /Reproducir pronunciación en Namtrik de Audio oración contextual/i,
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', { name: /Abrir ilustración cultural 1 de Pisindɵ/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Abrir ilustración cultural 2 de Pisindɵ/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Abrir video cultural 1 de Pisindɵ/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Abrir video cultural 2 de Pisindɵ/i }),
      ).toBeInTheDocument();
    });

    it('ubica audios pregunta_dialogo y respuesta_dialogo en sus bloques correspondientes (Spec 014 R-009)', () => {
      const dialogicTerm: Term = {
        id: 'term-dlg-audio',
        tipo: 'dialogico',
        misak: 'Munásrɵ?',
        spanish: '¿Cómo amaneció?',
        dialogo: {
          respuestaNamtrik: 'Yúsrɵ.',
          respuestaNamtrikContexto: null,
          respuestaEspanolGlosa: 'Amanecí bien.',
          respuestaEspanolExplicacion: null,
        },
        medios: [
          {
            uuid: 'aud-preg',
            tipo: 'audio',
            proposito: 'pregunta_dialogo',
            streamUrl: '/api/media/aud-preg/stream',
            descripcionEspanol: 'Audio pregunta saludo',
          },
          {
            uuid: 'aud-resp',
            tipo: 'audio',
            proposito: 'respuesta_dialogo',
            streamUrl: '/api/media/aud-resp/stream',
            descripcionEspanol: 'Audio respuesta saludo',
          },
        ],
      };

      render(<TermRow term={dialogicTerm} />);

      const preguntaText = screen.getByText('Munásrɵ?');
      const respuestaText = screen.getByText('Yúsrɵ.');

      const preguntaBtn = screen.getByRole('button', {
        name: /Reproducir pronunciación en Namtrik de Audio pregunta saludo/i,
      });
      const respuestaBtn = screen.getByRole('button', {
        name: /Reproducir pronunciación en Namtrik de Audio respuesta saludo/i,
      });

      expect(preguntaText.parentElement).toContainElement(preguntaBtn);
      expect(respuestaText.parentElement).toContainElement(respuestaBtn);
    });
  });

  it('renderiza miniaturas cuadradas sin recorte (fit="contain"), overlay aria-hidden y restaura el foco al disparador exacto', () => {
    const multiVisualTerm: Term = {
      id: 'term-kaluyapenku',
      tipo: 'estandar',
      misak: 'Kaluyapenku',
      spanish: 'Conejo',
      medios: [
        {
          uuid: 'img-1',
          tipo: 'imagen',
          proposito: 'ilustracion_cultural',
          streamUrl: '/api/media/img-1/stream',
          descripcionEspanol: 'Kaluyapenku frente',
        },
        {
          uuid: 'img-2',
          tipo: 'imagen',
          proposito: 'ilustracion_cultural',
          streamUrl: '/api/media/img-2/stream',
          descripcionEspanol: 'Kaluyapenku perfil',
        },
        {
          uuid: 'vid-1',
          tipo: 'video',
          proposito: 'video_cultural',
          streamUrl: '/api/media/vid-1/stream',
          descripcionEspanol: 'Pronunciación Kaluyapenku',
        },
      ],
    };

    render(<TermRow term={multiVisualTerm} />);

    const firstImgBtn = screen.getByRole('button', {
      name: /Abrir ilustración cultural 1 de Kaluyapenku/i,
    });
    const secondImgBtn = screen.getByRole('button', {
      name: /Abrir ilustración cultural 2 de Kaluyapenku/i,
    });
    const videoBtn = screen.getByRole('button', {
      name: /Abrir video cultural de Kaluyapenku/i,
    });

    expect(firstImgBtn).toHaveClass('aspect-square', 'w-14', 'h-14', 'sm:w-16', 'sm:h-16');
    expect(secondImgBtn).toHaveClass('aspect-square', 'w-14', 'h-14', 'sm:w-16', 'sm:h-16');

    const thumbImages = screen.getAllByTestId('mock-lazy-image');
    expect(thumbImages).toHaveLength(2);
    for (const img of thumbImages) {
      expect(img).toHaveAttribute('data-fit', 'contain');
      expect(img).toHaveClass('object-contain');
    }

    const overlay = firstImgBtn.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('pointer-events-none');

    // Abrir la 2da ilustración y comprobar restauración exacta de foco
    fireEvent.click(secondImgBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(secondImgBtn);

    // Abrir video cultural y comprobar restauración exacta de foco
    fireEvent.click(videoBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(videoBtn);
  });
});
