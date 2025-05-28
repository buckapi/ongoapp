import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
activeRoute: string = 'login';
  constructor(
   
  ) { }
  setRoute(route: string) {
    this.activeRoute = route;
  }
}
