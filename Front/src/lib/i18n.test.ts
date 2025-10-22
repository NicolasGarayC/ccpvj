// Versión simplificada de i18n para tests
import { writable, derived } from 'svelte/store';

export type Locale = 'es' | 'en';
export type MessageKey = string;

// Store simple para tests
export const locale = writable<Locale>('es');

// Store derivado que retorna la key como traducción
export const t = derived(locale, () => (key: string) => key);

// Store derivado para traducciones con parámetros
export const tParams = derived(locale, () => (key: string, params?: Record<string, string | number>) => {
  if (!params) return key;
  let result = key;
  Object.entries(params).forEach(([param, value]) => {
    result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
  });
  return result;
});

// Funciones helper
export function getLocale(): Locale {
  return 'es';
}

export function setLocale(newLocale: Locale): void {
  locale.set(newLocale);
}

export function translate(key: string): string {
  return key;
}

export function translate_params(key: string, params?: Record<string, string | number>): string {
  if (!params) return key;
  let result = key;
  Object.entries(params).forEach(([param, value]) => {
    result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
  });
  return result;
}

export const messages = {
  es: {},
  en: {}
};

export default translate;
