import { Component } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { CommonModule } from '@angular/common';
import { AuthPocketbaseService } from '../../services/authPocketbase.service';
import { RealtimeClientesService } from '../../services/realtime-clientes.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OnInit } from '@angular/core';
import PocketBase from 'pocketbase';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileData: any = {
    interests: '',
    relationshipGoal: '',
    language: '',
    sexualOrientation: ''
  };
  
  photos: any[] = Array(6).fill({});
  selectedInterests: string[] = [];
  interestSearch: string = '';
  allInterests: string[] = [
    'Ludo', 'Football', 'Cricket', 'Tea', 'Brunch', 'Compras', 'Instagram', 
    'Collecting', 'Video juegos', 'Café', 'Peliculas', 'Bailar', 'Bicicletas', 'Autos', 
    'Estudiar', 'Walking', 'Correr', 'Manga', 'Fotografia', 'Arte', 'Musica'
  ];
  filteredInterests: string[] = [...this.allInterests];
  
  relationshipGoals = [
    { value: 'Socio a largo plazo', label: 'Socio a largo plazo', icon: '../assets/images/w3tinder/svg/love.svg' },
    { value: 'Diversión a corto plazo', label: 'Diversión a corto plazo', icon: '../assets/images/w3tinder/svg/smile-emoji.svg' },
    { value: 'Amistad', label: 'Amistad', icon: '../assets/images/w3tinder/svg/toast.svg' },
    { value: 'Citas casuales', label: 'Citas casuales', icon: '../assets/images/w3tinder/svg/party.svg' },
    { value: 'Abiert@ a opciones', label: 'Abiert@ a opciones', icon: '../assets/images/w3tinder/svg/hello.svg' },
    { value: 'Averiguarlo', label: 'Averiguarlo', icon: '../assets/images/w3tinder/svg/think.svg' }
  ];
  
  languages = [
    { name: 'Indio', flag: '../assets/images/flags/india.svg' },
    { name: 'Ingles', flag: '../assets/images/flags/united-states.svg' },
    { name: 'Aleman', flag: '../assets/images/flags/germany.svg' },
    { name: 'Italiano', flag: '../assets/images/flags/italy.svg' },
    { name: 'Espanol', flag: '../assets/images/flags/spain.svg' }
  ];
  
  sexualOrientations = [
    { value: 'Heterosexual', label: 'Heterosexual' },
    { value: 'Gay', label: 'Gay' },
    { value: 'Lesbian', label: 'Lesbian' },
    { value: 'Bisexual', label: 'Bisexual' },
    { value: 'Asexual', label: 'Asexual' },
    { value: 'Queer', label: 'Queer' },
    { value: 'Demisexual', label: 'Demisexual' }
  ];
  
  private pb = new PocketBase('https://db.buckapi.lat:8015');
isEditProfile: boolean = false;
newAvatar: File | null = null;
  avatarPreview: string | null = null;

constructor(
  public global: GlobalService,
  public auth: AuthPocketbaseService,
  public realtimeClientes: RealtimeClientesService
){}
async ngOnInit() {
  await this.loadProfileData();
}

async loadProfileData() {
  try {
    // Obtener datos del usuario
    const userData = await this.pb.collection('usuariosClient').getFirstListItem(
      `userId="${this.auth.currentUser?.id}"`
    );
    
    this.profileData = {
      interests: userData['interestedIn'] || '',
      relationshipGoal: userData['lookingFor'] || '',
      language: userData['language'] || '',
      sexualOrientation: userData['orientation'] || ''
    };
    
    // Cargar fotos si existen
    if (userData['photos']) {
      const photosData = JSON.parse(userData['photos']);
      this.photos = photosData.map((url: string) => ({ url }));
    }
    
    // Inicializar intereses seleccionados
    if (this.profileData.interests) {
      this.selectedInterests = this.profileData.interests.split(',').map((i: string) => i.trim());
    }
  } catch (error) {
    console.error('Error cargando perfil:', error);
  }
}

