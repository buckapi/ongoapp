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
import { ProfileLocalComponent } from './components/profile-local/profile-local.component';
import { MapComponent } from './components/map/map.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { ChatComponent } from './components/chat/chat.component';
import { ChatDetailComponent } from './components/chat-detail/chat-detail.component';
import { DetailprofileComponent } from './components/detailprofile/detailprofile.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { DetailprofilelocalComponent } from './components/detailprofilelocal/detailprofilelocal.component';

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
    ProfileComponent,
    ProfileLocalComponent,
    MapComponent,
    FavoritesComponent,
    ChatComponent,
    ChatDetailComponent,
    DetailprofileComponent,
    ExplorerComponent,
    DetailprofilelocalComponent
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
