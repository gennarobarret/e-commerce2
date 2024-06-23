import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;

  constructor() {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('Token not found');
    } else {
      console.log('Token found:', token);

      // Conectar al servidor de Socket.io
      this.socket = io(environment.socketUrl, {
        withCredentials: true,
        extraHeaders: {
          Authorization: `Bearer ${token}` // Asegúrate de usar el prefijo 'Bearer ' si es necesario
        }
      });

      // Eventos de conexión y error
      this.socket.on('connect', () => {
        console.log('Connected to Socket.io server');
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket.io connection error:', err);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from Socket.io server:', reason);
      });
    }
  }


  // Método para recibir alertas en tiempo real
  // Método para recibir alertas en tiempo real
  onAlert(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('alertCreated', (alert) => {
        console.log('Received alert:', alert); // Log de depuración
        observer.next(alert);
      });

      // Manejar desconexiones o errores
      this.socket.on('disconnect', (reason) => {
        observer.error('Socket disconnected: ' + reason);
      });

      return () => {
        this.socket.off('alertCreated');
      };
    });
  }

  // Método para emitir alertas (si es necesario)
  sendAlert(alert: any) {
    this.socket.emit('sendAlert', alert);
  }
}
