<p align="center"> 
  <img src="public/favicon.svg" width="80" alt="CoreAsset Logo" />
</p>

<h1 align="center">CoreAsset — Inventory Management Web Client</h1>

<p align="center">
  <strong>White-Label Administration Panel · Asset Tracking · Role-Based Access Control</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Astro-6.4-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/SOC_2-Aligned-green?style=flat-square" alt="SOC 2" />
  <img src="https://img.shields.io/badge/OWASP-Top_10-orange?style=flat-square" alt="OWASP" />
  <img src="https://img.shields.io/badge/WCAG-2.1_AA-blue?style=flat-square" alt="WCAG 2.1" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Islands Architecture — Why Astro](#islands-architecture--why-astro)
  - [Decoupled Frontend](#decoupled-frontend)
- [Security Standards & Compliance](#security-standards--compliance)
  - [Session Security — Cookies over JWT](#session-security--cookies-over-jwt)
  - [CSRF Defense & HTTP Client](#csrf-defense--http-client)
  - [Strict Session Lifecycles](#strict-session-lifecycles)
  - [SOC 2 & OWASP Compliance](#soc-2--owasp-compliance)
  - [Accessibility as a Structural Security Metric](#accessibility-as-a-structural-security-metric)
- [UI/UX Design System](#uiux-design-system)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Available Commands](#available-commands)

---

## Overview

**CoreAsset-InventoryManagement-web-client** is the decoupled presentation layer (UI) of an enterprise white-label administration panel engineered for **asset tracking** and **role-based access control (RBAC)**. It is built as a zero-JavaScript-by-default Astro application that selectively hydrates interactive React islands only where complex client-side state is required.

This client communicates exclusively with its headless API counterpart over session-authenticated HTTP, never storing sensitive tokens on the client side. Every architectural decision — from the rendering model to the cookie strategy — is driven by a security-first, performance-first philosophy.

---

## Architecture

### Islands Architecture — Why Astro

This project implements the **Islands Architecture** pattern using [Astro](https://astro.build/) as the meta-framework.

**The rationale:**

| Concern | Decision | Why |
|:--------|:---------|:----|
| **Routing & Layouts** | Astro (static / zero-JS) | Pages and layouts are rendered as pure HTML with no client-side JavaScript bundle. This eliminates entire categories of attack surface (DOM-based XSS) while delivering sub-second Time to Interactive (TTI). |
| **Interactive State** | React Islands (`client:load`, `client:visible`) | Complex stateful UI — data tables with sorting/filtering, multi-step forms, authentication context providers — is isolated into strict React components that hydrate independently. |
| **Styling** | Tailwind CSS v4 via Vite plugin | Utility-first CSS is compiled at build time. No runtime CSS-in-JS overhead. |
| **Type Safety** | TypeScript (`strict` mode) | End-to-end type safety from API response schemas to component props, using Astro's `strict` tsconfig preset. |

> **Key insight:** By defaulting to zero JavaScript and opting in only where interaction demands it, we ship less code, reduce attack surface, and achieve better Core Web Vitals — all without sacrificing the rich interactivity that React provides.

### Decoupled Frontend

This repository contains **only the presentation layer**. The backend — built with **Django** and **PostgreSQL** — lives in a separate repository:

🔗 **Backend API:** [`CoreAsset-InventoryManagement-headless-api`](https://github.com/CrisLottz/CoreAsset-InventoryManagement-headless-api)

```
┌─────────────────────────┐         HTTPS / JSON          ┌─────────────────────────┐
│                         │ ◄──────────────────────────── │                         │
│   Web Client (Astro)    │         Session Cookies        │  Headless API (Django)  │
│   This Repository       │ ────────────────────────────► │  PostgreSQL             │
│                         │         CSRF Token             │                         │
└─────────────────────────┘                                └─────────────────────────┘
```

**Why decouple?**

- **Independent deployment cadence** — Frontend and backend can be versioned, tested, and deployed independently.
- **Team autonomy** — UI engineers and backend engineers work in parallel without merge conflicts or shared release cycles.
- **White-label flexibility** — The same API can power multiple branded frontends without backend changes.

---

## Security Standards & Compliance

### Session Security — Cookies over JWT

> **Decision:** The client **never** stores authentication tokens in `localStorage` or `sessionStorage`.

All session management is handled via **`HttpOnly` session cookies** set by the Django backend. The browser automatically attaches these cookies to every request to the API origin.

**Why this matters:**

- `HttpOnly` cookies are **inaccessible to JavaScript**, which means even if an attacker achieves script injection (XSS), they **cannot exfiltrate the session credential**.
- Unlike JWTs in `localStorage`, cookies with `HttpOnly`, `Secure`, and `SameSite` attributes provide defense-in-depth against token theft.

```
┌──────────┐     POST /api/auth/login/     ┌──────────┐
│  Browser │  ───────────────────────────►  │  Django  │
│          │                                │          │
│          │  ◄─── Set-Cookie: sessionid    │          │
│          │       HttpOnly; Secure;        │          │
│          │       SameSite=Lax             │          │
└──────────┘                                └──────────┘
```

### CSRF Defense & HTTP Client

Every HTTP request in this application is routed through a **centralized Axios interceptor** that enforces Cross-Site Request Forgery (CSRF) protection.

**How it works:**

1. Django sets a `csrftoken` cookie (readable by JavaScript — this is by design, it is not the session cookie).
2. The Axios request interceptor reads the `csrftoken` value from `document.cookie`.
3. For every **state-mutating request** (`POST`, `PUT`, `PATCH`, `DELETE`), the interceptor injects the token into the `X-CSRFToken` HTTP header.
4. Django validates that the header value matches the cookie value, confirming the request originated from the legitimate client.

```typescript
// Centralized Axios instance — conceptual reference
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PUBLIC_API_BASE_URL,
  withCredentials: true, // Attach cookies on every request
});

api.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];

  if (csrfToken && config.method !== 'get') {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});
```

> **Why a centralized interceptor?** By routing all API calls through a single Axios instance, we guarantee that CSRF protection is **never accidentally omitted** from a request. There is no "opt-in" — it is structural.

### Strict Session Lifecycles

The Axios **response interceptor** enforces strict session lifecycle management:

| HTTP Status | Action | Rationale |
|:------------|:-------|:----------|
| `401 Unauthorized` | Purge React auth state → Redirect to `/login` | Session has expired or was never established. Prevents UI from displaying stale data under an invalid session. |
| `403 Forbidden` | Purge React auth state → Redirect to `/login` | The server explicitly revoked access. The client must not cache or display any privileged data. |

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // 1. Purge React AuthContext state
      // 2. Clear any cached data
      // 3. Force hard redirect to /login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

> **Why force a hard redirect?** A client-side `router.push()` might preserve stale state in React's memory. A full `window.location.href` navigation destroys the JavaScript execution context entirely, guaranteeing no residual data remains in memory.

### SOC 2 & OWASP Compliance

This architecture is designed to align with the following compliance frameworks:

| Framework | Control | How This Project Addresses It |
|:----------|:--------|:------------------------------|
| **OWASP Top 10 — A7:2017 (XSS)** | Prevent cross-site scripting | `HttpOnly` session cookies prevent token exfiltration. Astro's zero-JS-by-default model minimizes DOM surface. React's built-in JSX escaping prevents injection in interactive islands. |
| **OWASP Top 10 — A8:2017 (CSRF)** | Prevent cross-site request forgery | Django's CSRF middleware + the centralized `X-CSRFToken` header injection via the Axios interceptor validate request origin authenticity on every mutation. |
| **SOC 2 — CC6.1** | Logical access controls | RBAC is enforced at the API layer. The UI conditionally renders based on permissions propagated through React Context, but **never trusts the client** — all authorization is re-validated server-side. |
| **SOC 2 — CC7.2** | System monitoring & incident response | `401`/`403` interception ensures that compromised or expired sessions are immediately terminated on the client, reducing the window of exposure. |

### Accessibility as a Structural Security Metric

Accessibility is **not optional** — it is a structural security and compliance obligation.

| Standard | Commitment |
|:---------|:-----------|
| **WCAG 2.1 Level AA** | All interactive components must meet AA contrast ratios, keyboard navigability, and screen reader compatibility. |
| **ARIA Compliance** | React islands use semantic HTML and ARIA attributes to ensure assistive technology compatibility. |
| **A11y Testing** | Automated accessibility audits are integrated into the CI pipeline. |

> **Why is A11y a security metric?** Systems that are inaccessible exclude users from safety-critical operations (e.g., an administrator who relies on a screen reader cannot revoke a compromised asset). Inaccessibility in a RBAC system is a **privilege escalation vector by omission**.

### SSR Route Protection (Astro Middleware)

The application implements Server-Side Rendering (SSR) route protection via Astro Middleware (`src/middleware.ts`). Before any protected route is sent to the browser, the middleware checks for the presence of the `sessionid` cookie.

- **Unauthenticated users** hitting a protected route (like `/dashboard`) are instantly intercepted at the server level (Status `302`) and redirected to `/login`. They never download the JS bundle or HTML layout of the dashboard.
- **Authenticated users** hitting public routes (like `/login`) are automatically redirected to their dashboard.

This guarantees that the client application never leaks protected layouts or attempts unauthorized API calls during initial load.

---

## UI/UX Design System

| Principle | Implementation |
|:----------|:---------------|
| **12-Column Grid** | All layouts are built on a responsive 12-column grid system that ensures consistent alignment across breakpoints. |
| **Tailwind CSS v4** | Utility-first styling compiled at build time via the `@tailwindcss/vite` plugin. No runtime CSS overhead. Semantic design tokens are defined through Tailwind's theme configuration. |
| **Whitespace-First Design** | Generous padding, margin, and breathing room between elements. Density is avoided — clarity is the priority. |
| **Strict Multi-State Feedback** | Every interactive element provides explicit visual feedback for all states: `default`, `hover`, `focus`, `active`, `disabled`, `loading`, `error`, and `success`. No silent failures. |

---

## Prerequisites

| Tool | Version | Notes |
|:-----|:--------|:------|
| **Node.js** | `>= 22.12.0` | Required. See `engines` field in `package.json`. |
| **npm** | `>= 10.x` | Ships with Node.js 22+. |
| **Git** | `>= 2.40` | For cloning and version control. |

> **Recommended:** Use [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage Node.js versions.

---

## Environment Setup

Create a `.env` file in the project root with the following variables:

```dotenv
# ──────────────────────────────────────────────
# API Configuration
# ──────────────────────────────────────────────
# Base URL for the Django headless API.
# Must include the protocol and exclude a trailing slash.
PUBLIC_API_BASE_URL=http://localhost:8000

# ──────────────────────────────────────────────
# Application Configuration
# ──────────────────────────────────────────────
# The port on which the Astro dev server runs.
# Default: 4321
PUBLIC_APP_PORT=4321
```

> **Note:** Only variables prefixed with `PUBLIC_` are exposed to client-side code in Astro. Never prefix sensitive values (secrets, API keys) with `PUBLIC_`.

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/CrisLottz/CoreAsset-InventoryManagement-web-client.git
cd CoreAsset-InventoryManagement-web-client

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API URL and configuration

# 4. Start the development server
npm run dev
```

The application will be available at `http://localhost:4321`.

> **Important:** The backend API must be running for authentication and data features to function. See the [backend repository](https://github.com/CrisLottz/CoreAsset-InventoryManagement-headless-api) for setup instructions.

---

## Project Structure

```
CoreAsset-InventoryManagement-web-client/
├── public/                          # Static assets (served as-is)
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── middleware.ts                # Astro SSR route protection (session interception)
│   ├── components/                  # Reusable UI components
│   │   ├── react/                   # Interactive React islands (hydrated)
│   │   │   ├── auth/                # AuthProvider, LoginForm, ProtectedRoute
│   │   │   ├── tables/              # DataTable, Pagination, Filters
│   │   │   └── forms/               # FormBuilder, Validation, Inputs
│   │   └── astro/                   # Static Astro components (zero-JS)
│   │       ├── layout/              # Header, Sidebar, Footer, Breadcrumbs
│   │       └── ui/                  # Card, Badge, Alert, Skeleton
│   ├── layouts/                     # Page-level layout templates
│   │   ├── BaseLayout.astro         # HTML shell, meta tags, global styles
│   │   └── DashboardLayout.astro    # Authenticated layout with sidebar
│   ├── lib/                         # Shared utilities
│   │   ├── api/                     # Axios instance, interceptors, endpoints
│   │   ├── context/                 # React context providers (Auth, Theme)
│   │   └── utils/                   # Formatters, validators, constants
│   ├── pages/                       # File-based routing (Astro)
│   │   ├── index.astro              # Landing / redirect to dashboard
│   │   ├── login.astro              # Authentication page
│   │   └── dashboard/               # Protected dashboard routes
│   │       ├── index.astro          # Dashboard overview
│   │       ├── assets/              # Asset CRUD pages
│   │       ├── employees/           # Employee management & CSV imports
│   │       └── users/               # User management pages
│   └── styles/
│       └── global.css               # Tailwind CSS v4 entry point
├── astro.config.mjs                 # Astro configuration (React + Tailwind)
├── tsconfig.json                    # TypeScript strict configuration
├── package.json                     # Dependencies and scripts
└── .env                             # Environment variables (not committed)
```

> **Convention:** Files under `components/react/` are the only components that ship JavaScript to the browser. Everything under `components/astro/` compiles to pure HTML at build time.

---

## Available Commands

All commands are executed from the project root:

| Command | Action |
|:--------|:-------|
| `npm install` | Install project dependencies |
| `npm run dev` | Start the Astro dev server at `localhost:4321` |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run astro ...` | Run Astro CLI commands (`astro add`, `astro check`) |

---

<p align="center">
  <sub>Built with <a href="https://astro.build">Astro</a> · <a href="https://react.dev">React</a> · <a href="https://tailwindcss.com">Tailwind CSS</a></sub>
</p>

---

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- VERSIÓN EN ESPAÑOL                                                     -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

<p align="center">
  <img src="public/favicon.svg" width="80" alt="CoreAsset Logo" />
</p>

<h1 align="center">CoreAsset — Inventory Management Web Client</h1>

<p align="center">
  <strong>Panel de Administración White-Label · Rastreo de Activos · Control de Acceso Basado en Roles</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Astro-6.4-BC52EE?style=for-the-badge&logo=astro&logoColor=white" alt="Astro" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Licencia-Propietaria-red?style=flat-square" alt="Licencia" />
  <img src="https://img.shields.io/badge/SOC_2-Alineado-green?style=flat-square" alt="SOC 2" />
  <img src="https://img.shields.io/badge/OWASP-Top_10-orange?style=flat-square" alt="OWASP" />
  <img src="https://img.shields.io/badge/WCAG-2.1_AA-blue?style=flat-square" alt="WCAG 2.1" />
</p>

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
  - [Arquitectura de Islas — Por qué Astro](#arquitectura-de-islas--por-qué-astro)
  - [Frontend Desacoplado](#frontend-desacoplado)
- [Estándares de Seguridad y Cumplimiento](#estándares-de-seguridad-y-cumplimiento)
  - [Seguridad de Sesión — Cookies sobre JWT](#seguridad-de-sesión--cookies-sobre-jwt)
  - [Defensa CSRF y Cliente HTTP](#defensa-csrf-y-cliente-http)
  - [Ciclos de Vida de Sesión Estrictos](#ciclos-de-vida-de-sesión-estrictos)
  - [Cumplimiento SOC 2 y OWASP](#cumplimiento-soc-2-y-owasp)
  - [Accesibilidad como Métrica de Seguridad Estructural](#accesibilidad-como-métrica-de-seguridad-estructural)
- [Sistema de Diseño UI/UX](#sistema-de-diseño-uiux)
- [Prerrequisitos](#prerrequisitos)
- [Configuración de Entorno](#configuración-de-entorno)
- [Instalación](#instalación-1)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Comandos Disponibles](#comandos-disponibles)

---

## Descripción General

**CoreAsset-InventoryManagement-web-client** es la capa de presentación desacoplada (UI) de un panel de administración enterprise white-label diseñado para **rastreo de activos** y **control de acceso basado en roles (RBAC)**. Está construido como una aplicación Astro que por defecto no envía JavaScript al navegador, hidratando selectivamente islas interactivas de React solo donde se requiere estado complejo del lado del cliente.

Este cliente se comunica exclusivamente con su contraparte de API headless a través de HTTP autenticado por sesión, sin almacenar nunca tokens sensibles en el lado del cliente. Cada decisión arquitectónica — desde el modelo de renderizado hasta la estrategia de cookies — está impulsada por una filosofía de seguridad primero, rendimiento primero.

---

## Arquitectura

### Arquitectura de Islas — Por qué Astro

Este proyecto implementa el patrón de **Arquitectura de Islas** utilizando [Astro](https://astro.build/) como meta-framework.

**La justificación:**

| Aspecto | Decisión | Por qué |
|:--------|:---------|:--------|
| **Enrutamiento y Layouts** | Astro (estático / cero-JS) | Las páginas y layouts se renderizan como HTML puro sin ningún bundle de JavaScript del lado del cliente. Esto elimina categorías enteras de superficie de ataque (XSS basado en DOM) mientras entrega un Time to Interactive (TTI) inferior a un segundo. |
| **Estado Interactivo** | Islas de React (`client:load`, `client:visible`) | La UI compleja con estado — tablas de datos con ordenamiento/filtrado, formularios multi-paso, proveedores de contexto de autenticación — se aísla en componentes estrictos de React que se hidratan independientemente. |
| **Estilos** | Tailwind CSS v4 vía plugin de Vite | CSS utilitario compilado en tiempo de build. Sin overhead de CSS-in-JS en tiempo de ejecución. |
| **Seguridad de Tipos** | TypeScript (modo `strict`) | Seguridad de tipos de extremo a extremo desde los esquemas de respuesta de la API hasta las props de los componentes, usando el preset `strict` de tsconfig de Astro. |

> **Insight clave:** Al usar cero JavaScript por defecto y optar por él solo donde la interacción lo demanda, enviamos menos código, reducimos la superficie de ataque y logramos mejores Core Web Vitals — todo sin sacrificar la rica interactividad que React proporciona.

### Frontend Desacoplado

Este repositorio contiene **únicamente la capa de presentación**. El backend — construido con **Django** y **PostgreSQL** — reside en un repositorio separado:

🔗 **API Backend:** [`CoreAsset-InventoryManagement-headless-api`](https://github.com/CrisLottz/CoreAsset-InventoryManagement-headless-api)

```
┌─────────────────────────┐        HTTPS / JSON           ┌─────────────────────────┐
│                         │ ◄──────────────────────────── │                         │
│   Web Client (Astro)    │        Cookies de Sesión       │  API Headless (Django)  │
│   Este Repositorio      │ ────────────────────────────► │  PostgreSQL             │
│                         │        Token CSRF              │                         │
└─────────────────────────┘                                └─────────────────────────┘
```

**¿Por qué desacoplar?**

- **Cadencia de despliegue independiente** — Frontend y backend pueden versionarse, probarse y desplegarse de forma independiente.
- **Autonomía de equipo** — Ingenieros de UI e ingenieros de backend trabajan en paralelo sin conflictos de merge ni ciclos de release compartidos.
- **Flexibilidad white-label** — La misma API puede alimentar múltiples frontends con marca sin cambios en el backend.

---

## Estándares de Seguridad y Cumplimiento

### Seguridad de Sesión — Cookies sobre JWT

> **Decisión:** El cliente **nunca** almacena tokens de autenticación en `localStorage` ni `sessionStorage`.

Toda la gestión de sesiones se maneja mediante **cookies de sesión `HttpOnly`** establecidas por el backend de Django. El navegador adjunta automáticamente estas cookies a cada petición al origen de la API.

**Por qué esto importa:**

- Las cookies `HttpOnly` son **inaccesibles para JavaScript**, lo que significa que incluso si un atacante logra inyección de scripts (XSS), **no puede exfiltrar la credencial de sesión**.
- A diferencia de los JWTs en `localStorage`, las cookies con atributos `HttpOnly`, `Secure` y `SameSite` proporcionan defensa en profundidad contra el robo de tokens.

```
┌──────────┐     POST /api/auth/login/     ┌──────────┐
│ Navegador│  ───────────────────────────►  │  Django  │
│          │                                │          │
│          │  ◄─── Set-Cookie: sessionid    │          │
│          │       HttpOnly; Secure;        │          │
│          │       SameSite=Lax             │          │
└──────────┘                                └──────────┘
```

### Defensa CSRF y Cliente HTTP

Cada petición HTTP en esta aplicación se enruta a través de un **interceptor centralizado de Axios** que impone protección contra Cross-Site Request Forgery (CSRF).

**Cómo funciona:**

1. Django establece una cookie `csrftoken` (legible por JavaScript — esto es por diseño, no es la cookie de sesión).
2. El interceptor de peticiones de Axios lee el valor de `csrftoken` desde `document.cookie`.
3. Para cada **petición que muta estado** (`POST`, `PUT`, `PATCH`, `DELETE`), el interceptor inyecta el token en la cabecera HTTP `X-CSRFToken`.
4. Django valida que el valor de la cabecera coincida con el valor de la cookie, confirmando que la petición se originó desde el cliente legítimo.

```typescript
// Instancia centralizada de Axios — referencia conceptual
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PUBLIC_API_BASE_URL,
  withCredentials: true, // Adjuntar cookies en cada petición
});

api.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];

  if (csrfToken && config.method !== 'get') {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});
```

> **¿Por qué un interceptor centralizado?** Al enrutar todas las llamadas a la API a través de una única instancia de Axios, garantizamos que la protección CSRF **nunca se omita accidentalmente** de una petición. No hay "opt-in" — es estructural.

### Ciclos de Vida de Sesión Estrictos

El **interceptor de respuestas** de Axios impone una gestión estricta del ciclo de vida de la sesión:

| Código HTTP | Acción | Justificación |
|:------------|:-------|:--------------|
| `401 Unauthorized` | Purgar estado de auth en React → Redirigir a `/login` | La sesión ha expirado o nunca se estableció. Previene que la UI muestre datos obsoletos bajo una sesión inválida. |
| `403 Forbidden` | Purgar estado de auth en React → Redirigir a `/login` | El servidor revocó explícitamente el acceso. El cliente no debe cachear ni mostrar datos privilegiados. |

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // 1. Purgar estado del AuthContext de React
      // 2. Limpiar cualquier dato cacheado
      // 3. Forzar redirección dura a /login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

> **¿Por qué forzar una redirección dura?** Un `router.push()` del lado del cliente podría preservar estado obsoleto en la memoria de React. Una navegación completa con `window.location.href` destruye el contexto de ejecución de JavaScript por completo, garantizando que no queden datos residuales en memoria.

### Cumplimiento SOC 2 y OWASP

Esta arquitectura está diseñada para alinearse con los siguientes marcos de cumplimiento:

| Marco | Control | Cómo Este Proyecto lo Aborda |
|:------|:--------|:-----------------------------|
| **OWASP Top 10 — A7:2017 (XSS)** | Prevenir cross-site scripting | Las cookies de sesión `HttpOnly` previenen la exfiltración de tokens. El modelo cero-JS-por-defecto de Astro minimiza la superficie DOM. El escape integrado de JSX en React previene inyección en las islas interactivas. |
| **OWASP Top 10 — A8:2017 (CSRF)** | Prevenir cross-site request forgery | El middleware CSRF de Django + la inyección centralizada de la cabecera `X-CSRFToken` vía el interceptor de Axios validan la autenticidad del origen de la petición en cada mutación. |
| **SOC 2 — CC6.1** | Controles de acceso lógico | RBAC se impone en la capa de API. La UI renderiza condicionalmente basándose en permisos propagados a través de React Context, pero **nunca confía en el cliente** — toda autorización se re-valida del lado del servidor. |
| **SOC 2 — CC7.2** | Monitoreo del sistema y respuesta a incidentes | La intercepción de `401`/`403` asegura que las sesiones comprometidas o expiradas se terminen inmediatamente en el cliente, reduciendo la ventana de exposición. |

### Accesibilidad como Métrica de Seguridad Estructural

La accesibilidad **no es opcional** — es una obligación estructural de seguridad y cumplimiento.

| Estándar | Compromiso |
|:---------|:-----------|
| **WCAG 2.1 Nivel AA** | Todos los componentes interactivos deben cumplir ratios de contraste AA, navegabilidad por teclado y compatibilidad con lectores de pantalla. |
| **Cumplimiento ARIA** | Las islas de React usan HTML semántico y atributos ARIA para asegurar compatibilidad con tecnologías asistivas. |
| **Pruebas A11y** | Auditorías automatizadas de accesibilidad se integran en el pipeline de CI. |

> **¿Por qué A11y es una métrica de seguridad?** Los sistemas inaccesibles excluyen a usuarios de operaciones críticas de seguridad (ej., un administrador que depende de un lector de pantalla no puede revocar un activo comprometido). La inaccesibilidad en un sistema RBAC es un **vector de escalación de privilegios por omisión**.

### Protección de Rutas SSR (Middleware de Astro)

La aplicación implementa protección de rutas mediante Server-Side Rendering (SSR) usando el Middleware de Astro (`src/middleware.ts`). Antes de que cualquier ruta protegida se envíe al navegador, el middleware verifica la presencia de la cookie `sessionid`.

- **Usuarios no autenticados** que intentan acceder a una ruta protegida (como `/dashboard`) son interceptados instantáneamente a nivel de servidor (Status `302`) y redirigidos a `/login`. Nunca descargan el bundle de JS ni el layout HTML del dashboard.
- **Usuarios autenticados** que intentan acceder a rutas públicas (como `/login`) son automáticamente redirigidos a su dashboard.

Esto garantiza que la aplicación cliente nunca filtre layouts protegidos ni intente realizar llamadas API no autorizadas durante la carga inicial.

---

## Sistema de Diseño UI/UX

| Principio | Implementación |
|:----------|:---------------|
| **Grid de 12 Columnas** | Todos los layouts están construidos sobre un sistema de grid responsivo de 12 columnas que asegura alineación consistente entre breakpoints. |
| **Tailwind CSS v4** | Estilos utilitarios compilados en tiempo de build vía el plugin `@tailwindcss/vite`. Sin overhead de CSS en tiempo de ejecución. Los tokens de diseño semánticos se definen a través de la configuración del tema de Tailwind. |
| **Diseño de Espacios en Blanco Primero** | Padding generoso, márgenes y espacio entre elementos. Se evita la densidad — la claridad es la prioridad. |
| **Feedback Multi-Estado Estricto** | Cada elemento interactivo proporciona feedback visual explícito para todos los estados: `default`, `hover`, `focus`, `active`, `disabled`, `loading`, `error` y `success`. Sin fallos silenciosos. |

---

## Prerrequisitos

| Herramienta | Versión | Notas |
|:------------|:--------|:------|
| **Node.js** | `>= 22.12.0` | Requerido. Ver campo `engines` en `package.json`. |
| **npm** | `>= 10.x` | Incluido con Node.js 22+. |
| **Git** | `>= 2.40` | Para clonación y control de versiones. |

> **Recomendado:** Usar [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) o [nvm-windows](https://github.com/coreybutler/nvm-windows) para gestionar versiones de Node.js.

---

## Configuración de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```dotenv
# ──────────────────────────────────────────────
# Configuración de la API
# ──────────────────────────────────────────────
# URL base de la API headless de Django.
# Debe incluir el protocolo y excluir la barra final.
PUBLIC_API_BASE_URL=http://localhost:8000

# ──────────────────────────────────────────────
# Configuración de la Aplicación
# ──────────────────────────────────────────────
# El puerto en el que corre el servidor de desarrollo de Astro.
# Por defecto: 4321
PUBLIC_APP_PORT=4321
```

> **Nota:** Solo las variables con prefijo `PUBLIC_` se exponen al código del lado del cliente en Astro. Nunca uses el prefijo `PUBLIC_` en valores sensibles (secretos, claves de API).

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/CrisLottz/CoreAsset-InventoryManagement-web-client.git
cd CoreAsset-InventoryManagement-web-client

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL de tu API y configuración

# 4. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:4321`.

> **Importante:** La API backend debe estar corriendo para que las funcionalidades de autenticación y datos funcionen. Consulta el [repositorio del backend](https://github.com/CrisLottz/CoreAsset-InventoryManagement-headless-api) para instrucciones de configuración.

---

## Estructura del Proyecto

```
CoreAsset-InventoryManagement-web-client/
├── public/                          # Activos estáticos (servidos tal cual)
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── middleware.ts                # Protección de rutas SSR de Astro (intercepción de sesión)
│   ├── components/                  # Componentes de UI reutilizables
│   │   ├── react/                   # Islas interactivas de React (hidratadas)
│   │   │   ├── auth/                # AuthProvider, LoginForm, ProtectedRoute
│   │   │   ├── tables/              # DataTable, Paginación, Filtros
│   │   │   └── forms/               # FormBuilder, Validación, Inputs
│   │   └── astro/                   # Componentes estáticos de Astro (cero-JS)
│   │       ├── layout/              # Header, Sidebar, Footer, Breadcrumbs
│   │       └── ui/                  # Card, Badge, Alert, Skeleton
│   ├── layouts/                     # Plantillas de layout a nivel de página
│   │   ├── BaseLayout.astro         # Shell HTML, meta tags, estilos globales
│   │   └── DashboardLayout.astro    # Layout autenticado con sidebar
│   ├── lib/                         # Utilidades compartidas
│   │   ├── api/                     # Instancia de Axios, interceptores, endpoints
│   │   ├── context/                 # Proveedores de contexto React (Auth, Theme)
│   │   └── utils/                   # Formateadores, validadores, constantes
│   ├── pages/                       # Enrutamiento basado en archivos (Astro)
│   │   ├── index.astro              # Landing / redirección al dashboard
│   │   ├── login.astro              # Página de autenticación
│   │   └── dashboard/               # Rutas protegidas del dashboard
│   │       ├── index.astro          # Vista general del dashboard
│   │       ├── assets/              # Páginas CRUD de activos
│   │       ├── employees/           # Gestión de empleados e importación CSV
│   │       └── users/               # Páginas de gestión de usuarios
│   └── styles/
│       └── global.css               # Punto de entrada de Tailwind CSS v4
├── astro.config.mjs                 # Configuración de Astro (React + Tailwind)
├── tsconfig.json                    # Configuración TypeScript estricta
├── package.json                     # Dependencias y scripts
└── .env                             # Variables de entorno (no se commitean)
```

> **Convención:** Los archivos bajo `components/react/` son los únicos componentes que envían JavaScript al navegador. Todo bajo `components/astro/` se compila a HTML puro en tiempo de build.

---

## Comandos Disponibles

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando | Acción |
|:--------|:-------|
| `npm install` | Instalar dependencias del proyecto |
| `npm run dev` | Iniciar el servidor de desarrollo Astro en `localhost:4321` |
| `npm run build` | Compilar el sitio de producción en `./dist/` |
| `npm run preview` | Previsualizar el build de producción localmente |
| `npm run astro ...` | Ejecutar comandos del CLI de Astro (`astro add`, `astro check`) |

---

<p align="center">
  <sub>Construido con <a href="https://astro.build">Astro</a> · <a href="https://react.dev">React</a> · <a href="https://tailwindcss.com">Tailwind CSS</a></sub>
</p>
