import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Category } from '../../core/interfaces/category';
import { CategoryService } from '../../core/services/category';
import { ProductQueryParams, ProductSort, StockStatus } from '../../core/services/product';

interface QuizOption {
  label: string;
  icon: string;
  nextNodeId?: string;
  filters?: GiftFilterPreset;
  matchNote?: string;
}

interface QuizNode {
  id: string;
  question: string;
  subtitle: string;
  options: QuizOption[];
}

interface GiftFilterPreset {
  categories?: string[];
  keyword?: string;
  keywordPool?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  stockStatus?: StockStatus;
  sort?: ProductSort;
}

@Component({
  selector: 'app-gift-finder',
  standalone: false,
  templateUrl: './gift-finder.html',
  styleUrl: './gift-finder.css',
})

export class GiftFinderComponent implements OnInit, OnDestroy {

  currentNodeId = 'root';
  isTransitioning = false;
  nodeHistory: string[] = [];
  breadcrumbLabels: string[] = [];

  private subscriptions: Subscription[] = [];
  private categorySlugSet: Set<string> = new Set<string>();
  private readonly maxCategoryTokens = 3;

  treeNodes: Record<string, QuizNode> = {
    'root': {
      id: 'root',
      question: 'Who are you shopping for?',
      subtitle: 'Select a persona to begin the traversal',
      options: [
        { label: 'The Hardcore Gamer', icon: 'bi bi-controller', nextNodeId: 'gamer_pref' },
        { label: 'The Creator / Pro', icon: 'bi bi-camera-video', nextNodeId: 'creator_pref' },
        { label: 'The Fitness Junkie', icon: 'bi bi-smartwatch', nextNodeId: 'fitness_pref' },
        { label: 'The Audiophile', icon: 'bi bi-headphones', nextNodeId: 'audio_pref' },
        { label: 'The Student', icon: 'bi bi-backpack', nextNodeId: 'student_pref' },
        { label: 'The Smart Home Fan', icon: 'bi bi-house-gear', nextNodeId: 'smart_home_pref' },
      ]
    },

    'gamer_pref': {
      id: 'gamer_pref',
      question: 'What is their weapon of choice?',
      subtitle: 'Pick their primary gaming platform',
      options: [
        { label: 'PC Master Race', icon: 'bi bi-pc-display', nextNodeId: 'gamer_pc_budget' },
        { label: 'Console Player', icon: 'bi bi-tv', nextNodeId: 'gamer_console_budget' },
      ]
    },
    'gamer_pc_budget': {
      id: 'gamer_pc_budget',
      question: 'How much do you actually like them?',
      subtitle: 'Set your budget for the PC gamer',
      options: [
        {
          label: 'Just a token gift (Under $150)',
          icon: 'bi bi-mouse2',
          filters: {
            categories: ['laptops-computers', 'gaming-consoles'],
            maxPrice: 150,
            sort: 'price_asc',
            stockStatus: 'in',
            keywordPool: ['mouse', 'keyboard', 'controller'],
          },
          matchNote: 'Affordable gaming essentials that still feel premium.',
        },
        {
          label: 'Take my money ($1500+)',
          icon: 'bi bi-cpu',
          filters: {
            categories: ['laptops-computers', 'gaming-consoles'],
            minPrice: 1500,
            minRating: 4,
            stockStatus: 'in',
            sort: 'top_rated',
            keywordPool: ['rtx', 'gaming', 'high refresh'],
          },
          matchNote: 'High-end picks optimized for performance-first gamers.',
        },
      ]
    },
    'gamer_console_budget': {
      id: 'gamer_console_budget',
      question: 'Are you buying them a system or an accessory?',
      subtitle: 'Narrow down the console gear',
      options: [
        {
          label: 'A Whole New Console',
          icon: 'bi bi-box-seam',
          filters: {
            categories: ['gaming-consoles'],
            keyword: 'console',
            minPrice: 300,
            stockStatus: 'in',
            sort: 'newest',
          },
          matchNote: 'Latest console inventory filtered to in-stock options.',
        },
        {
          label: 'Just Controllers & Gear',
          icon: 'bi bi-joystick',
          filters: {
            categories: ['gaming-consoles'],
            keyword: 'controller',
            maxPrice: 200,
            stockStatus: 'in',
            sort: 'price_asc',
          },
          matchNote: 'Popular accessories sorted by value and availability.',
        },
      ]
    },

    'creator_pref': {
      id: 'creator_pref',
      question: 'What do they create?',
      subtitle: 'Identify their workflow',
      options: [
        { label: 'Video & Design', icon: 'bi bi-camera-video', nextNodeId: 'creator_video' },
        { label: 'Music & Podcasting', icon: 'bi bi-mic', nextNodeId: 'creator_audio' },
      ]
    },
    'creator_video': {
      id: 'creator_video',
      question: 'What do they need to upgrade?',
      subtitle: 'Select a hardware category',
      options: [
        {
          label: 'A Bigger Display',
          icon: 'bi bi-display',
          filters: {
            categories: ['laptops-computers'],
            keywordPool: ['monitor', 'display'],
            minRating: 4,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Color-accurate displays with strong review performance.',
        },
        {
          label: 'More Storage / Hubs',
          icon: 'bi bi-device-hdd',
          filters: {
            categories: ['laptops-computers', 'smartphones-accessories'],
            keywordPool: ['hub', 'ssd', 'storage'],
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Reliable workflow upgrades for editing and transfer speed.',
        },
      ]
    },
    'creator_audio': {
      id: 'creator_audio',
      question: 'Studio monitors or casual listening?',
      subtitle: 'Select their audio fidelity level',
      options: [
        {
          label: 'Studio Quality ($300+)',
          icon: 'bi bi-headphones',
          filters: {
            categories: ['audio-headphones'],
            minPrice: 300,
            minRating: 4,
            stockStatus: 'in',
            sort: 'top_rated',
            keywordPool: ['studio', 'reference', 'monitor'],
          },
          matchNote: 'Accurate and highly rated gear for production use.',
        },
        {
          label: 'Just Earbuds',
          icon: 'bi bi-earbuds',
          filters: {
            categories: ['audio-headphones'],
            keyword: 'bud',
            maxPrice: 250,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Compact audio picks with strong sound-per-dollar value.',
        },
      ]
    },

    'fitness_pref': {
      id: 'fitness_pref',
      question: 'How do they track their progress?',
      subtitle: 'Select a wearable ecosystem',
      options: [
        {
          label: 'Apple / iOS Ecosystem',
          icon: 'bi bi-smartwatch',
          filters: {
            categories: ['smart-home-wearables', 'apple-ecosystem'],
            keywordPool: ['apple watch', 'fitness'],
            minRating: 4,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Health-focused Apple-compatible gear with top reviews.',
        },
        {
          label: 'Android / Other',
          icon: 'bi bi-phone',
          filters: {
            categories: ['smart-home-wearables'],
            keywordPool: ['garmin', 'fitbit', 'samsung'],
            minRating: 4,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Strong Android-friendly wearables with proven ratings.',
        },
      ]
    },

    'audio_pref': {
      id: 'audio_pref',
      question: 'Where do they listen to music most?',
      subtitle: 'Select an environment',
      options: [
        {
          label: 'Traveling / Commuting',
          icon: 'bi bi-briefcase',
          filters: {
            categories: ['audio-headphones'],
            keywordPool: ['noise canceling', 'wireless'],
            minRating: 4,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Portable noise-canceling options with high user ratings.',
        },
        {
          label: 'At Home (Smart Speakers)',
          icon: 'bi bi-house',
          filters: {
            categories: ['audio-headphones', 'smart-home-wearables', 'apple-ecosystem'],
            keywordPool: ['smart speaker', 'home audio'],
            minRating: 4,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Home audio upgrades tuned for quality and convenience.',
        },
      ]
    },

    'student_pref': {
      id: 'student_pref',
      question: 'What will help them most this semester?',
      subtitle: 'Pick the use-case that matters most',
      options: [
        { label: 'Study Productivity', icon: 'bi bi-journal-check', nextNodeId: 'student_productivity' },
        { label: 'Portable Essentials', icon: 'bi bi-laptop', nextNodeId: 'student_portable' },
      ]
    },
    'student_productivity': {
      id: 'student_productivity',
      question: 'Which productivity boost fits best?',
      subtitle: 'Smart picks for classes and assignments',
      options: [
        {
          label: 'Desk Setup (Monitor + Keyboard)',
          icon: 'bi bi-pc-display-horizontal',
          filters: {
            categories: ['laptops-computers'],
            keywordPool: ['monitor', 'keyboard'],
            maxPrice: 350,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Trusted desk upgrades that improve daily study flow.',
        },
        {
          label: 'Budget Study Accessories',
          icon: 'bi bi-pencil-square',
          filters: {
            categories: ['smartphones-accessories', 'laptops-computers'],
            keywordPool: ['hub', 'stand', 'charger'],
            maxPrice: 120,
            stockStatus: 'in',
            sort: 'price_asc',
          },
          matchNote: 'Low-cost accessories that still deliver everyday value.',
        },
      ]
    },
    'student_portable': {
      id: 'student_portable',
      question: 'What matters more on the go?',
      subtitle: 'Battery life or compact gear',
      options: [
        {
          label: 'Portable Power + Charging',
          icon: 'bi bi-battery-charging',
          filters: {
            categories: ['smartphones-accessories'],
            keywordPool: ['power bank', 'charger', 'usb-c'],
            maxPrice: 150,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Portable charging gear with dependable reviews.',
        },
        {
          label: 'Lightweight Audio for Campus',
          icon: 'bi bi-earbuds',
          filters: {
            categories: ['audio-headphones'],
            keywordPool: ['earbuds', 'wireless'],
            maxPrice: 180,
            minRating: 4,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Comfortable daily audio choices for study and commute.',
        },
      ]
    },

    'smart_home_pref': {
      id: 'smart_home_pref',
      question: 'Which room are you upgrading first?',
      subtitle: 'Choose where they will use smart tech most',
      options: [
        { label: 'Living Room', icon: 'bi bi-tv', nextNodeId: 'smart_home_living' },
        { label: 'Bedroom / Desk', icon: 'bi bi-lamp', nextNodeId: 'smart_home_bedroom' },
      ]
    },
    'smart_home_living': {
      id: 'smart_home_living',
      question: 'Entertainment or automation?',
      subtitle: 'Dial in the experience they will use daily',
      options: [
        {
          label: 'Smart Speakers + Streaming',
          icon: 'bi bi-speaker',
          filters: {
            categories: ['smart-home-wearables', 'audio-headphones'],
            keywordPool: ['smart speaker', 'streaming'],
            minRating: 4,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Great-sounding smart entertainment picks for home.',
        },
        {
          label: 'Automation Starter Kit',
          icon: 'bi bi-house-check',
          filters: {
            categories: ['smart-home-wearables'],
            keywordPool: ['smart plug', 'automation', 'hub'],
            maxPrice: 300,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Starter smart-home bundles optimized for easy setup.',
        },
      ]
    },
    'smart_home_bedroom': {
      id: 'smart_home_bedroom',
      question: 'Comfort or focus setup?',
      subtitle: 'Select the preferred mood and routine',
      options: [
        {
          label: 'Sleep + Wellness Tech',
          icon: 'bi bi-moon-stars',
          filters: {
            categories: ['smart-home-wearables'],
            keywordPool: ['sleep', 'wellness', 'tracker'],
            minRating: 4,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Smart wellness gear with high customer satisfaction.',
        },
        {
          label: 'Desk Focus Setup',
          icon: 'bi bi-lightbulb',
          filters: {
            categories: ['smart-home-wearables', 'laptops-computers'],
            keywordPool: ['desk light', 'focus', 'monitor light'],
            maxPrice: 250,
            stockStatus: 'in',
            sort: 'top_rated',
          },
          matchNote: 'Focus-friendly desk tech for deep work sessions.',
        },
      ]
    }
  };

  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const categorySub = this.categoryService.getCategories().subscribe({
      next: (res) => {
        const categories = res?.data ?? [];
        this.categorySlugSet = new Set(categories.map((cat: Category) => cat.slug));
        this.cdr.detectChanges();
      },
      error: () => {
        this.categorySlugSet = new Set<string>();
        this.cdr.detectChanges();
      },
    });

    this.subscriptions.push(categorySub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  get currentNode(): QuizNode {
    return this.treeNodes[this.currentNodeId];
  }

  get canGoBack(): boolean {
    return this.nodeHistory.length > 0;
  }

  get breadcrumbPath(): string {
    return this.breadcrumbLabels.join(' > ');
  }

  selectOption(option: QuizOption): void {
    if (option.nextNodeId) {
      this.nodeHistory.push(this.currentNodeId);
      this.breadcrumbLabels.push(option.label);
      this.isTransitioning = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.currentNodeId = option.nextNodeId!;
        this.isTransitioning = false;
        this.cdr.detectChanges();
      }, 300);
      return;
    }

    else if (option.filters) {
      const queryParams = this.composeLeafQueryParams(option.filters);
      this.router.navigate(['/products'], { queryParams });
    }
  }

  goBack(): void {
    if (!this.canGoBack) {
      return;
    }

    this.breadcrumbLabels.pop();
    const previousNodeId = this.nodeHistory.pop();

    if (previousNodeId) {
      this.currentNodeId = previousNodeId;
      this.cdr.detectChanges();
    }
  }

  resetQuiz(): void {
    this.currentNodeId = 'root';
    this.nodeHistory = [];
    this.breadcrumbLabels = [];
    this.cdr.detectChanges();
  }

  private composeLeafQueryParams(preset: GiftFilterPreset): ProductQueryParams {
    const personaPathId = this.nodeHistory.find((nodeId) => nodeId.endsWith('_pref'));
    const selectedKeyword = this.pickKeyword([preset.keyword ?? '']);

    const categories = this.sanitizeCategoryTokens(preset.categories ?? []);

    const query: ProductQueryParams = {
      keyword: selectedKeyword,
      minPrice: preset.minPrice,
      maxPrice: preset.maxPrice,
      minRating: preset.minRating,
      stockStatus: preset.stockStatus,
      sort: preset.sort,
      category: categories.length > 0 ? categories.join(',') : undefined,
      page: 1,
    };

    this.applyPathEnrichment(query, personaPathId);
    return this.compactQuery(query);
  }

  private sanitizeCategoryTokens(tokens: string[]): string[] {
    const normalized = tokens
      .map((token) => token.trim().toLowerCase())
      .filter((token, index, arr) => !!token && arr.indexOf(token) === index)
      .slice(0, this.maxCategoryTokens);

    if (this.categorySlugSet.size === 0) {
      return normalized;
    }

    return normalized.filter((token) => this.categorySlugSet.has(token));
  }

  private pickKeyword(candidates: string[]): string | undefined {
    const keyword = candidates.find((value) => value && value.trim().length > 0);
    return keyword?.trim();
  }

  private applyPathEnrichment(query: ProductQueryParams, personaPathId?: string): void {
    if (query.maxPrice !== undefined && query.maxPrice <= 200) {
      query.sort = 'price_asc';
    }

    if (query.minPrice !== undefined && query.minPrice >= 1000) {
      query.sort = 'price_desc';
    }

    if (personaPathId === 'creator_pref' || personaPathId === 'audio_pref') {
      query.stockStatus = query.stockStatus ?? 'in';
      query.sort = query.sort ?? 'top_rated';
    }

    if (personaPathId === 'gamer_pref') {
      query.stockStatus = query.stockStatus ?? 'in';
      query.sort = query.sort ?? 'top_rated';
    }

    if (personaPathId === 'student_pref') {
      query.stockStatus = query.stockStatus ?? 'in';
      query.sort = query.sort ?? 'price_asc';
    }

    if (personaPathId === 'smart_home_pref' || personaPathId === 'fitness_pref') {
      query.stockStatus = query.stockStatus ?? 'in';
      query.sort = query.sort ?? 'top_rated';
    }

    // Seeded catalogs commonly start with unrated products. Avoid hiding valid matches.
    query.minRating = undefined;
  }

  private compactQuery(query: ProductQueryParams): ProductQueryParams {
    const compact: ProductQueryParams = {};

    (Object.entries(query) as [keyof ProductQueryParams, ProductQueryParams[keyof ProductQueryParams]][])
      .forEach(([key, value]) => {
        const isEmptyString = typeof value === 'string' && value.trim() === '';
        if (value !== undefined && value !== null && !isEmptyString) {
          (compact as Record<string, string | number>)[key] = value as string | number;
        }
      });

    return compact;
  }
}