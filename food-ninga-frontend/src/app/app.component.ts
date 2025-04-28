import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../app/services/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'food-ninga-frontend';
  userName = ''

  constructor(private api: ApiService){
    this.userName = this.api.getUserName()
  }
}
