class Player {
    constructor(username, characterIndex, isMe = false) {
        this.username = username;
        this.x = 100;
        this.y = 0;
        this.width = 24;
        this.height = 40;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.character = GAME_CONFIG.characters[characterIndex % GAME_CONFIG.characters.length];
        this.isMe = isMe;
        this.finished = false;
        this.alive = true;
        this.direction = 1;
        this.animFrame = 0;
        this.lastJump = 0;
    }
    
    update(keys, mobileControls, camera, enemies, autoScrollX, finishedPlayers) {
        if (!this.alive) return;
        
        if (this.isMe) {
            let moving = false;
            
            if (keys['ArrowLeft'] || keys['a'] || keys['A'] || mobileControls.left) {
                this.velocityX = Math.max(this.velocityX - 0.5, -GAME_CONFIG.physics.MOVE_SPEED);
                this.direction = -1;
                moving = true;
            }
            if (keys['ArrowRight'] || keys['d'] || keys['D'] || mobileControls.right) {
                this.velocityX = Math.min(this.velocityX + 0.5, GAME_CONFIG.physics.MOVE_SPEED);
                this.direction = 1;
                moving = true;
            }
            if ((keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' '] || mobileControls.jump) && 
                this.onGround && Date.now() - this.lastJump > GAME_CONFIG.ui.JUMP_COOLDOWN) {
                this.velocityY = GAME_CONFIG.physics.JUMP_FORCE;
                this.onGround = false;
                this.lastJump = Date.now();
            }
            
            if (moving) {
                this.animFrame += GAME_CONFIG.ui.ANIMATION_SPEED;
            }
            
            this.velocityY += GAME_CONFIG.physics.GRAVITY;
            this.x += this.velocityX;
            this.y += this.velocityY;
            
            const groundLevel = window.innerHeight - GAME_CONFIG.world.GROUND_LEVEL_OFFSET;
            if (this.y + this.height >= groundLevel) {
                this.y = groundLevel - this.height;
                this.velocityY = 0;
                this.onGround = true;
            } else {
                this.onGround = false;
            }
            
            if (this.x < 0) this.x = 0;
            if (this.x > GAME_CONFIG.world.WIDTH - this.width) {
                this.x = GAME_CONFIG.world.WIDTH - this.width;
            }
            
            this.velocityX *= GAME_CONFIG.physics.FRICTION;
            
            if (this.x < camera.x - 100) {
                this.alive = false;
                socketManager.socket.emit('player-eliminated', {
                    roomId: gameManager.currentRoom,
                    username: this.username
                });
            }
            
            enemies.forEach(enemy => {
                if (this.alive && 
                    this.x < enemy.x + enemy.width &&
                    this.x + this.width > enemy.x &&
                    this.y < enemy.y + enemy.height &&
                    this.y + this.height > enemy.y) {
                    this.alive = false;
                    socketManager.socket.emit('player-eliminated', {
                        roomId: gameManager.currentRoom,
                        username: this.username
                    });
                }
            });
            
            const finishLine = GAME_CONFIG.world.WIDTH - GAME_CONFIG.world.FINISH_LINE_OFFSET;
            if (this.x >= finishLine && !this.finished && this.alive) {
                this.finished = true;
                finishedPlayers.push({
                    username: this.username,
                    position: finishedPlayers.length + 1,
                    time: Date.now()
                });
                
                socketManager.socket.emit('player-finished', {
                    roomId: gameManager.currentRoom,
                    username: this.username,
                    position: finishedPlayers.length
                });
            }
            
            if (socketManager.socket) {
                socketManager.socket.emit('player-position', {
                    roomId: gameManager.currentRoom,
                    username: this.username,
                    x: this.x,
                    y: this.y,
                    character: this.character,
                    alive: this.alive,
                    direction: this.direction,
                    animFrame: this.animFrame
                });
            }
        }
    }
    
    draw(ctx, camera) {
        if (!this.alive) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y;
        
        if (screenX < -50 || screenX > window.innerWidth + 50) return;
        
        ctx.save();
        
        const bobOffset = this.onGround ? Math.sin(this.animFrame) * 2 : 0;
        
        if (this.direction === -1) {
            ctx.scale(-1, 1);
            ctx.translate(-(screenX + this.width), 0);
        } else {
            ctx.translate(screenX, 0);
        }
        
        ctx.fillStyle = this.character.bodyColor;
        ctx.fillRect(0, screenY + 20 + bobOffset, this.width, 20);
        
        ctx.fillStyle = this.character.armorColor;
        ctx.fillRect(2, screenY + 20 + bobOffset, this.width - 4, 16);
        
        ctx.fillStyle = this.character.bodyColor;
        ctx.fillRect(6, screenY + bobOffset, 12, 24);
        
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(7, screenY + 2 + bobOffset, 10, 10);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(9, screenY + 4 + bobOffset, 2, 2);
        ctx.fillRect(13, screenY + 4 + bobOffset, 2, 2);
        ctx.fillRect(10, screenY + 7 + bobOffset, 4, 1);
        
        this.drawAccessory(ctx, screenY, bobOffset);
        this.drawLegs(ctx, screenY, bobOffset);
        
        ctx.restore();
        
        ctx.fillStyle = this.alive ? '#FFFFFF' : '#FF0000';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.font = '10px monospace';
        ctx.strokeText(this.username, screenX - 10, screenY - 10);
        ctx.fillText(this.username, screenX - 10, screenY - 10);
    }
    
    drawAccessory(ctx, screenY, bobOffset) {
        if (this.character.accessory === 'helmet') {
            ctx.fillStyle = this.character.armorColor;
            ctx.fillRect(6, screenY - 2 + bobOffset, 12, 6);
            ctx.fillStyle = '#333333';
            ctx.fillRect(8, screenY + bobOffset, 8, 2);
        } else if (this.character.accessory === 'hat') {
            ctx.fillStyle = this.character.armorColor;
            ctx.fillRect(7, screenY - 4 + bobOffset, 10, 4);
            ctx.fillRect(11, screenY - 8 + bobOffset, 2, 4);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(11, screenY - 6 + bobOffset, 2, 1);
        } else if (this.character.accessory === 'hood') {
            ctx.fillStyle = this.character.armorColor;
            ctx.fillRect(5, screenY - 2 + bobOffset, 14, 8);
            ctx.fillRect(7, screenY + 4 + bobOffset, 10, 2);
        } else if (this.character.accessory === 'crown') {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(7, screenY - 3 + bobOffset, 10, 3);
            ctx.fillRect(9, screenY - 5 + bobOffset, 2, 2);
            ctx.fillRect(13, screenY - 5 + bobOffset, 2, 2);
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(10, screenY - 4 + bobOffset, 1, 1);
            ctx.fillRect(14, screenY - 4 + bobOffset, 1, 1);
        } else if (this.character.accessory === 'mask') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(7, screenY + 2 + bobOffset, 10, 4);
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(9, screenY + 3 + bobOffset, 2, 1);
            ctx.fillRect(13, screenY + 3 + bobOffset, 2, 1);
        }
    }
    
    drawLegs(ctx, screenY, bobOffset) {
        const legOffset = this.onGround ? Math.sin(this.animFrame * GAME_CONFIG.ui.LEG_ANIMATION_SPEED) * 3 : 0;
        
        ctx.fillStyle = this.character.bodyColor;
        ctx.fillRect(3, screenY + 40 + bobOffset + legOffset, 6, 8);
        ctx.fillRect(15, screenY + 40 + bobOffset - legOffset, 6, 8);
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(3, screenY + 46 + bobOffset + legOffset, 6, 2);
        ctx.fillRect(15, screenY + 46 + bobOffset - legOffset, 6, 2);
    }
}