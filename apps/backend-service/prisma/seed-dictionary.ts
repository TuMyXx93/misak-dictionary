/**
 * Dictionary Content Seed
 * Spec 003 — Integración vertical
 *
 * Carga el contenido mínimo validado (mismo shape que el mock del frontend)
 * de forma idempotente. DATOS DESECHABLES: material de observación, no la base
 * productiva — la ingesta governada llega en una spec posterior (004+).
 *
 * Escala: SEED_TERMS_SCALE=1 (≈24 términos, default) | 10 (≈240) | 100 (≈2400)
 * para observar UI/UX, búsqueda y paginación a distintos volúmenes.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SCALE = Math.max(1, Number(process.env.SEED_TERMS_SCALE ?? 1));

interface TermSeed {
  misak: string;
  spanish: string;
}
interface MicrofieldSeed {
  slug: string;
  misak: string;
  spanish: string;
  descriptionMisak: string;
  descriptionSpanish: string;
  terms: TermSeed[];
}
interface SubfieldSeed {
  slug: string;
  misak: string;
  spanish: string;
  descriptionMisak: string;
  descriptionSpanish: string;
  microfields: MicrofieldSeed[];
}
interface FieldSeed {
  slug: string;
  namtrik: string;
  spanish: string;
  longMisak: string;
  longSpanish: string;
  subfields: SubfieldSeed[];
}

/**
 * Contenido base — 7 campos ratificados (2 con jerarquía completa).
 * Fuente: mock validado del frontend (src/data/semanticFields). Calco fiel.
 */
