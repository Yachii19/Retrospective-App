import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => {
            return import('./pages/login/login.component').then(
                (m) => m.LoginComponent
            )
        }
    },
    {
        path: 'dashboard',
        pathMatch: 'full',
        loadComponent: () => {
            return import('./pages/dashboard/dashboard.component').then(
                (m) => m.DashboardComponent
            )
        }
    }, {
        path: 'all-sessions',
        pathMatch: 'full',
        loadComponent: () => {
            return import('./pages/all-session/all-session.component').then(
                (m) => m.AllSessionComponent
            )
        }
    },
    {
        path: 'create-session',
        pathMatch: 'full',
        loadComponent: () => {
            return import('./pages/create-session/create-session.component').then(
                (m) => m.CreateSessionComponent
            )
        }
    },
    {
        path: 'my-contribution',
        pathMatch: 'full',
        loadComponent: () => {
            return import('./pages/my-contributions/my-contributions.component').then(
                (m) => m.MyContributionsComponent
            )
        }
    },
    {
        path: 'session/:id',
        pathMatch: 'full',
        loadComponent: () => {
            return import('./pages/session-details/session-details.component').then(
                (m) => m.SessionDetailsComponent
            )
        }
    },
    {
        path: 'session/:id/highlight',
        pathMatch: 'full',
        loadComponent: () => {
            return import('./pages/session-highlights/session-highlights.component').then(
                (m) => m.SessionHighlightsComponent
            )
        }
    },
    {
        path: '**',
        pathMatch: 'full',
        loadComponent: () => {
            return import('./pages/not-found/not-found.component').then(
                (m) => m.NotFoundComponent
            );
        }
    }
];
