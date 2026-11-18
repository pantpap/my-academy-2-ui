import { TestBed } from '@angular/core/testing';

import { Session } from './session';

const KEY = 'CS_ACADEMY_ORGANIZATION';

describe('Session', () => {
  afterEach(() => localStorage.removeItem(KEY));

  it('starts with the organization stored in localStorage', () => {
    localStorage.setItem(KEY, JSON.stringify({ id: 7, name: 'A' }));

    const session = TestBed.inject(Session);

    expect(session.organization()).toEqual({ id: 7, name: 'A' });
  });

  it('starts with null when nothing is stored', () => {
    expect(TestBed.inject(Session).organization()).toBeNull();
  });

  it('setOrganization() updates the signal and localStorage', () => {
    const session = TestBed.inject(Session);

    session.setOrganization({ id: 9, name: 'B' } as never);

    expect(session.organization()).toEqual({ id: 9, name: 'B' });
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ id: 9, name: 'B' });
  });

  it('clear() resets the signal and removes it from localStorage', () => {
    localStorage.setItem(KEY, JSON.stringify({ id: 7 }));
    const session = TestBed.inject(Session);

    session.clear();

    expect(session.organization()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
