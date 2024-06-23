import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StringArtComponent } from './string-art.component';

describe('StringArtComponent', () => {
  let component: StringArtComponent;
  let fixture: ComponentFixture<StringArtComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StringArtComponent]
    });
    fixture = TestBed.createComponent(StringArtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
