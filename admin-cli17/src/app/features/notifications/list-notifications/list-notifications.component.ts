import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FeatherIconsService } from '../../../core/services/feather-icons.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notifications.service';
import { SocketService } from '../../../core/services/socket.service';
import { DataTableService } from '../../../core/services/data-table.service';
import { Notification } from '../../../core/models/notification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-list-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-notifications.component.html',
  styleUrls: ['./list-notifications.component.css']
})
export class ListNotificationsComponent implements OnInit, AfterViewInit, OnDestroy {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  private socketSubscription: Subscription | null = null;
  page = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100, 200, 1000];
  sortOrder: 'asc' | 'desc' = 'asc';
  sortKey: string = 'message';
  load_data = true;
  selectedFilterKey: string = 'message';
  searchText: string = '';
  filterKeys: string[] = ['message', 'date', 'isViewed'];

  constructor(
    private notificationService: NotificationService,
    private socketService: SocketService,
    private featherIconsService: FeatherIconsService,
    private dataTableService: DataTableService
  ) { }

  ngOnInit(): void {
    this.fetchNotifications();

    this.socketSubscription = this.socketService.on('notification').subscribe(
      (notification: Notification) => {
        if (!this.notifications.some(notif => notif._id === notification._id)) {
          this.notifications.unshift(notification);
          this.applyFilter();
          this.activateFeatherIcons();
        }
      }
    );
  }

  ngAfterViewInit(): void {
    this.activateFeatherIcons();
  }

  fetchNotifications(): void {
    this.notificationService.getNotifications().subscribe(
      (response: any) => {
        this.notifications = response.data.notifications;
        this.notifications.forEach(notification => {
          notification.date = new Date(notification.date); // Asegurarse de que la fecha sea un objeto Date
        });
        this.applyFilter();
        this.load_data = false;
        this.activateFeatherIcons();
      },
      (error: any) => {
        console.error('Error fetching notifications', error);
      }
    );
  }

  activateFeatherIcons(): void {
    this.featherIconsService.activateFeatherIcons();
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
        this.applyFilter();
        this.activateFeatherIcons();
      },
      (error: any) => {
        console.error('Error marking notification as viewed', error);
      }
    );
  }

  deleteNotification(notificationId: string): void {
    this.notificationService.deleteNotification(notificationId).subscribe(
      () => {
        this.notifications = this.notifications.filter(notif => notif._id !== notificationId);
        this.applyFilter();
        this.activateFeatherIcons();
      },
      (error: any) => {
        console.error('Error deleting notification', error);
      }
    );
  }

  sort(key: string) {
    this.sortKey = key; // Actualizar sortKey
    this.notifications = this.dataTableService.sort(this.notifications, key, this.sortOrder);
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilter();
  }

  applyFilter() {
    this.filteredNotifications = this.dataTableService.applyFilter(this.notifications, this.selectedFilterKey, this.searchText);
    this.filteredNotifications = this.dataTableService.paginate(this.filteredNotifications, this.pageSize, this.page);
  }

  search() {
    this.applyFilter();
  }

  reset() {
    this.searchText = '';
    this.applyFilter();
  }

  onPageSizeChange(event: any) {
    this.pageSize = +event.target.value;
    this.page = 1;
    this.applyFilter();
  }

  getRowClass(type: string): string {
    switch (type) {
      case 'success':
        return 'table-success';
      case 'info':
        return 'table-info';
      case 'warning':
        return 'table-warning';
      case 'danger':
        return 'table-danger';
      default:
        return '';
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredNotifications.length / this.pageSize);
  }
}
