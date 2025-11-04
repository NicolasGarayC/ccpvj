import { browser } from '$app/environment';
import { jwtService } from './JwtService';

/**
 * Service to detect user inactivity and manage session timeouts
 *
 * Features:
 * - Detects user activity (mouse, keyboard, touch)
 * - Shows warning 2 minutes before session expires
 * - Auto-logout after session expires
 */

type InactivityCallback = () => void;
type WarningCallback = (timeRemaining: number) => void;

class InactivityService {
    private lastActivityTime: number = Date.now();
    private warningTimer: number | null = null;
    private logoutTimer: number | null = null;
    private activityCheckInterval: number | null = null;

    // Callbacks
    private onWarningCallback: WarningCallback | null = null;
    private onLogoutCallback: InactivityCallback | null = null;

    // Configuration (in milliseconds)
    private readonly WARNING_TIME = 2 * 60 * 1000; // 2 minutes before expiration
    private readonly AUTO_LOGOUT_COUNTDOWN = 30 * 1000; // 30 seconds countdown

    // Activity events to listen for
    private readonly ACTIVITY_EVENTS = [
        'mousedown',
        'mousemove',
        'keypress',
        'scroll',
        'touchstart',
        'click'
    ];

    constructor() {
        if (browser) {
            this.setupActivityListeners();
        }
    }

    /**
     * Start monitoring user inactivity
     */
    start(): void {
        if (!browser) return;

        this.lastActivityTime = Date.now();
        this.startActivityCheck();
    }

    /**
     * Stop monitoring user inactivity
     */
    stop(): void {
        this.clearTimers();
        if (this.activityCheckInterval !== null) {
            clearInterval(this.activityCheckInterval);
            this.activityCheckInterval = null;
        }
    }

    /**
     * Register callback for warning (2 minutes before expiration)
     */
    onWarning(callback: WarningCallback): void {
        this.onWarningCallback = callback;
    }

    /**
     * Register callback for auto-logout
     */
    onLogout(callback: InactivityCallback): void {
        this.onLogoutCallback = callback;
    }

    /**
     * Reset inactivity timer (called when user is active or clicks "Continue")
     */
    resetInactivity(): void {
        this.lastActivityTime = Date.now();
        this.clearTimers();
        this.startActivityCheck();
    }

    /**
     * Get time until token expires (in milliseconds)
     */
    private getTimeUntilExpiration(): number | null {
        const expiration = jwtService.getTokenExpiration();
        if (!expiration) return null;

        return expiration.getTime() - Date.now();
    }

    /**
     * Setup event listeners for user activity
     */
    private setupActivityListeners(): void {
        this.ACTIVITY_EVENTS.forEach(event => {
            window.addEventListener(event, this.handleActivity, { passive: true });
        });
    }

    /**
     * Handle user activity
     */
    private handleActivity = (): void => {
        this.lastActivityTime = Date.now();
    };

    /**
     * Start checking activity periodically
     */
    private startActivityCheck(): void {
        // Check every 10 seconds
        this.activityCheckInterval = window.setInterval(() => {
            this.checkInactivity();
        }, 10000);

        // Also check immediately
        this.checkInactivity();
    }

    /**
     * Check if user is inactive and handle accordingly
     */
    private checkInactivity(): void {
        const timeUntilExpiration = this.getTimeUntilExpiration();

        if (timeUntilExpiration === null) {
            // No token or can't get expiration, stop monitoring
            this.stop();
            return;
        }

        // If token expired or about to expire
        if (timeUntilExpiration <= 0) {
            this.triggerLogout();
            return;
        }

        // If within warning period (2 minutes before expiration)
        if (timeUntilExpiration <= this.WARNING_TIME) {
            this.triggerWarning(Math.ceil(timeUntilExpiration / 1000)); // Convert to seconds
        }
    }

    /**
     * Trigger warning callback
     */
    private triggerWarning(secondsRemaining: number): void {
        if (this.onWarningCallback) {
            this.onWarningCallback(secondsRemaining);
        }

        // Clear existing timers
        this.clearTimers();

        // Set logout timer for 30 seconds from now (or remaining time if less than 30s)
        const logoutDelay = Math.min(secondsRemaining * 1000, this.AUTO_LOGOUT_COUNTDOWN);

        this.logoutTimer = window.setTimeout(() => {
            this.triggerLogout();
        }, logoutDelay);
    }

    /**
     * Trigger logout callback
     */
    private triggerLogout(): void {
        this.stop();

        if (this.onLogoutCallback) {
            this.onLogoutCallback();
        }
    }

    /**
     * Clear all timers
     */
    private clearTimers(): void {
        if (this.warningTimer !== null) {
            clearTimeout(this.warningTimer);
            this.warningTimer = null;
        }

        if (this.logoutTimer !== null) {
            clearTimeout(this.logoutTimer);
            this.logoutTimer = null;
        }
    }

    /**
     * Cleanup listeners (for testing or unmounting)
     */
    cleanup(): void {
        this.stop();

        if (browser) {
            this.ACTIVITY_EVENTS.forEach(event => {
                window.removeEventListener(event, this.handleActivity);
            });
        }
    }
}

// Export singleton instance
export const inactivityService = new InactivityService();
