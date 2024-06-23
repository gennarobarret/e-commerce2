import { createAction, props } from '@ngrx/store';
import { User } from '../../models';

export const loadCurrentUser = createAction('[User] Load Current User');
export const loadCurrentUserSuccess = createAction(
    '[User] Load Current User Success',
    props<{ user: User }>()
);
export const loadCurrentUserFailure = createAction(
    '[User] Load Current User Failure',
    props<{ error: any }>()
);

export const updateUser = createAction(
    '[User] Update User',
    props<{ user: User }>()
);
export const updateUserSuccess = createAction(
    '[User] Update User Success',
    props<{ user: User }>()
);
export const updateUserFailure = createAction(
    '[User] Update User Failure',
    props<{ error: any }>()
);