filterInterests() {
  if (!this.interestSearch) {
    this.filteredInterests = [...this.allInterests];
    return;
  }
  
  this.filteredInterests = this.allInterests.filter(interest => 
    interest.toLowerCase().includes(this.interestSearch.toLowerCase())
  );
}

toggleInterest(interest: string) {
  const index = this.selectedInterests.indexOf(interest);
  if (index >= 0) {
    this.selectedInterests.splice(index, 1);
  } else {
    this.selectedInterests.push(interest);
  }
}

saveInterests() {
  this.profileData.interests = this.selectedInterests.join(', ');
}

saveRelationshipGoal() {
  // Guardar en perfil
}

selectLanguage(lang: any) {
  this.profileData.language = lang.name;
  // Cerrar el offcanvas después de seleccionar
  const offcanvas = document.getElementById('offcanvasLang');
  const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvas as Element);
  if (bsOffcanvas) {
    bsOffcanvas.hide();
  }
}

saveSexualOrientation() {
  // Guardar en perfil
}

async saveProfile() {
  try {
    // Subir fotos nuevas
    const uploadedPhotos = [];
    for (const photo of this.photos) {
      if (photo.file) {
        const formData = new FormData();
        formData.append('file', photo.file);
        
        // Subir la imagen a PocketBase
        const record = await this.pb.collection('files').create(formData);        
        // Obtener URL de la imagen subida
        const url = this.pb.files.getUrl(record, record['file']);
        uploadedPhotos.push(url);
      } else if (photo.url) {
        // Mantener las URLs existentes
        uploadedPhotos.push(photo.url);
      }
    }

    // Subir nuevo avatar si existe
    if (this.newAvatar) {
      const avatarFormData = new FormData();
      avatarFormData.append('avatar', this.newAvatar);
      
      // Actualizar avatar en la colección de usuarios
      await this.pb.collection('usuariosClient').update(this.auth.currentUser?.id, avatarFormData);
      
      // Actualizar el avatar en el servicio de autenticación
      await this.auth.pb.collection('usuariosClient').update(this.auth.currentUser?.id, avatarFormData);
    }

    // Preparar datos para PocketBase
    const data: any = {
      interestedIn: this.profileData.interests,
      lookingFor: this.profileData.relationshipGoal,
      language: this.profileData.language,
      orientation: this.profileData.sexualOrientation,
      photos: JSON.stringify(uploadedPhotos)
    };

    // Actualizar o crear perfil
    const existingProfile = await this.pb.collection('usuariosClient').getFirstListItem(
      `userId="${this.auth.currentUser?.id}"`,
      { silent: true }
    ).catch(() => null);

    if (existingProfile) {
      await this.pb.collection('usuariosClient').update(existingProfile.id, data);
    } else {
      data.userId = this.auth.currentUser?.id;
      await this.pb.collection('usuariosClient').create(data);
    }

    alert('Perfil actualizado correctamente');
    this.isEditProfile = false;
  } catch (error) {
    console.error('Error guardando perfil:', error);
    alert('Error al guardar los cambios');
  }
}

cancelEdit() {
  // Volver a cargar los datos originales
  this.loadProfileData();
  this.isEditProfile = false;
}

onPhotoSelected(event: any, index: number) {
  const file = event.target.files[0];
  if (file) {
    // Crear URL temporal para previsualización
    const url = URL.createObjectURL(file);
    this.photos[index] = {
      url: url,
      file: file
    };
  }
}

onAvatarSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.newAvatar = file;
    // Crear URL temporal para previsualización
    this.avatarPreview = URL.createObjectURL(file);
  }
}

removePhoto(index: number) {
  this.photos[index] = {};
  // Limpiar el input file
  const fileInput = document.getElementById('imageUpload' + index) as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
}

addPhoto() {
  const emptyIndex = this.photos.findIndex(p => !p.url);
  if (emptyIndex !== -1) {
    const inputId = 'imageUpload' + emptyIndex;
    document.getElementById(inputId)?.click();
  } else {
    alert('Máximo de fotos alcanzado');
  }
}
}