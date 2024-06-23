import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { UserManagementService } from '../../services/user-management.service';
import { loadCurrentUser, loadCurrentUserSuccess, loadCurrentUserFailure, updateUser, updateUserSuccess, updateUserFailure } from './user.actions';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class UserEffects {
    loadCurrentUser$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadCurrentUser),
            mergeMap(() =>
                this.userService.getCurrentUser().pipe(
                    map(user => loadCurrentUserSuccess({ user })),
                    catchError(error => of(loadCurrentUserFailure({ error })))
                )
            )
        )
    );

    updateUser$ = createEffect(() =>
        this.actions$.pipe(
            ofType(updateUser),
            mergeMap(action =>
                this.userService.updateCurrentUser(action.user).pipe(
                    map(user => updateUserSuccess({ user })),
                    catchError(error => of(updateUserFailure({ error })))
                )
            )
        )
    );

    constructor(
        private actions$: Actions,
        private userService: UserManagementService
    ) { }
}
