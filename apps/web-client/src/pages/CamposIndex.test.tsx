import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CamposIndex } from './CamposIndex';

const renderCamposIndex = () =>
  render(
    <MemoryRouter initialEntries={['/campos']}>
      <Routes>
        <Route path="/campos" element={<CamposIndex />} />
      </Routes>
    </MemoryRouter>,
  );

describe('CamposIndex', () => {
  it('renderiza el título principal', async () => {
    renderCamposIndex();
    await waitFor(() => {
      expect(screen.getByText('Campos Semánticos')).toBeInTheDocument();
    });
  });

  it('renderiza la descripción', async () => {
    renderCamposIndex();
    await waitFor(() => {
      expect(
        screen.getByText(/Explora los campos semánticos del diccionario Misak/i),
      ).toBeInTheDocument();
    });
  });

  it('renderiza los 7 campos semánticos', async () => {
    renderCamposIndex();
    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links.length).toBe(7);
    });
  });

  it('muestra el campo Ya como disponible', async () => {
    renderCamposIndex();
    await waitFor(() => {
      expect(screen.getByText('Ya')).toBeInTheDocument();
      expect(screen.getByText('La Casa')).toBeInTheDocument();
    });
  });

  it('muestra el campo Namui Nu Pirɵ como disponible', async () => {
    renderCamposIndex();
    await waitFor(() => {
      expect(screen.getByText('Namui Nu Pirɵ')).toBeInTheDocument();
    });
  });

  it('marca campos coming-soon como no clickeables', async () => {
    renderCamposIndex();
    await waitFor(() => {
      const comingSoonLabels = screen.getAllByText('Próximamente');
      expect(comingSoonLabels.length).toBe(5);
    });
  });
});
