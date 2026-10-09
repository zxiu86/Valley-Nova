import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { filter } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  readonly isReaderRoute = signal<boolean>(false);

  constructor() {
    this.updateRoute(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.updateRoute(event.urlAfterRedirects || event.url);
      });
  }

  private updateRoute(url: string): void {
    const isReader = url.startsWith('/reader') || url.includes('/reader');
    this.isReaderRoute.set(isReader);
  }
}


