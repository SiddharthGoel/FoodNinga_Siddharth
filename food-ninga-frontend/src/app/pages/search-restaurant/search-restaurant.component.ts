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

  search() {
    this.api.searchRestaurants(this.zipCode).subscribe((res: any) => {
      this.restaurants = res;
      console.log(this.restaurants)
    });
  }

  viewMenu(restaurantId: number) {
    console.log("restaurant ID: "+ restaurantId)
    this.router.navigate(['/restaurant', restaurantId, 'menu']);
  }
}
