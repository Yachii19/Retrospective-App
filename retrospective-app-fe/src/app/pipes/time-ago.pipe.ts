import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: string | Date, nowRef?: Date): string {
    const now = nowRef ?? new Date();
    const date = new Date(value);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) {
      return 'Just now';
    }
    if (minutes === 1) {
      return 'A minute ago';
    }
    if (minutes < 60) {
      return `${minutes} minutes ago`;
    }
    if (hours === 1) {
      return 'An hour ago';
    }
    if (hours < 24) {
      return `${hours} hours ago`;
    }
    if (hours >= 24 && days < 7) {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      const isYesterday = date.getDate() === yesterday.getDate() && 
                        date.getMonth() === yesterday.getMonth() &&
                        date.getFullYear() === yesterday.getFullYear()

      return isYesterday ? `Yesterday` : days === 1? `1 day ago` : `${days} days ago` ;
    }
    if (weeks >= 1 && weeks < 4) {
      return weeks === 1? `1 week ago` : `${weeks} weeks ago`
    }
    if (months >= 1 && months < 12) {
      return months === 1? `1 month ago` : `${months} months ago`
    }
    if (years > 0) {
      return years === 1? `1 year ago` : `${years} years ago` 
    }

    return ''
  }
}
