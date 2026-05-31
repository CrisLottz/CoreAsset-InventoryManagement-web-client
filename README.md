<div align="center">

# CoreAsset — Inventory Management Web Client

**React-Powered Dashboard for Asset Tracking & Identity Governance**

[![Astro](https://img.shields.io/badge/Astro-5.x-FF5D01?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-EF4444?style=for-the-badge)](#)

---

> **⚡ Decoupled UI** — This repository contains **only the Presentation Layer** (Frontend).
>
> The RESTful API Engine (Backend) built with **Django / PostgreSQL / Redis** lives in a separate repository:
>
> **🔗 [CoreAsset-InventoryManagement-headless-api](https://github.com/CrisLottz/CoreAsset-InventoryManagement-headless-api)**

---

</div>

## Table of Contents

- [Overview](#overview)
- [Architecture & State Management](#architecture--state-management)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Installation & Local Deployment](#installation--local-deployment)
- [Project Structure](#project-structure)

---

## Overview

CoreAsset Web Client is a high-performance, white-label administration dashboard designed to manage hardware/software inventories and control geographic access (RBAC). 

Engineered with an "Islands Architecture" approach, it leverages **Astro** for zero-JS routing and layout delivery, while delegating complex interactive state (Data Tables, Forms, Authentication context) to strict **React** components.

## Architecture & State Management

1. **Authentication (Cookies over JWT):** This client does not store authentication tokens in `localStorage`. It is configured to handle `HttpOnly` session cookies and `csrftoken` headers interacting directly with the Headless API, completely neutralizing XSS attack vectors.
2. **HTTP Interceptor:** All data fetching is routed through a centralized Axios/Fetch interceptor that automatically includes `credentials: 'include'` to maintain the Django session across cross-origin requests.
3. **UI/UX System:** Built on a 12-column grid system utilizing **Tailwind CSS v4**. The design prioritizes whitespace, accessible contrast ratios (WCAG), and strict multi-state interaction feedback (hover, focus, disabled).

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 18.x | JavaScript runtime environment |
| [CoreAsset API](https://github.com/CrisLottz/CoreAsset-InventoryManagement-headless-api) | Live | The backend engine must be running on `localhost:8000` |

## Environment Configuration

Create a `.env` file in the root of the project. This defines the trust boundary for the client to communicate with the headless engine.

```env
# Point this to your local Docker backend instance
PUBLIC_API_URL=[http://127.0.0.1:8000/api/v1](http://127.0.0.1:8000/api/v1)
