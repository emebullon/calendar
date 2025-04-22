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
    console.log('Intentando obtener token con credenciales:', {
      client_id: FEB_CREDENTIALS.app_id,
      // No logueamos el secret por seguridad
    });

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
      }).toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from token endpoint:', errorText);
      throw new Error(`Error al obtener el token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Token obtenido correctamente');
    return data.access_token;
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
}

// Función para hacer llamadas a la API de la FEB
async function callFEBAPI(endpoint, token) {
  try {
    const url = `${FEB_API_BASE}${endpoint}`;
    console.log('Calling FEB API:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from API:', errorText);
      throw new Error(`Error en la llamada a la API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API response received:', data);
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
  console.log('Function called with event:', {
    httpMethod: event.httpMethod,
    path: event.path,
    queryStringParameters: event.queryStringParameters
  });

  try {
    // Verificar que tenemos las credenciales
    if (!FEB_CREDENTIALS.app_id || !FEB_CREDENTIALS.app_secret) {
      throw new Error('Faltan las credenciales de la API de la FEB');
    }

    // Obtener el token
    const token = await getFEBToken();
    
    // Hacer la llamada a la API para obtener los partidos
    const apiData = await callFEBAPI('/matches', token);
    
    // Transformar los datos al formato esperado
    const matches = Array.isArray(apiData) ? apiData : [];
    const transformedData = matches.map(match => ({
      starttime: match.date || "00-00-0000 - 00:00",
      day: match.date ? match.date.split('-')[0] : "00",
      month: match.date ? match.date.split('-')[1] : "00",
      year: match.date ? match.date.split('-')[2].split(' ')[0] : "0000",
      time: match.time || "00:00",
      competition: match.competition || "",
      status: match.status || "Pendiente",
      teamAName: match.homeTeam?.name || "Equipo A",
      teamALogo: match.homeTeam?.logo || "https://via.placeholder.com/50",
      teamAPts: match.homeTeam?.score || 0,
      teamBName: match.awayTeam?.name || "Equipo B",
      teamBLogo: match.awayTeam?.logo || "https://via.placeholder.com/50",
      teamBPts: match.awayTeam?.score || 0
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(transformedData),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }
}; 