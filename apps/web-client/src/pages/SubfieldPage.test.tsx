import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SubfieldPage } from './SubfieldPage';

const renderSubfieldPage = (initialPath = '/campos/ya/fogon') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/campos/:fieldSlug/:subfieldSlug" element={<SubfieldPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('SubfieldPage', () => {
  it('renderiza sin caer', async () => {
    renderSubfieldPage();
    await waitFor(() => {
      expect(screen.getByText(/Fogon/)).toBeInTheDocument();
    });
  });
});
