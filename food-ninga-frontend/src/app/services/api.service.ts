import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private userId: string = '';
  setUserId(user_id: string) {
    this.userId = user_id;
  }

  getUserId(): string {
    return this.userId;
  }

  clearUserId() {
    this.userId = '';
  }
  private baseUrl = 'http://localhost:5000';  // your backend server

  constructor(private http: HttpClient) {}

  loginUser(credentials: any) {
    // not implemented in backend yet, placeholder
    return this.http.post(`${this.baseUrl}/login`, credentials);
  }

  signupUser(user: any) {
    // not implemented in backend yet, placeholder
    return this.http.post(`${this.baseUrl}/signup`, user);
  }

  searchRestaurants(zipCode: string) {
    return this.http.get(`${this.baseUrl}/restaurants/${zipCode}`);
  }

  getRestaurantMenu(restaurantId: number) {
    return this.http.get(`${this.baseUrl}/menus/${restaurantId}`);
  }

  placeOrder(order: any) {
    return this.http.post(`${this.baseUrl}/orders`, order);
  }
}
