import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private router: Router,private apiService: ApiService) {}

  login() {
    console.log('Logging in:', this.email);
    const payload = {
      email: this.email,
      password: this.password
    };

    this.apiService.loginUser(payload).subscribe({
      next: (response: any) => {
        console.log('Login successful:', response);
        this.apiService.setUserId(response.user_id)
        // Navigate after successful login
        this.router.navigate(['/chooseRestaurant']);
      },
      error: (error) => {
        console.error('Login failed:', error);
        alert('Login failed. Please check your credentials.');
      }
    });
  }
}
