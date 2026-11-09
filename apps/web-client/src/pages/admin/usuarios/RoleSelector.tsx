/**
 * RoleSelector.tsx
 * Spec 008 - Gobierno de Usuarios y Recuperación de Sesión (R-006)
 * Selector de roles en español sin scroll interno (elimina el doble scroll del modal)
 * y con badges de nivel de acceso en español sin identificadores técnicos en inglés.
 */

import { AdminBadge } from '@/components/admin/ui';
import { ROLE_CATALOG, type RoleVisualDef } from './roleCatalog';
import { USER_COPY } from './userCopy';

interface RoleSelectorProps {
  selectedRoles: string[];
  onChange: (roles: string[]) => void;
  canManageSuperAdmin?: boolean;
}

export const RoleSelector = ({
  selectedRoles,
  onChange,
  canManageSuperAdmin = true,
}: RoleSelectorProps) => {
  const handleToggle = (roleId: string) => {
    if (roleId === 'super_admin' && !canManageSuperAdmin) {
      return;
    }

    if (selectedRoles.includes(roleId)) {
      // Debe quedar al menos un rol
      if (selectedRoles.length > 1) {
        onChange(selectedRoles.filter((r) => r !== roleId));
      }
    } else {
      onChange([...selectedRoles, roleId]);
    }
  };

  return (
    <div className="pt-2 border-t border-slate-700/60 space-y-3">
      <div>
        <h4 className="text-xs font-bold tracking-wider uppercase text-slate-300">
          {USER_COPY.fields.seccionRoles}
        </h4>
        <p className="text-xs text-slate-400 mt-0.5">{USER_COPY.fields.rolesHelp}</p>
      </div>

      {/* Grid de tarjetas sin scroll interno */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ROLE_CATALOG.map((role: RoleVisualDef) => {
          const isSelected = selectedRoles.includes(role.id);
          const isDisabled = role.id === 'super_admin' && !canManageSuperAdmin;

          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: card container click handler for user convenience
            // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard interaction is handled by the native checkbox
            <div
              key={role.id}
              onClick={(e) => {
                const targetTag = (e.target as HTMLElement).tagName.toLowerCase();
                if (targetTag === 'input' || targetTag === 'label') {
                  return;
                }
                handleToggle(role.id);
              }}
              className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 select-none ${
                isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-slate-900/40 border-slate-800'
                  : isSelected
                    ? 'bg-blue-950/40 border-blue-500/60 shadow-sm cursor-pointer'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900 cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id={`role-check-${role.id}`}
                    aria-label={role.name}
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => handleToggle(role.id)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <label
                    htmlFor={`role-check-${role.id}`}
                    className="text-sm font-bold text-white cursor-pointer select-none"
                  >
                    {role.name}
                  </label>
                </div>
                <AdminBadge
                  tone={role.tone}
                  className="text-[10px] py-0.5 px-2 font-medium shrink-0"
                >
                  {role.badgeLabel}
                </AdminBadge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">{role.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
