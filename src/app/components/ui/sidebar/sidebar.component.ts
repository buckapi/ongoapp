import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../../../services/global.service';
import { AuthPocketbaseService } from '../../../services/authPocketbase.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  constructor(
    public global: GlobalService,
    public auth: AuthPocketbaseService
  ) { }

  ngOnInit(): void {
    // Verificar si hay un usuario logueado
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      this.auth.setUser(currentUser); // Actualizar el usuario en el servicio
    }
  }
}
