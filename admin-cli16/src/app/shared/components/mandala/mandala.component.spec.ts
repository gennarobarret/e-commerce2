import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MandalaComponent } from './mandala.component';

describe('MandalaComponent', () => {
  let component: MandalaComponent;
  let fixture: ComponentFixture<MandalaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MandalaComponent]
    });
    fixture = TestBed.createComponent(MandalaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
