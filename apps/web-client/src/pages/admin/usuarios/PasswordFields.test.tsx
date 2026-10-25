import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordFields } from './PasswordFields';

describe('PasswordFields', () => {
  const mockOnPasswordChange = vi.fn();
  const mockOnConfirmPasswordChange = vi.fn();
  const mockOnGenerateAutoPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite alternar visibilidad de contraseña con el botón de ojo', async () => {
    render(
      <PasswordFields
        password="MySecretPassword123#"
        confirmPassword="MySecretPassword123#"
        onPasswordChange={mockOnPasswordChange}
        onConfirmPasswordChange={mockOnConfirmPasswordChange}
        onGenerateAutoPassword={mockOnGenerateAutoPassword}
      />,
    );

    const inputs = screen.getAllByDisplayValue('MySecretPassword123#');
    expect(inputs[0]).toHaveAttribute('type', 'password');
    expect(inputs[1]).toHaveAttribute('type', 'password');

    const toggleButtons = screen.getAllByRole('button', { name: /ver contraseña/i });
    await userEvent.click(toggleButtons[0]);

    expect(inputs[0]).toHaveAttribute('type', 'text');
    expect(inputs[1]).toHaveAttribute('type', 'text');

    const hideButtons = screen.getAllByRole('button', { name: /ocultar contraseña/i });
    await userEvent.click(hideButtons[0]);

    expect(inputs[0]).toHaveAttribute('type', 'password');
    expect(inputs[1]).toHaveAttribute('type', 'password');
  });

  it('llama a onGenerateAutoPassword al pulsar el botón de generar', async () => {
    render(
      <PasswordFields
        password=""
        confirmPassword=""
        onPasswordChange={mockOnPasswordChange}
        onConfirmPasswordChange={mockOnConfirmPasswordChange}
        onGenerateAutoPassword={mockOnGenerateAutoPassword}
      />,
    );

    const generateBtn = screen.getByRole('button', {
      name: /generar contraseña automática/i,
    });
    await userEvent.click(generateBtn);

    expect(mockOnGenerateAutoPassword).toHaveBeenCalledTimes(1);
  });

  it('permite copiar la contraseña al portapapeles cuando existe valor', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    render(
      <PasswordFields
        password="SecurePass999#"
        confirmPassword="SecurePass999#"
        onPasswordChange={mockOnPasswordChange}
        onConfirmPasswordChange={mockOnConfirmPasswordChange}
        onGenerateAutoPassword={mockOnGenerateAutoPassword}
      />,
    );

    const copyBtn = screen.getByRole('button', { name: /copiar contraseña/i });
    await userEvent.click(copyBtn);

    expect(writeTextSpy).toHaveBeenCalledWith('SecurePass999#');
    expect(screen.getByText('✓ Copiada')).toBeInTheDocument();
  });

  it('permite escribir en ambos campos de contraseña llamando a sus callbacks', async () => {
    render(
      <PasswordFields
        password=""
        confirmPassword=""
        onPasswordChange={mockOnPasswordChange}
        onConfirmPasswordChange={mockOnConfirmPasswordChange}
        onGenerateAutoPassword={mockOnGenerateAutoPassword}
      />,
    );

    const passInput = screen.getByLabelText(/contraseña inicial/i);
    await userEvent.type(passInput, 'MiClave123!');
    expect(mockOnPasswordChange).toHaveBeenCalled();

    const confirmInput = screen.getByLabelText(/confirmar contraseña/i);
    await userEvent.type(confirmInput, 'MiClave123!');
    expect(mockOnConfirmPasswordChange).toHaveBeenCalled();
  });
});
