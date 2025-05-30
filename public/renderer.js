class Renderer {
    drawBackground(ctx, canvas, camera, gameStartTime) {
        const timeOfDay = (Date.now() - gameStartTime) * 0.0001;
        const skyColor1 = `hsl(${200 + Math.sin(timeOfDay) * 30}, 70%, 70%)`;
        const skyColor2 = `hsl(${120 + Math.sin(timeOfDay + 1) * 20}, 60%, 60%)`;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, skyColor1);
        gradient.addColorStop(0.7, skyColor2);
        gradient.addColorStop(0.7, '#90EE90');
        gradient.addColorStop(1, '#228B22');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 150) + Math.sin(Date.now() * 0.0005 + i) * 50 - camera.x * 0.2;
            const y = 20 + Math.sin(Date.now() * 0.001 + i * 2) * 30;
            if (x > -100 && x < canvas.width + 100) {
                this.drawPixelCloud(ctx, x, y, 0.8 + Math.sin(Date.now() * 0.001 + i) * 0.2);
            }
        }
        
        const grassPattern = this.createGrassTexture();
        ctx.fillStyle = grassPattern;
        ctx.fillRect(0 - (camera.x % 64), canvas.height - GAME_CONFIG.world.GROUND_LEVEL_OFFSET, canvas.width + 64, GAME_CONFIG.world.GROUND_LEVEL_OFFSET);
        
        for (let i = 0; i < GAME_CONFIG.world.WIDTH / 80; i++) {
            const x = i * 80 + 40 - camera.x;
            if (x > -80 && x < canvas.width + 80) {
                this.drawEnhancedTree(ctx, x, canvas.height - 120);
            }
        }
    }
    
    createGrassTexture() {
        const grassCanvas = document.createElement('canvas');
        grassCanvas.width = 64;
        grassCanvas.height = 64;
        const grassCtx = grassCanvas.getContext('2d');
        
        grassCtx.fillStyle = '#228B22';
        grassCtx.fillRect(0, 0, 64, 64);
        
        grassCtx.fillStyle = '#32CD32';
        for (let i = 0; i < 32; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 64;
            grassCtx.fillRect(x, y, 2, 8);
        }
        
        return grassCtx.createPattern(grassCanvas, 'repeat');
    }
    
    drawPixelCloud(ctx, x, y, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, 60, 20);
        ctx.fillRect(x - 20, y + 10, 100, 20);
        ctx.fillRect(x + 10, y - 10, 40, 20);
        ctx.restore();
    }
    
    drawEnhancedTree(ctx, x, y) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 6, y, 12, 60);
        
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(x - 4, y + 10, 8, 5);
        ctx.fillRect(x - 4, y + 25, 8, 5);
        
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x - 25, y - 30, 50, 40);
        ctx.fillRect(x - 20, y - 45, 40, 30);
        ctx.fillRect(x - 15, y - 55, 30, 25);
        
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < 8; i++) {
            const leafX = x - 20 + Math.random() * 40;
            const leafY = y - 50 + Math.random() * 30;
            ctx.fillRect(leafX, leafY, 3, 3);
        }
    }
    
    drawObstacles(ctx, canvas, camera) {
        GAME_CONFIG.obstacles.forEach(obs => {
            const screenX = obs.x - camera.x;
            const actualY = canvas.height + obs.y;
            if (screenX > -obs.w && screenX < canvas.width + obs.w) {
                for (let x = 0; x < obs.w; x += 20) {
                    for (let y = 0; y < obs.h; y += 20) {
                        const checker = (Math.floor(x / 20) + Math.floor(y / 20)) % 2;
                        ctx.fillStyle = checker === 0 ? '#8B4513' : '#A0522D';
                        ctx.fillRect(screenX + x, actualY + y, 20, 20);
                        
                        if (checker === 0) {
                            ctx.fillStyle = '#654321';
                            ctx.fillRect(screenX + x + 2, actualY + y + 2, 16, 16);
                        }
                    }
                }
            }
        });
    }
    
    drawFinishLine(ctx, canvas, camera) {
        const finishLine = GAME_CONFIG.world.WIDTH - GAME_CONFIG.world.FINISH_LINE_OFFSET;
        const screenX = finishLine - camera.x;
        if (screenX > -100 && screenX < canvas.width + 100) {
            for (let y = 0; y < canvas.height; y += 30) {
                ctx.fillStyle = (Math.floor(y / 30) % 2 === 0) ? '#000000' : '#FFFFFF';
                ctx.fillRect(screenX, y, 15, 15);
                ctx.fillRect(screenX + 15, y + 15, 15, 15);
            }
            
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(screenX + 32, 50, 6, 150);
            
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(screenX + 38, 50, 40, 25);
            
            ctx.fillStyle = '#000000';
            ctx.font = '16px monospace';
            ctx.fillText('FINISH!', screenX - 80, 40);
        }
    }
}

const renderer = new Renderer();