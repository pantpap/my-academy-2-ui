import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorage {
  private readonly keyPrefix = 'CS_ACADEMY_';

  setItem(key: string, value: string) {
    localStorage.setItem(`${this.keyPrefix}${key}`, JSON.stringify(value));
  }

  getItem(key: string) {
    try {
      return JSON.parse(localStorage.getItem(`${this.keyPrefix}${key}`) ?? '');
    } catch (e) {
      return `Error retrieving item with key ${key} from localStorage: ${e}`;
    }
  }

  removeItem(key: string) {
    localStorage.removeItem(`${this.keyPrefix}${key}`);
  }
}
