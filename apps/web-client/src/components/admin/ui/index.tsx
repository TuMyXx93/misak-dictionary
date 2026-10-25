/**
 * Primitivos UI del Panel Administrativo — Sistema de Diseño Misak
 *
 * Garantiza contraste WCAG 2.2 AA (>= 4.5:1 texto, >= 3:1 bordes de control)
 * tanto en modo Light como en modo Dark usando los 4 colores oficiales Misak:
 * #E52D6D (Magenta), #0055AA (Azul), #FFFFFF (Blanco), #000000 (Negro).
 */

import {
  type ButtonHTMLAttributes,
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
  useId,
  useRef,
} from 'react';
import { type AdminThemeMode, useAdminTheme } from '@/contexts/AdminThemeContext';
import { cn } from '@/utils/cn';

/* ========================================================================== *
 * 1. Superficies y Encabezados de Página
 * ========================================================================== */

export interface AdminSurfaceProps {
  children: ReactNode;
  variant?: 'default' | 'raised' | 'muted';
  className?: string;
}

export const AdminSurface = ({ children, variant = 'default', className }: AdminSurfaceProps) => {
  const bgMap = {
    default: 'bg-[var(--admin-surface)]',
    raised: 'bg-[var(--admin-surface-raised)]',
    muted: 'bg-[var(--admin-surface-muted)]',
  } as const;

  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--admin-border)] text-[var(--admin-text)] shadow-xs',
        bgMap[variant],
        className,
      )}
    >
      {children}
    </div>
  );
};

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

export const AdminPageHeader = ({
  title,
  description,
  eyebrow,
  actions,
  className,
}: AdminPageHeaderProps) => (
  <div
    className={cn(
      'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[var(--admin-border)]',
      className,
    )}
  >
    <div className="min-w-0">
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--admin-accent-text)] mb-1">
          <span className="w-2 h-2 rounded-full bg-[#E52D6D]" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[var(--admin-text)]">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm text-[var(--admin-text-secondary)] max-w-3xl">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
  </div>
);

/* ========================================================================== *
 * 2. Botones e Insignias Semánticas Misak
 * ========================================================================== */

export type AdminButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type AdminButtonSize = 'sm' | 'md' | 'lg';

export interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
}

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ variant = 'primary', size = 'md', className, type = 'button', ...props }, ref) => {
    const variantStyles: Record<AdminButtonVariant, string> = {
      // #0055AA con texto #FFFFFF -> Contraste 7.35:1 (WCAG AAA) en Light y Dark
      primary:
        'bg-[#0055AA] hover:bg-[#004488] text-white border border-[#0055AA] shadow-xs focus-visible:ring-[#0055AA]',
      // #C41E58 (versión oscurecida del Misak Magenta #E52D6D para garantizar contraste WCAG AA >= 4.5:1 con texto blanco)
      accent:
        'bg-[#C41E58] hover:bg-[#a61749] text-white border border-[#C41E58] shadow-xs focus-visible:ring-[#C41E58]',
      secondary:
        'bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)] text-[var(--admin-text)] border border-[var(--admin-control-border)] focus-visible:ring-[#0055AA]',
      ghost:
        'bg-transparent hover:bg-[var(--admin-surface-muted)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] border border-transparent focus-visible:ring-[#0055AA]',
      danger:
        'bg-red-700 hover:bg-red-800 text-white border border-red-700 shadow-xs focus-visible:ring-red-600',
    };

    const sizeStyles: Record<AdminButtonSize, string> = {
      sm: 'min-h-[38px] px-3 py-1.5 text-xs rounded-xl gap-1.5',
      md: 'min-h-[44px] px-4 py-2 text-sm rounded-xl gap-2',
      lg: 'min-h-[48px] px-5 py-2.5 text-base rounded-xl gap-2',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);
AdminButton.displayName = 'AdminButton';

export type AdminBadgeTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

export interface AdminBadgeProps {
  children: ReactNode;
  tone?: AdminBadgeTone;
  className?: string;
}

export const AdminBadge = ({ children, tone = 'neutral', className }: AdminBadgeProps) => {
  const toneStyles: Record<AdminBadgeTone, string> = {
    primary: 'bg-[var(--admin-primary-soft)] text-[var(--admin-primary-text)] border-[#0055AA]/35',
    accent: 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)] border-[#E52D6D]/35',
    success: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-600/35',
    warning: 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-600/40',
    danger: 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-600/35',
    neutral:
      'bg-[var(--admin-surface-muted)] text-[var(--admin-text-secondary)] border-[var(--admin-border)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
};

/* ========================================================================== *
 * 3. Controles de Formulario (Contraste Garantizado en Light y Dark)
 * ========================================================================== */

const CONTROL_BASE_CLASSES =
  'block w-full rounded-xl border border-[var(--admin-control-border)] bg-[var(--admin-input-bg)] text-[var(--admin-text)] px-3.5 py-2.5 text-sm min-h-[44px] shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#0055AA] focus:border-[#0055AA] disabled:opacity-60';

export interface AdminFieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor: string;
}

