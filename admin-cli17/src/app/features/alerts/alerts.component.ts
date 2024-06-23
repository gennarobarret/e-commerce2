import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AlertService } from '../../core/services/alert.service';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css'],
  imports: [CommonModule, HttpClientModule]
})
export class AlertsComponent implements OnInit, OnDestroy {
  alerts: any[] = [];
  page: number = 1;
  limit: number = 10;
  private subscriptions = new Subscription();

  constructor(private alertService: AlertService, private socketService: SocketService) { }

  ngOnInit(): void {
    this.loadAlerts();
    this.listenForAlerts();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Método para cargar alertas desde el servidor
  loadAlerts(): void {
    this.alertService.getAlerts(this.page, this.limit).subscribe(
      (data) => {
        if (data && data.alerts) {
          this.alerts = data.alerts;
          console.log('Alerts loaded:', this.alerts);
        } else {
          console.error('Unexpected data structure:', data);
          alert('Failed to load alerts. Unexpected response structure.');
        }
      },
      (error) => {
        console.error('Error loading alerts:', error);
        alert('Failed to load alerts. Please check the console for more details.');
      }
    );
  }

  // Método para escuchar nuevas alertas en tiempo real
  listenForAlerts(): void {
    this.subscriptions.add(
      this.socketService.onAlert().subscribe(alert => {
        console.log('Received alert in component:', alert);
        this.alerts.unshift(alert); // Añadir la alerta al principio del array
        if (this.alerts.length > 10) {
          this.alerts.pop(); // Limitar el número de alertas mostradas
        }
      })
    );
  }

  // Método para obtener la clase de ícono basada en el tipo de alerta
  getIconClass(type: string): string {
    switch (type) {
      case 'info': return 'feather-icon info-icon';
      case 'warning': return 'feather-icon warning-icon';
      case 'danger': return 'fas fa-exclamation-triangle';
      case 'success': return 'feather-icon success-icon';
      default: return 'feather-icon default-icon';
    }
  }

  // Método para marcar una alerta como vista
  markAsSeen(alertId: string): void {
    this.alertService.markAlertAsSeen(alertId).subscribe(
      (response) => {
        console.log('Alert marked as seen:', response);
        const alertIndex = this.alerts.findIndex(alert => alert._id === alertId);
        if (alertIndex !== -1) {
          this.alerts[alertIndex].isSeen = true;
        }
      },
      (error) => {
        console.error('Error marking alert as seen:', error);
        alert('Failed to mark alert as seen. Please try again.');
      }
    );
  }
}