const FIELDS: FieldSeed[] = [
  {
    slug: 'ya',
    namtrik: 'Ya',
    spanish: 'La Casa',
    longMisak: 'Ya, namui pɵtɵ mirrawek.',
    longSpanish:
      'El campo de la casa representa el núcleo de la vida Misak. El fogón, central en la cultura, es donde se prepara la comida, se transmite el conocimiento y se comparten las historias.',
    subfields: [
      {
        slug: 'fogon',
        misak: 'Namui',
        spanish: 'Fogón',
        descriptionMisak: 'Ya pɵtɵ namui.',
        descriptionSpanish: 'El fogón central de la casa Misak.',
        microfields: [
          {
            slug: 'utensilios',
            misak: 'Kawe',
            spanish: 'Utensilios del fogón',
            descriptionMisak: 'Pɵtɵ trikwa kawe.',
            descriptionSpanish: 'Instrumentos tradicionales para cocinar.',
            terms: [
              { misak: 'Sruik', spanish: 'Olla de barro' },
              { misak: 'Pɵta', spanish: 'Plato hondo' },
              { misak: 'Kʊra', spanish: 'Jarro para agua' },
              { misak: 'Wapa', spanish: 'Cuchara de madera' },
              { misak: 'Shɵka', spanish: 'Totuma / recipiente' },
            ],
          },
          {
            slug: 'alimentos',
            misak: 'Yɵ',
            spanish: 'Alimentos del fogón',
            descriptionMisak: 'Namui pɵtɵ yɵ.',
            descriptionSpanish: 'Alimentos preparados en el fogón.',
            terms: [
              { misak: 'Mʊru', spanish: 'Mazamorra' },
              { misak: 'Sɵka', spanish: 'Envuelto de maíz' },
              { misak: 'Tʊka', spanish: 'Caldo de frijol' },
              { misak: 'Shɵ', spanish: 'Café misak' },
              { misak: 'Kɵwa', spanish: 'Panela' },
            ],
          },
        ],
      },
      {
        slug: 'espacios-casa',
        misak: 'Ya Namɵ',
        spanish: 'Espacios de la casa',
        descriptionMisak: 'Ya pɵtɵ namɵ.',
        descriptionSpanish: 'Los espacios que conforman la vivienda Misak.',
        microfields: [
          {
            slug: 'paredes-techo',
            misak: 'Piro',
            spanish: 'Paredes y techo',
            descriptionMisak: 'Ya piro.',
            descriptionSpanish: 'Estructura física de la casa.',
            terms: [
              { misak: 'Tʊka', spanish: 'Pared de bahareque' },
              { misak: 'Shɵra', spanish: 'Techo de palma' },
              { misak: 'Pɵ', spanish: 'Puerta' },
              { misak: 'Wɵ', spanish: 'Ventana' },
              { misak: 'Sru', spanish: 'Poste central' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'namui-nu-piro',
    namtrik: 'Namui Nu Pirɵ',
    spanish: 'Nuestro Territorio',
    longMisak: 'Namui nu pirɵ, Namunakwek.',
    longSpanish:
      'El territorio es la base de la vida y la identidad Misak: montañas, ríos y caminos que confluyen en el horizonte.',
    subfields: [
      {
        slug: 'montanas',
        misak: 'Namui Pɵ',
        spanish: 'Montañas',
        descriptionMisak: 'Piro pɵ namui.',
        descriptionSpanish: 'Las montañas sagradas del territorio Misak.',
        microfields: [
          {
            slug: 'cerros-sagrados',
            misak: 'Pɵ Namui',
            spanish: 'Cerros sagrados',
            descriptionMisak: 'Piro pɵ namui.',
            descriptionSpanish: 'Cerros de importancia espiritual.',
            terms: [
              { misak: 'Pɵ Ya', spanish: 'Cerro de la casa' },
              { misak: 'Pɵ Ta', spanish: 'Cerro del sol' },
              { misak: 'Pɵ Shɵ', spanish: 'Cerro de la luna' },
              { misak: 'Pɵ Kɵ', spanish: 'Cerro del fuego' },
              { misak: 'Pɵ Ru', spanish: 'Cerro del agua' },
            ],
          },
          {
            slug: 'rios',
            misak: 'Namui Ru',
            spanish: 'Ríos',
            descriptionMisak: 'Pirɵ ru.',
            descriptionSpanish: 'Los ríos que cruzan el territorio.',
            terms: [
              { misak: 'Ru Ya', spanish: 'Río de la casa' },
              { misak: 'Ru Pɵ', spanish: 'Río del cerro' },
              { misak: 'Ru Shɵ', spanish: 'Río de la luna' },
              { misak: 'Ru Kɵ', spanish: 'Río del fuego' },
            ],
          },
        ],
      },
      {
        slug: 'caminos',
        misak: 'Tʊka Piro',
        spanish: 'Caminos',
        descriptionMisak: 'Pirɵ tʊka piro.',
        descriptionSpanish: 'Los caminos que recorren el territorio.',
        microfields: [
          {
            slug: 'caminos-principales',
            misak: 'Tʊka Piro Namui',
            spanish: 'Caminos principales',
            descriptionMisak: 'Namui tʊka piro.',
            descriptionSpanish: 'Rutas principales del territorio.',
            terms: [
              { misak: 'Tu Ya', spanish: 'Camino a la casa' },
              { misak: 'Tu Pɵ', spanish: 'Camino al cerro' },
              { misak: 'Tu Ru', spanish: 'Camino al río' },
              { misak: 'Tu Shɵ', spanish: 'Camino a la luna' },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'ya-tul',
    namtrik: 'Ya Tul',
    spanish: 'La Huerta',
    longMisak: 'Ya tul, namunakwek.',
    longSpanish:
      'La huerta es el cultivo cercano a la casa: plantas, semillas y la tradición agrícola que alimenta a la familia Misak.',
    subfields: [],
  },
  {
    slug: 'kaumpu-ushamera',
    namtrik: 'Kaumpu Ushamera',
    spanish: 'Animales Silvestres',
    longMisak: 'Pirɵ kaumpu ushamera.',
    longSpanish:
      'Los animales silvestres que habitan el territorio Misak, compañeros del bosque y el páramo.',
    subfields: [],
  },
  {
    slug: 'tusrmera',
    namtrik: 'Tusrmera',
    spanish: 'Flora',
    longMisak: 'Pirɵ tusrmera.',
    longSpanish:
      'La vegetación silvestre del territorio: plantas del páramo, el bosque y la orilla de los ríos.',
    subfields: [],
  },
  {
    slug: 'namui-nu-isuik',
    namtrik: 'Namui Nu Isuik',
    spanish: 'Cosmovisión',
    longMisak: 'Namui nu isuik.',
    longSpanish:
      'El pensamiento cíclico y cosmogónico del pueblo Misak: la relación entre el arriba, el abajo y la tierra.',
    subfields: [],
  },
  {
    slug: 'sro-wammera',
    namtrik: 'Srɵ Wammera',
    spanish: 'Neologismos',
    longMisak: 'Srɵ wammera.',
    longSpanish:
      'Palabras nuevas que nacen de la vitalidad lingüística Misak y la adaptación del idioma al presente.',
    subfields: [],
  },
];

/** Upsert idempotente: busca, actualiza si existe, crea si no */
async function upsertByTerm<T>(
  find: () => Promise<{ id: T } | null>,
  create: () => Promise<unknown>,
  update: () => Promise<unknown>,
): Promise<T> {
  const existing = await find();
  if (existing) {
    await update();
    return existing.id;
  }
  await create();
  const created = await find();
  if (!created) throw new Error('upsert falló tras create');
  return created.id;
}

export async function seedDictionaryContent(): Promise<void> {
  console.log(`\n📚 Seeding dictionary content (scale ×${SCALE})...`);

  for (const field of FIELDS) {
    const campoId = await upsertByTerm<bigint>(
      () =>
        prisma.campoSemantico.findFirst({
          where: { namtrikTermino: field.namtrik },
        }),
      () =>
        prisma.campoSemantico.create({
          data: {
            namtrikTermino: field.namtrik,
            namtrikDescripcion: field.longMisak,
            espanolTermino: field.spanish,
            espanolDescripcion: field.longSpanish,
          },
        }),
      () =>
        prisma.campoSemantico.updateMany({
          where: { namtrikTermino: field.namtrik },
          data: {
            namtrikDescripcion: field.longMisak,
            espanolDescripcion: field.longSpanish,
          },
        }),
    );

    for (const sub of field.subfields) {
      const subId = await upsertByTerm<bigint>(
        () =>
          prisma.subcampoSemantico.findFirst({
            where: {
              campoSemanticoId: campoId,
              namtrikTermino: sub.misak,
              deletedAt: null,
            },
          }),
        () =>
          prisma.subcampoSemantico.create({
            data: {
              campoSemanticoId: campoId,
              namtrikTermino: sub.misak,
              namtrikDescripcion: sub.descriptionMisak,
              espanolTermino: sub.spanish,
              espanolDescripcion: sub.descriptionSpanish,
            },
          }),
        () =>
          prisma.subcampoSemantico.updateMany({
            where: {
              campoSemanticoId: campoId,
              namtrikTermino: sub.misak,
              deletedAt: null,
            },
            data: { espanolDescripcion: sub.descriptionSpanish },
          }),
      );

      for (const micro of sub.microfields) {
        const microId = await upsertByTerm<bigint>(
          () =>
            prisma.microcampo.findFirst({
              where: {
                subcampoSemanticoId: subId,
                namtrikTermino: micro.misak,
                deletedAt: null,
              },
            }),
          () =>
            prisma.microcampo.create({
              data: {
                subcampoSemanticoId: subId,
                namtrikTermino: micro.misak,
                namtrikDescripcion: micro.descriptionMisak,
                espanolTermino: micro.spanish,
                espanolDescripcion: micro.descriptionSpanish,
              },
            }),
          () =>
            prisma.microcampo.updateMany({
              where: {
                subcampoSemanticoId: subId,
                namtrikTermino: micro.misak,
                deletedAt: null,
              },
              data: { espanolDescripcion: micro.descriptionSpanish },
            }),
        );

        for (const term of micro.terms) {
          for (let i = 0; i < SCALE; i++) {
            const suffix = i === 0 ? '' : ` ${String(i + 1).padStart(3, '0')}`;
            const namtrikTermino = `${term.misak}${suffix}`;
            const espanolTermino = `${term.spanish}${suffix}`;

            const palabraId = await upsertByTerm<bigint>(
              () => prisma.palabraModelo1.findFirst({ where: { namtrikTermino } }),
              () =>
                prisma.palabraModelo1.create({
                  data: {
                    namtrikTermino,
                    namtrikDescripcion: `${term.spanish} — descripción de observación.`,
                    espanolTermino,
                    espanolDescripcion: `${term.spanish} — descripción de observación.`,
                  },
                }),
              () =>
                prisma.palabraModelo1.updateMany({
                  where: { namtrikTermino },
                  data: {},
                }),
            );

            await prisma.palabraM1Microcampo.upsert({
              where: {
                palabraId_microcampoId: { palabraId, microcampoId: microId },
              },
              create: { palabraId, microcampoId: microId },
              update: {},
            });
          }
        }
      }
    }
  }

  const [campos, subs, micros, palabras] = await Promise.all([
    prisma.campoSemantico.count(),
    prisma.subcampoSemantico.count(),
    prisma.microcampo.count(),
    prisma.palabraModelo1.count(),
  ]);
  console.log(
    `  ✅ Content ready: ${campos} campos · ${subs} subcampos · ${micros} microcampos · ${palabras} términos M1`,
  );
}

// Ejecutable standalone: tsx prisma/seed-dictionary.ts
if (process.argv[1]?.includes('seed-dictionary')) {
  seedDictionaryContent()
    .catch((error) => {
      console.error('❌ Dictionary seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
