import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private userId: string = '';
  private userName: string = '';
  private restaurant: object = {};

  setUserId(user_id: string, name:string) {
    this.userId = user_id;
    this.userName =name;
  }

  getUserId(): string {
    return this.userId;
  }
  getUserName(): string {
    return this.userName;
  }
  setRestaurant(restaurant:object){
    this.restaurant =restaurant;
  }
  getRestaurant():object {
    return this.restaurant;
  }

  clearUserId() {
    this.userId = '';
  }
  private baseUrl = 'http://localhost:5000';  // your backend server

  constructor(private http: HttpClient) {}

  loginUser(credentials: any) {
    this.logEvent("login").subscribe();
    return this.http.post(`${this.baseUrl}/login`, credentials);
  }

  signupUser(user: any) {
    this.logEvent("signup").subscribe();
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
  logEvent(eventType: string) {
    const logData = {
      event_type: eventType,
      user_id: this.getUserId()
    };
    console.log(logData)
    return this.http.post(`${this.baseUrl}/logs`, logData);
  }
}
