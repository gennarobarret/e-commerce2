import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataTableService {
  constructor() { }

  // Método para filtrar los datos
  applyFilter<T>(items: T[], filterKey: string, filterValue: string): T[] {
    return items.filter(item => {
      const itemValue = (item as any)[filterKey];
      if (itemValue instanceof Date) {
        const filterDate = new Date(filterValue).getTime();
        const itemDate = new Date(itemValue).getTime();
        return !isNaN(filterDate) && itemDate === filterDate;
      }
      return itemValue.toString().toLowerCase().includes(filterValue.toLowerCase());
    });
  }

  // Método para paginar los datos
  paginate<T>(items: T[], pageSize: number, page: number): T[] {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }

  // Método para ordenar los datos
  sort<T>(items: T[], key: string, sortOrder: 'asc' | 'desc'): T[] {
    return items.sort((a, b) => {
      let valueA = (a as any)[key];
      let valueB = (b as any)[key];

      // Verificar si los valores son nulos o indefinidos
      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      // Manejar valores numéricos
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // Manejar fechas
      if (valueA instanceof Date && valueB instanceof Date) {
        valueA = valueA.getTime();
        valueB = valueB.getTime();
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }

      // Convertir valores a cadenas para compararlos
      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();

      if (valueA < valueB) {
        return sortOrder === 'asc' ? -1 : 1;
      } else if (valueA > valueB) {
        return sortOrder === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });
  }
}
