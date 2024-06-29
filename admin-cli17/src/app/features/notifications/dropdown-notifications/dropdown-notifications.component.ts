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

  constructor(
    private featherIconsService: FeatherIconsService,
    private socketService: SocketService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.socketSubscription = this.socketService.on('notification').subscribe((notification: Notification) => {
      if (!this.notifications.some(notif => notif._id === notification._id)) {
        this.notifications.unshift(notification); // Añadir al principio las nuevas notificaciones en tiempo real
        this.featherIconsService.activateFeatherIcons();
      }
    });

    this.notificationService.getNotifications().subscribe(
      (response: any) => {
        const sortedNotifications = response.data.notifications.sort((a: Notification, b: Notification) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
      // Actualizar la lista de notificaciones para reflejar el cambio
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
  }
}


// import { Component, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { SocketService } from '../../../core/services/socket.service';
// import { FeatherIconsService } from '../../../core/services/feather-icons.service';
// import { RouterLink } from '@angular/router';
// import { NotificationService } from '../../../core/services/notifications.service';
// import { Notification } from '../../../core/models/notification.model';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-dropdown-notifications',
//   templateUrl: './dropdown-notifications.component.html',
//   styleUrls: ['./dropdown-notifications.component.css'],
//   standalone: true,
//   imports: [CommonModule, RouterLink]
// })
// export class DropdownNotificationsComponent implements OnInit, OnDestroy, AfterViewChecked {
//   notifications: Notification[] = [];
//   allNotifications: Notification[] = [];
//   notificationIds: Set<string> = new Set();
//   socketSubscription: Subscription | undefined;

//   constructor(
//     private featherIconsService: FeatherIconsService,
//     private socketService: SocketService,
//     private notificationService: NotificationService
//   ) { }

//   ngOnInit(): void {
//     this.loadNotificationsAndSetupSocket();
//   }

//   private loadNotificationsAndSetupSocket(): void {
//     this.notificationService.getNotifications().subscribe(
//       (response: any) => {
//         const sortedNotifications = response.data.notifications.sort((a: Notification, b: Notification) => new Date(b.date).getTime() - new Date(a.date).getTime());
//         sortedNotifications.forEach((notification: Notification) => {
//           if (!this.notificationIds.has(notification._id)) {
//             this.notifications.push(notification); // Se asegura de que las notificaciones iniciales se agreguen al final en orden
//             this.allNotifications.push(notification);
//             this.notificationIds.add(notification._id);
//           }
//         });
//         this.setupSocketSubscription();
//       },
//       error => {
//         console.error('Error fetching notifications', error);
//       }
//     );
//   }

//   private setupSocketSubscription(): void {
//     this.socketSubscription = this.socketService.on('notification').subscribe((notification: Notification) => {
//       if (!this.notificationIds.has(notification._id)) {
//         this.notifications.unshift(notification); // Añadir al principio las nuevas notificaciones en tiempo real
//         this.allNotifications.unshift(notification);
//         this.notificationIds.add(notification._id);
//         this.featherIconsService.activateFeatherIcons();
//       }
//     });
//   }

//   onNotificationClick(notification: Notification): void {
//     this.notifications = this.notifications.filter(notif => notif._id !== notification._id);
//     this.notificationIds.delete(notification._id);
//     // Marcar notificación como vista en el backend
//     this.notificationService.markAsViewed(notification._id).subscribe();
//     this.featherIconsService.activateFeatherIcons();
//   }

//   ngAfterViewChecked(): void {
//     this.featherIconsService.activateFeatherIcons();
//   }

//   ngOnDestroy(): void {
//     if (this.socketSubscription) {
//       this.socketSubscription.unsubscribe();
//     }
//   }
// }
