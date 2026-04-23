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
      // Use getAllByText and filter to avoid matching the live region
      const headings = screen.getAllByText(/Fogon/).filter((el) => el.tagName === 'H1');
      expect(headings.length).toBe(1);
    });
  });
});
