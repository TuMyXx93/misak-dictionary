-- Migration 0015: Catálogo dinámico de abreviaturas lingüísticas, normalización de categorías y restauración de etiquetas
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

-- 2. Poblar abreviaturas oficiales de Abreviaturas.pdf (idempotente con ON CONFLICT DO UPDATE)
INSERT INTO public.abreviaturas_gramaticales (codigo, etiqueta_completa, descripcion, dimension, orden, activo)
VALUES
  ('s.', 'Sustantivo', 'Palabra que designa personas, animales, cosas, lugares o conceptos en la cosmovisión Misak.', 'categoria', 1, true),
  ('loc. nom.', 'Locución nominal', 'Grupo de palabras que funciona sintácticamente como un sustantivo.', 'categoria', 2, true),
  ('sn.', 'Sintagma Nominal', 'Estructura sintáctica cuyo núcleo es un sustantivo o pronombre.', 'categoria', 3, true),
  ('v.', 'Verbo', 'Palabra que indica acción, proceso, estado o vivencia.', 'categoria', 4, true),
  ('sv.', 'Sintagma verbal', 'Estructura sintáctica cuyo núcleo es un verbo.', 'categoria', 5, true),
  ('v. pos.', 'Verbo posicional', 'Verbo que expresa postura corporal, disposición espacial o estado posicional tradicional.', 'categoria', 6, true),
  ('adj.', 'Adjetivo', 'Palabra que describe o delimita al sustantivo.', 'categoria', 7, true),
  ('cal.', 'Calificativo', 'Adjetivo o modificador que atribuye una cualidad específica.', 'categoria', 8, true),
  ('adj. cal.', 'Adjetivo calificativo', 'Adjetivo que denota características físicas, sensoriales o valorativas.', 'categoria', 9, true),
  ('adv. c.', 'Adverbio de cantidad', 'Modificador que especifica grado, intensidad o volumen de la acción.', 'categoria', 10, true),
  ('adv. lugar', 'Adverbio de lugar', 'Modificador que ubica espacial o territorialmente una acción.', 'categoria', 11, true),
  ('cuant. nom.', 'Cuantificador nominal', 'Elemento que especifica cantidad o medida sobre un sustantivo.', 'categoria', 12, true),
  ('interj.', 'Interjección', 'Expresión emotiva o exclamación cultural directa.', 'categoria', 13, true),
  ('loc.', 'Locución', 'Combinación fija de palabras con significado unitario.', 'categoria', 14, true),
  ('loc. verb.', 'Locución verbal', 'Combinación fija de palabras que funciona como un verbo.', 'categoria', 15, true),
  ('loc. adv. l.', 'Locución adverbial de lugar', 'Frase adverbial que sitúa geográficamente o en el territorio una acción.', 'categoria', 16, true),
  ('loc. interj.', 'Locución interjectiva', 'Frase fija empleada como saludo o expresión emotiva comunitaria.', 'categoria', 17, true),
  ('loc. conjunt. temp.', 'Locución conjuntiva temporal', 'Conector gramatical que enlaza acontecimientos en el tiempo.', 'categoria', 18, true),
  ('orac. condic.', 'Oración condicional', 'Estructura oracional que supedita una acción a una condición previa.', 'categoria', 19, true),
  ('O.S.Adv. Tiem.', 'Oración subordinada adverbial de tiempo', 'Oración subordinada que señala la circunstancia temporal de la acción.', 'categoria', 20, true),
  ('O. S. E. A. P. I.', 'Oración simple, enunciativa afirmativa, predicativa, activa e intransitiva', 'Estructura oracional completa activa sin objeto directo.', 'categoria', 21, true),
  ('O.E.A.', 'Oración enunciativa afirmativa', 'Oración que asevera un hecho o estado afirmativo.', 'categoria', 22, true),

  ('V. 1', 'Variante 1', 'Forma o pronunciación alternativa documentada en la comunidad.', 'variante', 23, true),
  ('V. 2', 'Variante 2', 'Segunda variante o pronunciación dialectal documentada.', 'variante', 24, true),
  ('V. 3', 'Variante 3', 'Tercera variante o pronunciación dialectal documentada.', 'variante', 25, true),

  ('sing.', 'Singular', 'Número gramatical singular.', 'rasgo', 26, true),
  ('pl.', 'Plural', 'Número gramatical plural.', 'rasgo', 27, true),
  ('f.', 'Femenino', 'Género gramatical femenino o referente femenino.', 'rasgo', 28, true),
  ('m.', 'Masculino', 'Género gramatical masculino o referente masculino.', 'rasgo', 29, true),
  ('amb.', 'Ambiguo', 'Término que admite tanto género femenino como masculino según el contexto.', 'rasgo', 30, true),

  ('neol.', 'Neologismo', 'Término de creación reciente o revitalización lingüística en Namtrik.', 'origen', 31, true),
  ('plac.', 'Préstamo léxico adaptado del castellano', 'Voz tomada del castellano y asimilada fonológica y morfológicamente al Namtrik.', 'origen', 32, true),
  ('plaq.', 'Préstamo léxico adaptado del quechua', 'Voz de origen quechua adaptada a la lengua Namtrik.', 'origen', 33, true),
  ('plaqui.', 'Préstamo léxico adaptado del quichua', 'Voz de origen quichua adaptada a la lengua Namtrik.', 'origen', 34, true),
  ('plan.', 'Préstamo léxico del Náhuatl', 'Voz tomada de la lengua náhuatl.', 'origen', 35, true),

  ('educ.', 'Educación', 'Ámbito educativo y pedagógico.', 'dominio', 36, true),
  ('gast.', 'Gastronomía', 'Preparación de alimentos, cocina tradicional y prácticas culinarias Misak.', 'dominio', 37, true),
  ('bot.', 'Botánica', 'Términos relacionados con plantas, cultivos y flora territorial.', 'dominio', 38, true),
  ('Zool.', 'Zoología', 'Términos relacionados con animales y fauna silvestre o doméstica.', 'dominio', 39, true),
  ('símb.', 'Símbolo', 'Signo o representación cultural ancestral del pueblo Misak.', 'dominio', 40, true),
  ('ren.', 'Riñón humano', 'Anatomía y medicina tradicional: riñón humano.', 'dominio', 41, true),
  ('VB.', 'Vesícula Biliar', 'Anatomía y medicina tradicional: vesícula biliar.', 'dominio', 42, true),
  ('mamíf.', 'Mamífero', 'Clasificación de mamíferos en el campo de animales originarios.', 'dominio', 43, true)
