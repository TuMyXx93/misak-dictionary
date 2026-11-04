import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { resolveBilingualTitle } from '@/types/semanticField';
import {
  getCulturalResourceAdapter,
  registerCulturalResourceAdapter,
  SectionMediaShowcase,
} from './CulturalResourceRegistry';

describe('CulturalResourceRegistry & resolveBilingualTitle', () => {
  it('resolveBilingualTitle deduplica subtítulos cuando Namtrik y Español coinciden', () => {
    const dup = resolveBilingualTitle('Nakchak', 'nakchak');
    expect(dup.title).toBe('Nakchak');
    expect(dup.subtitle).toBeUndefined();

    const distinct = resolveBilingualTitle('Ya', 'La Casa');
    expect(distinct.title).toBe('Ya');
    expect(distinct.subtitle).toBe('La Casa');
  });

  it('permite registrar adaptadores personalizados para futuros tipos de datos culturales', () => {
    registerCulturalResourceAdapter({
      tipo: 'espectrograma_fonetico',
      label: 'Espectrograma Fonético',
      badgeColorClass: 'bg-[#0055AA]/20 text-white border-[#0055AA]',
      renderViewer: (item) => <div data-testid="custom-spectrogram">{item.alt}</div>,
    });

    const adapter = getCulturalResourceAdapter('espectrograma_fonetico');
    expect(adapter.label).toBe('Espectrograma Fonético');
  });

  it('SectionMediaShowcase renderiza audios, imágenes y videos asociados a un nodo taxonómico', () => {
    render(
      <AudioPlayerProvider>
        <SectionMediaShowcase
          title="Ya"
          medios={[
            {
              uuid: 'aud-sec-1',
              tipo: 'audio',
              proposito: 'pronunciacion_lema',
              streamUrl: '/api/media/aud-sec-1/stream',
              descripcionEspanol: 'Pronunciación del campo Ya',
            },
            {
              uuid: 'vid-sec-1',
              tipo: 'video',
              proposito: 'recorrido_territorial',
              mimetype: 'video/mp4',
              streamUrl: '/api/media/vid-sec-1/stream',
              descripcionEspanol: 'Recorrido por la casa tradicional Misak',
              duracionSegundos: 62,
            },
          ]}
        />
      </AudioPlayerProvider>,
    );

    expect(
      screen.getByRole('button', { name: /reproducir pronunciación en namtrik de ya/i }),
    ).toBeInTheDocument();

    const videoCardBtn = screen.getByRole('button', {
      name: /abrir video cultural de ya/i,
    });
    expect(videoCardBtn).toBeInTheDocument();

    fireEvent.click(videoCardBtn);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getAllByText('Recorrido por la casa tradicional Misak').length,
    ).toBeGreaterThanOrEqual(1);
  });
});
