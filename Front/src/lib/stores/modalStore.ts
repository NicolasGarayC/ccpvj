import { writable } from 'svelte/store';

/**
 * Centralized modal management store
 * Similar to Angular's MatDialog.closeAll()
 */

export interface ModalState {
    id: string;
    isOpen: boolean;
}

function createModalStore() {
    const { subscribe, set, update } = writable<Map<string, boolean>>(new Map());

    return {
        subscribe,

        /**
         * Register a modal
         */
        register: (id: string) => {
            update(modals => {
                modals.set(id, false);
                return modals;
            });
        },

        /**
         * Unregister a modal
         */
        unregister: (id: string) => {
            update(modals => {
                modals.delete(id);
                return modals;
            });
        },

        /**
         * Open a specific modal
         */
        open: (id: string) => {
            update(modals => {
                modals.set(id, true);
                return modals;
            });
        },

        /**
         * Close a specific modal
         */
        close: (id: string) => {
            update(modals => {
                modals.set(id, false);
                return modals;
            });
        },

        /**
         * Close all modals (like Angular's MatDialog.closeAll())
         */
        closeAll: () => {
            update(modals => {
                modals.forEach((_, id) => {
                    modals.set(id, false);
                });
                return modals;
            });

            // Also dispatch event for components that don't use the store
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('close-all-modals'));
            }
        },

        /**
         * Check if a modal is open
         */
        isOpen: (id: string): boolean => {
            let isOpen = false;
            subscribe(modals => {
                isOpen = modals.get(id) || false;
            })();
            return isOpen;
        }
    };
}

export const modalStore = createModalStore();
