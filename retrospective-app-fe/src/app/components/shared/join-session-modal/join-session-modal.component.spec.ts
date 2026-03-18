import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinSessionModalComponent } from './join-session-modal.component';

describe('JoinSessionModalComponent', () => {
  let component: JoinSessionModalComponent;
  let fixture: ComponentFixture<JoinSessionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinSessionModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoinSessionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
