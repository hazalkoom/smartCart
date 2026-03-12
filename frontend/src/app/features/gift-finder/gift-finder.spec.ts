import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GiftFinder } from './gift-finder';

describe('GiftFinder', () => {
  let component: GiftFinder;
  let fixture: ComponentFixture<GiftFinder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GiftFinder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GiftFinder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
