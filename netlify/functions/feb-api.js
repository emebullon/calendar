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
  try {
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
      console.error('Error response:', await response.text());
      throw new Error('Error al obtener el token de la FEB');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
}

// Función para hacer llamadas a la API de la FEB
async function callFEBAPI(endpoint, token) {
  try {
    console.log('Calling FEB API:', `${FEB_API_BASE}${endpoint}`);
    const response = await fetch(`${FEB_API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Error response:', await response.text());
      throw new Error(`Error en la llamada a la API: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
}

// Función para transformar los datos de la API al formato esperado
function transformMatchData(apiData) {
  // Asumiendo que apiData es un array de partidos de la API de la FEB
  return apiData.map(game => ({
    starttime: game.startTime || "00-00-0000 - 00:00",
    day: game.startTime ? game.startTime.split('-')[0] : "00",
    month: game.startTime ? game.startTime.split('-')[1] : "00",
    year: game.startTime ? game.startTime.split('-')[2].split(' ')[0] : "0000",
    time: game.startTime ? game.startTime.split(' - ')[1] : "00:00",
    competition: game.competition || "",
    status: game.status || "Pendiente",
    teamAName: game.teamA?.name || "Equipo A",
    teamALogo: game.teamA?.logo || "https://via.placeholder.com/50",
    teamAPts: game.teamA?.score || 0,
    teamBName: game.teamB?.name || "Equipo B",
    teamBLogo: game.teamB?.logo || "https://via.placeholder.com/50",
    teamBPts: game.teamB?.score || 0
  }));
}

// Handler principal de la función
exports.handler = async function(event, context) {
  try {
    console.log('Function called with event:', event);
    
    // Obtener el token
    const token = await getFEBToken();
    console.log('Token obtained successfully');
    
    // Obtener el endpoint de la query string
    const endpoint = event.queryStringParameters?.endpoint || '/matches';
    
    // Hacer la llamada a la API
    const apiData = await callFEBAPI(endpoint, token);
    console.log('API data received:', apiData);
    
    // Transformar los datos al formato esperado
    const transformedData = transformMatchData(apiData);
    
    return {
      statusCode: 200,
      body: JSON.stringify(transformedData),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
}; 