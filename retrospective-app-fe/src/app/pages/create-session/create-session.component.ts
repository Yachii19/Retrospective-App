import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CreateSessionHandlerComponent } from '../../components/create-session-handler/create-session-handler.component';

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [SidebarComponent, CreateSessionHandlerComponent],
  templateUrl: './create-session.component.html',
  styleUrl: './create-session.component.scss'
})
export class CreateSessionComponent {
  

}
