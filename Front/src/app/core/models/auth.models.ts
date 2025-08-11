export interface LoginRequest {
  nombreUsuario: string;
  contrasena: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  idUsuario: number;
  nombreUsuario: string;
  rol: string;
  expiresAt: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
