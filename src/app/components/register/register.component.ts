import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthPocketbaseService } from '../../services/authPocketbase.service';
import { GlobalService } from '../../services/global.service';
import { register as registerSwiperElements } from 'swiper/element/bundle';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TermsComponent } from '../terms/terms.component';
import { PrivacyComponent } from '../privacy/privacy.component';
registerSwiperElements();

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TermsComponent, PrivacyComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  schemas: [NO_ERRORS_SCHEMA]
})
export class RegisterComponent {
  showModal: boolean = false;
  modalTitle: string = '';
  modalContent: 'terms' | 'privacy' | null = null;
  currentStep = 1;
  userType: 'partner' | 'client' | null = null;

  // Formulario para partners
  partnerForm: FormGroup;

  // Formulario para clientes
  clientForm: FormGroup;

  // Configuración del swiper
  swiperConfig = {
    slidesPerView: 1,
    spaceBetween: 30,
    pagination: {
      clickable: true,
      type: 'bullets'
    }
  };

  constructor(
    private fb: FormBuilder,
    public auth: AuthPocketbaseService,
    public global: GlobalService
  ) {


    // Formulario para partners (locales nocturnos)
    this.partnerForm = this.fb.group({
      // Paso 1
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],

      // Paso 2
      venueName: ['', [Validators.required, Validators.maxLength(100)]],
      address: ['', [Validators.required, Validators.maxLength(200)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],

      // Paso 3
      description: ['', Validators.maxLength(500)],
      capacity: ['', Validators.pattern(/^[0-9]*$/)],
      openingHours: [''],
      terms: [false, Validators.requiredTrue]
    }, {
      validators: [this.passwordMatchValidator, this.validateOpeningHours]
    });

    // Formulario para clientes
    this.clientForm = this.fb.group({
      // Paso 1 - Información básica
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],

      // Paso 2 - Información personal
      firstName: ['', Validators.required],
      birthDate: ['', [Validators.required, this.validateAge]],
      gender: ['Women', Validators.required],

      // Paso 3 - Preferencias
      orientation: this.fb.group({
        straight: [false],
        gay: [false],
        lesbian: [false],
        bisexual: [false],
        asexual: [false],
        queer: [false],
        demisexual: [false]
      }),
      interestedIn: ['Women', Validators.required],
      lookingFor: ['Long-term partner', Validators.required],

      // Paso 4 - Fotos (usamos FormArray para múltiples imágenes)
      photos: this.fb.array(Array(6).fill(null)),

      // Términos y condiciones
      terms: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });
  }
  // Agrega este getter para acceder fácilmente a los controles del formulario de partner
  get pf() {
    return this.partnerForm.controls;
  }
  validateOpeningHours(control: AbstractControl): ValidationErrors | null {
    const hours = control.get('openingHours')?.value;
    if (hours && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hours)) {
      return { invalidHours: true };
    }
    return null;
  }
  
  openTermsModal(type: 'terms' | 'privacy') {
    console.log('Opening modal with type:', type);
    this.modalContent = type;
    switch (type) {
      case 'terms':
        this.modalTitle = 'Términos y Condiciones';
        break;
      case 'privacy':
        this.modalTitle = 'Política de Privacidad';
        break;
    }
    this.showModal = true;
    console.log('Modal state:', { showModal: this.showModal, modalTitle: this.modalTitle, modalContent: this.modalContent });
  }

  closeModal() {
    this.showModal = false;
    this.modalContent = null;
  }
  async onSubmit() {
    try {
      if (this.userType === 'partner') {
        await this.registerPartner();
      } else if (this.userType === 'client') {
        await this.registerClient();
      }
    } catch (error: any) {
      console.error('Error en el registro:', error);
      
      let errorMessage = 'Hubo un problema al registrar tu cuenta. Por favor intenta nuevamente.';
      
      if (error?.response?.data) {
        const pbError = error.response.data;
        if (pbError.email) {
          errorMessage = pbError.email.message;
        } else if (pbError.username) {
          errorMessage = pbError.username.message;
        }
      }
      
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  }
  
  async registerPartner() {
    if (this.partnerForm.invalid) {
      this.markPartnerFieldsAsTouched(this.currentStep);
      return;
    }
  
    const formData = this.partnerForm.value;
  
    // 1. Registrar usuario en PocketBase
    const userResponse = await this.auth.registerUser(
      formData.email,
      formData.password,
      'partner',
      formData.venueName,
      formData.address
    ).toPromise();
  
    // 2. Preparar datos adicionales del partner
    const partnerData: any = {
      userId: userResponse.id,
      venueName: formData.venueName,
      address: formData.address,
      phone: formData.phone,
      description: formData.description,
      capacity: formData.capacity,
      openingHours: formData.openingHours,
      status: 'pending',
      approved: false,
      email: formData.email // Guardar email también en la colección partners
    };
  
    // 3. Guardar en la colección usuariosPartner
    await this.auth.pb.collection('usuariosPartner').create(partnerData);
  
    // 4. Iniciar sesión automáticamente
    await this.auth.loginUser(formData.email, formData.password).toPromise();
  
    // 5. Redirigir al dashboard de partner
    this.global.setRoute('home-partner');
  
    // 6. Mostrar confirmación
    Swal.fire({
      title: 'Registro Exitoso',
      text: 'Tu local ha sido registrado. Estará activo después de la aprobación.',
      icon: 'success',
      confirmButtonText: 'Entendido'
    });
  }
  
  async registerClient() {
    if (this.clientForm.invalid) {
      this.markClientFieldsAsTouched(this.currentStep);
      return;
    }
  
    const formData = this.clientForm.value;
  
    try {
      // 1. Registrar usuario en PocketBase
      const userResponse = await this.auth.registerUser(
        formData.email,
        formData.password,
        'client',
        formData.firstName,
        '' // Teléfono opcional
      ).toPromise();
  
      // 2. Preparar datos adicionales del cliente
      const clientData: any = {
        userId: userResponse.id,
        birthDate: new Date(formData.birthDate).toISOString(),
        gender: formData.gender,
        orientation: this.getSelectedOrientations(),
        interestedIn: formData.interestedIn,
        lookingFor: formData.lookingFor,
        profileComplete: true,
        email: formData.email
      };
  
      // 3. Guardar en la colección usuariosClient
      await this.auth.pb.collection('usuariosClient').create(clientData);
  
      // 4. Iniciar sesión automáticamente
      await this.auth.loginUser(formData.email, formData.password).toPromise();
  
      // 5. Redirigir al perfil
      this.global.setRoute('profile');
  
      // 6. Mostrar confirmación
      Swal.fire({
        title: 'Registro Completo',
        text: 'Tu perfil ha sido creado exitosamente',
        icon: 'success',
        confirmButtonText: 'Continuar'
      });
    } catch (error) {
      console.error('Error registrando cliente:', error);
      throw error; // Re-lanzar el error para que lo maneje onSubmit
    }
  }

  // Generar contraseña aleatoria para clientes (que usan OTP)
  generateRandomPassword(): string {
    return Math.random().toString(36).slice(-8);
  }

  // Mostrar mensajes
  showSuccessAndLogin(email: string, password: string) {
    Swal.fire({
      title: 'Registro Exitoso',
      text: 'Tu cuenta ha sido creada correctamente.',
      icon: 'success'
    }).then(() => {
      this.auth.loginUser(email, password).subscribe({
        next: () => {
          this.global.setRoute('home-partner');
        },
        error: () => {
          this.global.setRoute('login');
        }
      });
    });
  }

  showSuccessAndRedirect() {
    Swal.fire({
      title: 'Registro Exitoso',
      text: 'Por favor verifica tu teléfono con el código OTP enviado.',
      icon: 'success'
    }).then(() => {
      this.global.setRoute('otp-verification');
    });
  }

  showError(error: any) {
    console.error('Error:', error);
    Swal.fire({
      title: 'Error',
      text: 'Hubo un problema al registrar tu cuenta. Por favor intenta nuevamente.',
      icon: 'error'
    });
  }

  // Validador de coincidencia de contraseñas
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    } else {
      form.get('confirmPassword')?.setErrors(null);
      return null;
    }
  }

  // Manejo de selección de tipo de usuario
  selectUserType(type: 'partner' | 'client') {
    this.userType = type;
    this.nextStep();
  }

  // Navegación entre pasos
  nextStep() {
    // Validar campos antes de avanzar
    if (this.userType === 'client') {
      if (this.currentStep === 1 && this.clientForm.get('email')?.invalid) {
        this.markClientFieldsAsTouched(1);
        return;
      }
      if (this.currentStep === 2 && this.clientForm.get('firstName')?.invalid) {
        this.markClientFieldsAsTouched(2);
        return;
      }
    }

    this.currentStep++;
  }

  prevStep() {
    this.currentStep--;
  }

  // Marcar campos como tocados para mostrar errores
  markClientFieldsAsTouched(step: number) {
    if (step === 1) {
      this.clientForm.get('email')?.markAsTouched();
      this.clientForm.get('password')?.markAsTouched();
      this.clientForm.get('confirmPassword')?.markAsTouched();
    } else if (step === 2) {
      this.clientForm.get('firstName')?.markAsTouched();
      this.clientForm.get('birthDate')?.markAsTouched();
      this.clientForm.get('gender')?.markAsTouched();
    }
  }

  markPartnerFieldsAsTouched(step: number) {
    if (step === 1) {
      this.partnerForm.get('email')?.markAsTouched();
      this.partnerForm.get('password')?.markAsTouched();
      this.partnerForm.get('confirmPassword')?.markAsTouched();
    } else if (step === 2) {
      this.partnerForm.get('venueName')?.markAsTouched();
      this.partnerForm.get('address')?.markAsTouched();
      this.partnerForm.get('phone')?.markAsTouched();
    } else if (step === 3) {
      this.partnerForm.get('description')?.markAsTouched();
      this.partnerForm.get('capacity')?.markAsTouched();
      this.partnerForm.get('openingHours')?.markAsTouched();
      this.partnerForm.get('terms')?.markAsTouched();
    }
  }

  // Manejo de imágenes
  /* async handleFileInput(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const record = await this.auth.pb.collection('files').create(formData);
        const photosArray = this.clientForm.get('photos') as FormArray;
        photosArray.at(index).setValue(record.id);
      } catch (error) {
        console.error('Error subiendo foto:', error);
      }
    }
  } */
  
    handleFileInput(event: any, index: number) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const imageUrl = e.target.result;
          this.photosArray.at(index).setValue(imageUrl);
        };
        reader.readAsDataURL(file);
      }
    }
  validateAge(control: AbstractControl): ValidationErrors | null {
    const birthDate = new Date(control.value);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    return age >= 18 ? null : { underAge: true };
  }


  getSelectedOrientations(): string[] {
    const orientationGroup = this.clientForm.get('orientation')?.value;
    return Object.keys(orientationGroup)
      .filter(key => orientationGroup[key])
      .map(key => key.toLowerCase());
  }
  // Getter para acceder fácilmente a los controles del formulario
  get f() {
    return this.clientForm.controls;
  }

  // Getter para acceder al FormArray de fotos
  get photosArray(): FormArray {
    return this.clientForm.get('photos') as FormArray;
  }
}