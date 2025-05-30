class AuthManager {
    constructor() {
        this.currentUser = null;
    }
    
    async login() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.currentUser = data.user;
                localStorage.setItem('token', data.token);
                socketManager.initialize();
                uiManager.showMainMenu();
            } else {
                utils.showError('loginError', data.error);
            }
        } catch (error) {
            utils.showError('loginError', 'Connection error');
        }
    }
    
    async register() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.currentUser = data.user;
                localStorage.setItem('token', data.token);
                socketManager.initialize();
                uiManager.showMainMenu();
            } else {
                utils.showError('registerError', data.error);
            }
        } catch (error) {
            utils.showError('registerError', 'Connection error');
        }
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('token');
        if (socketManager.socket) {
            socketManager.socket.disconnect();
            socketManager.socket = null;
        }
        uiManager.showLogin();
    }
    
    updateUserStats() {
        if (this.currentUser) {
            document.getElementById('userGamesPlayed').textContent = this.currentUser.gamesPlayed;
            document.getElementById('userGamesWon').textContent = this.currentUser.gamesWon;
            const winRate = this.currentUser.gamesPlayed > 0 ? 
                ((this.currentUser.gamesWon / this.currentUser.gamesPlayed) * 100).toFixed(1) : 0;
            document.getElementById('userWinRate').textContent = winRate + '%';
        }
    }
    
    async checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch('/api/profile/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data;
                    socketManager.initialize();
                    uiManager.showMainMenu();
                } else {
                    throw new Error('Token invalid');
                }
            } catch (error) {
                localStorage.removeItem('token');
                uiManager.showLogin();
            }
        } else {
            uiManager.showLogin();
        }
    }
}

const authManager = new AuthManager();