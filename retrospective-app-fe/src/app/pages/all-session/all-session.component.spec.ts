import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSessionComponent } from './all-session.component';

describe('AllSessionComponent', () => {
  let component: AllSessionComponent;
  let fixture: ComponentFixture<AllSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSessionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
