class AFKBotClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.botRunning = false;
        this.initialize();
    }

    initialize() {
        this.connectSocket();
        this.setupEventListeners();
        this.updateServerTime();
        setInterval(() => this.updateServerTime(), 1000);
    }

    connectSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.updateConnectionStatus('🟢 Connected to rexrtl.progamer.me', 'connected');
            this.addLog('Connected to AFK Bot server');
        });

        this.socket.on('welcome', (data) => {
            this.addLog(`Server: ${data.message}`);
        });

        this.socket.on('bot-status', (data) => {
            if (data.status === 'started') {
                this.botRunning = true;
                this.updateBotStatus('🟢 AFK BOT RUNNING');
                this.addLog(`AFK Bot started for ${data.duration} minutes`);
            } else {
                this.botRunning = false;
                this.updateBotStatus('🔴 AFK BOT STOPPED');
                this.addLog('AFK Bot stopped');
            }
            this.updateControls();
        });

        this.socket.on('bot-activity', (data) => {
            this.addLog(`Bot action: ${data.action}`);
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateConnectionStatus('🔴 Disconnected from server', 'disconnected');
            this.addLog('Disconnected from server');
        });
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startBot());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopBot());
        document.getElementById('emergencyBtn').addEventListener('click', () => this.emergencyStop());
        document.getElementById('clearLog').addEventListener('click', () => this.clearLog());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.startBot();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        this.emergencyStop();
                        break;
                }
            }
        });
    }

    async startBot() {
        const duration = document.getElementById('duration').value;
        const movementDelay = document.getElementById('movementDelay').value;
        
        const selectedActions = Array.from(document.querySelectorAll('input[name="actions"]:checked'))
            .map(cb => cb.value);

        try {
            const response = await fetch('/api/bot/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    duration: parseInt(duration),
                    movementDelay: parseInt(movementDelay),
                    actions: selectedActions
                })
            });

            const data = await response.json();
            this.addLog(`Server: ${data.message}`);
            
            // Emit socket event for real-time updates
            this.socket.emit('start-bot', {
                duration: parseInt(duration),
                movementDelay: parseInt(movementDelay)
            });

        } catch (error) {
            this.addLog(`Error: Failed to start bot - ${error.message}`);
        }
    }

    async stopBot() {
        try {
            const response = await fetch('/api/bot/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            this.addLog(`Server: ${data.message}`);
            
            this.socket.emit('stop-bot');

        } catch (error) {
            this.addLog(`Error: Failed to stop bot - ${error.message}`);
        }
    }

    emergencyStop() {
        this.addLog('🚨 EMERGENCY STOP ACTIVATED');
        this.stopBot();
        
        // Immediate UI update
        this.botRunning = false;
        this.updateBotStatus('🚨 EMERGENCY STOPPED');
        this.updateControls();
    }

    updateBotStatus(status) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = status;
        statusElement.className = `status ${this.botRunning ? 'running' : 'stopped'}`;
    }

    updateConnectionStatus(message, status) {
        const connectionElement = document.getElementById('connection-status');
        connectionElement.textContent = message;
        connectionElement.className = `connection ${status}`;
    }

    updateControls() {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        startBtn.disabled = this.botRunning || !this.isConnected;
        stopBtn.disabled = !this.botRunning || !this.isConnected;
    }

    addLog(message) {
        const log = document.getElementById('log');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
        log.appendChild(logEntry);
        log.scrollTop = log.scrollHeight;
    }

    clearLog() {
        document.getElementById('log').innerHTML = '';
        this.addLog('Log cleared');
    }

    updateServerTime() {
        const timeElement = document.getElementById('server-time');
        const now = new Date();
        timeElement.textContent = `Server Time: ${now.toLocaleString()}`;
    }
}

// Initialize the AFK Bot Client when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AFKBotClient();
});
