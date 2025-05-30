class SocketManager {
    constructor() {
        this.socket = null;
    }
    
    initialize() {
        this.socket = io();
        
        this.socket.on('room-created', (data) => {
            roomManager.currentRoom = data.roomId;
            document.getElementById('roomCode').textContent = data.roomId;
            uiManager.showScreen('lobbyScreen');
        });
        
        this.socket.on('room-updated', (room) => {
            roomManager.updateLobby(room);
        });
        
        this.socket.on('game-start', (room) => {
            uiManager.showScreen('gameCanvas');
            gameManager.initialize(room);
        });
        
        this.socket.on('player-moved', (data) => {
            gameManager.updatePlayerPosition(data);
        });
        
        this.socket.on('player-eliminated', (data) => {
            if (data.username === authManager.currentUser.username) {
                gameManager.showGameOver();
            } else {
                gameManager.removePlayer(data.username);
            }
        });
        
        this.socket.on('game-end', (results) => {
            gameManager.showGameResults(results);
        });
        
        this.socket.on('error', (message) => {
            document.getElementById('lobbyMessage').innerHTML = 
                `<div class="error">${message}</div>`;
        });
    }
}

const socketManager = new SocketManager();