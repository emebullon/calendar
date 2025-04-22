const fetch = require('node-fetch');

const IDENTITY_URL = 'https://intrafeb.feb.es/identity.api/connect/token';
const APP_ID = 'livestats-miguelbullon';
const APP_SECRET = 'Rk4wnoJqDI5ZyNFYSZS2cLMFLwSpL/RJyEDkVZEw9SXU=';

exports.handler = async function(event, context) {
  console.log('Iniciando solicitud de token...');
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const formData = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: APP_ID,
      client_secret: APP_SECRET,
      scope: 'livestats.api'
    });

    console.log('URL de autenticación:', IDENTITY_URL);
    console.log('Datos de la solicitud:', {
      client_id: APP_ID,
      grant_type: 'client_credentials',
      scope: 'livestats.api'
    });

    const response = await fetch(IDENTITY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData
    });

    console.log('Código de estado de la respuesta:', response.status);

    const responseText = await response.text();
    console.log('Respuesta completa:', responseText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, details: ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Error al parsear la respuesta como JSON: ${responseText}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error completo:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error al obtener el token',
        details: error.message
      })
    };
  }
}; 