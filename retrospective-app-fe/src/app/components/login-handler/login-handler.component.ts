import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-handler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-handler.component.html',
  styleUrl: './login-handler.component.scss'
})
export class LoginHandlerComponent {
  username: string = '';
  showError: boolean = false;

  constructor(private router: Router) {}

  signInAsGuest(): void {
    if (this.username.trim()) {
      localStorage.setItem('username', this.username);
      this.router.navigate(['/dashboard']); 
    } else {
      this.showError = true;
    }
  }

  onInputChange(): void {
    this.showError = false;
  }
}
