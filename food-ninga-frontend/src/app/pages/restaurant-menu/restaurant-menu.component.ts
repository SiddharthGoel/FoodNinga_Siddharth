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

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    this.restaurantId = parseInt(this.route.snapshot.paramMap.get('id')!, 10) || 10;
    console.log(this.restaurantId)
    this.api.getRestaurantMenu(this.restaurantId).subscribe((res: any) => {
      this.menuItems = res;
    });
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

  placeOrder() {
    if (this.orders.length === 0) {
      alert('No items to order.');
      return;
    }
  
    console.log('Placing order:', this.orders);
    alert('Order placed successfully! 🎉');
  
    // Optionally clear the cart after placing order
    this.orders = [];
  }
  
}