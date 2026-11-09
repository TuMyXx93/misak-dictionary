/**
 * UserFormFields.tsx
 * Spec 008 - Gobierno de Usuarios y Recuperación de Sesión (R-006)
 * Grilla unificada en 2 columnas para datos personales, contacto y residencia.
 * Previene el recorte de «Tipo de Documento» y unifica placeholders con «Ej.».
 */

import { AdminFieldLabel, AdminInput, AdminSelect } from '@/components/admin/ui';
import { USER_COPY } from './userCopy';

const TIPOS_IDENTIFICACION = [
  { id: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { id: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { id: 'CE', label: 'Cédula de Extranjería (CE)' },
  { id: 'PASAPORTE', label: 'Pasaporte' },
  { id: 'OTRO', label: 'Otro Documento' },
];

export interface UserFormData {
  email: string;
  nombres: string;
  apellidos: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  telefonoContacto: string;
  username: string;
  direccionResidencia: string;
  barrio: string;
  departamento: string;
  ciudadMunicipio: string;
}

interface UserFormFieldsProps {
  data: UserFormData;
  onChange: (field: keyof UserFormData, value: string) => void;
  onVerifyUsername?: () => void;
  isVerifyingUsername?: boolean;
  usernameAvailable?: boolean | null;
  usernameHelpMessage?: string | null;
  isEditMode?: boolean;
}

export const UserFormFields = ({
  data,
  onChange,
  onVerifyUsername,
  isVerifyingUsername = false,
  usernameAvailable = null,
  usernameHelpMessage = null,
  isEditMode = false,
}: UserFormFieldsProps) => {
  return (
    <div className="space-y-5">
      {/* 1. Correo electrónico (fila completa) */}
      <div>
        <AdminFieldLabel htmlFor="field-email">{USER_COPY.fields.email}</AdminFieldLabel>
        <AdminInput
          id="field-email"
          type="email"
          required
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder={USER_COPY.fields.emailPlaceholder}
          autoComplete="email"
        />
      </div>

      {/* 2. Nombres y Apellidos en 2 columnas equilibradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <AdminFieldLabel htmlFor="field-nombres">{USER_COPY.fields.nombres}</AdminFieldLabel>
          <AdminInput
            id="field-nombres"
            type="text"
            required
            value={data.nombres}
            onChange={(e) => onChange('nombres', e.target.value)}
            placeholder={USER_COPY.fields.nombresPlaceholder}
            autoComplete="given-name"
          />
        </div>
        <div>
          <AdminFieldLabel htmlFor="field-apellidos">{USER_COPY.fields.apellidos}</AdminFieldLabel>
          <AdminInput
            id="field-apellidos"
            type="text"
            required
            value={data.apellidos}
            onChange={(e) => onChange('apellidos', e.target.value)}
            placeholder={USER_COPY.fields.apellidosPlaceholder}
            autoComplete="family-name"
          />
        </div>
      </div>

      {/* 3. Documento y Teléfono en grilla de 2 columnas (previene recorte) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <AdminFieldLabel htmlFor="field-tipo-doc">
            {USER_COPY.fields.tipoDocumento}
          </AdminFieldLabel>
          <AdminSelect
            id="field-tipo-doc"
            value={data.tipoIdentificacion}
            onChange={(e) => onChange('tipoIdentificacion', e.target.value)}
          >
            {TIPOS_IDENTIFICACION.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </AdminSelect>
        </div>
        <div>
          <AdminFieldLabel htmlFor="field-num-doc">
            {USER_COPY.fields.numeroDocumento}
          </AdminFieldLabel>
          <AdminInput
            id="field-num-doc"
            type="text"
            value={data.numeroIdentificacion}
            onChange={(e) => onChange('numeroIdentificacion', e.target.value)}
            placeholder={USER_COPY.fields.numeroDocumentoPlaceholder}
          />
        </div>
      </div>

      <div>
        <AdminFieldLabel htmlFor="field-telefono">{USER_COPY.fields.telefono}</AdminFieldLabel>
        <AdminInput
          id="field-telefono"
          type="tel"
          value={data.telefonoContacto}
          onChange={(e) => onChange('telefonoContacto', e.target.value)}
          placeholder={USER_COPY.fields.telefonoPlaceholder}
          autoComplete="tel"
        />
      </div>

      {/* 4. Usuario de Acceso con acción a la derecha y texto explicativo */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <AdminFieldLabel htmlFor="field-username" className="mb-0">
            {USER_COPY.fields.usernameLabel}
          </AdminFieldLabel>
          {onVerifyUsername && !isEditMode && (
            <button
              type="button"
              onClick={onVerifyUsername}
              disabled={isVerifyingUsername}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
            >
              {isVerifyingUsername ? 'Verificando...' : USER_COPY.fields.usernameAction}
            </button>
          )}
        </div>
        <AdminInput
          id="field-username"
          type="text"
          required
          value={data.username}
          onChange={(e) => onChange('username', e.target.value)}
          placeholder={USER_COPY.fields.usernamePlaceholder}
          autoComplete="username"
        />
        {usernameHelpMessage ? (
          <p
            className={`text-xs mt-1 font-medium ${
              usernameAvailable === true
                ? 'text-emerald-400'
                : usernameAvailable === false
                  ? 'text-red-400'
                  : 'text-slate-400'
            }`}
          >
            {usernameHelpMessage}
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-1">{USER_COPY.fields.usernameHelp}</p>
        )}
      </div>

      {/* 5. Sección Dirección de Residencia */}
      <div className="pt-2 border-t border-slate-700/60">
        <h4 className="text-xs font-bold tracking-wider uppercase text-slate-300 mb-3">
          {USER_COPY.fields.seccionUbicacion}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <AdminFieldLabel htmlFor="field-direccion">
              {USER_COPY.fields.direccionPrincipal}
            </AdminFieldLabel>
            <AdminInput
              id="field-direccion"
              type="text"
              value={data.direccionResidencia}
              onChange={(e) => onChange('direccionResidencia', e.target.value)}
              placeholder={USER_COPY.fields.direccionPrincipalPlaceholder}
              autoComplete="street-address"
            />
          </div>
          <div>
            <AdminFieldLabel htmlFor="field-barrio">{USER_COPY.fields.barrio}</AdminFieldLabel>
            <AdminInput
              id="field-barrio"
              type="text"
              value={data.barrio}
              onChange={(e) => onChange('barrio', e.target.value)}
              placeholder={USER_COPY.fields.barrioPlaceholder}
            />
          </div>
          <div>
            <AdminFieldLabel htmlFor="field-departamento">
              {USER_COPY.fields.departamento}
            </AdminFieldLabel>
            <AdminInput
              id="field-departamento"
              type="text"
              value={data.departamento}
              onChange={(e) => onChange('departamento', e.target.value)}
              placeholder={USER_COPY.fields.departamentoPlaceholder}
            />
          </div>
          <div>
            <AdminFieldLabel htmlFor="field-ciudad">{USER_COPY.fields.ciudad}</AdminFieldLabel>
            <AdminInput
              id="field-ciudad"
              type="text"
              value={data.ciudadMunicipio}
              onChange={(e) => onChange('ciudadMunicipio', e.target.value)}
              placeholder={USER_COPY.fields.ciudadPlaceholder}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
