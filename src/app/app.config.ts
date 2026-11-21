import {
  ApplicationConfig,
  Injectable,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy, provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { I18nService } from './core/services/i18n.service';

@Injectable()
export class LocalizedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let route = snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const key = route.data['titleKey'] as
      | 'novels'
      | 'details'
      | 'explore'
      | 'reader'
      | 'auth'
      | 'profile'
      | 'writer'
      | undefined;
    const dict = this.i18n.copy();
    const resolvedTitle = (key && dict.site.titles[key]) || dict.site.pageTitleDefault;
    this.title.setTitle(resolvedTitle);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    { provide: TitleStrategy, useClass: LocalizedTitleStrategy },
  ],
};
