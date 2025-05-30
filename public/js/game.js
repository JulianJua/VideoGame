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
        this.scrollSpeed = 0;
        this.gameStartTime = 0;
        this.gameRunning = false;
        this.gameStarted = false;
        this.finishedPlayers = [];
        this.currentRoom = null;
        this.playersAlive = 0;
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
        this.gameStarted = false;
        this.gameStartTime = Date.now();
        this.autoScrollX = 0;
        this.scrollSpeed = 0;
        this.playersAlive = room.players.length;
        
        this.startCountdown();
    }
    
    startCountdown() {
        uiManager.showScreen('countdownScreen');
        let count = 3;
        const countdownElement = document.getElementById('countdownNumber');
        
        const countdown = setInterval(() => {
            if (count > 0) {
                countdownElement.textContent = count;
                count--;
            } else {
                countdownElement.textContent = 'GO!';
                setTimeout(() => {
                    this.gameStarted = true;
                    this.scrollSpeed = GAME_CONFIG.scroll.INITIAL_SPEED;
                    uiManager.showScreen('gameCanvas');
                    this.gameLoop();
                }, 500);
                clearInterval(countdown);
            }
        }, 1000);
    }
    
    setupPlayers(room) {
        this.players.clear();
        this.finishedPlayers = [];
        
        room.players.forEach((player, index) => {
            const isMe = player.username === authManager.currentUser.username;
            const newPlayer = new Player(player.username, index, isMe);
            newPlayer.y = this.canvas.height - GAME_CONFIG.world.GROUND_LEVEL_OFFSET - newPlayer.height;
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
            const joystick = document.getElementById('virtualJoystick');
            const knob = document.getElementById('joystickKnob');
            const jumpBtn = document.getElementById('jumpBtn');
            
            let joystickActive = false;
            let joystickCenter = { x: 0, y: 0 };
            const joystickRadius = 30;
            
            const getJoystickCenter = () => {
                const rect = joystick.getBoundingClientRect();
                return {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
            };
            
            const updateJoystick = (clientX, clientY) => {
                const center = getJoystickCenter();
                const deltaX = clientX - center.x;
                const deltaY = clientY - center.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (distance <= joystickRadius) {
                    knob.style.transform = `translate(${deltaX - 20}px, ${deltaY - 20}px)`;
                } else {
                    const angle = Math.atan2(deltaY, deltaX);
                    const x = Math.cos(angle) * joystickRadius;
                    const y = Math.sin(angle) * joystickRadius;
                    knob.style.transform = `translate(${x - 20}px, ${y - 20}px)`;
                }
                
                const normalizedX = Math.max(-1, Math.min(1, deltaX / joystickRadius));
                
                if (normalizedX < -0.3) {
                    this.mobileControls.left = true;
                    this.mobileControls.right = false;
                } else if (normalizedX > 0.3) {
                    this.mobileControls.right = true;
                    this.mobileControls.left = false;
                } else {
                    this.mobileControls.left = false;
                    this.mobileControls.right = false;
                }
            };
            
            const resetJoystick = () => {
                knob.style.transform = 'translate(-50%, -50%)';
                this.mobileControls.left = false;
                this.mobileControls.right = false;
                joystickActive = false;
            };
            
            joystick.addEventListener('touchstart', (e) => {
                e.preventDefault();
                joystickActive = true;
                joystickCenter = getJoystickCenter();
                const touch = e.touches[0];
                updateJoystick(touch.clientX, touch.clientY);
            }, { passive: false });
            
            joystick.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (joystickActive) {
                    const touch = e.touches[0];
                    updateJoystick(touch.clientX, touch.clientY);
                }
            }, { passive: false });
            
            joystick.addEventListener('touchend', (e) => {
                e.preventDefault();
                resetJoystick();
            }, { passive: false });
            
            joystick.addEventListener('mousedown', (e) => {
                e.preventDefault();
                joystickActive = true;
                joystickCenter = getJoystickCenter();
                updateJoystick(e.clientX, e.clientY);
            });
            
            document.addEventListener('mousemove', (e) => {
                if (joystickActive) {
                    updateJoystick(e.clientX, e.clientY);
                }
            });
            
            document.addEventListener('mouseup', () => {
                if (joystickActive) {
                    resetJoystick();
                }
            });
            
            const handleJumpStart = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.mobileControls.jump = true;
            };
            
            const handleJumpEnd = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.mobileControls.jump = false;
            };
            
            jumpBtn.addEventListener('touchstart', handleJumpStart, { passive: false });
            jumpBtn.addEventListener('touchend', handleJumpEnd, { passive: false });
            jumpBtn.addEventListener('touchcancel', handleJumpEnd, { passive: false });
            jumpBtn.addEventListener('mousedown', handleJumpStart);
            jumpBtn.addEventListener('mouseup', handleJumpEnd);
            jumpBtn.addEventListener('mouseleave', handleJumpEnd);
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
        
        if (this.gameStarted) {
            this.autoScrollX += this.scrollSpeed;
            this.camera.x = Math.max(this.autoScrollX, this.myPlayer ? this.myPlayer.x - this.canvas.width / 3 : this.autoScrollX);
            
            this.scrollSpeed += GAME_CONFIG.scroll.ACCELERATION;
            if (this.scrollSpeed > GAME_CONFIG.scroll.MAX_SPEED) {
                this.scrollSpeed = GAME_CONFIG.scroll.MAX_SPEED;
            }
        }
        
        this.enemies.forEach(enemy => enemy.update());
        
        this.players.forEach(player => {
            player.update(this.keys, this.mobileControls, this.camera, this.enemies, this.autoScrollX, this.finishedPlayers, this.gameStarted);
        });
        
        const currentSpeed = (this.scrollSpeed + Math.sin(Date.now() * 0.001) * 0.2).toFixed(1);
        document.getElementById('scrollSpeed').textContent = currentSpeed;
        
        let playersAlive = 0;
        this.players.forEach(player => {
            if (player.alive) playersAlive++;
        });
        this.playersAlive = playersAlive;
        document.getElementById('playersAlive').textContent = playersAlive;
        
        if (playersAlive === 0 && this.gameStarted) {
            this.endGame();
        }
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
            this.playersAlive--;
        }
    }
    
    showGameOver() {
        uiManager.showScreen('gameOverScreen');
    }
    
    endGame() {
        this.gameRunning = false;
        
        if (socketManager.socket) {
            socketManager.socket.emit('game-finished', {
                roomId: this.currentRoom,
                results: this.finishedPlayers
            });
        }
        
        setTimeout(() => {
            this.showGameResults(this.finishedPlayers);
        }, 1000);
    }
    
    showGameResults(results) {
        uiManager.showScreen('resultsScreen');
        
        let html = '';
        
        if (results.length === 0) {
            html = '<div style="text-align: center; color: #ff0000; margin: 20px 0;">All players were eliminated!</div>';
        } else {
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
        }
        
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
}class GameManager {
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
        this.scrollSpeed = 0;
        this.gameStartTime = 0;
        this.gameRunning = false;
        this.gameStarted = false;
        this.finishedPlayers = [];
        this.currentRoom = null;
        this.playersAlive = 0;
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
        this.gameStarted = false;
        this.gameStartTime = Date.now();
        this.autoScrollX = 0;
        this.scrollSpeed = 0;
        this.playersAlive = room.players.length;
        
        this.startCountdown();
    }
    
    startCountdown() {
        uiManager.showScreen('countdownScreen');
        let count = 3;
        const countdownElement = document.getElementById('countdownNumber');
        
        const countdown = setInterval(() => {
            if (count > 0) {
                countdownElement.textContent = count;
                count--;
            } else {
                countdownElement.textContent = 'GO!';
                setTimeout(() => {
                    this.gameStarted = true;
                    this.scrollSpeed = GAME_CONFIG.scroll.INITIAL_SPEED;
                    uiManager.showScreen('gameCanvas');
                    this.gameLoop();
                }, 500);
                clearInterval(countdown);
            }
        }, 1000);
    }
    
    setupPlayers(room) {
        this.players.clear();
        this.finishedPlayers = [];
        
        room.players.forEach((player, index) => {
            const isMe = player.username === authManager.currentUser.username;
            const newPlayer = new Player(player.username, index, isMe);
            newPlayer.y = this.canvas.height - GAME_CONFIG.world.GROUND_LEVEL_OFFSET - newPlayer.height;
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
        
        if (this.gameStarted) {
            this.autoScrollX += this.scrollSpeed;
            this.camera.x = Math.max(this.autoScrollX, this.myPlayer ? this.myPlayer.x - this.canvas.width / 3 : this.autoScrollX);
            
            this.scrollSpeed += GAME_CONFIG.scroll.ACCELERATION;
            if (this.scrollSpeed > GAME_CONFIG.scroll.MAX_SPEED) {
                this.scrollSpeed = GAME_CONFIG.scroll.MAX_SPEED;
            }
        }
        
        this.enemies.forEach(enemy => enemy.update());
        
        this.players.forEach(player => {
            player.update(this.keys, this.mobileControls, this.camera, this.enemies, this.autoScrollX, this.finishedPlayers, this.gameStarted);
        });
        
        const currentSpeed = (this.scrollSpeed + Math.sin(Date.now() * 0.001) * 0.2).toFixed(1);
        document.getElementById('scrollSpeed').textContent = currentSpeed;
        
        let playersAlive = 0;
        this.players.forEach(player => {
            if (player.alive) playersAlive++;
        });
        this.playersAlive = playersAlive;
        document.getElementById('playersAlive').textContent = playersAlive;
        
        if (playersAlive === 0 && this.gameStarted) {
            this.endGame();
        }
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
            this.playersAlive--;
        }
    }
    
    showGameOver() {
        uiManager.showScreen('gameOverScreen');
    }
    
    endGame() {
        this.gameRunning = false;
        
        if (socketManager.socket) {
            socketManager.socket.emit('game-finished', {
                roomId: this.currentRoom,
                results: this.finishedPlayers
            });
        }
        
        setTimeout(() => {
            this.showGameResults(this.finishedPlayers);
        }, 1000);
    }
    
    showGameResults(results) {
        uiManager.showScreen('resultsScreen');
        
        let html = '';
        
        if (results.length === 0) {
            html = '<div style="text-align: center; color: #ff0000; margin: 20px 0; font-family: \'Press Start 2P\', monospace; font-size: 12px;">All players were eliminated!</div>';
        } else {
            results.forEach((result, index) => {
                let medal = '';
                if (result.position === 1) medal = '🥇';
                else if (result.position === 2) medal = '🥈';
                else if (result.position === 3) medal = '🥉';
                else medal = `${result.position}th`;
                
                html += `
                    <div class="player-item" style="margin: 10px 0;">
                        <div style="font-family: 'Press Start 2P', monospace;">${medal} ${result.username}</div>
                    </div>
                `;
            });
        }
        
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