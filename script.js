// URL y credenciales
const TOKEN_URL = 'https://intrafeb.feb.es/identity.api/connect/token';
const API_BASE_URL = 'https://intrafeb.feb.es/livestats.api/api/v1/';
const CLIENT_ID = 'livestats-miguelbullon';
const CLIENT_SECRET = 'Rk4wnoJqDI5ZyNFYSZS2cLMFLwSpL/RJyEDkVZEw9SXU=';

document.getElementById('auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  
  try {
    // Obtener el token JWT
    const token = await getToken();
    displayOutput('Token obtenido:\n' + token);

    // Opcional: Prueba de un endpoint de ejemplo
    const data = await fetchData('some-endpoint', token);
    displayOutput('Datos de la API:\n' + JSON.stringify(data, null, 2));
  } catch (error) {
    displayOutput('Error:\n' + error.message);
  }
});

// Función para obtener el token
async function getToken() {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error('Error al obtener el token: ' + response.statusText);
  }

  const data = await response.json();
  return data.access_token;
}

// Función para hacer una petición a la API
async function fetchData(endpoint, token) {
  const response = await fetch(API_BASE_URL + endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener datos de la API: ' + response.statusText);
  }

  return await response.json();
}

// Mostrar resultados en pantalla
function displayOutput(message) {
  document.getElementById('output').textContent = message;
}
