// spinner.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SpinnerService {
    private loading = new BehaviorSubject<boolean>(false);
    public readonly isLoading$ = this.loading.asObservable();

    show(): void {
        this.loading.next(true);
    }

    hide(): void {
        this.loading.next(false);
    }
}
