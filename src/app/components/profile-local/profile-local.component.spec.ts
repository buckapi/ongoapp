import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileLocalComponent } from './profile-local.component';

describe('ProfileLocalComponent', () => {
  let component: ProfileLocalComponent;
  let fixture: ComponentFixture<ProfileLocalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileLocalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileLocalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
