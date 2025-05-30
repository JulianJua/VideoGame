const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static('public'));

mongoose.connect('mongodb+srv://julian:Montealban12.@cluster0.or7k80r.mongodb.net/racing-game?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    friends: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const gameRoomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    players: [{ username: String, socketId: String }],
    maxPlayers: { type: Number, default: 5 },
    gameStarted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const GameRoom = mongoose.model('GameRoom', gameRoomSchema);

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            username,
            email,
            password: hashedPassword
        });
        
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, 'secret-key');
        
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email,
                gamesPlayed: user.gamesPlayed,
                gamesWon: user.gamesWon
            } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user._id }, 'secret-key');
        
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email,
                gamesPlayed: user.gamesPlayed,
                gamesWon: user.gamesWon,
                friends: user.friends
            } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/profile/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            username: user.username,
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            winRate: user.gamesPlayed > 0 ? (user.gamesWon / user.gamesPlayed * 100).toFixed(1) : 0,
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/add-friend', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, 'secret-key');
        const { friendUsername } = req.body;
        
        const user = await User.findById(decoded.userId);
        const friend = await User.findOne({ username: friendUsername });
        
        if (!friend) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.friends.includes(friendUsername)) {
            return res.status(400).json({ error: 'Already friends' });
        }
        
        user.friends.push(friendUsername);
        friend.friends.push(user.username);
        
        await user.save();
        await friend.save();
        
        res.json({ message: 'Friend added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/friends', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, 'secret-key');
        
        const user = await User.findById(decoded.userId);
        const friends = await User.find({ username: { $in: user.friends } })
                                 .select('username gamesPlayed gamesWon');
        
        res.json(friends);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

let activeRooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('create-room', async (data) => {
        const roomId = Math.random().toString(36).substring(7);
        const room = {
            id: roomId,
            players: [{ username: data.username, socketId: socket.id, ready: false }],
            maxPlayers: 5,
            gameStarted: false
        };
        
        activeRooms.set(roomId, room);
        socket.join(roomId);
        socket.emit('room-created', { roomId });
        io.to(roomId).emit('room-updated', room);
    });
    
    socket.on('join-room', (data) => {
        const { roomId, username } = data;
        const room = activeRooms.get(roomId);
        
        if (!room) {
            socket.emit('error', 'Room not found');
            return;
        }
        
        if (room.players.length >= room.maxPlayers) {
            socket.emit('error', 'Room is full');
            return;
        }
        
        if (room.gameStarted) {
            socket.emit('error', 'Game already started');
            return;
        }
        
        room.players.push({ username, socketId: socket.id, ready: false });
        socket.join(roomId);
        io.to(roomId).emit('room-updated', room);
    });
    
    socket.on('player-ready', (data) => {
        const { roomId } = data;
        const room = activeRooms.get(roomId);
        
        if (room) {
            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                player.ready = !player.ready;
                io.to(roomId).emit('room-updated', room);
                
                if (room.players.every(p => p.ready) && room.players.length >= 2) {
                    room.gameStarted = true;
                    io.to(roomId).emit('game-start', room);
                }
            }
        }
    });
    
    socket.on('game-finished', async (data) => {
        const { roomId, results } = data;
        
        for (let result of results) {
            try {
                const user = await User.findOne({ username: result.username });
                if (user) {
                    user.gamesPlayed += 1;
                    if (result.position === 1) {
                        user.gamesWon += 1;
                    }
                    await user.save();
                }
            } catch (error) {
                console.error('Error updating user stats:', error);
            }
        }
        
        activeRooms.delete(roomId);
    });
    
    socket.on('player-position', (data) => {
        socket.to(data.roomId).emit('player-moved', {
            username: data.username,
            x: data.x,
            y: data.y,
            character: data.character
        });
    });
    
    socket.on('disconnect', () => {
        activeRooms.forEach((room, roomId) => {
            const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    activeRooms.delete(roomId);
                } else {
                    io.to(roomId).emit('room-updated', room);
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});