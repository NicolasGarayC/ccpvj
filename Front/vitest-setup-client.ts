import { cleanup } from '@testing-library/svelte';
import { afterEach, expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { readable, writable } from 'svelte/store';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock $app/environment to enable browser mode for Svelte components
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn()
}));

// Mock $app/stores
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn()
	},
	navigating: {
		subscribe: vi.fn()
	},
	updated: {
		subscribe: vi.fn()
	}
}));

vi.mock('@testing-library/svelte', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@testing-library/svelte')>();

	const attachOn = (component: any) => {
		if (!component || typeof component !== 'object') {
			return;
		}

		const internal = component.$$;
		if (!internal) {
			return;
		}

		internal.callbacks = internal.callbacks || {};

		component.$on = (event: string, handler: (event: CustomEvent<any>) => void) => {
			const callbacks = internal.callbacks[event] || (internal.callbacks[event] = []);
			callbacks.push(handler);
			return () => {
				const index = callbacks.indexOf(handler);
				if (index !== -1) {
					callbacks.splice(index, 1);
				}
			};
		};
	};

	return {
		...actual,
		render: (component: any, options: any = {}) => {
			const result = actual.render(component, options);
			attachOn(result.component);
			return result;
		}
	};
});

vi.mock('$env/dynamic/public', () => ({
	env: {}
}));

type Locale = 'es' | 'en';
type TranslationMap = Record<string, string>;

const DEFAULT_TRANSLATIONS: TranslationMap = {};
let translations: TranslationMap = { ...DEFAULT_TRANSLATIONS };
let currentLocale: Locale = 'es';

const localeStore = writable<Locale>(currentLocale);

const translateKey = (key: string, params?: Record<string, string | number>): string => {
	let result = translations[key] ?? key;

	if (params) {
		for (const [param, value] of Object.entries(params)) {
			result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
		}
	}

	return result;
};

const translateMock = vi.fn(
	(key: string, params?: Record<string, string | number>) => translateKey(key, params)
);

const translateParamsMock = vi.fn(
	(key: string, params?: Record<string, string | number>) => translateKey(key, params)
);

const tStore = readable(
	(key: string, params?: Record<string, string | number>) => translateKey(key, params)
);

const tParamsStore = readable(
	(key: string, params?: Record<string, string | number>) => translateKey(key, params)
);

const setTestTranslations = (overrides: TranslationMap) => {
	translations = { ...DEFAULT_TRANSLATIONS, ...overrides };
};

const resetTestTranslations = () => {
	translations = { ...DEFAULT_TRANSLATIONS };
	translateMock.mockClear();
	translateParamsMock.mockClear();
};

vi.mock('$lib/i18n', () => ({
	locale: {
		subscribe: localeStore.subscribe,
		set: localeStore.set,
		update: localeStore.update
	},
	t: {
		subscribe: tStore.subscribe
	},
	tParams: {
		subscribe: tParamsStore.subscribe
	},
	translate: translateMock,
	translate_params: translateParamsMock,
	getLocale: () => currentLocale,
	setLocale: (newLocale: Locale) => {
		currentLocale = newLocale;
		localeStore.set(newLocale);
	},
	__setTranslations: setTestTranslations,
	__resetTranslations: resetTestTranslations,
	messages: {
		es: {},
		en: {}
	}
}));

// Mock localStorage for components
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();

// Cleanup after each test
afterEach(() => {
	cleanup();
	resetTestTranslations();
});
