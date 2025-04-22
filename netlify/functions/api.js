const fetch = require('node-fetch');

// Configuración de la API
const CONFIG = {
    API_BASE_URL: 'https://intrafeb.feb.es/livestats.api/api/v1',
    IDENTITY_URL: 'https://intrafeb.feb.es/identity/connect/token',
    APP_ID: process.env.FEB_APP_ID,
    APP_SECRET: process.env.FEB_APP_SECRET
};

// Función para obtener el token
async function getToken() {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', CONFIG.APP_ID);
    formData.append('client_secret', CONFIG.APP_SECRET);

    const response = await fetch(CONFIG.IDENTITY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || 'Error al obtener el token');
    }

    const data = await response.json();
    return data.access_token;
}

exports.handler = async function(event, context) {
    // Configurar headers CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Manejar preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers,
            body: ''
        };
    }

    try {
        // Obtener el token
        const token = await getToken();

        // Hacer la petición a la API de FEB
        const response = await fetch(`${CONFIG.API_BASE_URL}/Overview/List`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    error: 'Error en la respuesta de la API',
                    details: data
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Error al procesar la petición',
                details: error.message
            })
        };
    }
}; 