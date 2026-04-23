import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { MicrofieldPage } from './MicrofieldPage';

const renderMicrofieldPage = (initialPath = '/campos/ya/fogon/utensilios') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/campos/:fieldSlug/:subfieldSlug/:microfieldSlug"
          element={<MicrofieldPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('MicrofieldPage', () => {
  it('renderiza sin caer', async () => {
    renderMicrofieldPage();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Utensilios del fogón/i })).toBeInTheDocument();
    });
  });
});
