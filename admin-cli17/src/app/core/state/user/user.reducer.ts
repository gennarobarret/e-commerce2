import { createReducer, on } from '@ngrx/store';
import { User } from '../../models';
import {
    loadCurrentUser,
    loadCurrentUserSuccess,
    loadCurrentUserFailure,
    updateUser,
    updateUserSuccess,
    updateUserFailure
} from './user.actions';

export interface UserState {
    user: User | null;
    loading: boolean;
    error: any;
}

export const initialState: UserState = {
    user: null,
    loading: false,
    error: null
};

const _userReducer = createReducer(
    initialState,
    on(loadCurrentUser, state => ({ ...state, loading: true })),
    on(loadCurrentUserSuccess, (state, { user }) => ({ ...state, user, loading: false })),
    on(loadCurrentUserFailure, (state, { error }) => ({ ...state, error, loading: false })),
    on(updateUser, state => ({ ...state, loading: true })),
    on(updateUserSuccess, (state, { user }) => ({ ...state, user, loading: false })),
    on(updateUserFailure, (state, { error }) => ({ ...state, error, loading: false }))
);

export function userReducer(state: UserState, action: any) {
    return _userReducer(state, action);
}
