/**
 * userCopy.ts
 * Spec 008 - Gobierno de Usuarios y Recuperación de Sesión (R-006)
 * Textos definitivos humanizados, neutrales y sin tecnicismos en inglés.
 */

export const USER_COPY = {
  header: {
    createTitle: 'Crear nuevo usuario',
    createSubtitle:
      'Completa la información para registrar a un nuevo integrante en la plataforma.',
    editTitle: 'Expediente del integrante',
    editSubtitle: 'Actualiza los datos personales, de contacto, residencia y roles asignados.',
  },
  fields: {
    email: 'CORREO ELECTRÓNICO *',
    emailPlaceholder: 'Ej. integrante@misak.edu.co',

    nombres: 'NOMBRE(S) *',
    nombresPlaceholder: 'Ej. Juan Carlos',

    apellidos: 'APELLIDO(S) *',
    apellidosPlaceholder: 'Ej. Gómez Hurtado',

    tipoDocumento: 'TIPO DE DOCUMENTO *',
    numeroDocumento: 'NÚMERO DE DOCUMENTO *',
    numeroDocumentoPlaceholder: 'Ej. 1061789456',

    telefono: 'TELÉFONO DE CONTACTO',
    telefonoPlaceholder: 'Ej. 312 456 7890',

    usernameLabel: 'USUARIO DE ACCESO *',
    usernameAction: '⚡ Verificar disponibilidad',
    usernameHelp:
      'Se genera automáticamente con el nombre y apellido. Podrá iniciar sesión con este usuario o con su correo.',
    usernamePlaceholder: 'Ej. juan.gomez',

    seccionPassword: 'CREDENCIALES DE ACCESO',
    btnGenerarPassword: '🎲 Generar contraseña automática',
    btnCopiarPassword: '📋 Copiar contraseña',
    passwordCopiada: '¡Contraseña copiada al portapapeles!',
    passwordInicial: 'CONTRASEÑA INICIAL * (Mín. 8 caracteres)',
    confirmarPassword: 'CONFIRMAR CONTRASEÑA *',
    passwordPlaceholder: '••••••••',

    seccionUbicacion: 'DIRECCIÓN DE RESIDENCIA',
    direccionPrincipal: 'DIRECCIÓN PRINCIPAL',
    direccionPrincipalPlaceholder: 'Ej. Calle 10 # 4-20',

    barrio: 'BARRIO / SECTOR / LOCALIDAD',
    barrioPlaceholder: 'Ej. Barrio La Campana',

    departamento: 'DEPARTAMENTO',
    departamentoPlaceholder: 'Ej. Cauca',

    ciudad: 'CIUDAD / MUNICIPIO',
    ciudadPlaceholder: 'Ej. Silvia',

    seccionRoles: 'ASIGNACIÓN DE ROLES *',
    rolesHelp:
      'Selecciona uno o más roles según las responsabilidades del integrante en la plataforma.',
  },
  dialogs: {
    suspensionTitle: 'Confirmar suspensión de cuenta',
    suspensionWarning:
      'Al suspender la cuenta, el usuario no podrá acceder al sistema y todas sus sesiones abiertas serán cerradas de inmediato.',
    suspensionReasonLabel: 'Motivo de la suspensión (opcional):',
    suspensionReasonPlaceholder: 'Ej. Salida temporal, inactividad o cambio de funciones...',
    btnConfirmarSuspension: 'Suspender cuenta',
    btnActivarCuenta: 'Reactivar cuenta',
    btnCancelar: 'Cancelar',

    resetPasswordTitle: 'Restablecer contraseña de acceso',
    resetPasswordWarning:
      'Se generará una contraseña temporal segura y se cerrarán todas las sesiones del usuario. El integrante deberá cambiarla obligatoriamente en su próximo inicio de sesión.',
    btnGenerarTemporal: 'Generar clave temporal',
    temporalGeneradaTitle: 'Contraseña temporal generada',
    temporalInstruccion:
      'Copia y entrega esta clave segura al integrante. Por seguridad, no volverá a mostrarse en pantalla.',
    btnCerrar: 'Entendido y cerrar',
  },
} as const;
