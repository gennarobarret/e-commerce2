import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTableService } from '../../../core/services/data-table.service';
import { FeatherIconsService } from '../../../core/services/feather-icons.service';
import { NotificationService } from '../../../core/services/notifications.service';
import { SocketService } from '../../../core/services/socket.service';
import { Notification } from '../../../core/models/notification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-notifications',
  templateUrl: './list-notifications.component.html',
  styleUrls: ['./list-notifications.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ListNotificationsComponent implements OnInit, AfterViewInit, OnDestroy {
  notifications: Notification[] = [];
  private socketSubscription: Subscription | null = null;

  constructor(
    private dataTableService: DataTableService,
    private featherIconsService: FeatherIconsService,
    private notificationService: NotificationService,
    private socketService: SocketService
  ) { }

  ngOnInit(): void {
    this.notificationService.getNotifications().subscribe(
      (response: any) => {
        this.notifications = response.data.notifications;
      },
      error => {
        console.error('Error fetching notifications', error);
      }
    );

    this.socketSubscription = this.socketService.on('notification').subscribe(
      (notification: Notification) => {
        if (!this.notifications.some(notif => notif._id === notification._id)) {
          this.notifications.unshift(notification);
          this.activateFeatherIcons();
        }
      }
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.dataTableService.initializeTable('notifications-table');
      this.activateFeatherIcons();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }

  markAsViewed(notification: Notification): void {
    this.notificationService.markAsViewed(notification._id).subscribe(
      () => {
        this.notifications = this.notifications.map(notif =>
          notif._id === notification._id ? { ...notif, isViewed: true } : notif
        );
      },
      error => {
        console.error('Error marking notification as viewed', error);
      }
    );
  }

  deleteNotification(notificationId: string): void {
    this.notificationService.deleteNotification(notificationId).subscribe(
      () => {
        this.notifications = this.notifications.filter(notif => notif._id !== notificationId);
      },
      error => {
        console.error('Error deleting notification', error);
      }
    );
  }

  activateFeatherIcons(): void {
    this.featherIconsService.activateFeatherIcons();
  }
}
