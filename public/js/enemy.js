class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.velocityX = (Math.random() - 0.5) * GAME_CONFIG.enemies.SPEED_RANGE;
        this.velocityY = 0;
        this.color = '#8B008B';
        this.bounceTimer = Math.random() * Math.PI * 2;
        this.originalY = y;
        this.eyeTimer = 0;
    }
    
    update() {
        this.bounceTimer += GAME_CONFIG.enemies.BOUNCE_SPEED;
        this.eyeTimer += GAME_CONFIG.ui.EYE_ANIMATION_SPEED;
        this.velocityY = Math.sin(this.bounceTimer) * 3;
        
        this.x += this.velocityX;
        this.y = this.originalY + Math.sin(this.bounceTimer) * 15;
        
        const groundLevel = window.innerHeight - 100;
        if (this.y + this.height > groundLevel) {
            this.y = groundLevel - this.height;
            this.originalY = this.y;
        }
        
        if (this.x <= 50 || this.x >= GAME_CONFIG.world.WIDTH - 50) {
            this.velocityX *= -1;
        }
    }
    
    draw(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y;
        
        if (screenX < -50 || screenX > window.innerWidth + 50) return;
        
        const squish = Math.abs(Math.sin(this.bounceTimer)) * 0.3;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, screenY + squish * 5, this.width, this.height - squish * 5);
        
        ctx.fillStyle = '#FF0080';
        ctx.fillRect(screenX + 2, screenY + 2 + squish * 5, this.width - 4, this.height - 4 - squish * 5);
        
        const eyeOffset = Math.sin(this.eyeTimer) * 2;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(screenX + 5 + eyeOffset, screenY + 5, 3, 3);
        ctx.fillRect(screenX + 12 - eyeOffset, screenY + 5, 3, 3);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(screenX + 6 + eyeOffset, screenY + 6, 1, 1);
        ctx.fillRect(screenX + 13 - eyeOffset, screenY + 6, 1, 1);
        
        ctx.fillRect(screenX + 7, screenY + 12, 6, 2);
    }
}