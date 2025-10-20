-- ============================================================================
-- DICCIONARIO CULTURAL MISAK - ESQUEMA DE ADMINISTRACIÓN Y AUTENTICACIÓN
-- ============================================================================
-- Descripción: Schema completo para sistema de usuarios, roles, permisos y auditoría
-- Proyecto: Diccionario Misak - Sistema Administrativo
-- Fecha: 2025-10-20
-- Autor: Tumi Dev Team
--
-- CARACTERÍSTICAS:
-- 1. Sistema de usuarios con roles jerárquicos (ROOT, ADMIN)
-- 2. Autenticación segura con bcrypt y JWT
-- 3. Recuperación de contraseña por email y SMS
-- 4. Auditoría completa de acciones administrativas
-- 5. Sesiones persistentes con expiración
-- 6. Sistema de permisos granular y escalable
-- 7. Soft delete para usuarios
-- 8. Rate limiting a nivel de base de datos
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: SCHEMA ADMINISTRATIVO
-- ============================================================================

-- Schema admin: tablas de autenticación, usuarios y permisos
CREATE SCHEMA IF NOT EXISTS admin;
ALTER SCHEMA admin OWNER TO postgres;

COMMENT ON SCHEMA admin IS 'Sistema de autenticación, usuarios, roles y permisos administrativos';

-- ============================================================================
-- SECCIÓN 2: TIPOS ENUM
-- ============================================================================

-- Roles del sistema (jerarquía: ROOT > ADMIN)
CREATE TYPE admin.user_role AS ENUM ('ROOT', 'ADMIN');

COMMENT ON TYPE admin.user_role IS 'Roles del sistema: ROOT (acceso total) y ADMIN (acceso limitado al diccionario)';

-- Estados de usuario
CREATE TYPE admin.user_status AS ENUM ('ACTIVE', 'DISABLED', 'SUSPENDED', 'PENDING_ACTIVATION');

COMMENT ON TYPE admin.user_status IS 'Estados del usuario: ACTIVE (activo), DISABLED (deshabilitado por ROOT), SUSPENDED (suspendido temporalmente), PENDING_ACTIVATION (pendiente de activación)';

-- Tipos de métodos de recuperación
CREATE TYPE admin.recovery_method AS ENUM ('EMAIL', 'SMS');

COMMENT ON TYPE admin.recovery_method IS 'Métodos de recuperación de contraseña: EMAIL o SMS';

-- Tipos de acciones auditables
CREATE TYPE admin.action_type AS ENUM (
  'CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE',
  'LOGIN', 'LOGOUT', 'FAILED_LOGIN', 
  'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE',
  'USER_CREATE', 'USER_UPDATE', 'USER_DISABLE', 'USER_ENABLE', 'USER_DELETE'
);

COMMENT ON TYPE admin.action_type IS 'Tipos de acciones auditables en el sistema administrativo';

-- ============================================================================
-- SECCIÓN 3: TABLA DE USUARIOS
-- ============================================================================

