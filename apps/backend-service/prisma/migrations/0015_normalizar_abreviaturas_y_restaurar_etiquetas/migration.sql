-- Migration 0015: Catálogo dinámico de las 41 abreviaturas lingüísticas de Abreviaturas.pdf y normalización de categorías
-- Spec 012 v0.2.0 (R-012, R-017)

-- 1. Crear tabla abreviaturas_gramaticales
CREATE TABLE IF NOT EXISTS public.abreviaturas_gramaticales (
    id bigserial PRIMARY KEY,
    codigo citext NOT NULL,
    etiqueta_completa text NOT NULL,
    descripcion text,
    dimension text NOT NULL DEFAULT 'categoria',
    orden integer NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_abreviaturas_codigo UNIQUE (codigo)
);

CREATE INDEX IF NOT EXISTS idx_abreviaturas_dimension_orden ON public.abreviaturas_gramaticales (dimension, orden);

-- 2. Eliminar entradas no presentes en Abreviaturas.pdf (adj. cal. y mamíf.)
DELETE FROM public.abreviaturas_gramaticales WHERE codigo IN ('adj. cal.', 'mamíf.');

-- 3. Poblar las 41 abreviaturas oficiales de Abreviaturas.pdf (únicamente codigo y etiqueta_completa)
INSERT INTO public.abreviaturas_gramaticales (codigo, etiqueta_completa, descripcion, dimension, orden, activo)
VALUES
  ('adj.', 'Adjetivo', NULL, 'categoria', 1, true),
  ('adv. lugar', 'Adverbio de lugar', NULL, 'categoria', 2, true),
  ('adv. c.', 'Adverbio de cantidad', NULL, 'categoria', 3, true),
  ('amb.', 'Ambiguo', NULL, 'categoria', 4, true),
  ('bot.', 'Botánica', NULL, 'categoria', 5, true),
  ('cal.', 'Calificativo', NULL, 'categoria', 6, true),
  ('cuant. nom.', 'Cuantificador nominal', NULL, 'categoria', 7, true),
  ('educ.', 'Educación', NULL, 'categoria', 8, true),
  ('f.', 'Femenino', NULL, 'categoria', 9, true),
  ('gast.', 'Gastronomía', NULL, 'categoria', 10, true),
  ('interj.', 'Interjección', NULL, 'categoria', 11, true),
  ('loc. adv. l.', 'Locución adverbial de lugar', NULL, 'categoria', 12, true),
  ('loc. conjunt. temp.', 'Locución conjuntiva temporal', NULL, 'categoria', 13, true),
  ('loc. nom.', 'Locución nominal', NULL, 'categoria', 14, true),
  ('loc. verb.', 'Locución verbal', NULL, 'categoria', 15, true),
  ('loc.', 'Locución', NULL, 'categoria', 16, true),
  ('loc. interj.', 'Locución interjectiva', NULL, 'categoria', 17, true),
  ('m.', 'Masculino', NULL, 'categoria', 18, true),
  ('neol.', 'Neologismo', NULL, 'categoria', 19, true),
  ('O. S. E. A. P. I.', 'Oración simple, enunciativa afirmativa, predicativa, activa e intransitiva.', NULL, 'categoria', 20, true),
  ('O.E.A.', 'Oración enunciativa afirmativa', NULL, 'categoria', 21, true),
  ('O.S.Adv. Tiem.', 'Oración subordinada adverbial de tiempo', NULL, 'categoria', 22, true),
  ('orac. condic.', 'Oración condicional', NULL, 'categoria', 23, true),
  ('pl.', 'Plural', NULL, 'categoria', 24, true),
  ('plac.', 'Préstamo léxico adaptado del castellano', NULL, 'categoria', 25, true),
  ('plan.', 'Préstamo léxico del Nahualt', NULL, 'categoria', 26, true),
  ('plaq.', 'Préstamo léxico adaptado del quechua', NULL, 'categoria', 27, true),
  ('plaqui.', 'Préstamo léxico adaptado del quichua', NULL, 'categoria', 28, true),
  ('ren.', 'Riñón humano', NULL, 'categoria', 29, true),
  ('s.', 'Sustantivo', NULL, 'categoria', 30, true),
  ('símb.', 'Símbolo', NULL, 'categoria', 31, true),
  ('sing.', 'Singular', NULL, 'categoria', 32, true),
  ('sn.', 'Sintagma Nominal', NULL, 'categoria', 33, true),
  ('sv.', 'Sintagma verbal', NULL, 'categoria', 34, true),
  ('V. 1', 'Variante 1', NULL, 'categoria', 35, true),
  ('V. 2', 'Variante 2', NULL, 'categoria', 36, true),
  ('V. 3', 'Variante 3', NULL, 'categoria', 37, true),
  ('v. pos.', 'Verbo posicional', NULL, 'categoria', 38, true),
  ('v.', 'Verbo', NULL, 'categoria', 39, true),
  ('VB.', 'Vesícula Biliar', NULL, 'categoria', 40, true),
  ('Zool.', 'Zoología', NULL, 'categoria', 41, true)
ON CONFLICT (codigo) DO UPDATE
SET etiqueta_completa = EXCLUDED.etiqueta_completa,
    descripcion = NULL,
    dimension = 'categoria',
    orden = EXCLUDED.orden,
    activo = EXCLUDED.activo,
    updated_at = CURRENT_TIMESTAMP;

-- 4. Restaurar etiqueta_original y nombre_científico en Waara y Milu kalik
UPDATE public.formas_namtrik f
SET etiqueta_original = 's.',
    categoria_gramatical = 's.',
    rasgos_gramaticales = array_remove(f.rasgos_gramaticales, 'mamíf.')
FROM public.sentidos_lexicos s
WHERE s.id = f.sentido_id AND s.codigo = 'C2.S5.E002';

UPDATE public.formas_namtrik f
SET etiqueta_original = 'sn.',
    categoria_gramatical = 'sn.'
FROM public.sentidos_lexicos s
WHERE s.id = f.sentido_id AND s.codigo = 'C4.S6.E021';

UPDATE public.sentidos_lexicos
SET nombre_cientifico = 'Gastropoda'
WHERE codigo = 'C4.S6.E021';

-- 5. Asegurar preservación de etiqueta_original antes de normalizar
UPDATE public.formas_namtrik
SET etiqueta_original = categoria_gramatical
WHERE etiqueta_original IS NULL AND categoria_gramatical IS NOT NULL;

-- 6. Normalizar variantes tipográficas en categoria_gramatical a las 41 oficiales de Abreviaturas.pdf
UPDATE public.formas_namtrik SET categoria_gramatical = 'sn.' WHERE categoria_gramatical IN ('sn', 'SN.');
UPDATE public.formas_namtrik SET categoria_gramatical = 'v.' WHERE categoria_gramatical = 'v';
UPDATE public.formas_namtrik SET categoria_gramatical = 'adj.' WHERE categoria_gramatical IN ('adj', 'Adj.');
UPDATE public.formas_namtrik SET categoria_gramatical = 'v. pos.' WHERE categoria_gramatical IN ('v.pos.', 'v.posic.');
UPDATE public.formas_namtrik SET categoria_gramatical = 'loc. interj.' WHERE categoria_gramatical IN ('loc.interj.', 'loc.Interj.');
UPDATE public.formas_namtrik SET categoria_gramatical = 'O.S.Adv. Tiem.' WHERE categoria_gramatical = 'O.S.Adv. Tiem';
UPDATE public.formas_namtrik SET categoria_gramatical = 'cal.' WHERE categoria_gramatical IN ('adj.cal.', 'adj. cal.');
