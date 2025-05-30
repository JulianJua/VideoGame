let gameManager;

window.addEventListener('load', () => {
    gameManager = new GameManager();
    authManager.checkAuthStatus();
});