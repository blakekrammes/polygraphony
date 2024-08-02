import { makeObservable, observable } from 'mobx';

import { Language } from '../localize/useLocalization';
import { makePersistable } from 'mobx-persist-store';

export default class SettingStore {
  language: Language | null = null;

  constructor() {
    if (typeof window === 'undefined') return;
    makeObservable(this, {
      language: observable,
    });

    makePersistable(this, {
      name: 'SettingStore',
      properties: ['language'],
      storage: window.localStorage,
    });
  }
}
