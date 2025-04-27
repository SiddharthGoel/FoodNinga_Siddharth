import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RestaurantMenuComponent } from './pages/restaurant-menu/restaurant-menu.component';
import { SignupComponent } from './pages/signup/signup.component';
import { SearchRestaurantComponent } from './pages/search-restaurant/search-restaurant.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'chooseRestaurant', component: SearchRestaurantComponent },
    { path: 'restaurant/:id/menu', component: RestaurantMenuComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' }
];
