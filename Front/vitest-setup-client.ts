/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
	cleanup();
});
