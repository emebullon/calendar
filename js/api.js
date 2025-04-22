class API {
    constructor() {
        this.baseUrl = '/.netlify/functions/api';
    }

    async fetchMatches() {
        try {
            const response = await fetch(this.baseUrl);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || error.error || 'Error al obtener los partidos');
            }

            const matches = await response.json();
            return this.processMatches(matches);
        } catch (error) {
            console.error('Error al obtener los partidos:', error);
            throw error;
        }
    }

    processMatches(matches) {
        if (!Array.isArray(matches)) {
            console.warn('La respuesta no es un array:', matches);
            return [];
        }

        return matches.map(match => ({
            id: match.id,
            date: new Date(match.date.split('-').reverse().join('-') + 'T' + match.time),
            competition: match.competition,
            status: this.getStatusText(match.status),
            homeTeam: {
                name: match.localTeam.name,
                logo: match.localTeam.logo || "https://via.placeholder.com/50?text=Local",
                score: match.localTeam.score || '0'
            },
            awayTeam: {
                name: match.visitorTeam.name,
                logo: match.visitorTeam.logo || "https://via.placeholder.com/50?text=Visitante",
                score: match.visitorTeam.score || '0'
            }
        }));
    }

    getStatusText(status) {
        const statusMap = {
            'SCHEDULED': 'Programado',
            'LIVE': 'En Directo',
            'FINISHED': 'Finalizado',
            'POSTPONED': 'Aplazado',
            'CANCELLED': 'Cancelado'
        };
        return statusMap[status] || status;
    }
}

// Crear una instancia global de la API
const api = new API(); 