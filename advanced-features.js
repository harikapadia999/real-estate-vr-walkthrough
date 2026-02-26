// ==================== ADVANCED FEATURES MODULE ====================

class VRTourAdvanced {
    constructor(viewer) {
        this.viewer = viewer;
        this.measurementMode = false;
        this.measurementPoints = [];
        this.virtualStagingEnabled = true;
        this.analytics = {
            roomVisits: {},
            timeSpent: {},
            hotspotClicks: {},
            startTime: Date.now()
        };
        this.currentRoomStartTime = Date.now();
    }

    // ==================== MEASUREMENT TOOL ====================
    
    toggleMeasurementMode() {
        this.measurementMode = !this.measurementMode;
        
        if (this.measurementMode) {
            this.showMeasurementUI();
            this.viewer.on('click', this.handleMeasurementClick.bind(this));
        } else {
            this.hideMeasurementUI();
            this.viewer.off('click', this.handleMeasurementClick.bind(this));
            this.clearMeasurements();
        }
    }

    handleMeasurementClick(event) {
        if (!this.measurementMode) return;

        const coords = this.viewer.mouseEventToCoords(event);
        this.measurementPoints.push(coords);

        if (this.measurementPoints.length === 2) {
            const distance = this.calculateDistance(
                this.measurementPoints[0],
                this.measurementPoints[1]
            );
            this.displayMeasurement(distance);
            this.measurementPoints = [];
        }
    }

    calculateDistance(point1, point2) {
        // Convert pitch/yaw to 3D coordinates
        const toRadians = (deg) => deg * Math.PI / 180;
        
        const pitch1 = toRadians(point1[0]);
        const yaw1 = toRadians(point1[1]);
        const pitch2 = toRadians(point2[0]);
        const yaw2 = toRadians(point2[1]);

        // Assuming room height of 12 feet for scale
        const roomHeight = 12;
        const scale = roomHeight / Math.abs(Math.sin(pitch1) - Math.sin(pitch2)) || 1;

        // Calculate angular distance
        const angularDistance = Math.acos(
            Math.sin(pitch1) * Math.sin(pitch2) +
            Math.cos(pitch1) * Math.cos(pitch2) * Math.cos(yaw1 - yaw2)
        );

        // Convert to feet (approximate)
        const distance = angularDistance * scale;
        
        return {
            feet: Math.round(distance * 10) / 10,
            meters: Math.round(distance * 0.3048 * 10) / 10
        };
    }

