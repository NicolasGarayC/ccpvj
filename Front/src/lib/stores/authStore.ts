import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { modalStore } from './modalStore';

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
                message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
            });
        },
        showUnauthorized: () => set({
            show: true,
            message: 'No tienes autorización para realizar esta acción.'
        }),
        hide: () => set({
            show: false,
            message: ''
        })
    };
}

export const authModalStore = createAuthModalStore();