ON CONFLICT (codigo) DO UPDATE
SET etiqueta_completa = EXCLUDED.etiqueta_completa,
    descripcion = EXCLUDED.descripcion,
    dimension = EXCLUDED.dimension,
    orden = EXCLUDED.orden,
    activo = EXCLUDED.activo,
    updated_at = CURRENT_TIMESTAMP;

-- 3. Restaurar etiqueta_original y nombre_científico en Waara y Milu kalik
UPDATE public.formas_namtrik f
SET etiqueta_original = 's., mamíf.',
    categoria_gramatical = 's.',
    rasgos_gramaticales = array_append(f.rasgos_gramaticales, 'mamíf.')
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

-- 4. Asegurar preservación de etiqueta_original antes de normalizar
UPDATE public.formas_namtrik
SET etiqueta_original = categoria_gramatical
WHERE etiqueta_original IS NULL AND categoria_gramatical IS NOT NULL;

-- 5. Normalizar variantes tipográficas en categoria_gramatical
UPDATE public.formas_namtrik SET categoria_gramatical = 'sn.' WHERE categoria_gramatical IN ('sn', 'SN.');
UPDATE public.formas_namtrik SET categoria_gramatical = 'v.' WHERE categoria_gramatical = 'v';
UPDATE public.formas_namtrik SET categoria_gramatical = 'adj.' WHERE categoria_gramatical IN ('adj', 'Adj.');
UPDATE public.formas_namtrik SET categoria_gramatical = 'v. pos.' WHERE categoria_gramatical IN ('v.pos.', 'v.posic.');
UPDATE public.formas_namtrik SET categoria_gramatical = 'loc. interj.' WHERE categoria_gramatical IN ('loc.interj.', 'loc.Interj.');
UPDATE public.formas_namtrik SET categoria_gramatical = 'O.S.Adv. Tiem.' WHERE categoria_gramatical = 'O.S.Adv. Tiem';
UPDATE public.formas_namtrik SET categoria_gramatical = 'adj. cal.' WHERE categoria_gramatical = 'adj.cal.';
