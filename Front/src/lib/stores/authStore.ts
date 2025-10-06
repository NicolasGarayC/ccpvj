import { writable } from 'svelte/store';

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
        showSessionExpired: () => set({
            show: true,
            message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
        }),
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