    displayMeasurement(distance) {
        const message = `📏 Measurement\n\n${distance.feet} feet\n${distance.meters} meters`;
        
        // Create measurement overlay
        const overlay = document.createElement('div');
        overlay.className = 'measurement-result';
        overlay.innerHTML = `
            <div class="measurement-content">
                <div class="measurement-icon">📏</div>
                <div class="measurement-value">${distance.feet} ft</div>
                <div class="measurement-value-alt">${distance.meters} m</div>
                <button onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;
        document.body.appendChild(overlay);

        setTimeout(() => overlay.remove(), 5000);
    }

    showMeasurementUI() {
        const ui = document.createElement('div');
        ui.id = 'measurementUI';
        ui.className = 'measurement-ui';
        ui.innerHTML = `
            <div class="measurement-instructions">
                📏 Measurement Mode Active
                <br>
                <small>Click two points to measure distance</small>
            </div>
        `;
        document.body.appendChild(ui);
    }

    hideMeasurementUI() {
        const ui = document.getElementById('measurementUI');
        if (ui) ui.remove();
    }

    clearMeasurements() {
        this.measurementPoints = [];
        document.querySelectorAll('.measurement-result').forEach(el => el.remove());
    }

    // ==================== VIRTUAL STAGING ====================

    toggleVirtualStaging() {
        this.virtualStagingEnabled = !this.virtualStagingEnabled;
        
        // In production, this would swap between staged/unstaged panoramas
        const message = this.virtualStagingEnabled 
            ? '🪑 Virtual Staging: ON\n\nShowing furnished version'
            : '📦 Virtual Staging: OFF\n\nShowing empty space';
        
        this.showNotification(message);
        
        // Track analytics
        this.trackEvent('virtual_staging_toggle', {
            enabled: this.virtualStagingEnabled,
            room: this.getCurrentRoom()
        });
    }

    // ==================== DAY/NIGHT MODE ====================

    toggleDayNight() {
        // In production, this would swap between day/night panoramas
        const currentMode = this.getDayNightMode();
        const newMode = currentMode === 'day' ? 'night' : 'day';
        
        this.showNotification(`${newMode === 'day' ? '☀️' : '🌙'} ${newMode.toUpperCase()} Mode`);
        
        // Track analytics
        this.trackEvent('day_night_toggle', {
            mode: newMode,
            room: this.getCurrentRoom()
        });
    }

    getDayNightMode() {
        // Placeholder - would track actual mode
        return 'day';
    }

    // ==================== ANALYTICS ====================

    trackRoomVisit(roomName) {
        // Track time spent in previous room
        if (this.currentRoom) {
            const timeSpent = Date.now() - this.currentRoomStartTime;
            this.analytics.timeSpent[this.currentRoom] = 
                (this.analytics.timeSpent[this.currentRoom] || 0) + timeSpent;
        }

        // Track new room visit
        this.analytics.roomVisits[roomName] = 
            (this.analytics.roomVisits[roomName] || 0) + 1;
        
        this.currentRoom = roomName;
        this.currentRoomStartTime = Date.now();

        // Send to analytics service (placeholder)
        this.sendAnalytics('room_visit', {
            room: roomName,
            timestamp: Date.now()
        });
    }

    trackHotspotClick(hotspotType, hotspotData) {
        const key = `${hotspotType}_${hotspotData}`;
        this.analytics.hotspotClicks[key] = 
            (this.analytics.hotspotClicks[key] || 0) + 1;

        this.sendAnalytics('hotspot_click', {
            type: hotspotType,
            data: hotspotData,
            room: this.getCurrentRoom()
        });
    }

    trackEvent(eventName, eventData) {
        this.sendAnalytics(eventName, eventData);
    }

    sendAnalytics(eventName, eventData) {
        // In production, send to Google Analytics, Mixpanel, etc.
        console.log('📊 Analytics:', eventName, eventData);
        
        // Example: Google Analytics 4
        // gtag('event', eventName, eventData);
        
        // Example: Mixpanel
        // mixpanel.track(eventName, eventData);
    }

    getAnalyticsSummary() {
        const totalTime = Date.now() - this.analytics.startTime;
        const currentRoomTime = Date.now() - this.currentRoomStartTime;
        
        return {
            totalTime: Math.round(totalTime / 1000),
            roomVisits: this.analytics.roomVisits,
            timeSpent: {
                ...this.analytics.timeSpent,
                [this.currentRoom]: (this.analytics.timeSpent[this.currentRoom] || 0) + currentRoomTime
            },
            hotspotClicks: this.analytics.hotspotClicks,
            mostVisitedRoom: this.getMostVisitedRoom(),
            longestTimeRoom: this.getLongestTimeRoom()
        };
    }

    getMostVisitedRoom() {
        let maxVisits = 0;
        let mostVisited = null;
        
        for (const [room, visits] of Object.entries(this.analytics.roomVisits)) {
            if (visits > maxVisits) {
                maxVisits = visits;
                mostVisited = room;
            }
        }
        
        return mostVisited;
    }

    getLongestTimeRoom() {
        let maxTime = 0;
        let longestRoom = null;
        
        const timeSpent = {
            ...this.analytics.timeSpent,
            [this.currentRoom]: (this.analytics.timeSpent[this.currentRoom] || 0) + 
                (Date.now() - this.currentRoomStartTime)
        };
        
        for (const [room, time] of Object.entries(timeSpent)) {
            if (time > maxTime) {
                maxTime = time;
                longestRoom = room;
            }
        }
        
        return longestRoom;
    }

    // ==================== UTILITY FUNCTIONS ====================

    getCurrentRoom() {
        return this.currentRoom || 'unknown';
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'vr-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ==================== SCREENSHOT ====================

    takeScreenshot() {
        const canvas = document.querySelector('#panorama canvas');
        if (!canvas) return;

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `manhattan-penthouse-${this.getCurrentRoom()}-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);

