import { createSelector, createFeatureSelector } from '@ngrx/store';
import { UserState } from './user.reducer';

export const selectUserState = createFeatureSelector<UserState>('user');

export const selectCurrentUser = createSelector(
    selectUserState,
    (state: UserState) => state.user
);

export const selectUserLoading = createSelector(
    selectUserState,
    (state: UserState) => state.loading
);

export const selectUserError = createSelector(
    selectUserState,
    (state: UserState) => state.error
);
