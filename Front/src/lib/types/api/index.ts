/**
 * API Types Index - Export all API-related types
 * Central import point for all HTTP service types
 */

// Auth types
export * from './auth.types';

// Course types (legacy)
export * from './course.types';

// Material Apoyo types
export * from './materialApoyo.types';

// Blog types
export * from './blog.types';

// Common types
export * from './common.types';

// Re-export base service types
export type { ApiError } from '$lib/services/base/baseHttpService';