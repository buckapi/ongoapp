import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/ui/header/header.component';
import { SidebarComponent } from './components/ui/sidebar/sidebar.component';
import { MenubarComponent } from './components/ui/menubar/menubar.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { GlobalService } from './services/global.service';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthPocketbaseService } from './services/authPocketbase.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    HeaderComponent, 
    SidebarComponent, 
    MenubarComponent, 
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ongo-app';

  constructor(
    public global: GlobalService,
    public auth: AuthPocketbaseService
  ) {
  }
  ngOnInit(): void {
    // Verificar autenticación al iniciar la aplicación
    if (localStorage.getItem('isLoggedin')) {
      this.auth.permision();
    }
  }
}
