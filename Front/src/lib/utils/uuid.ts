const hasCrypto = typeof globalThis !== 'undefined' && typeof globalThis.crypto !== 'undefined';

const generateWithCrypto = (): string => {
	if (hasCrypto) {
		const { crypto } = globalThis;
		if (typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}
		if (typeof crypto.getRandomValues === 'function') {
			const bytes = crypto.getRandomValues(new Uint8Array(16));
			// Adapted from RFC4122 version 4
			bytes[6] = (bytes[6] & 0x0f) | 0x40;
			bytes[8] = (bytes[8] & 0x3f) | 0x80;

			const toHex = (n: number) => n.toString(16).padStart(2, '0');
			return (
				toHex(bytes[0]) +
				toHex(bytes[1]) +
				toHex(bytes[2]) +
				toHex(bytes[3]) +
				'-' +
				toHex(bytes[4]) +
				toHex(bytes[5]) +
				'-' +
				toHex(bytes[6]) +
				toHex(bytes[7]) +
				'-' +
				toHex(bytes[8]) +
				toHex(bytes[9]) +
				'-' +
				toHex(bytes[10]) +
				toHex(bytes[11]) +
				toHex(bytes[12]) +
				toHex(bytes[13]) +
				toHex(bytes[14]) +
				toHex(bytes[15])
			);
		}
	}
	return '';
};

const generateFallback = (): string => {
	let timestamp = new Date().getTime();
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
		const random = (timestamp + Math.random() * 16) % 16 | 0;
		timestamp = Math.floor(timestamp / 16);
		const value = character === 'x' ? random : (random & 0x3) | 0x8;
		return value.toString(16);
	});
};

export const safeRandomUUID = (): string => {
	const result = generateWithCrypto();
	return result || generateFallback();
};