export const AdminFieldLabel = ({
  htmlFor,
  className,
  children,
  ...props
}: AdminFieldLabelProps) => (
  <label
    htmlFor={htmlFor}
    className={cn(
      'block text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)] mb-1.5',
      className,
    )}
    {...props}
  >
    {children}
  </label>
);

export const AdminInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(CONTROL_BASE_CLASSES, className)} {...props} />
  ),
);
AdminInput.displayName = 'AdminInput';

export const AdminSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(CONTROL_BASE_CLASSES, 'pr-8', className)} {...props}>
      {children}
    </select>
  ),
);
AdminSelect.displayName = 'AdminSelect';

export const AdminTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(CONTROL_BASE_CLASSES, 'min-h-[96px] py-2.5', className)}
    {...props}
  />
));
AdminTextarea.displayName = 'AdminTextarea';

/* ========================================================================== *
 * 4. Modal Nativo <dialog> con Light-Dismiss y Soporte Safari / jsdom
 * ========================================================================== */

export interface AdminDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  titleId?: string;
  describedById?: string;
  maxWidthClass?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export const AdminDialog = ({
  isOpen,
  onClose,
  title,
  subtitle,
  titleId: customTitleId,
  describedById,
  maxWidthClass = 'max-w-2xl',
  footer,
  children,
}: AdminDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closedOnceRef = useRef(false);
  const generatedTitleId = useId();
  const titleId = customTitleId ?? generatedTitleId;
  const { mode } = useAdminTheme();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      closedOnceRef.current = false;
      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) {
          try {
            dialog.showModal();
          } catch {
            dialog.setAttribute('open', '');
          }
        }
      } else {
        dialog.setAttribute('open', '');
      }
      if (!dialog.open) {
        dialog.setAttribute('open', '');
      }
    } else if (dialog.open) {
      if (typeof dialog.close === 'function') {
        try {
          dialog.close();
        } catch {
          dialog.removeAttribute('open');
        }
      } else {
        dialog.removeAttribute('open');
      }
    }
  }, [isOpen]);

  // Fallback light-dismiss en backdrop para navegadores sin soporte nativo de closedby="any" (p. ej. Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;

    const safeClose = () => {
      if (closedOnceRef.current) return;
      closedOnceRef.current = true;
      onClose();
    };

    const handleBackdropClick = (event: MouseEvent) => {
      if ('closedBy' in HTMLDialogElement.prototype) return;
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const insideBox =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!insideBox) {
        safeClose();
      }
    };

    const handleNativeClose = () => {
      safeClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        safeClose();
      }
    };

    dialog.addEventListener('click', handleBackdropClick);
    dialog.addEventListener('close', handleNativeClose);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('click', handleBackdropClick);
      dialog.removeEventListener('close', handleNativeClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={describedById}
      data-admin-theme={mode}
      {...({ closedby: 'any' } as Record<string, string>)}
      className={cn(
        'misak-admin-scope m-auto w-[calc(100%-1.5rem)] sm:w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] p-0 shadow-2xl max-h-[90dvh] overflow-hidden flex flex-col',
        maxWidthClass,
      )}
    >
      {/* Barra superior cuatricolor Misak */}
      <div className="grid grid-cols-4 h-1.5 w-full shrink-0" aria-hidden="true">
        <span className="bg-[#E52D6D]" />
        <span className="bg-[#0055AA]" />
        <span className="bg-[#FFFFFF] border-b border-black/10" />
        <span className="bg-[#000000]" />
      </div>

      {/* Header sticky */}
      <div className="px-5 py-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] flex items-start justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-display font-bold text-[var(--admin-text)]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Descartar diálogo"
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface-muted)] transition-colors shrink-0 cursor-pointer"
        >
          <svg
            aria-hidden="true"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Cuerpo con scroll independiente */}
      <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>

      {/* Footer sticky opcional */}
      {footer && (
        <div className="px-5 py-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface-muted)] flex flex-wrap items-center justify-end gap-2.5 shrink-0">
          {footer}
        </div>
      )}
    </dialog>
  );
};

