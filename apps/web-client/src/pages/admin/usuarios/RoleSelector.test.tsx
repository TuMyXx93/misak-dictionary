import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleSelector } from './RoleSelector';

describe('RoleSelector (R-006)', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza los 6 roles sin scroll interno', () => {
    render(
      <RoleSelector
        selectedRoles={['content_admin']}
        onChange={mockOnChange}
        canManageSuperAdmin={true}
      />,
    );

    expect(screen.getByText('Superadministrador')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Revisor Cultural')).toBeInTheDocument();
    expect(screen.getByText('Editor de Contenido')).toBeInTheDocument();
    expect(screen.getByText('Gestor de Medios')).toBeInTheDocument();
    expect(screen.getByText('Analista')).toBeInTheDocument();
  });

  it('permite seleccionar un rol no seleccionado', async () => {
    render(
      <RoleSelector
        selectedRoles={['content_admin']}
        onChange={mockOnChange}
        canManageSuperAdmin={true}
      />,
    );

    const reviewerCheckbox = screen.getByLabelText('Revisor Cultural');
    await userEvent.click(reviewerCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(['content_admin', 'cultural_reviewer']);
  });

  it('permite deseleccionar un rol si hay más de uno seleccionado', async () => {
    render(
      <RoleSelector
        selectedRoles={['content_admin', 'cultural_reviewer']}
        onChange={mockOnChange}
        canManageSuperAdmin={true}
      />,
    );

    const reviewerCheckbox = screen.getByLabelText('Revisor Cultural');
    await userEvent.click(reviewerCheckbox);

    expect(mockOnChange).toHaveBeenCalledWith(['content_admin']);
  });

  it('impide deseleccionar el único rol seleccionado para evitar usuarios sin permisos', async () => {
    render(
      <RoleSelector
        selectedRoles={['content_admin']}
        onChange={mockOnChange}
        canManageSuperAdmin={true}
      />,
    );

    const contentCheckbox = screen.getByLabelText('Editor de Contenido');
    await userEvent.click(contentCheckbox);

    // No debe haber llamado onChange porque solo había 1 rol
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('deshabilita la opción de Superadministrador si canManageSuperAdmin es false', async () => {
    render(
      <RoleSelector
        selectedRoles={['content_admin']}
        onChange={mockOnChange}
        canManageSuperAdmin={false}
      />,
    );

    const superAdminCheckbox = screen.getByLabelText('Superadministrador');
    expect(superAdminCheckbox).toBeDisabled();

    const superAdminCard = superAdminCheckbox.closest('div.p-3');
    if (!superAdminCard) throw new Error('SuperAdmin card not found');
    await userEvent.click(superAdminCard);
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
