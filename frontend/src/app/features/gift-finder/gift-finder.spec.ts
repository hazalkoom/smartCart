import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { GiftFinderComponent } from './gift-finder';
import { CategoryService } from '../../core/services/category';

describe('GiftFinderComponent', () => {
  let component: GiftFinderComponent;
  let fixture: ComponentFixture<GiftFinderComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const categoryServiceMock = {
      getCategories: () => of({
        success: true,
        count: 6,
        data: [
          { _id: '1', name: 'Gaming Consoles', slug: 'gaming-consoles' },
          { _id: '2', name: 'Laptops', slug: 'laptops-computers' },
          { _id: '3', name: 'Audio', slug: 'audio-headphones' },
          { _id: '4', name: 'Wearables', slug: 'smart-home-wearables' },
          { _id: '5', name: 'Apple', slug: 'apple-ecosystem' },
          { _id: '6', name: 'Accessories', slug: 'smartphones-accessories' },
        ],
      }),
    };

    await TestBed.configureTestingModule({
      declarations: [GiftFinderComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: CategoryService, useValue: categoryServiceMock },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(GiftFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should move forward with breadcrumb and history when selecting next node', fakeAsync(() => {
    const option = component.treeNodes['root'].options[0];

    component.selectOption(option);
    tick(300);

    expect(component.currentNodeId).toBe('gamer_pref');
    expect(component.nodeHistory).toEqual(['root']);
    expect(component.breadcrumbLabels).toEqual(['The Hardcore Gamer']);
  }));

  it('should go back to the previous node', () => {
    component.currentNodeId = 'gamer_pc_budget';
    component.nodeHistory = ['root', 'gamer_pref'];
    component.breadcrumbLabels = ['The Hardcore Gamer', 'PC Master Race'];

    component.goBack();

    expect(component.currentNodeId).toBe('gamer_pref');
    expect(component.breadcrumbLabels).toEqual(['The Hardcore Gamer']);
    expect(component.nodeHistory).toEqual(['root']);
  });

  it('should reset node and trail state', () => {
    component.currentNodeId = 'creator_audio';
    component.nodeHistory = ['root', 'creator_pref'];
    component.breadcrumbLabels = ['The Creator / Pro', 'Music & Podcasting'];

    component.resetQuiz();

    expect(component.currentNodeId).toBe('root');
    expect(component.nodeHistory).toEqual([]);
    expect(component.breadcrumbLabels).toEqual([]);
  });

  it('should compose and navigate with enriched filters on leaf selection', () => {
    component.currentNodeId = 'gamer_pc_budget';
    component.nodeHistory = ['root', 'gamer_pref'];
    const leaf = component.treeNodes['gamer_pc_budget'].options[1];

    component.selectOption(leaf);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/products'], {
      queryParams: jasmine.objectContaining({
        category: 'laptops-computers,gaming-consoles',
        minPrice: 1500,
        minRating: 4,
        stockStatus: 'in',
        sort: 'price_desc',
        page: 1,
      }),
    });
  });

  it('should drop invalid categories from composed query params', () => {
    component.currentNodeId = 'smart_home_bedroom';
    component.nodeHistory = ['root', 'smart_home_pref'];

    const option = {
      label: 'Invalid token test',
      icon: 'bi bi-question-circle',
      filters: {
        categories: ['smart-home-wearables', 'not-a-real-category'],
        keywordPool: ['automation'],
        sort: 'top_rated' as const,
      },
    };

    component.selectOption(option);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/products'], {
      queryParams: jasmine.objectContaining({
        category: 'smart-home-wearables',
      }),
    });
  });
});
