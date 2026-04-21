import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AdminComponent } from './dashboard/admin/admin.component';
import { RhComponent } from './dashboard/rh/rh.component';
import { CandidatComponent } from './dashboard/candidat/candidat.component';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { PublicOffersComponent } from './public/offers/public-offers.component';
import { ApplyComponent } from './dashboard/candidat/apply/apply.component';
import { CandidateApplicationsComponent } from './dashboard/candidat/candidate-applications/candidate-applications.component';
import { RhApplicationsComponent } from './dashboard/rh/rh-applications/rh-applications.component';
import { TestCandidateComponent } from './dashboard/candidat/test-candidate.component';
import { RhOfferApplicationsComponent } from './dashboard/rh/applications/rh-offer-applications.component';

import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { CandidateOfferSearchComponent } from './dashboard/candidat/candidate-offer-search/candidate-offer-search.component';
import { RhStatistiquesComponent } from './dashboard/rh/rh-satistiques/rh-satistiques.component';
import { AuthCallbackComponent } from './auth/auth-callback/auth-callback.component';
import { RhOffersComponent } from './dashboard/rh/rh-offers/rh-offers.component';
import { CandidateProfileComponent } from './dashboard/candidat/candidate-profile/candidate-profile.component';
import { RhParametresComponent } from './dashboard/rh/rh-parametres/rh-parametres.component';
import { TestComponent } from './test.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { CandidateOffersListComponent } from './dashboard/candidat/candidate-offers-list/candidate-offers-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/offers', pathMatch: 'full' },
  { path: 'offers', component: PublicOffersComponent },
  { path: 'login', component: LoginComponent },
  { path: 'auth/:provider/callback', component: AuthCallbackComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  { path: 'test-reset', component: ResetPasswordComponent },

  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
  },
  {
    path: 'rh',
    component: RhComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_RH'] },
  },
  {
    path: 'rh/applications/offer/:id',
    component: RhOfferApplicationsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_RH'] },
  },
  {
    path: 'rh/applications',
    component: RhApplicationsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_RH'] },
  },
  {
    path: 'rh/statistiques',
    component: RhStatistiquesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_RH'] },
  },
  {
    path: 'rh/offers',
    component: RhOffersComponent,
    canActivate: [authGuard],
    data: { roles: ['ROLE_RH'] },
  },
  {
    path: 'rh/parametres',
    component: RhParametresComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_RH'] },
  },

  {
    path: 'candidate',
    component: CandidatComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_CANDIDAT'] },
  },
  {
    path: 'candidate/profile',
    component: CandidateProfileComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_CANDIDAT'] },
  },
  {
    path: 'candidate/apply/:id',
    component: ApplyComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_CANDIDAT'] },
  },
  {
    path: 'candidate/applications',
    component: CandidateApplicationsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_CANDIDAT'] },
  },

  {
    path: 'candidate/offers/search',
    component: CandidateOfferSearchComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_CANDIDAT'] },
  },
  {
    path: 'candidate/offers-list',
    component: CandidateOffersListComponent,
    canActivate: [authGuard],
  },

  { path: 'candidat', redirectTo: 'candidate', pathMatch: 'full' },
  { path: 'test', component: TestComponent },
  { path: '**', redirectTo: 'offers' },
];
