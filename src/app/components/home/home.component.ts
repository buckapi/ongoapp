import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { CommonModule } from '@angular/common';
import PocketBase from 'pocketbase';
@Component({
  selector: 'app-home',
  standalone: true, 
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  clientes: any[] = [];
  locales: any[] = [];
  pb: PocketBase;
  
constructor(public global: GlobalService){
  this.pb = this.global.pb;
}
ngOnInit(): void {
  this.global.clientes$.subscribe((clientes : any[]) => {
    this.clientes = clientes;
  });
}
}


