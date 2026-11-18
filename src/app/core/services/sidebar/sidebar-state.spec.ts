import { TestBed } from '@angular/core/testing';
import { SIDEBAR_COLLAPSED } from '../../../common/constants/local-storage-constants';
import { LocalStorage } from '../localStorage/local-storage';
import { SidebarState } from './sidebar-state';

// SPEC-sidebar-collapse.md: κατάσταση ανοιχτό/κλειστό, αποθηκευμένη στο localStorage.
describe('SidebarState', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  function create(): SidebarState {
    return TestBed.inject(SidebarState);
  }

  it('ξεκινά ανοιχτό όταν δεν υπάρχει αποθηκευμένη τιμή', () => {
    expect(create().collapsed()).toBe(false);
  });

  it('ξεκινά κλειστό όταν είναι αποθηκευμένο true', () => {
    TestBed.inject(LocalStorage).setItem(SIDEBAR_COLLAPSED, true);
    expect(create().collapsed()).toBe(true);
  });

  it('ξεκινά ανοιχτό όταν η αποθηκευμένη τιμή δεν είναι true', () => {
    TestBed.inject(LocalStorage).setItem(SIDEBAR_COLLAPSED, 'yes');
    expect(create().collapsed()).toBe(false);
  });

  it('το toggle() κλείνει και ανοίγει το sidebar', () => {
    const state = create();
    state.toggle();
    expect(state.collapsed()).toBe(true);
    state.toggle();
    expect(state.collapsed()).toBe(false);
  });

  it('το toggle() γράφει τη νέα τιμή στο localStorage', () => {
    const state = create();
    const storage = TestBed.inject(LocalStorage);
    state.toggle();
    expect(storage.getItem(SIDEBAR_COLLAPSED)).toBe(true);
    state.toggle();
    expect(storage.getItem(SIDEBAR_COLLAPSED)).toBe(false);
  });
});
