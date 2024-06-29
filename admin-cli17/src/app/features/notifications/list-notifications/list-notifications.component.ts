import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { DataTableService } from '../../../core/services/data-table.service';
import { NotificationService } from '../../../core/services/notifications.service';
import { Notification } from '../../../core/models/notification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-notifications',
  templateUrl: './list-notifications.component.html',
  styleUrls: ['./list-notifications.component.css']
})
export class ListNotificationsComponent implements OnInit, AfterViewInit, OnDestroy {
  notifications: Notification[] = [];
  private socketSubscription: Subscription | null = null;

  constructor(
    private dataTableService: DataTableService,
    private notificationService: NotificationService
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
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.dataTableService.initializeTable('notifications-table');
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
}
