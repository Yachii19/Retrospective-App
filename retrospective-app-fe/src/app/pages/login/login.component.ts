import { Component } from '@angular/core';
import { LoginHandlerComponent } from '../../components/login-handler/login-handler.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LoginHandlerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

}