CREATE TABLE admin.users (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Identificación y autenticación
    username public.citext NOT NULL UNIQUE,
    email public.citext NOT NULL UNIQUE,
    phone varchar(20),
    password_hash text NOT NULL,
    
    -- Información personal
    full_name text NOT NULL,
    
    -- Rol y estado
    role admin.user_role NOT NULL DEFAULT 'ADMIN',
    status admin.user_status NOT NULL DEFAULT 'PENDING_ACTIVATION',
    
    -- Configuración de seguridad
    require_password_change boolean NOT NULL DEFAULT false,
    password_changed_at timestamptz,
    failed_login_attempts int NOT NULL DEFAULT 0,
    locked_until timestamptz,
    last_login_at timestamptz,
    last_login_ip inet,
    
    -- Metadata
    created_by bigint,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    
    -- Constraints
    CONSTRAINT chk_username_length CHECK (char_length(username::text) >= 3),
    CONSTRAINT chk_username_format CHECK (username::text ~* '^[a-z0-9_-]+$'),
    CONSTRAINT chk_email_format CHECK (email::text ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
    CONSTRAINT chk_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{10,15}$'),
    CONSTRAINT chk_full_name_length CHECK (char_length(full_name) >= 2),
    CONSTRAINT chk_failed_attempts_positive CHECK (failed_login_attempts >= 0),
    
    -- Solo puede haber un usuario ROOT
    CONSTRAINT chk_single_root EXCLUDE (role WITH =) WHERE (role = 'ROOT' AND deleted_at IS NULL)
);

ALTER TABLE admin.users OWNER TO postgres;

-- Foreign key auto-referencial (created_by)
ALTER TABLE admin.users
  ADD CONSTRAINT users_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES admin.users(id)
  ON DELETE SET NULL;

COMMENT ON TABLE admin.users IS 'Usuarios del sistema administrativo (ROOT y ADMIN)';
COMMENT ON COLUMN admin.users.password_hash IS 'Hash bcrypt de la contraseña (costo 12)';
COMMENT ON COLUMN admin.users.failed_login_attempts IS 'Contador de intentos fallidos de login (reset al login exitoso)';
COMMENT ON COLUMN admin.users.locked_until IS 'Usuario bloqueado hasta esta fecha por múltiples intentos fallidos';
COMMENT ON COLUMN admin.users.require_password_change IS 'Usuario debe cambiar contraseña en próximo login';

-- Índices
CREATE INDEX idx_users_email ON admin.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON admin.users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON admin.users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON admin.users(role);
CREATE INDEX idx_users_created_at ON admin.users(created_at DESC);

-- Trigger de updated_at
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON admin.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- SECCIÓN 4: TABLA DE SESIONES
-- ============================================================================

CREATE TABLE admin.sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id bigint NOT NULL,
    
    -- Datos de la sesión
    token_hash text NOT NULL UNIQUE,
    refresh_token_hash text,
    
    -- Información de conexión
    ip_address inet NOT NULL,
    user_agent text,
    device_info jsonb,
    
    -- Timestamps y expiración
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    last_activity_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    
    -- Metadata
    CONSTRAINT chk_expires_future CHECK (expires_at > created_at)
);

ALTER TABLE admin.sessions OWNER TO postgres;

-- Foreign keys
ALTER TABLE admin.sessions
  ADD CONSTRAINT sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES admin.users(id)
  ON DELETE CASCADE;

COMMENT ON TABLE admin.sessions IS 'Sesiones activas de usuarios (JWT tokens hasheados)';
COMMENT ON COLUMN admin.sessions.token_hash IS 'Hash SHA-256 del JWT access token';
COMMENT ON COLUMN admin.sessions.refresh_token_hash IS 'Hash SHA-256 del refresh token';
COMMENT ON COLUMN admin.sessions.device_info IS 'Información del dispositivo (navegador, OS, etc.)';

-- Índices
CREATE INDEX idx_sessions_user_id ON admin.sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON admin.sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON admin.sessions(expires_at);
CREATE INDEX idx_sessions_active ON admin.sessions(user_id, expires_at) 
  WHERE revoked_at IS NULL;

-- ============================================================================
-- SECCIÓN 5: TABLA DE TOKENS DE RECUPERACIÓN
-- ============================================================================

CREATE TABLE admin.password_recovery_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id bigint NOT NULL,
    
    -- Token y método
    token_hash text NOT NULL UNIQUE,
    recovery_method admin.recovery_method NOT NULL,
    
    -- Destino (email o teléfono)
    sent_to text NOT NULL,
    
    -- Control de uso
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    attempts int NOT NULL DEFAULT 0,
    
    -- Metadata
    ip_address inet NOT NULL,
    user_agent text,
    
    CONSTRAINT chk_recovery_expires CHECK (expires_at > created_at),
    CONSTRAINT chk_recovery_attempts CHECK (attempts >= 0 AND attempts <= 5)
);

ALTER TABLE admin.password_recovery_tokens OWNER TO postgres;

-- Foreign keys
ALTER TABLE admin.password_recovery_tokens
  ADD CONSTRAINT password_recovery_tokens_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES admin.users(id)
  ON DELETE CASCADE;

COMMENT ON TABLE admin.password_recovery_tokens IS 'Tokens de recuperación de contraseña (expiran en 1 hora)';
COMMENT ON COLUMN admin.password_recovery_tokens.token_hash IS 'Hash SHA-256 del token de 6 dígitos';
COMMENT ON COLUMN admin.password_recovery_tokens.attempts IS 'Intentos de uso del token (máximo 5)';

