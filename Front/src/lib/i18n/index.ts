// Simple i18n system for Centro Cultural
import { getLocale } from '$lib/paraglide/runtime';
import { messages, type MessageKey, type Locale } from './messages';

/**
 * Get translation for a key
 */
export function t(key: MessageKey): string {
  try {
    const locale = getLocale() as Locale;
    const localeMessages = messages[locale] || messages.es;
    return localeMessages[key] || key;
  } catch (error) {
    console.warn('Translation error:', error);
    return key;
  }
}

/**
 * Async version (compatibility)
 */
export async function translate(key: string, locale?: string): Promise<string> {
  return t(key);
}

/**
 * Load messages (no-op for compatibility)
 */
export async function loadMessages(): Promise<void> {
  // No-op since we import directly
  return Promise.resolve();
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): string[] {
  return ['es', 'en'];
}

/**
 * Check if a key exists
 */
export function hasTranslation(key: MessageKey): boolean {
  const locale = getLocale() as Locale;
  const localeMessages = messages[locale] || messages.es;
  return key in localeMessages;
}