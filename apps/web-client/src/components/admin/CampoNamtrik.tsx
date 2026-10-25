/**
 * CampoNamtrik
 * Spec 006 (R-022) — Componente de entrada de texto para la lengua Namtrik.
 * - Atributo lang="gum"
 * - Normalización Unicode NFC obligatoria
 * - Sin autocapitalización ni autocorrect que alteren los grafemas
 * - Botones de inserción rápida para 'ɵ' y 'Ɵ' con preservación de foco y cursor
 * - Adaptado armónicamente a Modo Claro y Modo Oscuro del Panel Administrativo Misak
 */

import type React from 'react';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { cn } from '@/utils/cn';

export interface CampoNamtrikProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  multiline?: boolean;
  rows?: number;
  value?: string;
  onChange?: (value: string) => void;
}

export const CampoNamtrik = forwardRef<HTMLInputElement | HTMLTextAreaElement, CampoNamtrikProps>(
  (
    {
      label,
      error,
      helperText,
      multiline = false,
      rows = 3,
      value = '',
      onChange,
      className = '',
      id,
      ...rest
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement | HTMLTextAreaElement);

    const inputId =
      id ?? (label ? `namtrik-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const normalized = e.target.value.normalize('NFC');
      onChange?.(normalized);
    };

    const insertCharacter = (char: 'ɵ' | 'Ɵ') => {
      const el = inputRef.current;
      if (!el) {
        onChange?.((value + char).normalize('NFC'));
        return;
      }

      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;

      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = (before + char + after).normalize('NFC');

      onChange?.(newValue);

      // Restaurar cursor justo después del caracter insertado
      requestAnimationFrame(() => {
        el.focus();
        const nextPos = start + char.length;
        el.setSelectionRange(nextPos, nextPos);
      });
    };

    const commonClasses = cn(
      'w-full rounded-xl bg-[var(--admin-input-bg)] border px-3.5 py-2.5 text-[var(--admin-text)] placeholder-[var(--admin-text-muted)] text-sm min-h-[44px] shadow-2xs focus:outline-none focus:ring-2 transition-colors',
      error
        ? 'border-red-600 focus:ring-red-600 focus:border-red-600'
        : 'border-[var(--admin-control-border)] focus:border-[#0055AA] focus:ring-[#0055AA]',
      className,
    );

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor={inputId}
              className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]"
            >
              {label}
            </label>
            <span className="text-[11px] text-[var(--admin-primary-text)] font-mono">
              lang=&quot;gum&quot; (NFC)
            </span>
          </div>
        )}

        <div className="relative flex flex-col gap-2">
          {multiline ? (
            <textarea
              {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
              id={inputId}
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              lang="gum"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              rows={rows}
              value={value}
              onChange={handleChange}
              className={commonClasses}
            />
          ) : (
            <input
              {...rest}
              id={inputId}
              type="text"
              ref={inputRef as React.RefObject<HTMLInputElement>}
              lang="gum"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              value={value}
              onChange={handleChange}
              className={commonClasses}
            />
          )}

          {/* Botones de inserción rápida para ɵ y Ɵ con tap target mínimo de 44px */}
          <fieldset
            className="flex flex-wrap items-center gap-2 border-0 p-0 m-0"
            aria-label="Caracteres especiales Namtrik"
          >
            <span className="text-xs text-[var(--admin-text-secondary)]">Insertar caracter:</span>
            <button
              type="button"
              onClick={() => insertCharacter('ɵ')}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-xl bg-[var(--admin-primary-soft)] hover:bg-[#0055AA] text-[var(--admin-primary-text)] hover:text-white border border-[#0055AA]/35 font-display font-bold text-base transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0055AA]"
              aria-label="Insertar letra minúscula ɵ"
            >
              ɵ
            </button>
            <button
              type="button"
              onClick={() => insertCharacter('Ɵ')}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-xl bg-[var(--admin-accent-soft)] hover:bg-[#E52D6D] text-[var(--admin-accent-text)] hover:text-white border border-[#E52D6D]/35 font-display font-bold text-base transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E52D6D]"
              aria-label="Insertar letra mayúscula Ɵ"
            >
              Ɵ
            </button>
          </fieldset>
        </div>

        {error ? (
          <span role="alert" className="text-xs text-red-700 dark:text-red-400 font-medium">
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-[var(--admin-text-secondary)]">{helperText}</span>
        ) : null}
      </div>
    );
  },
);

CampoNamtrik.displayName = 'CampoNamtrik';