-- Índices
CREATE INDEX idx_recovery_user_id ON admin.password_recovery_tokens(user_id);
CREATE INDEX idx_recovery_token_hash ON admin.password_recovery_tokens(token_hash);
CREATE INDEX idx_recovery_expires_at ON admin.password_recovery_tokens(expires_at);
CREATE INDEX idx_recovery_unused ON admin.password_recovery_tokens(user_id, expires_at) 
  WHERE used_at IS NULL;

-- ============================================================================
-- SECCIÓN 6: TABLA DE PERMISOS
-- ============================================================================

CREATE TABLE admin.permissions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Identificación del permiso
    code varchar(100) NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    
    -- Categoría (para agrupación en UI)
    category varchar(50) NOT NULL,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_permission_code_format CHECK (code ~ '^[a-z_]+\.[a-z_]+$')
);

ALTER TABLE admin.permissions OWNER TO postgres;

COMMENT ON TABLE admin.permissions IS 'Permisos granulares del sistema (ej: diccionario.create, users.manage)';
COMMENT ON COLUMN admin.permissions.code IS 'Código único del permiso formato: categoria.accion';
COMMENT ON COLUMN admin.permissions.category IS 'Categoría del permiso (diccionario, usuarios, sistema)';

-- Índices
CREATE INDEX idx_permissions_category ON admin.permissions(category);

-- Trigger de updated_at
CREATE TRIGGER trg_permissions_updated_at
  BEFORE UPDATE ON admin.permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- SECCIÓN 7: TABLA DE ROLES Y PERMISOS
-- ============================================================================

CREATE TABLE admin.role_permissions (
    role admin.user_role NOT NULL,
    permission_id bigint NOT NULL,
    
    granted_at timestamptz NOT NULL DEFAULT now(),
    granted_by bigint,
    
    PRIMARY KEY (role, permission_id)
);

ALTER TABLE admin.role_permissions OWNER TO postgres;

-- Foreign keys
ALTER TABLE admin.role_permissions
  ADD CONSTRAINT role_permissions_permission_id_fkey
  FOREIGN KEY (permission_id) REFERENCES admin.permissions(id)
  ON DELETE CASCADE;

ALTER TABLE admin.role_permissions
  ADD CONSTRAINT role_permissions_granted_by_fkey
  FOREIGN KEY (granted_by) REFERENCES admin.users(id)
  ON DELETE SET NULL;

COMMENT ON TABLE admin.role_permissions IS 'Relación entre roles y permisos asignados';

-- Índices
CREATE INDEX idx_role_permissions_role ON admin.role_permissions(role);
CREATE INDEX idx_role_permissions_permission_id ON admin.role_permissions(permission_id);

-- ============================================================================
-- SECCIÓN 8: TABLA DE LOGS ADMINISTRATIVOS
-- ============================================================================

CREATE TABLE admin.admin_logs (
    id bigserial PRIMARY KEY,
    
    -- Quién realizó la acción
    user_id bigint,
    username text NOT NULL,
    user_role admin.user_role NOT NULL,
    
    -- Qué acción se realizó
    action admin.action_type NOT NULL,
    entity_type text NOT NULL,
    entity_id bigint,
    
    -- Detalles de la acción
    description text,
    changes jsonb,
    
    -- Metadata de la solicitud
    ip_address inet NOT NULL,
    user_agent text,
    request_id uuid,
    
    -- Resultado
    success boolean NOT NULL DEFAULT true,
    error_message text,
    
    -- Timestamp
    created_at timestamptz NOT NULL DEFAULT now(),
    
    CONSTRAINT chk_admin_log_error CHECK (
      (success = true AND error_message IS NULL) OR 
      (success = false)
    )
);

ALTER TABLE admin.admin_logs OWNER TO postgres;

-- Foreign keys (SET NULL porque queremos mantener logs aunque se elimine usuario)
ALTER TABLE admin.admin_logs
  ADD CONSTRAINT admin_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES admin.users(id)
  ON DELETE SET NULL;

