import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router,ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-restaurant',
  standalone: true,
  imports: [FormsModule,CommonModule ],
  templateUrl: './search-restaurant.component.html',
  styleUrl: './search-restaurant.component.css'
})
export class SearchRestaurantComponent {
  zipCode = '';
  restaurants: any[] = [];

  constructor(private api: ApiService, private router: Router,private route: ActivatedRoute) {}

// Initialize the message property
message: string = '';

search() {
  this.restaurants = [];
  this.message = ''; // Clear previous messages

  this.api.searchRestaurants(this.zipCode).subscribe({
    next: (res: any) => {
      if (res && res.length > 0) {
        this.restaurants = res;
      } else {
        this.message = 'No restaurants found for the provided zip code.';
      }
    },
    error: (err) => {
      console.error('API error:', err);
      this.message = 'An error occurred while fetching restaurants. Please try again later.';
    }
  });
}


  viewMenu(restaurantId: number, restaurant:object) {
    console.log("restaurant ID: "+ restaurantId)
    this.api.setRestaurant(restaurant)
    this.router.navigate(['/restaurant', restaurantId, 'menu']);
  }
}
