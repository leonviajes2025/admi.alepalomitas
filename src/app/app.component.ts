
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { APP_NAVIGATION } from './core/content/dashboard.content';
import { AuthService } from './core/services/auth.service';

type ThemeMode = 'dark' | 'light';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly navigation = APP_NAVIGATION;
  protected readonly theme = signal<ThemeMode>(this.getInitialTheme());
  protected readonly isMobileNavigationOpen = signal(false);
  protected readonly currentUser = this.authService.currentUser;
  protected readonly showShell = computed(
    () => this.authService.isAuthenticated() && !this.currentUrl().startsWith('/login')
  );

  constructor() {
    this.applyTheme(this.theme());
  }

  protected logout(): void {
    this.closeMobileNavigation();
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  protected toggleMobileNavigation(): void {
    this.isMobileNavigationOpen.update((isOpen) => !isOpen);
  }

  protected closeMobileNavigation(): void {
    this.isMobileNavigationOpen.set(false);
  }

  protected setTheme(theme: ThemeMode): void {
    if (this.theme() === theme) {
      return;
    }

    this.theme.set(theme);
    this.applyTheme(theme);
  }

  private getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    const savedTheme = window.localStorage.getItem('alepalomitas-theme');
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
  }

  private applyTheme(theme: ThemeMode): void {
    this.document.documentElement.dataset['theme'] = theme;
    this.document.documentElement.style.colorScheme = theme;

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('alepalomitas-theme', theme);
    }
  }
}