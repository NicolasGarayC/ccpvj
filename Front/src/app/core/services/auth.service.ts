import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.getUserFromStorage()
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    const user = this.currentUserValue;
    return !!user && !this.isTokenExpired();
  }

  public get isEducador(): boolean {
    const user = this.currentUserValue;
    return user?.role === 'Educador';
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            const user: User = {
              id: response.idUsuario,
              username: response.nombreUsuario,
              role: response.rol,
              token: response.token
            };
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('tokenExpiration', response.expiresAt);
            this.currentUserSubject.next(user);
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tokenExpiration');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  verifyToken(): Observable<any> {
    return this.http.get(`${this.API_URL}/auth/verify`)
      .pipe(catchError(this.handleError));
  }

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (this.isTokenExpired()) {
          this.logout();
          return null;
        }
        return user;
      } catch {
        localStorage.removeItem('currentUser');
        return null;
      }
    }
    return null;
  }

  private isTokenExpired(): boolean {
    const expiration = localStorage.getItem('tokenExpiration');
    if (!expiration) return true;
    
    const expirationDate = new Date(expiration);
    return expirationDate <= new Date();
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'Credenciales inválidas';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Datos de entrada inválidos';
      } else if (error.status === 500) {
        errorMessage = 'Error del servidor. Intente más tarde';
      } else {
        errorMessage = `Error: ${error.status} - ${error.message}`;
      }
    }
    
    return throwError(() => errorMessage);
  }
}
