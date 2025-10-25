type SessionEvent = () => void;

const sessionExpiredListeners = new Set<SessionEvent>();
const sessionInvalidatedListeners = new Set<SessionEvent>();

export function onSessionExpired(listener: SessionEvent): () => void {
	sessionExpiredListeners.add(listener);
	return () => sessionExpiredListeners.delete(listener);
}

export function onSessionInvalidated(listener: SessionEvent): () => void {
	sessionInvalidatedListeners.add(listener);
	return () => sessionInvalidatedListeners.delete(listener);
}

export function emitSessionExpired(): void {
	sessionExpiredListeners.forEach(listener => {
		try {
			listener();
		} catch (error) {
			console.error('Error handling session expired listener', error);
		}
	});
}

export function emitSessionInvalidated(): void {
	sessionInvalidatedListeners.forEach(listener => {
		try {
			listener();
		} catch (error) {
			console.error('Error handling session invalidated listener', error);
		}
	});
}
