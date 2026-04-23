import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CampoPage } from './CampoPage';

const renderCampoPage = (initialPath = '/campos/ya') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/campos/:fieldSlug" element={<CampoPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('CampoPage', () => {
  it('renderiza sin caer', async () => {
    renderCampoPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Ya/i })).toBeInTheDocument();
    });
  });
});
