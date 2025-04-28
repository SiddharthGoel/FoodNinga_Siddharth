import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-restaurant-menu',
  imports: [CommonModule],
  templateUrl: './restaurant-menu.component.html',
  styleUrl: './restaurant-menu.component.css'
})
export class RestaurantMenuComponent implements OnInit {
  restaurantId!: number;
  menuItems: any[] = [];
  orders: any[] = [];
  restaurant:any = {}

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    this.restaurantId = parseInt(this.route.snapshot.paramMap.get('id')!, 10) || 10;
    console.log(this.restaurantId)
    this.api.getRestaurantMenu(this.restaurantId).subscribe((res: any) => {
      this.menuItems = res;
    });
    this.restaurant = this.api.getRestaurant()
  }

  increaseQuantity(index: number) {
    this.orders[index].quantity++;
  }
  
  decreaseQuantity(index: number) {
    if (this.orders[index].quantity > 1) {
      this.orders[index].quantity--;
    }
  }
  
  getTotal(): number {
    return this.orders.reduce((acc, item) => acc + item.quantity * item.price, 0);
  }

  addToOrder(item: any) {
    console.log(item)
    const existingItem = this.orders.find(order => order.itemName === item.name);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.orders.push({
        itemName: item.name,
        quantity: 1,
        price: this.extractPrice(item.price)  // in case price is like '16.99 USD'
      });
    }
  }

  extractPrice(priceStr: string): number {
    const match = priceStr.toString().match(/[\d\.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  // placeOrder() {
  //   if (this.orders.length === 0) {
  //     alert('No items to order.');
  //     return;
  //   }
    
  //   console.log('Placing order:', this.orders);
  //   alert('Order placed successfully! 🎉');
  
  //   // Optionally clear the cart after placing order
  //   this.orders = [];
  // }
  placeOrder() {
    if (this.orders.length === 0) {
      alert('No items to order.');
      return;
    }
  
    const orderPayload = {
      user_id: this.api.getUserId(), 
      restaurant_id: this.restaurantId,
      orders: this.orders,
      total_price: this.getTotal(),
      status: 'placed',
      timestamps: new Date().toISOString()
    };
  
    console.log('Placing order:', orderPayload);
  
    this.api.placeOrder(orderPayload).subscribe(
      (response) => {
        console.log('Order placed successfully!', response);
        alert('Order placed successfully! 🎉');
        this.orders = []; // clear the cart
      },
      (error) => {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
      }
    );
  }
  
  
}