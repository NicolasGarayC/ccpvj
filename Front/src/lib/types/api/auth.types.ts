/**
 * Authentication DTOs - Based on Backend .NET DTOs
 * Replaces SQLite schema imports
 */

export interface LoginRequest {
	nombreUsuario: string;
	contrasena: string;
}

export interface UsuarioDto {
	idUsuario: number;
	nombreUsuario: string;
	nombre: string;
	apellido: string;
	telefono: string;
	nombreRol: string;
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	expiresAt: string; // ISO date string
	usuario: UsuarioDto;
}

export interface RefreshTokenRequest {
	refreshToken: string;
}

// Frontend-specific interfaces
export interface LoginResponse {
	success: boolean;
	error?: string;
	user?: AuthUser;
}

export interface AuthUser {
	id: number;
	username: string;
	nombre: string;
	apellido: string;
	telefono?: string;
	role: string;
}

// Role types
export type UserRole = 'asistente' | 'colaborador' | 'administrador';

export interface AuthStatus {
	isAuthenticated: boolean;
	user: AuthUser | null;
}