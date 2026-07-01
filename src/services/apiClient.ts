import axios from 'axios';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true, // CRÍTICO: Permite que el navegador envíe las cookies
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Función auxiliar estricta para extraer cookies del DOM nativo
function getCookie(name: string) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// 1. Interceptor de PETICIONES: Inyección manual y garantizada del token CSRF
apiClient.interceptors.request.use((config) => {
    // Antes de que el POST/PUT salga, buscamos la cookie
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
        // Si existe, forzamos la inyección del Header que exige Django
        config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 2. Interceptor de RESPUESTAS: Manejo global de seguridad
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const status = error.response.status;
            
            if ((status === 401 || status === 403) && window.location.pathname !== '/login') {
                // Mantenemos la línea comentada para que no te expulse de la pantalla si hay un error, 
                // permitiéndote leer la consola con tranquilidad.
                // window.location.href = '/login'; 
                console.error("DEBUG - Fallo de seguridad. Respuesta del servidor:", error.response.data);
            }
        }
        return Promise.reject(error);
    }
);