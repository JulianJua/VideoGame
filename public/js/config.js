const GAME_CONFIG = {
    physics: {
        GRAVITY: 0.6,
        JUMP_FORCE: -12,
        MOVE_SPEED: 4,
        FRICTION: 0.8
    },
    
    world: {
        WIDTH: 10000,
        GROUND_LEVEL_OFFSET: 80,
        FINISH_LINE_OFFSET: 500
    },
    
    scroll: {
        INITIAL_SPEED: 3,
        MAX_SPEED: 6,
        ACCELERATION: 0.002
    },
    
    characters: [
        { 
            name: 'Red Knight', 
            bodyColor: '#FF0000', 
            armorColor: '#8B0000',
            accessory: 'helmet'
        },
        { 
            name: 'Blue Mage', 
            bodyColor: '#0066FF', 
            armorColor: '#003399',
            accessory: 'hat'
        },
        { 
            name: 'Green Archer', 
            bodyColor: '#00AA00', 
            armorColor: '#006600',
            accessory: 'hood'
        },
        { 
            name: 'Yellow Warrior', 
            bodyColor: '#FFAA00', 
            armorColor: '#CC8800',
            accessory: 'crown'
        },
        { 
            name: 'Purple Rogue', 
            bodyColor: '#AA00AA', 
            armorColor: '#660066',
            accessory: 'mask'
        }
    ],
    
    enemies: {
        COUNT: 30,
        SPAWN_START: 300,
        SPAWN_END_OFFSET: 600,
        HEIGHT_VARIANCE: 150,
        SPEED_RANGE: 3,
        BOUNCE_SPEED: 0.15
    },
    
    obstacles: [
        { x: 400, y: -140, w: 50, h: 60 },
        { x: 700, y: -160, w: 70, h: 80 },
        { x: 1100, y: -130, w: 40, h: 50 },
        { x: 1500, y: -150, w: 60, h: 70 },
        { x: 1900, y: -170, w: 50, h: 90 },
        { x: 2300, y: -140, w: 45, h: 60 },
        { x: 2700, y: -160, w: 55, h: 80 },
        { x: 3200, y: -130, w: 60, h: 50 },
        { x: 3600, y: -150, w: 70, h: 70 },
        { x: 4000, y: -170, w: 80, h: 90 }
    ],
    
    ui: {
        JUMP_COOLDOWN: 300,
        ANIMATION_SPEED: 0.2,
        LEG_ANIMATION_SPEED: 2,
        EYE_ANIMATION_SPEED: 0.1
    }
};

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;