            this.showNotification('📸 Screenshot saved!');
            this.trackEvent('screenshot', { room: this.getCurrentRoom() });
        });
    }

    // ==================== TOUR GUIDE ====================

    startGuidedTour() {
        const tourSequence = ['living', 'kitchen', 'bedroom', 'bathroom', 'terrace'];
        let currentIndex = 0;

        const nextRoom = () => {
            if (currentIndex >= tourSequence.length) {
                this.showNotification('🎉 Tour Complete!');
                return;
            }

            const room = tourSequence[currentIndex];
            this.showNotification(`🎯 Guided Tour: ${room}`);
            
            // Trigger room change (would integrate with main app)
            window.loadScene(room);
            
            currentIndex++;
            setTimeout(nextRoom, 8000); // 8 seconds per room
        };

        this.showNotification('🎬 Starting Guided Tour...');
        setTimeout(nextRoom, 2000);
        
        this.trackEvent('guided_tour_start', {});
    }

    // ==================== COMPARISON MODE ====================

    enableComparisonMode(room1, room2) {
        // Split screen comparison (advanced feature)
        this.showNotification(`🔄 Comparing ${room1} vs ${room2}`);
        this.trackEvent('comparison_mode', { room1, room2 });
    }

    // ==================== EXPORT TOUR DATA ====================

    exportTourData() {
        const summary = this.getAnalyticsSummary();
        const data = {
            property: 'The Manhattan Penthouse',
            tourDate: new Date().toISOString(),
            duration: summary.totalTime,
            analytics: summary
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tour-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('📊 Tour data exported!');
    }
}

// ==================== CSS STYLES FOR ADVANCED FEATURES ====================

const advancedStyles = `
    .measurement-ui {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.9);
        backdrop-filter: blur(20px);
        padding: 30px 40px;
        border-radius: 20px;
        border: 2px solid var(--gold);
        text-align: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    }

    .measurement-instructions {
        font-size: 18px;
        color: var(--gold);
        font-weight: 600;
    }

    .measurement-instructions small {
        font-size: 14px;
        color: rgba(255,255,255,0.6);
        font-weight: 400;
    }

    .measurement-result {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10001;
        animation: fadeIn 0.3s ease;
    }

    .measurement-content {
        background: rgba(0,0,0,0.95);
        backdrop-filter: blur(30px);
        padding: 40px 50px;
        border-radius: 25px;
        border: 3px solid var(--gold);
        text-align: center;
        box-shadow: 0 30px 80px rgba(0,0,0,0.9);
    }

    .measurement-icon {
        font-size: 48px;
        margin-bottom: 20px;
    }

    .measurement-value {
        font-size: 42px;
        font-weight: 800;
        color: var(--gold);
        font-family: 'Playfair Display', serif;
        margin-bottom: 10px;
    }

    .measurement-value-alt {
        font-size: 24px;
        color: rgba(255,255,255,0.6);
        margin-bottom: 20px;
    }

    .measurement-content button {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 10px 20px;
        border-radius: 50px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
    }

    .measurement-content button:hover {
        background: rgba(255,255,255,0.2);
    }

    .vr-notification {
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: rgba(0,0,0,0.95);
        backdrop-filter: blur(20px);
        padding: 20px 40px;
        border-radius: 50px;
        border: 2px solid var(--gold);
        color: white;
        font-size: 16px;
        font-weight: 600;
        z-index: 10000;
        opacity: 0;
        transition: all 0.3s ease;
        white-space: pre-line;
        text-align: center;
    }

    .vr-notification.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = advancedStyles;
document.head.appendChild(styleSheet);

// Export for use in main application
window.VRTourAdvanced = VRTourAdvanced;
