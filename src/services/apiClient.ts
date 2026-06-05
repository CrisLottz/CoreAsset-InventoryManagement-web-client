import axios from 'axios';

// Vite/Astro expone las variables de entorno a través de import.meta.env
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
    baseURL: API_URL,
    // CRÍTICO: Permite el envío y recepción de cookies (SessionID, CSRF) cruzando puertos
    withCredentials: true,
    // Le dice a Axios que busque la cookie 'csrftoken' (nombre por defecto de Django)
    xsrfCookieName: 'csrftoken',
    // Le dice a Axios que inyecte ese valor en el header 'X-CSRFToken' al hacer POST/PUT/DELETE
    xsrfHeaderName: 'X-CSRFToken',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Interceptor de Respuestas (Manejo global de seguridad)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const status = error.response.status;
            
            // Si el backend rechaza la sesión y no estamos ya en la página de login
            if ((status === 401 || status === 403) && window.location.pathname !== '/login') {
                // Redirección forzada para limpiar el estado y proteger la UI
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);