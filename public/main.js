let uiManager;
let authManager;
let profileManager;
let roomManager;
let socketManager;
let gameManager;
let renderer;

window.addEventListener('load', () => {
    uiManager = new UIManager();
    authManager = new AuthManager();
    profileManager = new ProfileManager();
    roomManager = new RoomManager();
    socketManager = new SocketManager();
    gameManager = new GameManager();
    renderer = new Renderer();
    
    authManager.checkAuthStatus();
});