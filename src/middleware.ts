import { defineMiddleware } from "astro:middleware";

// Definimos las rutas que no requieren autenticación
const PUBLIC_ROUTES = ['/login', '/'];

export const onRequest = defineMiddleware((context, next) => {
    const isPublicRoute = PUBLIC_ROUTES.includes(context.url.pathname);
    
    // Django usa 'sessionid' para mantener la sesión.
    // Como el frontend (4321) y backend (8000) comparten localhost,
    // el navegador envía esta cookie a Astro también.
    const hasSession = context.cookies.has('sessionid');

    // Si intenta acceder a una ruta privada sin sesión, lo rebotamos al login
    if (!isPublicRoute && !hasSession) {
        return context.redirect('/login');
    }

    // Si intenta acceder al login teniendo ya una sesión activa, lo mandamos al dashboard
    if (isPublicRoute && hasSession && context.url.pathname === '/login') {
        return context.redirect('/dashboard');
    }

    // Si todo está correcto, permitimos que la petición continúe
    return next();
});
