const fetch = require('node-fetch');

// Credenciales de la API de la FEB desde variables de entorno
const FEB_CREDENTIALS = {
  app_id: process.env.FEB_APP_ID,
  app_secret: process.env.FEB_APP_SECRET
};

// URL base de la API
const FEB_API_BASE = 'https://intrafeb.feb.es/livestats.api';

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
function transformMatchData(match) {
  const header = match.HEADER || {};
  const teams = header.TEAM || [];
  const teamA = teams[0] || {};
  const teamB = teams[1] || {};

  return {
    starttime: header.starttime || "00-00-0000 - 00:00",
    day: header.starttime ? header.starttime.split('-')[0] : "00",
    month: header.starttime ? header.starttime.split('-')[1] : "00",
    year: header.starttime ? header.starttime.split('-')[2].split(' ')[0] : "0000",
    time: header.time || "00:00",
    competition: header.competition || "",
    status: header.time || "Pendiente",
    teamAName: teamA.name || "Equipo A",
    teamALogo: teamA.logo || "https://via.placeholder.com/50",
    teamAPts: parseInt(teamA.pts) || 0,
    teamBName: teamB.name || "Equipo B",
    teamBLogo: teamB.logo || "https://via.placeholder.com/50",
    teamBPts: parseInt(teamB.pts) || 0
  };
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
    
    // Obtener el ID del partido si se proporciona
    const matchId = event.queryStringParameters?.id;
    
    if (matchId) {
      // Si tenemos un ID, obtener un partido específico
      const matchData = await callFEBAPI(`/api/v1/FullMatch/${matchId}`, token);
      const transformedData = transformMatchData(matchData);
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
    } else {
      // Si no tenemos ID, devolver error
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: "Se requiere un ID de partido"
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        }
      };
    }
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