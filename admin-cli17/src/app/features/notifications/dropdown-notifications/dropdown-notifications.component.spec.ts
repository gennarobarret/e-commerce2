import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownNotificationsComponent } from './dropdown-notifications.component';

describe('NotificationsComponent', () => {
  let component: DropdownNotificationsComponent;
  let fixture: ComponentFixture<DropdownNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownNotificationsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DropdownNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
