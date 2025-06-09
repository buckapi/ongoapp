import { Component } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './explorer.component.html',
  styleUrl: './explorer.component.css'
})
export class ExplorerComponent {
  partners: any[] = [];
constructor(public global: GlobalService){
}
ngOnInit(): void {
  this.global.partners$.subscribe((partners : any[]) => {
    this.partners = partners;
  });
}
}
