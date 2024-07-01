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
  private notificationsChangedSubscription: Subscription | null = null;
  page = 1;
  pageSize = 10;
  totalPages = 0;
  pageSizeOptions = [5, 10, 25, 50, 100, 200, 1000];
  sortOrder: 'asc' | 'desc' = 'asc';
  sortKey: string = 'message';
  load_data = true;
  selectedFilterKey: string = 'message';
  searchText: string = '';
  filterKeys: string[] = ['message', 'date', 'type', 'isViewed'];
  startDate: string = '';
  endDate: string = '';

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

    this.notificationsChangedSubscription = this.notificationService.getNotificationsChanged().subscribe(() => {
      this.fetchNotifications();
    });
  }

  ngAfterViewInit(): void {
    this.activateFeatherIcons();
  }

  fetchNotifications(): void {
    this.notificationService.getNotifications().subscribe(
      (response: any) => {
        this.notifications = response.data.notifications;
        this.notifications.forEach(notification => {
          notification.date = new Date(notification.date);
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
    if (this.notificationsChangedSubscription) {
      this.notificationsChangedSubscription.unsubscribe();
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
    this.sortKey = key;
    this.notifications = this.dataTableService.sort(this.notifications, key, this.sortOrder);
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilter();
  }

  applyFilter() {
    let filtered = this.notifications;

    // Filtrado por fecha
    if (this.selectedFilterKey === 'date') {
      const start = this.startDate ? new Date(this.startDate) : null;
      const end = this.endDate ? new Date(this.endDate) : null;

      filtered = filtered.filter(notification => {
        const date = new Date(notification.date);
        if (start && end) {
          return date >= start && date <= end;
        } else if (start) {
          return date >= start;
        } else if (end) {
          return date <= end;
        }
        return true;
      });
    } else if (this.selectedFilterKey === 'isViewed') {
      if (this.searchText !== '') {
        filtered = filtered.filter(notification => notification.isViewed.toString() === this.searchText);
      }
    } else if (this.searchText !== '') {
      filtered = this.dataTableService.applyFilter(filtered, this.selectedFilterKey, this.searchText);
    }

    // Ordenar los datos
    filtered = this.dataTableService.sort(filtered, this.sortKey, this.sortOrder);

    // Aplicar paginación
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    const startIndex = (this.page - 1) * this.pageSize;
    this.filteredNotifications = filtered.slice(startIndex, startIndex + this.pageSize);

    // Logs para depuración
    // console.log('Total notifications:', this.notifications.length);
    // console.log('Filtered notifications:', filtered.length);
    // console.log('Current page:', this.page);
    // console.log('Page size:', this.pageSize);
    // console.log('Filtered notifications for current page:', this.filteredNotifications.length);
  }

  onDeleteAllViewed(): void {
    this.notificationService.deleteAllViewed().subscribe({
      next: (response) => {
        console.log('Deleted all viewed notifications successfully', response);
        // Aquí puedes manejar la respuesta, por ejemplo, actualizar la lista de notificaciones
      },
      error: (error) => {
        console.error('Error deleting viewed notifications', error);
      }
    });
  }

  setPage(pageNumber: number): void {
    this.page = pageNumber;
    this.applyFilter();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.applyFilter();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.applyFilter();
    }
  }

  getTotalPages(): number {
    return this.totalPages;
  }

  search() {
    this.page = 1; // Reiniciar a la primera página cuando se realiza una búsqueda
    this.applyFilter();
  }

  reset() {
    this.searchText = '';
    this.startDate = '';
    this.endDate = '';
    this.page = 1; // Reiniciar a la primera página cuando se restablecen los filtros
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
}
