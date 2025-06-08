import PocketBase from 'pocketbase';
import { Injectable, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GlobalService } from './global.service';
import { Observable, from, tap, map } from 'rxjs';
import { UserInterface } from '../interface/user-interface ';
import { RecordModel } from 'pocketbase';
/* import { RealtimeOrdersService } from './realtime-orders.service';  
 */@Injectable({
  providedIn: 'root',
})
export class AuthPocketbaseService {
  public pb: PocketBase;
  public currentUser: any; // Agregamos una propiedad pública para el usuario actual
  complete: boolean = false;

  constructor(
/*     public realtimeOrders: RealtimeOrdersService,
 */    public global: GlobalService) {
    this.pb = new PocketBase('https://db.buckapi.lat:8015');
    
    // Check for existing auth token and restore session
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.pb.authStore.loadFromCookie(token);
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        this.setUser(currentUser);
        this.setToken(token);
        localStorage.setItem('isLoggedin', 'true');
        localStorage.setItem('userId', currentUser.id);
      }
    }
  }
  async updateUserField(userId: string, updateData: any): Promise<void> {
    await this.pb.collection('users').update(userId, updateData);
  }
  
  async findPartnerByUserId(userId: string): Promise<any> {
    return await this.pb
      .collection('usuariosPartner')
      .getFirstListItem(`userId="${userId}"`);
  }
  
  async updatePartnerField(partnerId: string, updateData: any): Promise<void> {
    await this.pb.collection('usuariosPartner').update(partnerId, updateData);
  }
  
  isLogin() {
    return localStorage.getItem('isLoggedin');
  }

  isAdmin() {
    const userType = localStorage.getItem('type');
    return userType === '"admin"';
  }
  isPartner() {
    const userType = localStorage.getItem('type');
    return userType === '"partner"';
  }

  isClient() {
    const userType = localStorage.getItem('type');
    return userType === '"usuariosClient"';
  }

  registerUser(email: string, password: string, type: string, name: string, address: string // Añadimos el parámetro address
  ): Observable<any> {
    const userData = {
      email: email,
      password: password,
      passwordConfirm: password,
      type: type,
      username: name,
      name: name,
    };

    // Crear usuario y luego crear el registro en usuariosPartner o usuariosClient
    return from(
      this.pb
        .collection('users')
        .create(userData)
        .then((user) => {
          const data = {
            name: name,
            venueName: '',
            address: address, 
            capacity: '',
            description: '',
            openingHours: '',
            phone: '', 
            userId: user.id, 
            status: 'pending', 
            birthday: '',
            gender: '',
            orientation: '',
            interestedIn: '',
            lookingFor: '',
            profileComplete: false,
            email: email,
            /* images: {}, */ // Agrega los campos correspondientes aquí
          };
          if (type === 'partner') {
            return this.pb.collection('usuariosPartner').create(data);
          } else if (type === 'client') {
            return this.pb.collection('usuariosClient').create(data);
          } else {
            throw new Error('Tipo de usuario no válido');
          }
        })
    );
  }
  
  profileStatus() {
    return this.complete;
  }

  onlyRegisterUser(
    email: string,
    password: string,
    type: string,
    name: string
  ): Observable<any> {
    const userData = {
      email: email,
      password: password,
      passwordConfirm: password,
      type: type,
      username: name,
      name: name,
    };

    // Crear usuario y devolver el observable con el usuario creado
    return from(
      this.pb
        .collection('users')
        .create(userData)
        .then((user) => {
          // No se necesita crear ningún registro adicional en clinics aquí
          return user; // Devolver los datos del usuario creado
        })
    );
  }

  loginUser(email: string, password: string): Observable<any> {
    return from(this.pb.collection('users').authWithPassword(email, password))
      .pipe(
        map((authData) => {
          const pbUser = authData.record;
          const user: UserInterface = {
            id: pbUser.id,
            email: pbUser['email'],
            password: '', // No almacenamos la contraseña por seguridad
            full_name: pbUser['name'],
            phone: pbUser['phone'],
            images: pbUser['images'] || {},
            type: pbUser['type'],
            username: pbUser['username'],
            address: pbUser['address'],
            created: pbUser['created'],
            updated: pbUser['updated'],
            avatar: pbUser['avatar'] || '',
            status: pbUser['status'] || 'active',
            dni: pbUser['dni'],
            gender: pbUser['gender'],
          };
          return { ...authData, user };
        }),
        tap((authData) => {
          this.setUser(authData.user);
          this.setToken(authData.token);
          localStorage.setItem('isLoggedin', 'true');
          localStorage.setItem('userId', authData.user.id);
        })
      );
  }

  logoutUser(): Observable<any> {
    // Limpiar completamente el localStorage
    localStorage.clear();
    
    // Limpiar la autenticación de PocketBase
    this.pb.authStore.clear();
    
    // Redireccionar a home
    this.global.setRoute('login');

    return new Observable<any>((observer) => {
      observer.next(''); // Indicar que la operación de cierre de sesión ha completado
      observer.complete();
    });
  }

  setToken(token: any): void {
    localStorage.setItem('accessToken', token);
  }
  permision(): void {
    if (!this.isAuthenticated()) {
      this.global.setRoute('home');
      return;
    }

    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.type) {
      this.global.setRoute('profile');
      return;
    }

    // Llamar a la API para obtener información actualizada del usuario
    this.pb.collection('users').getOne(currentUser.id).then(updatedUser => {
      switch (updatedUser["type"]) {
        case 'partner':
          this.global.setRoute('profile-local');
          this.complete = true;
          break;
        case 'client':
          this.global.setRoute('profile');
          this.complete = true;
          break;
        default:
          this.global.setRoute('login');
      }
    }).catch(error => {
      console.error('Error checking permissions:', error);
      localStorage.clear();
      this.pb.authStore.clear();
      this.global.setRoute('profile');
    });
  }

  isAuthenticated(): boolean {
    return !!this.pb.authStore.isValid;
  }

  setUser(user: UserInterface): void {
    this.currentUser = user; // Almacenamos el usuario en la propiedad pública
    let user_string = JSON.stringify(user);
    let type = JSON.stringify(user.type);
    localStorage.setItem('user', user_string);
    localStorage.setItem('type', type);
  }
  getCurrentUser(): any {
    return this.currentUser || JSON.parse(localStorage.getItem('user') || '{}');
  }
  getUserId(): string {
    const userId = localStorage.getItem('userId');
    return userId ? userId : ''; // Devuelve el usuario actual o null si no existe
  }
  getFullName(): string {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      return user.full_name || 'Usuario';
    }
    return 'Usuario';
  }
}
