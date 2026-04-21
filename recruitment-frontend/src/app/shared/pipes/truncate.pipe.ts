import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    limit: number = 50,
    completeWords: boolean = false,
    ellipsis: string = '...',
  ): string {
    if (!value) return '';

    if (value.length <= limit) {
      return value;
    }

    let truncated = value.substring(0, limit);

    if (completeWords) {
      const lastSpace = truncated.lastIndexOf(' ');

      if (lastSpace > 0) {
        truncated = truncated.substring(0, lastSpace);
      }

      truncated = truncated.replace(/[.,;!?]\s*$/, '');
    }

    return truncated + ellipsis;
  }
}