COMMENT ON TABLE admin.admin_logs IS 'Logs de todas las acciones administrativas realizadas en el sistema';
COMMENT ON COLUMN admin.admin_logs.changes IS 'Cambios realizados en formato JSON (before/after)';
COMMENT ON COLUMN admin.admin_logs.request_id IS 'ID de la solicitud HTTP para correlación con logs de aplicación';

-- Índices para búsquedas comunes
CREATE INDEX idx_admin_logs_user_id ON admin.admin_logs(user_id);
CREATE INDEX idx_admin_logs_action ON admin.admin_logs(action);
CREATE INDEX idx_admin_logs_entity ON admin.admin_logs(entity_type, entity_id);
CREATE INDEX idx_admin_logs_created_at ON admin.admin_logs(created_at DESC);
CREATE INDEX idx_admin_logs_user_created_at ON admin.admin_logs(user_id, created_at DESC);

-- Índice para búsqueda de intentos fallidos de login
CREATE INDEX idx_admin_logs_failed_login ON admin.admin_logs(username, created_at DESC)
  WHERE action = 'FAILED_LOGIN';

-- ============================================================================
-- SECCIÓN 9: FUNCIONES AUXILIARES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Función: Registrar login exitoso
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin.log_successful_login(
  p_user_id bigint,
  p_ip_address inet,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Resetear contador de intentos fallidos
  UPDATE admin.users 
  SET 
    failed_login_attempts = 0,
    locked_until = NULL,
    last_login_at = now(),
    last_login_ip = p_ip_address
  WHERE id = p_user_id;
  
  -- Registrar en logs
  INSERT INTO admin.admin_logs (
    user_id, username, user_role, action, entity_type, entity_id,
    description, ip_address, user_agent, success
  )
  SELECT 
    id, username::text, role, 'LOGIN', 'session', id,
    'Login exitoso', p_ip_address, p_user_agent, true
  FROM admin.users
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION admin.log_successful_login IS 'Registra login exitoso, resetea intentos fallidos y actualiza última conexión';

-- -----------------------------------------------------------------------------
-- Función: Registrar login fallido
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin.log_failed_login(
  p_username text,
  p_ip_address inet,
  p_reason text DEFAULT 'Credenciales inválidas',
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id bigint;
  v_attempts int;
BEGIN
  -- Obtener user_id y actualizar intentos fallidos
  UPDATE admin.users 
  SET failed_login_attempts = failed_login_attempts + 1
  WHERE username = p_username::citext AND deleted_at IS NULL
  RETURNING id, failed_login_attempts INTO v_user_id, v_attempts;
  
  -- Si llegó a 5 intentos, bloquear por 15 minutos
  IF v_attempts >= 5 THEN
    UPDATE admin.users
    SET locked_until = now() + interval '15 minutes'
    WHERE id = v_user_id;
  END IF;
  
  -- Registrar en logs
  INSERT INTO admin.admin_logs (
    user_id, username, user_role, action, entity_type,
    description, ip_address, user_agent, success, error_message
  )
  VALUES (
    v_user_id, p_username, 'ADMIN', 'FAILED_LOGIN', 'session',
    format('Intento %s de login fallido', v_attempts), 
    p_ip_address, p_user_agent, false, p_reason
  );
END;
$$;

COMMENT ON FUNCTION admin.log_failed_login IS 'Registra login fallido, incrementa contador y bloquea usuario tras 5 intentos';

-- -----------------------------------------------------------------------------
-- Función: Limpiar sesiones expiradas
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin.cleanup_expired_sessions()
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM admin.sessions
  WHERE expires_at < now() - interval '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION admin.cleanup_expired_sessions IS 'Elimina sesiones expiradas hace más de 7 días (ejecutar diariamente)';

-- -----------------------------------------------------------------------------
-- Función: Limpiar tokens de recuperación expirados
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin.cleanup_expired_recovery_tokens()
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM admin.password_recovery_tokens
  WHERE expires_at < now() - interval '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION admin.cleanup_expired_recovery_tokens IS 'Elimina tokens de recuperación expirados hace más de 24 horas';

-- -----------------------------------------------------------------------------
-- Función: Verificar permiso de usuario
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin.user_has_permission(
  p_user_id bigint,
  p_permission_code varchar
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_role admin.user_role;
BEGIN
  -- Obtener rol del usuario
  SELECT role INTO v_role
  FROM admin.users
  WHERE id = p_user_id AND deleted_at IS NULL AND status = 'ACTIVE';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- ROOT tiene todos los permisos
  IF v_role = 'ROOT' THEN
    RETURN true;
  END IF;
  
  -- Verificar si el rol tiene el permiso
  RETURN EXISTS (
    SELECT 1
    FROM admin.role_permissions rp
    JOIN admin.permissions p ON rp.permission_id = p.id
    WHERE rp.role = v_role AND p.code = p_permission_code
  );
END;
$$;

COMMENT ON FUNCTION admin.user_has_permission IS 'Verifica si un usuario tiene un permiso específico (ROOT siempre retorna true)';

-- ============================================================================
-- SECCIÓN 10: DATOS INICIALES - PERMISOS
-- ============================================================================

-- Permisos del módulo de diccionario
INSERT INTO admin.permissions (code, name, description, category) VALUES
  ('diccionario.view', 'Ver Diccionario', 'Permite visualizar entradas del diccionario', 'diccionario'),
  ('diccionario.create', 'Crear Entradas', 'Permite crear nuevas entradas en el diccionario', 'diccionario'),
  ('diccionario.update', 'Editar Entradas', 'Permite editar entradas existentes del diccionario', 'diccionario'),
  ('diccionario.delete', 'Eliminar Entradas', 'Permite eliminar entradas del diccionario', 'diccionario'),
  ('diccionario.restore', 'Restaurar Entradas', 'Permite restaurar entradas eliminadas', 'diccionario'),
  
  ('campos.manage', 'Gestionar Campos Semánticos', 'Permite crear, editar y eliminar campos semánticos', 'diccionario'),
  ('subcampos.manage', 'Gestionar Subcampos', 'Permite crear, editar y eliminar subcampos semánticos', 'diccionario'),
  ('microcampos.manage', 'Gestionar Microcampos', 'Permite crear, editar y eliminar microcampos', 'diccionario'),
  
  -- Permisos del módulo de usuarios (solo ROOT)
  ('users.view', 'Ver Usuarios', 'Permite visualizar lista de usuarios administradores', 'usuarios'),
  ('users.create', 'Crear Usuarios', 'Permite crear nuevos usuarios administradores', 'usuarios'),
  ('users.update', 'Editar Usuarios', 'Permite editar usuarios administradores', 'usuarios'),
  ('users.disable', 'Deshabilitar Usuarios', 'Permite deshabilitar usuarios administradores', 'usuarios'),
  ('users.delete', 'Eliminar Usuarios', 'Permite eliminar usuarios administradores', 'usuarios'),
  
  -- Permisos del módulo de sistema (solo ROOT)
  ('system.logs_view', 'Ver Logs del Sistema', 'Permite visualizar logs de auditoría', 'sistema'),
  ('system.logs_export', 'Exportar Logs', 'Permite exportar logs del sistema', 'sistema'),
  ('system.settings_view', 'Ver Configuración', 'Permite ver configuración del sistema', 'sistema'),
  ('system.settings_update', 'Editar Configuración', 'Permite modificar configuración del sistema', 'sistema')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SECCIÓN 11: DATOS INICIALES - ASIGNACIÓN DE PERMISOS A ROLES
-- ============================================================================

-- Permisos para rol ADMIN (solo diccionario)
INSERT INTO admin.role_permissions (role, permission_id, granted_by)
SELECT 
  'ADMIN'::admin.user_role,
  id,
  NULL
FROM admin.permissions
WHERE category = 'diccionario'
ON CONFLICT DO NOTHING;

-- ROOT tiene todos los permisos (se valida en función, no necesita registros)

-- ============================================================================
-- SECCIÓN 12: TRIGGER PARA AUDITORÍA AUTOMÁTICA
-- ============================================================================

-- Trigger para auditar cambios en tabla de usuarios
CREATE OR REPLACE FUNCTION admin.audit_user_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo auditar cambios significativos, no updated_at ni last_login
  IF (TG_OP = 'UPDATE') THEN
    IF (
      OLD.username IS DISTINCT FROM NEW.username OR
      OLD.email IS DISTINCT FROM NEW.email OR
      OLD.role IS DISTINCT FROM NEW.role OR
      OLD.status IS DISTINCT FROM NEW.status OR
      OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
    ) THEN
      INSERT INTO admin.admin_logs (
        user_id, username, user_role, action, entity_type, entity_id,
        description, changes, ip_address
      ) VALUES (
        NEW.id,
        NEW.username::text,
        NEW.role,
        CASE 
          WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN 'SOFT_DELETE'
          WHEN NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN 'RESTORE'
          ELSE 'UPDATE'
        END,
        'user',
        NEW.id,
        'Usuario modificado',
        jsonb_build_object(
          'before', to_jsonb(OLD) - 'password_hash' - 'updated_at' - 'last_login_at',
          'after', to_jsonb(NEW) - 'password_hash' - 'updated_at' - 'last_login_at'
        ),
        '127.0.0.1'::inet
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_user_changes
  AFTER UPDATE ON admin.users
  FOR EACH ROW
  EXECUTE FUNCTION admin.audit_user_changes();

-- ============================================================================
-- SECCIÓN 13: VISTAS ÚTILES
-- ============================================================================

-- Vista de usuarios activos con información resumida
CREATE OR REPLACE VIEW admin.v_active_users AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.full_name,
  u.role,
  u.status,
  u.last_login_at,
  u.created_at,
  creator.username AS created_by_username,
  (
    SELECT count(*) 
    FROM admin.sessions s 
    WHERE s.user_id = u.id 
      AND s.expires_at > now() 
      AND s.revoked_at IS NULL
  ) AS active_sessions_count
FROM admin.users u
LEFT JOIN admin.users creator ON u.created_by = creator.id
WHERE u.deleted_at IS NULL
ORDER BY u.created_at DESC;

COMMENT ON VIEW admin.v_active_users IS 'Vista de usuarios activos con información resumida y conteo de sesiones';

-- Vista de logs recientes con información de usuario
CREATE OR REPLACE VIEW admin.v_recent_logs AS
SELECT 
  l.id,
  l.user_id,
  l.username,
  l.user_role,
  l.action,
  l.entity_type,
  l.entity_id,
  l.description,
  l.success,
  l.error_message,
  l.ip_address,
  l.created_at,
  u.full_name AS user_full_name
FROM admin.admin_logs l
LEFT JOIN admin.users u ON l.user_id = u.id
ORDER BY l.created_at DESC
LIMIT 1000;

COMMENT ON VIEW admin.v_recent_logs IS 'Vista de los últimos 1000 logs con información de usuario';

-- ============================================================================
-- SECCIÓN 14: ÍNDICES DE RENDIMIENTO ADICIONALES
-- ============================================================================

-- Índice compuesto para búsqueda de logs por usuario y fecha
CREATE INDEX idx_admin_logs_user_action_date 
ON admin.admin_logs(user_id, action, created_at DESC);

-- Índice para búsquedas de recuperación de contraseña por email/phone
CREATE INDEX idx_users_email_lower ON admin.users(LOWER(email::text)) 
WHERE deleted_at IS NULL;

-- ============================================================================
-- SECCIÓN 15: POLÍTICAS DE SEGURIDAD (RLS) - OPCIONAL
-- ============================================================================

-- Descomentar para habilitar Row Level Security en producción

/*
-- Habilitar RLS en tablas sensibles
ALTER TABLE admin.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.admin_logs ENABLE ROW LEVEL SECURITY;

-- Política: ROOT puede ver todos los usuarios
CREATE POLICY users_root_all ON admin.users
  FOR ALL TO admin_role
  USING (
    EXISTS (
      SELECT 1 FROM admin.users AS current_user
      WHERE current_user.id = current_setting('app.current_user_id')::bigint
        AND current_user.role = 'ROOT'
    )
  );

-- Política: ADMIN solo puede ver su propia información
CREATE POLICY users_admin_self ON admin.users
  FOR SELECT TO admin_role
  USING (id = current_setting('app.current_user_id')::bigint);
*/

-- ============================================================================
-- FIN DEL ESQUEMA ADMINISTRATIVO
-- ============================================================================
