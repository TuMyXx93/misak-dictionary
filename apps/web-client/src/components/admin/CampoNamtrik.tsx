/**
 * CampoNamtrik
 * Spec 006 (R-022) — Componente de entrada de texto para la lengua Namtrik.
 * - Atributo lang="gum"
 * - Normalización Unicode NFC obligatoria
 * - Sin autocapitalización ni autocorrect que alteren los grafemas
 * - Botones de inserción rápida para 'ɵ' y 'Ɵ' con preservación de foco y cursor
 */

import type React from 'react';
import { forwardRef, useImperativeHandle, useRef } from 'react';

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

    const commonClasses = `w-full rounded-xl bg-background-dark/80 border ${
      error ? 'border-red-500' : 'border-primary/20 focus:border-primary'
    } px-3.5 py-2.5 text-white placeholder-text-muted/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors ${className}`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="text-xs font-semibold text-white/90">
              {label}
            </label>
            <span className="text-[11px] text-primary/70 font-mono">lang="gum" (NFC)</span>
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
          <div
            className="flex items-center gap-2"
            role="group"
            aria-label="Caracteres especiales Namtrik"
          >
            <span className="text-xs text-text-muted">Insertar caracter:</span>
            <button
              type="button"
              onClick={() => insertCharacter('ɵ')}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/30 font-display font-bold text-base transition-colors"
              aria-label="Insertar letra minúscula ɵ"
            >
              ɵ
            </button>
            <button
              type="button"
              onClick={() => insertCharacter('Ɵ')}
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/30 font-display font-bold text-base transition-colors"
              aria-label="Insertar letra mayúscula Ɵ"
            >
              Ɵ
            </button>
          </div>
        </div>

        {error ? (
          <span role="alert" className="text-xs text-red-400 font-medium">
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs text-text-muted">{helperText}</span>
        ) : null}
      </div>
    );
  },
);

CampoNamtrik.displayName = 'CampoNamtrik';