/* ========================================================================== *
 * 5. Controladores Exclusivos de Modo Claro / Oscuro en el Panel Admin
 * ========================================================================== */

export const AdminThemeQuickToggle = ({ className }: { className?: string }) => {
  const { resolvedTheme, toggleLightDark } = useAdminTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleLightDark}
      aria-label={isDark ? 'Cambiar panel a modo claro' : 'Cambiar panel a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={cn(
        'inline-flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--admin-control-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)] text-[var(--admin-text)] transition-colors cursor-pointer',
        className,
      )}
    >
      {isDark ? (
        <>
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-[#E52D6D]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="4" />
            <path
              strokeLinecap="round"
              d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
            />
          </svg>
          <span className="hidden sm:inline">Modo Claro</span>
        </>
      ) : (
        <>
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-[#0055AA]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            />
          </svg>
          <span className="hidden sm:inline">Modo Oscuro</span>
        </>
      )}
    </button>
  );
};

export const AdminThemeTriStateSelector = () => {
  const { mode, setMode, systemPrefersDark } = useAdminTheme();

  const options: Array<{
    id: AdminThemeMode;
    label: string;
    description: string;
  }> = [
    {
      id: 'light',
      label: 'Modo Claro',
      description: 'Lienzo blanco #FFFFFF con tipografía #000000 y acentos #0055AA / #E52D6D.',
    },
    {
      id: 'dark',
      label: 'Modo Oscuro',
      description: 'Lienzo negro #000000 de baja fatiga visual con contraste luminoso Misak.',
    },
    {
      id: 'system',
      label: `Sistema (${systemPrefersDark ? 'actualmente oscuro' : 'actualmente claro'})`,
      description: 'Sincroniza automáticamente la apariencia del panel con tu dispositivo.',
    },
  ];

  const groupName = useId();

  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="sr-only">Tema del panel administrativo</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const selected = mode === opt.id;
          const radioId = `${groupName}-${opt.id}`;
          return (
            <label
              key={opt.id}
              htmlFor={radioId}
              className={cn(
                'text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 min-h-[104px] focus-within:ring-2 focus-within:ring-[#0055AA]',
                selected
                  ? 'border-[#0055AA] ring-2 ring-[#0055AA] bg-[var(--admin-primary-soft)]'
                  : 'border-[var(--admin-control-border)] bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-muted)]',
              )}
            >
              <input
                id={radioId}
                type="radio"
                name={groupName}
                value={opt.id}
                checked={selected}
                onChange={() => setMode(opt.id)}
                className="sr-only"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-[var(--admin-text)]">{opt.label}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    selected ? 'border-[#0055AA]' : 'border-[var(--admin-control-border)]',
                  )}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-[#E52D6D]" />}
                </span>
              </div>
              <p className="text-xs text-[var(--admin-text-secondary)] leading-relaxed">
                {opt.description}
              </p>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
