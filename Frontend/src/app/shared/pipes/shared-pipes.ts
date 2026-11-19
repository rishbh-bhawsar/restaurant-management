import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appCurrency',
  standalone: false
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | string | null | undefined, currencyCode: string = '$'): string {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return `${currencyCode}0.00`;
    }
    const num = Number(value);
    return `${currencyCode}${num.toFixed(2)}`;
  }
}

@Pipe({
  name: 'truncate',
  standalone: false
})
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit: number = 30, trail: string = '...'): string {
    if (!value) return '';
    return value.length > limit ? value.substring(0, limit) + trail : value;
  }
}
