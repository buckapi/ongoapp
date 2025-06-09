import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class GlobalService {
activeRoute: string = 'login';
pb = new PocketBase('https://db.buckapi.lat:8015');
private clientesSubject = new BehaviorSubject<any[]>([]);
clientes$ = this.clientesSubject.asObservable();
private partnersSubject = new BehaviorSubject<any[]>([]);
partners$ = this.partnersSubject.asObservable();

  constructor(
   
  ) { 
    this.initClientesRealtime();
    this.initPartnersRealtime();
  }
  setRoute(route: string) {
    this.activeRoute = route;
  }
  async initClientesRealtime() {
    // Fetch inicial
    const result = await this.pb.collection('usuariosClient').getFullList();
    this.clientesSubject.next(result);

    // Suscripción realtime
    this.pb.collection('usuariosClient').subscribe('*', (e: any) => {
      let current = this.clientesSubject.getValue();
      if (e.action === 'create') {
        current = [...current, e.record];
      } else if (e.action === 'update') {
        current = current.map((c: any) => c.id === e.record.id ? e.record : c);
      } else if (e.action === 'delete') {
        current = current.filter((c: any) => c.id !== e.record.id);
      }
      this.clientesSubject.next(current);
    });
  }
  async initPartnersRealtime() {
    // Fetch inicial
    const result = await this.pb.collection('usuariosPartner').getFullList();
    this.partnersSubject.next(result);

    // Suscripción realtime
    this.pb.collection('usuariosPartner').subscribe('*', (e: any) => {
      let current = this.partnersSubject.getValue();
      if (e.action === 'create') {
        current = [...current, e.record];
      } else if (e.action === 'update') {
        current = current.map((c: any) => c.id === e.record.id ? e.record : c);
      } else if (e.action === 'delete') {
        current = current.filter((c: any) => c.id !== e.record.id);
      }
      this.partnersSubject.next(current);
    });
  }
}
