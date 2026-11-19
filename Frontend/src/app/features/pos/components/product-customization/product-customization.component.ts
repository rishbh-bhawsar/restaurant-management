import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { PosProduct, SelectedModifier, ProductCustomizationOption } from '../../models/pos.model';
import { PricingService } from '../../services/pricing.service';

@Component({
  selector: 'app-product-customization',
  templateUrl: './product-customization.component.html',
  styleUrls: ['./product-customization.component.scss'],
  standalone: false
})
export class ProductCustomizationComponent implements OnChanges {
  @Input() product: PosProduct | null = null;
  @Input() isOpen: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() addConfigured = new EventEmitter<{
    product: PosProduct;
    modifiers: SelectedModifier[];
    instructions: string;
  }>();

  selectedModifiers: SelectedModifier[] = [];
  specialInstructions: string = '';
  calculatedTotal: number = 0;

  constructor(private pricingService: PricingService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.selectedModifiers = [];
      this.specialInstructions = '';

      // Set default selected options for required groups
      if (this.product.customizationGroups) {
        for (const group of this.product.customizationGroups) {
          if (group.required && group.options.length > 0) {
            this.selectedModifiers.push({
              groupName: group.name,
              optionName: group.options[0].name,
              priceDelta: group.options[0].priceDelta
            });
          }
        }
      }
      this.updateTotal();
    }
  }

  isOptionSelected(groupName: string, optionName: string): boolean {
    return this.selectedModifiers.some(
      (m) => m.groupName === groupName && m.optionName === optionName
    );
  }

  toggleOption(groupName: string, option: ProductCustomizationOption, isSingleChoice: boolean): void {
    if (isSingleChoice) {
      this.selectedModifiers = this.selectedModifiers.filter((m) => m.groupName !== groupName);
      this.selectedModifiers.push({
        groupName,
        optionName: option.name,
        priceDelta: option.priceDelta
      });
    } else {
      const existingIdx = this.selectedModifiers.findIndex(
        (m) => m.groupName === groupName && m.optionName === option.name
      );
      if (existingIdx > -1) {
        this.selectedModifiers.splice(existingIdx, 1);
      } else {
        this.selectedModifiers.push({
          groupName,
          optionName: option.name,
          priceDelta: option.priceDelta
        });
      }
    }
    this.updateTotal();
  }

  updateTotal(): void {
    if (!this.product) return;
    this.calculatedTotal = this.pricingService.calculateItemUnitPrice(
      this.product.price,
      this.selectedModifiers
    );
  }

  confirm(): void {
    if (!this.product) return;
    this.addConfigured.emit({
      product: this.product,
      modifiers: this.selectedModifiers,
      instructions: this.specialInstructions.trim()
    });
    this.close.emit();
  }
}
