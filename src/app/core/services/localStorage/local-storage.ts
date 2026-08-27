import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorage {
  private readonly keyPrefix = 'CS_ACADEMY_';

  setItem(key: string, value: unknown) {
    localStorage.setItem(`${this.keyPrefix}${key}`, JSON.stringify(value));
  }

  getItem<T = unknown>(key: string): T {
    try {
      return JSON.parse(localStorage.getItem(`${this.keyPrefix}${key}`) ?? '');
    } catch (e) {
      return null as T;
    }
  }

  removeItem(key: string) {
    localStorage.removeItem(`${this.keyPrefix}${key}`);
  }
}
