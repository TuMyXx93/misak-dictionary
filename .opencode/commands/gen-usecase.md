---
description: Genera un use case completo con Clean Architecture (domain, application, infrastructure)
agent: backend
---

Genera un use case llamado **$1** siguiendo Clean Architecture para el backend del proyecto Misak Dictionary.

Antes de generar, carga el skill `clean-arch-usecase` para seguir el patron establecido.

Requisitos:

1. Crear la entity en `src/domain/entities/` (si no existe)
2. Crear o actualizar el port interface en `src/domain/ports/` con prefijo `I`
3. Crear el DTO con Zod schema en `src/application/dtos/`
4. Crear el use case en `src/application/use-cases/<dominio>/`
5. Crear el repository Prisma en `src/infrastructure/repositories/` (si no existe)
6. Crear o actualizar el controller en `src/presentation/controllers/`
7. Configurar el wiring de DI en el archivo de rutas correspondiente
8. Todos los imports deben usar extensiones `.js`
9. Todas las funciones deben tener return types explicitos
10. Incluir JSDoc en cada archivo

Contexto adicional del usuario: $ARGUMENTS
