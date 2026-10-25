import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type UserFormData, UserFormFields } from './UserFormFields';

describe('UserFormFields (R-006)', () => {
  const initialData: UserFormData = {
    email: 'test@namtrik.org',
    nombres: 'Taita',
    apellidos: 'Misak',
    tipoIdentificacion: 'CC',
    numeroIdentificacion: '1061789456',
    telefonoContacto: '3124567890',
    username: 'taita.misak',
    direccionResidencia: 'Calle 10 # 4-20',
    barrio: 'La Campana',
    departamento: 'Cauca',
    ciudadMunicipio: 'Silvia',
  };

  const mockOnChange = vi.fn();
  const mockOnVerifyUsername = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza todos los campos con sus etiquetas legibles y prefijo Ej.', () => {
    render(
      <UserFormFields
        data={initialData}
        onChange={mockOnChange}
        onVerifyUsername={mockOnVerifyUsername}
      />,
    );

    expect(screen.getByLabelText(/correo electrónico \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre\(s\) \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apellido\(s\) \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de documento \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/número de documento \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono de contacto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/usuario de acceso \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dirección principal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/barrio \/ sector \/ localidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^departamento$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ciudad \/ municipio/i)).toBeInTheDocument();
  });

  it('permite cambiar los valores llamando a onChange', async () => {
    render(
      <UserFormFields
        data={initialData}
        onChange={mockOnChange}
        onVerifyUsername={mockOnVerifyUsername}
      />,
    );

    const emailInput = screen.getByLabelText(/correo electrónico \*/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'nuevo@namtrik.org');

    expect(mockOnChange).toHaveBeenCalledWith('email', expect.any(String));
  });

  it('permite pulsar el botón de verificar disponibilidad de usuario', async () => {
    render(
      <UserFormFields
        data={initialData}
        onChange={mockOnChange}
        onVerifyUsername={mockOnVerifyUsername}
      />,
    );

    const verifyBtn = screen.getByRole('button', { name: /verificar disponibilidad/i });
    await userEvent.click(verifyBtn);

    expect(mockOnVerifyUsername).toHaveBeenCalledTimes(1);
  });

  it('muestra mensaje de disponible con clase verde si usernameAvailable es true', () => {
    render(
      <UserFormFields
        data={initialData}
        onChange={mockOnChange}
        usernameAvailable={true}
        usernameHelpMessage="Usuario disponible para registro"
      />,
    );

    const message = screen.getByText('Usuario disponible para registro');
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('text-emerald-400');
  });

  it('muestra mensaje de no disponible con clase roja si usernameAvailable es false', () => {
    render(
      <UserFormFields
        data={initialData}
        onChange={mockOnChange}
        usernameAvailable={false}
        usernameHelpMessage="El usuario ya se encuentra registrado"
      />,
    );

    const message = screen.getByText('El usuario ya se encuentra registrado');
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('text-red-400');
  });

  it('muestra texto Verificando... en el botón si isVerifyingUsername es true', () => {
    render(
      <UserFormFields
        data={initialData}
        onChange={mockOnChange}
        onVerifyUsername={mockOnVerifyUsername}
        isVerifyingUsername={true}
      />,
    );

    expect(screen.getByText('Verificando...')).toBeInTheDocument();
  });
});
