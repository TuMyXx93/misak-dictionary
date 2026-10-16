/**
 * GetHomeSlotsUseCase Tests
 * Spec 004 R-013 — Botones de campos semánticos del home persistidos
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CampoSemanticoRepository } from '../../../infrastructure/repositories/CampoSemanticoRepository.js';
import { GetHomeSlotsUseCase } from './GetHomeSlotsUseCase.js';

describe('GetHomeSlotsUseCase', () => {
  let useCase: GetHomeSlotsUseCase;
  let mockCampoSemanticoRepository: CampoSemanticoRepository;

  const mockSlots = [
    {
      id: BigInt(1),
      clave: 'ya',
      etiqueta: 'Ya',
      posicion: 1,
      campo: {
        id: BigInt(10),
        codigo: 'C1',
        slug: 'ya',
        namtrikTermino: 'Ya',
        espanolTermino: 'La casa',
        espanolDescripcion: 'El hogar y el fogón central',
      },
    },
    {
      id: BigInt(5),
      clave: 'namui-nu-piro',
      etiqueta: 'Namui Nu Pirɵ',
      posicion: 5,
      campo: null,
    },
  ];

  beforeEach(() => {
    mockCampoSemanticoRepository = {
      findHomeSlots: vi.fn(),
    } as unknown as CampoSemanticoRepository;

    useCase = new GetHomeSlotsUseCase(mockCampoSemanticoRepository);
  });

  describe('execute', () => {
    it('debería delegar a findHomeSlots y retornar los slots del home', async () => {
      // Arrange
      vi.mocked(mockCampoSemanticoRepository.findHomeSlots).mockResolvedValue(
        // biome-ignore lint/suspicious/noExplicitAny: mock de test
        mockSlots as any,
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockCampoSemanticoRepository.findHomeSlots).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSlots);
    });
  });
});
