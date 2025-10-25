import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { modalStore } from './modalStore';
import { onSessionExpired } from '$lib/shared/session/sessionEvents';
import { translate } from '$lib/i18n';

export interface AuthModalState {
    show: boolean;
    message: string;
}

function createAuthModalStore() {
    const { subscribe, set, update } = writable<AuthModalState>({
        show: false,
        message: ''
    });

    return {
        subscribe,
        show: (message: string) => {
            modalStore.closeAll();
            set({
                show: true,
                message
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
                message: translate('modal.sessionExpiredMessage')
            });
        },
        showUnauthorized: () => set({
            show: true,
            message: translate('auth.login_required')
        }),
        hide: () => set({
            show: false,
            message: ''
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
