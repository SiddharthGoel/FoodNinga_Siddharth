import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  email = '';
  name = '';
  password = '';
  phone = "";

  constructor(private router: Router, private apiService: ApiService) {}

  signup() {
    console.log('Signing up:', this.email);
    const payload = {
      name: this.name,
      email: this.email,
      password: this.password,
      phone: this.phone
    };

    this.apiService.signupUser(payload).subscribe({
      next: (response: any) => {
        console.log('Signup successful:', response);
        alert('Signup successful! You can now log in.');
        this.router.navigate(['/login']); // Redirect back to login page
      },
      error: (error) => {
        console.error('Signup failed:', error);
        alert('Signup failed. Try a different email.');
      }
    });
  }
}
