import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface QuizOption {
  label: string;
  icon: string;
  nextNodeId?: string
  filters?: any
}

interface QuizNode {
  id: string;
  question: string;
  subtitle: string;
  options: QuizOption[];
}

@Component({
  selector: 'app-gift-finder',
  standalone: false,
  templateUrl: './gift-finder.html',
  styleUrl: './gift-finder.css',
})

export class GiftFinderComponent {

  // We start at the 'root' node
  currentNodeId: string = 'root';
  isTransitioning: boolean = false;

  // --- THE DECISION TREE GRAPH ---
  treeNodes: Record<string, QuizNode> = {
    'root': {
      id: 'root',
      question: 'Who are you shopping for?',
      subtitle: 'Select a persona to begin the traversal',
      options: [
        { label: 'The Hardcore Gamer', icon: 'icon-monitor', nextNodeId: 'gamer_pref' },
        { label: 'The Creator / Pro', icon: 'icon-cpu', nextNodeId: 'creator_pref' },
        { label: 'The Fitness Junkie', icon: 'icon-activity', nextNodeId: 'fitness_pref' },
        { label: 'The Audiophile', icon: 'icon-headphones', nextNodeId: 'audio_pref' }
      ]
    },

    // ----------------------------------------------------
    // BRANCH 1: THE GAMER
    // ----------------------------------------------------
    'gamer_pref': {
      id: 'gamer_pref',
      question: 'What is their weapon of choice?',
      subtitle: 'Pick their primary gaming platform',
      options: [
        { label: 'PC Master Race', icon: 'icon-hard-drive', nextNodeId: 'gamer_pc_budget' },
        { label: 'Console Player', icon: 'icon-tv', nextNodeId: 'gamer_console_budget' }
      ]
    },
    'gamer_pc_budget': {
      id: 'gamer_pc_budget',
      question: 'How much do you actually like them?',
      subtitle: 'Set your budget for the PC gamer',
      options: [
        { 
          label: 'Just a token gift (Under $150)', 
          icon: 'icon-mouse', 
          filters: { 
            // Combines Laptops/Computers AND Gaming/Consoles
            category: 'laptops-computers,gaming-consoles', 
            maxPrice: 150,
            sort: 'price_asc'
          } 
        },
        { 
          label: 'Take my money ($1500+)', 
          icon: 'icon-cpu', 
          filters: { 
            // Combines Laptops AND Gaming, strictly high-end
            category: 'laptops-computers,gaming-consoles', 
            minPrice: 1500,
            sort: 'price_desc'
          } 
        }
      ]
    },
    'gamer_console_budget': {
      id: 'gamer_console_budget',
      question: 'Are you buying them a system or an accessory?',
      subtitle: 'Narrow down the console gear',
      options: [
        { 
          label: 'A Whole New Console', 
          icon: 'icon-box', 
          filters: { 
            category: 'gaming-consoles', 
            keyword: 'console',
            minPrice: 300 
          } 
        },
        { 
          label: 'Just Controllers & Gear', 
          icon: 'icon-crosshair', 
          filters: { 
            category: 'gaming-consoles', 
            keyword: 'controller',
            maxPrice: 200 
          } 
        }
      ]
    },

    // ----------------------------------------------------
    // BRANCH 2: THE CREATOR
    // ----------------------------------------------------
    'creator_pref': {
      id: 'creator_pref',
      question: 'What do they create?',
      subtitle: 'Identify their workflow',
      options: [
        { label: 'Video & Design', icon: 'icon-video', nextNodeId: 'creator_video' },
        { label: 'Music & Podcasting', icon: 'icon-mic', nextNodeId: 'creator_audio' }
      ]
    },
    'creator_video': {
      id: 'creator_video',
      question: 'What do they need to upgrade?',
      subtitle: 'Select a hardware category',
      options: [
        { 
          label: 'A Bigger Display', 
          icon: 'icon-monitor', 
          filters: { 
            // Combines Laptops & Computers
            category: 'laptops-computers', 
            keyword: 'monitor'
          } 
        },
        { 
          label: 'More Storage / Hubs', 
          icon: 'icon-hard-drive', 
          filters: { 
            // Combines Laptops & Computers AND Phones & Accessories
            category: 'laptops-computers,smartphones-accessories',
            keyword: 'hub'
          } 
        }
      ]
    },
    'creator_audio': {
      id: 'creator_audio',
      question: 'Studio monitors or casual listening?',
      subtitle: 'Select their audio fidelity level',
      options: [
        { 
          label: 'Studio Quality ($300+)', 
          icon: 'icon-headphones', 
          filters: { 
            category: 'audio-headphones', 
            minPrice: 300,
            sort: 'top_rated'
          } 
        },
        { 
          label: 'Just Earbuds', 
          icon: 'icon-music', 
          filters: { 
            category: 'audio-headphones', 
            keyword: 'bud',
            maxPrice: 250
          } 
        }
      ]
    },

    // ----------------------------------------------------
    // BRANCH 3: THE FITNESS JUNKIE
    // ----------------------------------------------------
    'fitness_pref': {
      id: 'fitness_pref',
      question: 'How do they track their progress?',
      subtitle: 'Select a wearable ecosystem',
      options: [
        { 
          label: 'Apple / iOS Ecosystem', 
          icon: 'icon-watch', 
          filters: { 
            category: 'smart-home-wearables,apple-ecosystem', 
            keyword: 'apple'
          } 
        },
        { 
          label: 'Android / Other', 
          icon: 'icon-activity', 
          filters: { 
            category: 'smart-home-wearables', 
            keyword: 'samsung' // Could also be garmin, fitbit, etc.
          } 
        }
      ]
    },

    // ----------------------------------------------------
    // BRANCH 4: THE AUDIOPHILE
    // ----------------------------------------------------
    'audio_pref': {
      id: 'audio_pref',
      question: 'Where do they listen to music most?',
      subtitle: 'Select an environment',
      options: [
        { 
          label: 'Traveling / Commuting', 
          icon: 'icon-briefcase', 
          filters: { 
            category: 'audio-headphones', 
            keyword: 'noise canceling' 
          } 
        },
        { 
          label: 'At Home (Smart Speakers)', 
          icon: 'icon-home', 
          filters: { 
            // Combines Audio, Smart Home, and Apple Ecosystem
            category: 'audio-headphones,smart-home-wearables,apple-ecosystem', 
            keyword: 'smart' 
          } 
        }
      ]
    }
  };

  constructor(private router: Router) {}

  get currentNode(): QuizNode {
    return this.treeNodes[this.currentNodeId];
  }

  selectOption(option: QuizOption) {
    // If it has a next node, traverse the tree
    if (option.nextNodeId) {
      this.isTransitioning = true;
      setTimeout(() => {
        this.currentNodeId = option.nextNodeId!;
        this.isTransitioning = false;
      }, 300); // Wait for CSS fade out
    } 
    // If it has NO next node, it's a leaf! Execute the search.
    else if (option.filters) {
      this.router.navigate(['/products'], { queryParams: option.filters });
    }
  }

  resetQuiz() {
    this.currentNodeId = 'root';
  }
}