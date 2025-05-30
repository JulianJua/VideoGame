class UIManager {
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        if (screenId === 'gameCanvas') {
            document.getElementById('gameCanvas').classList.add('active');
            document.getElementById('gameUI').style.display = 'block';
            if (isMobile) {
                document.getElementById('mobileControls').classList.add('active');
            }
        } else if (screenId === 'countdownScreen') {
            document.getElementById('countdownScreen').classList.add('active');
            if (isMobile) {
                document.getElementById('mobileControls').classList.add('active');
            }
        } else {
            document.getElementById('gameCanvas').classList.remove('active');
            document.getElementById('gameUI').style.display = 'none';
            document.getElementById('mobileControls').classList.remove('active');
            document.getElementById(screenId).classList.add('active');
        }
    }
    
    showLogin() {
        this.showScreen('loginScreen');
    }
    
    showRegister() {
        this.showScreen('registerScreen');
    }
    
    showMainMenu() {
        this.showScreen('mainMenu');
        authManager.updateUserStats();
    }
    
    showProfile() {
        this.showScreen('profileScreen');
        profileManager.loadProfile();
    }
    
    showJoinRoom() {
        document.getElementById('joinRoomDiv').style.display = 'block';
    }
    
    hideJoinRoom() {
        document.getElementById('joinRoomDiv').style.display = 'none';
    }
}

const uiManager = new UIManager();