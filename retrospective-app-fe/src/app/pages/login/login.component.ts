import { Component } from '@angular/core';
import { LoginHandlerComponent } from '../../components/login-handler/login-handler.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LoginHandlerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email: string = "";

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit():void {
    if(this.authService.isLoggedIn()){
      this.router.navigate(['/dashboard']);
    }
  }
}
