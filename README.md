# Finapp Web

Aplicación web de gestión financiera personal construida con React, TypeScript y Vite.

## Funcionalidades principales

- Autenticación de usuarios (login/registro).
- Dashboard con resumen de movimientos y balances.
- Gestión de cuentas, categorías, etiquetas y presupuestos.
- Gestión de transacciones recurrentes.
- Soporte de tema y notificaciones en la UI.

## Stack tecnológico

- React 19 + TypeScript
- Vite 8
- React Router
- TanStack Query
- React Hook Form + Zod
- Zustand
- Tailwind CSS

## Requisitos

- Node.js 20+ (recomendado)
- npm

## Variables de entorno

Crear un archivo `.env` en la raíz con:

```env
VITE_API_URL=http://localhost:8081/api/v1
```

Si no se define, la app usa `http://localhost:8081/api/v1` por defecto.

## Instalación y ejecución

```bash
npm ci
npm run dev
```

La aplicación se levanta en `http://localhost:5173` (por defecto de Vite).

## Scripts disponibles

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: compila TypeScript y genera build de producción.
- `npm run lint`: ejecuta ESLint.
- `npm run preview`: sirve localmente la build de producción.
