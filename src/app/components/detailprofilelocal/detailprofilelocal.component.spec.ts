import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailprofilelocalComponent } from './detailprofilelocal.component';

describe('DetailprofilelocalComponent', () => {
  let component: DetailprofilelocalComponent;
  let fixture: ComponentFixture<DetailprofilelocalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailprofilelocalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailprofilelocalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
