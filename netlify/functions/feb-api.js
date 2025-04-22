const fetch = require('node-fetch');

// Credenciales de la API de la FEB desde variables de entorno
const FEB_CREDENTIALS = {
  app_id: process.env.FEB_APP_ID,
  app_secret: process.env.FEB_APP_SECRET
};

// URL base de la API
const FEB_API_BASE = 'https://intrafeb.feb.es/livestats.api/api/v1';

// Función para obtener el token JWT
async function getFEBToken() {
  const response = await fetch('https://intrafeb.feb.es/identity.api/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: FEB_CREDENTIALS.app_id,
      client_secret: FEB_CREDENTIALS.app_secret,
      scope: 'livestats.api'
    })
  });

  if (!response.ok) {
    throw new Error('Error al obtener el token de la FEB');
  }

  const data = await response.json();
  return data.access_token;
}

// Función para hacer llamadas a la API de la FEB
async function callFEBAPI(endpoint, token) {
  const response = await fetch(`${FEB_API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Error en la llamada a la API: ${response.statusText}`);
  }

  return response.json();
}

// Handler principal de la función
exports.handler = async function(event, context) {
  try {
    // Obtener el token
    const token = await getFEBToken();
    
    // Obtener el endpoint de la query string
    const endpoint = event.queryStringParameters.endpoint || '/matches';
    
    // Hacer la llamada a la API
    const data = await callFEBAPI(endpoint, token);
    
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
}; 