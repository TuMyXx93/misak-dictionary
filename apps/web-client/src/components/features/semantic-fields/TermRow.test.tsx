import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Term } from '@/types/semanticField';
import { TermRow } from './TermRow';

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
    expect(screen.getByText(/sustantivo/)).toBeInTheDocument();
  });

  it('renders with example in Misak', () => {
    const termWithExample: Term = { ...baseTerm, exampleMisak: 'ashi shɵka' };
    render(<TermRow term={termWithExample} />);
    expect(screen.getByText(/ej. ashi shɵka/)).toBeInTheDocument();
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
    expect(screen.getByText('V.1')).toBeInTheDocument();
    expect(screen.getByText('Kirap')).toBeInTheDocument();
    expect(screen.getByText('V.2')).toBeInTheDocument();
    expect(screen.getByText('neol.')).toBeInTheDocument();
    expect(screen.getByText('Duro')).toBeInTheDocument();
  });

  it('renders scientific name when provided', () => {
    const termWithSci: Term = {
      ...baseTerm,
      scientificName: 'Zea mays',
    };
    render(<TermRow term={termWithSci} />);
    expect(screen.getByText('Zea mays')).toBeInTheDocument();
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
});
