// Configuración de la API
const API_CONFIG = {
    baseUrl: '/.netlify/functions',
    endpoints: {
        match: (id) => `/feb-api?id=${id}`
    }
};

// Exportar la configuración
export default API_CONFIG; 