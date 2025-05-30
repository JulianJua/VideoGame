class GameManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.players = new Map();
        this.myPlayer = null;
        this.enemies = [];
        this.camera = { x: 0, y: 0 };
        this.keys = {};
        this.mobileControls = { left: false, right: false, jump: false };
        this.autoScrollX = 0;
        this.scrollSpeed = GAME_CONFIG.scroll.INITIAL_SPEED;
        this.gameStartTime = 0;
        this.gameRunning = false;
        this.finishedPlayers = [];
        this.currentRoom = null;
    }
    
    initialize(room) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentRoom = room;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.setupPlayers(room);
        this.setupEnemies();
        this.setupControls();
        this.gameRunning = true;
        this.gameStartTime = Date.now();
        this.autoScrollX = 0;
        this.scrollSpeed = GAME_CONFIG.scroll.INITIAL_SPEED;
        
        this.gameLoop();
    }
    
    setupPlayers(room) {
        this.players.clear();
        this.finishedPlayers = [];
        
        room.players.forEach((player, index) => {
            const isMe = player.username === authManager.currentUser.username;
            const newPlayer = new Player(player.username, index, isMe);
            this.players.set(player.username, newPlayer);
            if (isMe) this.myPlayer = newPlayer;
        });
    }
    
    setupEnemies() {
        this.enemies = [];
        const config = GAME_CONFIG.enemies;
        
        for (let i = 0; i < config.COUNT; i++) {
            const x = config.SPAWN_START + Math.random() * (GAME_CONFIG.world.WIDTH - config.SPAWN_START - config.SPAWN_END_OFFSET);
            const y = this.canvas.height - GAME_CONFIG.world.GROUND_LEVEL_OFFSET - 20 - Math.random() * config.HEIGHT_VARIANCE;
            this.enemies.push(new Enemy(x, y));
        }
    }
    
    setupControls() {
        if (isMobile) {
            const leftBtn = document.getElementById('leftBtn');
            const rightBtn = document.getElementById('rightBtn');
            const jumpBtn = document.getElementById('jumpBtn');
            
            leftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileControls.left = true;
            });
            leftBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileControls.left = false;
            });
            
            rightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileControls.right = true;
            });
            rightBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileControls.right = false;
            });
            
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobileControls.jump = true;
            });
            jumpBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobileControls.jump = false;
            });
        }
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            e.preventDefault();
        });
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    update() {
        if (!this.gameRunning) return;
        
        this.autoScrollX += this.scrollSpeed;
        this.camera.x = Math.max(this.autoScrollX, this.myPlayer ? this.myPlayer.x - this.canvas.width / 3 : this.autoScrollX);
        
        this.enemies.forEach(enemy => enemy.update());
        
        this.players.forEach(player => {
            player.update(this.keys, this.mobileControls, this.camera, this.enemies, this.autoScrollX, this.finishedPlayers);
        });
        
        const currentSpeed = (this.scrollSpeed + Math.sin(Date.now() * 0.001) * 0.5).toFixed(1);
        document.getElementById('scrollSpeed').textContent = currentSpeed;
        
        this.scrollSpeed += GAME_CONFIG.scroll.ACCELERATION;
        if (this.scrollSpeed > GAME_CONFIG.scroll.MAX_SPEED) {
            this.scrollSpeed = GAME_CONFIG.scroll.MAX_SPEED;
        }
        
        let playersAlive = 0;
        this.players.forEach(player => {
            if (player.alive) playersAlive++;
        });
        document.getElementById('playersAlive').textContent = playersAlive;
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        renderer.drawBackground(this.ctx, this.canvas, this.camera, this.gameStartTime);
        renderer.drawObstacles(this.ctx, this.canvas, this.camera);
        renderer.drawFinishLine(this.ctx, this.canvas, this.camera);
        
        this.enemies.forEach(enemy => enemy.draw(this.ctx, this.camera));
        this.players.forEach(player => player.draw(this.ctx, this.camera));
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updatePlayerPosition(data) {
        const player = this.players.get(data.username);
        if (player && data.username !== authManager.currentUser.username) {
            player.x = data.x;
            player.y = data.y;
            player.alive = data.alive;
            player.direction = data.direction;
            player.animFrame = data.animFrame;
        }
    }
    
    removePlayer(username) {
        const player = this.players.get(username);
        if (player) {
            player.alive = false;
        }
    }
    
    showGameOver() {
        uiManager.showScreen('gameOverScreen');
    }
    
    showGameResults(results) {
        uiManager.showScreen('resultsScreen');
        
        let html = '';
        results.forEach((result, index) => {
            let medal = '';
            if (result.position === 1) medal = '🥇';
            else if (result.position === 2) medal = '🥈';
            else if (result.position === 3) medal = '🥉';
            else medal = `${result.position}th`;
            
            html += `
                <div class="player-item" style="margin: 10px 0;">
                    <div>${medal} ${result.username}</div>
                </div>
            `;
        });
        
        document.getElementById('raceResults').innerHTML = html;
    }
    
    playAgain() {
        if (socketManager.socket && this.currentRoom) {
            socketManager.socket.emit('play-again', { roomId: this.currentRoom });
            uiManager.showScreen('lobbyScreen');
        }
    }
    
    returnToHub() {
        this.currentRoom = null;
        this.gameRunning = false;
        uiManager.showMainMenu();
    }
    
    stop() {
        this.gameRunning = false;
    }
}

const gameManager = new GameManager();