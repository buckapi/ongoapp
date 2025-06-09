import { Component } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-detailprofilelocal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detailprofilelocal.component.html',
  styleUrl: './detailprofilelocal.component.css'
})
export class DetailprofilelocalComponent {
  constructor(public global: GlobalService){}
}
