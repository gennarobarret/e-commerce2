import { Component, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../../core/services/socket.service';
import { FeatherIconsService } from '../../../core/services/feather-icons.service';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notifications.service';
import { Notification } from '../../../core/models/notification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dropdown-notifications',
  templateUrl: './dropdown-notifications.component.html',
  styleUrls: ['./dropdown-notifications.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class DropdownNotificationsComponent implements OnInit, OnDestroy, AfterViewChecked {
  notifications: Notification[] = [];
  socketSubscription: Subscription | undefined;
  notificationsChangedSubscription: Subscription | undefined;

  constructor(
    private featherIconsService: FeatherIconsService,
    private socketService: SocketService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.socketSubscription = this.socketService.on('notification').subscribe((notification: Notification) => {
      if (!this.notifications.some(notif => notif._id === notification._id)) {
        this.notifications.unshift(notification);
        this.featherIconsService.activateFeatherIcons();
      }
    });

    this.fetchNotifications();

    this.notificationsChangedSubscription = this.notificationService.getNotificationsChanged().subscribe(() => {
      this.fetchNotifications();
    });
  }

  fetchNotifications(): void {
    this.notificationService.getNotifications().subscribe(
      (response: any) => {
        const sortedNotifications = response.data.notifications
          .sort((a: Notification, b: Notification) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.notifications = sortedNotifications.filter((notification: Notification) => !notification.isViewed);
      },
      error => {
        console.error('Error fetching notifications', error);
      }
    );
  }

  onNotificationClick(notification: Notification): void {
    this.notifications = this.notifications.filter(notif => notif._id !== notification._id);
    this.notificationService.markAsViewed(notification._id).subscribe(() => {
      this.notifications = this.notifications.filter(notif => notif._id !== notification._id);
    });
    this.featherIconsService.activateFeatherIcons();
  }

  ngAfterViewChecked(): void {
    this.featherIconsService.activateFeatherIcons();
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    if (this.notificationsChangedSubscription) {
      this.notificationsChangedSubscription.unsubscribe();
    }
  }
}
