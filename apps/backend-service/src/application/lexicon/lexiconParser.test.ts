import { describe, expect, it } from 'vitest';
import {
  extraerLexicoDeHojas,
  parsearContenidoEspanol,
  parsearFormasNamtrik,
} from './lexiconParser.js';
import { lexicoSchema } from './lexiconSchema.js';

describe('lexiconParser — modelo Sentido + Formas (Spec 005)', () => {
  it('desglosa un sentido con múltiples formas, variantes y marca de neologismo (R-001)', () => {
    const { formas } = parsearFormasNamtrik(
      'Miirap (v., neol., V.1) Kasrak kɵtrɵisrik (v., neol., V.2)',
    );

    expect(formas).toHaveLength(2);
    expect(formas[0]).toEqual({
      orden: 1,
      lema: 'Miirap',
      categoriaGramatical: 'v.',
      variante: 'V.1',
      esNeologismo: true,
      rasgosGramaticales: [],
      etiquetaOriginal: 'v., neol., V.1',
    });
    expect(formas[1]).toEqual({
      orden: 2,
      lema: 'Kasrak kɵtrɵisrik',
      categoriaGramatical: 'v.',
      variante: 'V.2',
      esNeologismo: true,
      rasgosGramaticales: [],
      etiquetaOriginal: 'v., neol., V.2',
    });
  });

  it('normaliza ortografía namtrik (o → ɵ) en el lema y detecta homónimos numerados (R-001)', () => {
    const { formas, cambiosOrtograficos } = parsearFormasNamtrik('Sruutra 1 (s.) Sruutra 2 (s.)');
    expect(formas[0]?.lema).toBe('Sruutra');
    expect(formas[0]?.acepcionHomonima).toBe(1);
    expect(formas[1]?.acepcionHomonima).toBe(2);

    const conVocalO = parsearFormasNamtrik(
      'Poiorop (v., V.1) Poiutsap (v., V.2) Poiisik (v., V.3)',
    );
    expect(conVocalO.formas.map((f) => f.lema)).toEqual(['Pɵiɵrɵp', 'Pɵiutsap', 'Pɵiisik']);
    expect(conVocalO.cambiosOrtograficos + cambiosOrtograficos).toBeGreaterThan(0);
  });

  it('extrae rasgos morfosintácticos (f., m., sing., pl., plac., Zool.) y sanea paréntesis dobles', () => {
    const { formas } = parsearFormasNamtrik(
      'Kualɵm mɵskai (loc. nom., m., sing., V.1) Kualɵm táta (loc. nom., plac., m., sing., V.2)',
    );
    expect(formas[0]?.categoriaGramatical).toBe('loc. nom.');
    expect(formas[0]?.variante).toBe('V.1');
    expect(formas[0]?.rasgosGramaticales).toEqual(['m.', 'sing.']);
    expect(formas[1]?.rasgosGramaticales).toEqual(['plac.', 'm.', 'sing.']);

    const dobleParen = parsearFormasNamtrik('Chikɵmɵ ka kualmaku? (loc.interj.), sing.)');
    expect(dobleParen.formas[0]?.lema).toBe('Chikɵmɵ ka kualmaku?');
    expect(dobleParen.formas[0]?.rasgosGramaticales).toEqual(['sing.']);
  });

  it('separa glosa principal, explicación cultural y nombre científico en español (R-002)', () => {
    const ave = parsearContenidoEspanol('Zumbador ventriblanco (Chaetocercus mulsant).');
    expect(ave).toEqual({
      espanolGlosa: 'Zumbador ventriblanco',
      nombreCientifico: 'Chaetocercus mulsant',
    });

    const conExplicacion = parsearContenidoEspanol(
      'Cansado: estado de fatiga que puede manifestarse en los ámbitos físico, mental, emocional o sensorial.',
    );
    expect(conExplicacion).toEqual({
      espanolGlosa: 'Cansado',
      espanolExplicacion:
        'estado de fatiga que puede manifestarse en los ámbitos físico, mental, emocional o sensorial.',
      nombreCientifico: undefined,
    });
  });

  it('procesa hojas completas: colapsa duplicados consecutivos, extrae saludos dialógicos y valida con Zod (R-003..R-007)', () => {
    const { lexico } = extraerLexicoDeHojas([
      {
        nombre: '3 TRATUL',
        filas: [
          { numeroFila: 1, columnas: { A: 'Campo semántico 3 Tratul (La huerta lejana)' } },
          {
            numeroFila: 2,
            columnas: {
              A: 'Ya pulu mamik lamɵtɵ ellmarmɵ, trausrɵmpe nɵtrɵ ellkuaik.',
              C: 'Espacio de trabajo ubicado a una distancia lejana de la vivienda.',
            },
          },
          {
            numeroFila: 3,
            columnas: {
              A: 'NAMTRIKMAI WAM',
              B: 'NAMTRIKMAI MANCHIPIK',
              C: 'PULƟ TRIKMAI MANCHIPIK',
            },
          },
          {
            numeroFila: 4,
            columnas: {
              A: 'Wela (s.)',
              B: 'Tsin kusrup pirɵ kemalsrɵp tanikwan.',
              C: 'Túmulos agrícolas: eras de cultivo construidas con forma trapezoidal.',
            },
            resaltadoAmarillo: true,
          },
        ],
      },
      {
        nombre: '4 USHAMERA',
        filas: [
          { numeroFila: 1, columnas: { A: 'Campo semántico 4 Kau ushamera' } },
          { numeroFila: 3, columnas: { A: 'Subcampo semántico 1 Illimera (las aves)' } },
          {
            numeroFila: 14,
            columnas: {
              A: 'Srutrap tsatsɵ (sn.)',
              B: 'Mekulap tsatsɵ, tsipyu.',
              C: 'Cometa verdiazul (Aglaiocercus kingii).',
            },
          },
          {
            numeroFila: 15,
            columnas: {
              A: 'Srutrap tsatsɵ (sn.)',
              B: 'Mekulap tsatsɵ, tsipyu.',
              C: 'Cometa verdiazul (Aglaiocercus kingii).',
            },
          },
        ],
      },
      {
        nombre: 'SALUDOS',
        filas: [
          { numeroFila: 1, columnas: { A: 'Microcampo semántico 21: Kuel Kuel Wamap Amɵnamelɵ' } },
          {
            numeroFila: 2,
            columnas: {
              A: 'Misak pirau, misak lincha wareiknukpe wamap amɵnamikwan.',
              D: 'En la lengua namtrik, los saludos difieren significativamente.',
            },
          },
          {
            numeroFila: 8,
            columnas: {
              A: 'Munásrɵ? (interj.)',
              B: 'Nepua isua asikmɵ yapsrɵ kutre atrupen wamik wam.',
              C: '¿Desde qué infinito vienes? expresión de saludo utilizada tradicionalmente.',
              D: 'Yúsrɵ',
              E: 'Lɵtik wam.',
              F: 'Llegué, aquí estoy: expresión de respuesta utilizada como réplica.',
            },
          },
        ],
      },
    ]);

    const validado = lexicoSchema.parse(lexico);
    expect(validado.fuente.duplicadosColapsados).toBe(1);
    expect(validado.descripcionesNodos).toHaveLength(2);
    expect(validado.sentidos).toHaveLength(3);

    const wela = validado.sentidos.find((s) => s.codigo === 'C3.E001');
    expect(wela?.nodoCodigo).toBe('C3');
    expect(wela?.observacionEditorial).toBe('resaltado_amarillo');

    const cometa = validado.sentidos.find((s) => s.codigo === 'C4.S1.E001');
    expect(cometa?.nombreCientifico).toBe('Aglaiocercus kingii');

    const saludo = validado.sentidos.find((s) => s.codigo === 'C1.S1.M21.D001');
    expect(saludo?.tipo).toBe('dialogico');
    expect(saludo?.dialogo?.respuestaNamtrik).toBe('Yúsrɵ');
    expect(saludo?.dialogo?.respuestaEspanolGlosa).toBe('Llegué, aquí estoy');
  });
});
