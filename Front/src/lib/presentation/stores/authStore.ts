import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { modalStore } from './modalStore';
import { onSessionExpired } from '$lib/shared/session/sessionEvents';
import { translate } from '$lib/i18n';

export interface AuthModalState {
    show: boolean;
    message: string;
    type: 'warning' | 'expired' | 'unauthorized';
    timeRemaining?: number; // For warning modal countdown
}

function createAuthModalStore() {
    const { subscribe, set, update } = writable<AuthModalState>({
        show: false,
        message: '',
        type: 'expired'
    });

    return {
        subscribe,
        show: (message: string) => {
            modalStore.closeAll();
            set({
                show: true,
                message,
                type: 'unauthorized'
            });
        },
        showSessionWarning: (timeRemaining: number) => {
            // Cerrar TODOS los modales primero
            modalStore.closeAll();

            // Emitir evento global para componentes que no usan modalStore
            if (browser) {
                window.dispatchEvent(new CustomEvent('session-warning'));
            }

            // Mostrar modal de advertencia de sesión
            set({
                show: true,
                message: translate('modal.sessionWarningMessage'),
                type: 'warning',
                timeRemaining
            });
        },
        showSessionExpired: () => {
            // Cerrar TODOS los modales primero
            modalStore.closeAll();

            // Emitir evento global para componentes que no usan modalStore
            if (browser) {
                window.dispatchEvent(new CustomEvent('session-expired'));
            }

            // Mostrar modal de sesión expirada
            set({
                show: true,
                message: translate('modal.sessionExpiredMessage'),
                type: 'expired'
            });
        },
        showUnauthorized: () => set({
            show: true,
            message: translate('auth.login_required'),
            type: 'unauthorized'
        }),
        updateTimeRemaining: (timeRemaining: number) => {
            update(state => ({
                ...state,
                timeRemaining
            }));
        },
        hide: () => set({
            show: false,
            message: '',
            type: 'expired'
        })
    };
}

const authModalStore = createAuthModalStore();

if (browser) {
    onSessionExpired(() => {
        authModalStore.showSessionExpired();
    });
}

export { authModalStore };
