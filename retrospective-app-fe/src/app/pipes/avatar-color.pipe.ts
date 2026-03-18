import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'avatarColor',
  standalone: true
})
export class AvatarColorPipe implements PipeTransform {

  transform(username: string | null): string {
    const colors = [
        '#007aff',
        '#5856d6',
        '#34aadc',
        '#30b87a',
        '#ff9500',
        '#ff6b6b',
    ];
    const index = username ? username.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }
}
