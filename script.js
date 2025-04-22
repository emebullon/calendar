// Constantes de configuración
const API_BASE_URL = 'https://intrafeb.feb.es/live.api/v1';

// Evento para manejar el formulario
document.getElementById('auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  
  try {
    // Obtener el token JWT usando la función de Netlify
    const token = await getToken();
    displayOutput('Token obtenido correctamente');
    console.log('Token obtenido:', token);

    // Obtener lista de partidos
    const endpoint = '/Overview/List';
    displayOutput('Obteniendo lista de partidos desde: ' + endpoint);
    const data = await fetchData(endpoint, token);
    displayOutput('Datos de partidos:\n' + JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error completo:', error);
    displayOutput('Error:\n' + error.message);
  }
});

// Función para obtener el token
async function getToken() {
  const response = await fetch('/.netlify/functions/auth', {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error al obtener el token: ${errorData.error}\nDetalles: ${errorData.details}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Función para hacer una petición a la API
async function fetchData(endpoint, token) {
  console.log('Enviando petición a la API:', endpoint);
  
  const response = await fetch('/.netlify/functions/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      endpoint,
      token
    })
  });

  const responseText = await response.text();
  console.log('Respuesta recibida:', responseText);

  if (!response.ok) {
    throw new Error(`Error al obtener datos de la API: ${response.status} ${response.statusText}\nDetalles: ${responseText}`);
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Error al parsear la respuesta como JSON: ${responseText}`);
  }
}

// Función para mostrar los resultados en la página
function displayOutput(message) {
  document.getElementById('output').textContent = message;
}
