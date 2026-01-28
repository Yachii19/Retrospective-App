import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSessionHandlerComponent } from './create-session-handler.component';

describe('CreateSessionHandlerComponent', () => {
  let component: CreateSessionHandlerComponent;
  let fixture: ComponentFixture<CreateSessionHandlerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSessionHandlerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateSessionHandlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
