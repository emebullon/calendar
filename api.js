// Función para obtener el token JWT
async function getAuthToken() {
    try {
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
            throw new Error('Error en la autenticación');
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error al obtener el token:', error);
        throw error;
    }
}

// Función para hacer llamadas a la API
async function callApi(endpoint) {
    try {
        const token = await getAuthToken();
        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error en la llamada a la API');
        }

        return await response.json();
    } catch (error) {
        console.error('Error en la llamada a la API:', error);
        throw error;
    }
}

// Función para obtener los partidos
async function getMatches() {
    try {
        // Obtener la lista de partidos desde la API
        const matches = await callApi('/Overview/List');
        return matches.map(match => ({
            starttime: `${match.date} - ${match.time}`,
            day: match.date.split('-')[0],
            month: match.date.split('-')[1],
            year: match.date.split('-')[2],
            time: match.time,
            competition: match.competition,
            status: match.status,
            teamAName: match.localTeam.name,
            teamALogo: match.localTeam.logo || "https://via.placeholder.com/50",
            teamAPts: match.localTeam.score,
            teamBName: match.visitorTeam.name,
            teamBLogo: match.visitorTeam.logo || "https://via.placeholder.com/50",
            teamBPts: match.visitorTeam.score
        }));
    } catch (error) {
        console.error('Error al obtener los partidos:', error);
        return [];
    }
} 