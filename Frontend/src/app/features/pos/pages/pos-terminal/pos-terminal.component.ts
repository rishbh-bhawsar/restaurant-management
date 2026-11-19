import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PosService } from '../../services/pos.service';
import { CartService } from '../../services/cart.service';
import { PosProduct, ProductCategory, SelectedModifier } from '../../models/pos.model';
import { ToasterService } from '../../../../core/services/toaster.service';

@Component({
  selector: 'app-pos-terminal',
  templateUrl: './pos-terminal.component.html',
  styleUrls: ['./pos-terminal.component.scss'],
  standalone: false
})
export class PosTerminalComponent implements OnInit {
  categories: ProductCategory[] = [];
  products: PosProduct[] = [];
  filteredProducts: PosProduct[] = [];

  selectedCategoryId: string = 'all';
  searchQuery: string = '';
  loading: boolean = true;

  // Customization modal state
  selectedProductForCustomization: PosProduct | null = null;
  isCustomizationOpen: boolean = false;

  constructor(
    private posService: PosService,
    private cartService: CartService,
    private router: Router,
    private toaster: ToasterService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.posService.getCategories().subscribe((cats) => {
      this.categories = cats;
    });

    this.posService.getProducts().subscribe({
      next: (prods) => {
        this.products = prods;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toaster.error('Failed to load menu products.', 'Catalog Error');
      }
    });
  }

  onCategorySelect(catId: string): void {
    this.selectedCategoryId = catId;
    this.applyFilters();
  }

  onSearch(term: string): void {
    this.searchQuery = term.toLowerCase().trim();
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedCategoryId = 'all';
    this.searchQuery = '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredProducts = this.products.filter((p) => {
      const matchCat = this.selectedCategoryId === 'all' || p.category === this.selectedCategoryId;
      const matchSearch =
        !this.searchQuery ||
        p.name.toLowerCase().includes(this.searchQuery) ||
        (p.description && p.description.toLowerCase().includes(this.searchQuery)) ||
        (p.itemRef && p.itemRef.toLowerCase().includes(this.searchQuery));

      return matchCat && matchSearch;
    });
  }

  onQuickAdd(product: PosProduct): void {
    // If product has required customizations, open modal instead
    const hasRequired = product.customizationGroups?.some((g) => g.required);
    if (hasRequired) {
      this.openCustomization(product);
    } else {
      this.cartService.addToCart(product);
    }
  }

  openCustomization(product: PosProduct): void {
    this.selectedProductForCustomization = product;
    this.isCustomizationOpen = true;
  }

  closeCustomization(): void {
    this.isCustomizationOpen = false;
    this.selectedProductForCustomization = null;
  }

  onAddConfigured(config: { product: PosProduct; modifiers: SelectedModifier[]; instructions: string }): void {
    this.cartService.addToCart(config.product, config.modifiers, config.instructions);
  }

  goToCheckout(): void {
    if (this.cartService.items().length === 0) {
      this.toaster.warning('Please add at least one item to cart before checkout.', 'Empty Cart');
      return;
    }
    this.router.navigate(['/pos/checkout']);
  }
}
