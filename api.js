import API_CONFIG from './config.js';

// Función para obtener los partidos
export async function getMatches() {
    try {
        const response = await fetch(API_CONFIG.baseUrl + API_CONFIG.endpoints.matches);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching matches:', error);
        throw error;
    }
}

// Función para obtener un partido específico
export async function getMatch(id) {
    try {
        const response = await fetch(API_CONFIG.baseUrl + API_CONFIG.endpoints.match(id));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching match:', error);
        throw error;
    }
} 