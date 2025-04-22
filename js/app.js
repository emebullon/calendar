class MatchesApp {
    constructor() {
        this.container = document.getElementById('matches-container');
        this.template = document.getElementById('match-template');
        this.loadingElement = document.getElementById('loading');
        this.refreshInterval = null;
    }

    async init() {
        try {
            await this.loadMatches();
            this.startAutoRefresh();
        } catch (error) {
            this.showError(error);
        }
    }

    async loadMatches() {
        try {
            this.showLoading();
            const matches = await api.fetchMatches();
            this.renderMatches(matches);
        } catch (error) {
            this.showError(error);
        } finally {
            this.hideLoading();
        }
    }

    renderMatches(matches) {
        if (!matches || matches.length === 0) {
            this.container.innerHTML = '<div class="no-matches">No hay partidos programados</div>';
            return;
        }

        // Limpiar el contenedor
        this.container.innerHTML = '';

        // Ordenar partidos por fecha
        matches.sort((a, b) => a.date - b.date);

        matches.forEach(match => {
            const matchElement = this.template.content.cloneNode(true);

            // Formatear la fecha
            const dateElement = matchElement.querySelector('.match-date');
            dateElement.textContent = match.date.toLocaleString('es-ES', CONFIG.DATE_FORMAT);
            dateElement.setAttribute('datetime', match.date.toISOString());

            // Estado del partido
            const statusElement = matchElement.querySelector('.match-status');
            statusElement.textContent = match.status;
            statusElement.className = `match-status status-${match.status.toLowerCase().replace(' ', '-')}`;

            // Competición
            matchElement.querySelector('.match-competition').textContent = match.competition;

            // Equipo Local
            const homeTeam = matchElement.querySelector('.team-home');
            homeTeam.querySelector('.team-logo').src = match.homeTeam.logo;
            homeTeam.querySelector('.team-logo').alt = match.homeTeam.name;
            homeTeam.querySelector('.team-name').textContent = match.homeTeam.name;
            homeTeam.querySelector('.team-score').textContent = match.homeTeam.score;

            // Equipo Visitante
            const awayTeam = matchElement.querySelector('.team-away');
            awayTeam.querySelector('.team-logo').src = match.awayTeam.logo;
            awayTeam.querySelector('.team-logo').alt = match.awayTeam.name;
            awayTeam.querySelector('.team-name').textContent = match.awayTeam.name;
            awayTeam.querySelector('.team-score').textContent = match.awayTeam.score;

            this.container.appendChild(matchElement);
        });
    }

    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.refreshInterval = setInterval(() => this.loadMatches(), CONFIG.REFRESH_INTERVAL);
    }

    showLoading() {
        this.loadingElement.style.display = 'block';
    }

    hideLoading() {
        this.loadingElement.style.display = 'none';
    }

    showError(error) {
        this.container.innerHTML = `
            <div class="error-message">
                <p>${error.message}</p>
                <button onclick="app.loadMatches()" class="retry-button">
                    Intentar de nuevo
                </button>
            </div>
        `;
    }
}

// Iniciar la aplicación cuando el DOM esté listo
const app = new MatchesApp();
document.addEventListener('DOMContentLoaded', () => app.init()); 