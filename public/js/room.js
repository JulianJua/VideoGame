class RoomManager {
    constructor() {
        this.currentRoom = null;
    }
    
    createRoom() {
        if (socketManager.socket && authManager.currentUser) {
            socketManager.socket.emit('create-room', { username: authManager.currentUser.username });
        }
    }
    
    joinRoom() {
        const roomCode = document.getElementById('roomCodeInput').value.trim();
        if (roomCode && socketManager.socket && authManager.currentUser) {
            socketManager.socket.emit('join-room', { 
                roomId: roomCode, 
                username: authManager.currentUser.username 
            });
            this.currentRoom = roomCode;
            document.getElementById('roomCode').textContent = roomCode;
            uiManager.showScreen('lobbyScreen');
            uiManager.hideJoinRoom();
        }
    }
    
    toggleReady() {
        if (socketManager.socket && this.currentRoom) {
            socketManager.socket.emit('player-ready', { roomId: this.currentRoom });
        }
    }
    
    leaveRoom() {
        this.currentRoom = null;
        uiManager.showMainMenu();
    }
    
    updateLobby(room) {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        room.players.forEach(player => {
            const readyClass = player.ready ? 'player-ready' : '';
            const readyText = player.ready ? 'READY' : 'NOT READY';
            
            playersList.innerHTML += `
                <div class="player-item ${readyClass}">
                    <div class="friend-name">${player.username}</div>
                    <div class="ready-status">${readyText}</div>
                </div>
            `;
        });
        
        const allReady = room.players.every(p => p.ready);
        const enoughPlayers = room.players.length >= 2;
        
        if (allReady && enoughPlayers) {
            document.getElementById('lobbyMessage').innerHTML = 
                '<div class="success">All players ready! Starting game...</div>';
        }
    }
}

const roomManager = new RoomManager();