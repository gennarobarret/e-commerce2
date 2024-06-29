import { Injectable } from '@angular/core';
import { DataTable } from 'simple-datatables';

@Injectable({
  providedIn: 'root'
})
export class DataTableService {
  datatable: DataTable | null = null;

  initializeTable(tableId: string): void {
    const tableElement = document.getElementById(tableId);
    if (tableElement) {
      this.datatable = new DataTable(tableElement as HTMLTableElement, {
        searchable: true,
        fixedHeight: true,
        perPage: 10,
        perPageSelect: [5, 10, 15, 20],
      });
    }
  }
}
