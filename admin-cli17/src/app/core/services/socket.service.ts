import { Injectable, OnDestroy, Injector } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket!: Socket;
  private authService!: AuthService;
  private isConnected = false;

  constructor(private injector: Injector) {
    setTimeout(() => {
      this.authService = this.injector.get(AuthService);
      const token = this.authService.getToken();
      if (token && !this.isConnected) {
        this.connect(token);
      }
    });
  }

  connect(token: string): void {
    if (!this.isConnected) {
      this.socket = io(environment.socketUrl, {
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('Connected to server with ID:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('Disconnected from server');
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      console.log('Socket disconnected');
    }
  }

  emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  on(event: string): Observable<any> {
    return new Observable(observer => {
      this.socket.on(event, (data: any) => {
        observer.next(data);
      });

      return () => this.socket.off(event);
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
