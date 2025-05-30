class ProfileManager {
    async loadProfile() {
        if (!authManager.currentUser) return;
        
        try {
            const response = await fetch(`/api/profile/${authManager.currentUser.username}`);
            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('profileInfo').innerHTML = `
                    <div class="stats-grid">
                        <div class="stat-box">
                            <div class="stat-number">${data.gamesPlayed}</div>
                            <div class="stat-label">Games Played</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">${data.gamesWon}</div>
                            <div class="stat-label">Games Won</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-number">${data.winRate}%</div>
                            <div class="stat-label">Win Rate</div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
        
        this.loadFriends();
    }
    
    async loadFriends() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/friends', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const friends = await response.json();
            
            if (response.ok) {
                const friendsList = document.getElementById('friendsList');
                friendsList.innerHTML = '';
                
                if (friends.length === 0) {
                    friendsList.innerHTML = '<div style="padding: 20px; text-align: center; color: #888; font-size: 8px;">No friends added yet</div>';
                } else {
                    friends.forEach(friend => {
                        const winRate = friend.gamesPlayed > 0 ? 
                            ((friend.gamesWon / friend.gamesPlayed) * 100).toFixed(1) : 0;
                        
                        friendsList.innerHTML += `
                            <div class="friend-item">
                                <div class="friend-name">${friend.username}</div>
                                <div class="friend-stats">${friend.gamesWon}W/${friend.gamesPlayed}P (${winRate}%)</div>
                            </div>
                        `;
                    });
                }
            }
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    }
    
    async addFriend() {
        const friendUsername = document.getElementById('friendUsername').value.trim();
        if (!friendUsername) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/add-friend', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ friendUsername })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('profileMessage').innerHTML = 
                    '<div class="success">Friend added successfully!</div>';
                document.getElementById('friendUsername').value = '';
                this.loadFriends();
            } else {
                document.getElementById('profileMessage').innerHTML = 
                    `<div class="error">${data.error}</div>`;
            }
        } catch (error) {
            document.getElementById('profileMessage').innerHTML = 
                '<div class="error">Connection error</div>';
        }
    }
    
    showFriends() {
        this.loadFriends();
    }
}

const profileManager = new ProfileManager();