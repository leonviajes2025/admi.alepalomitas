
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { APP_NAVIGATION, DASHBOARD_METRICS } from './core/content/dashboard.content';

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

  protected readonly navigation = APP_NAVIGATION;
  protected readonly metrics = DASHBOARD_METRICS;
  protected readonly theme = signal<ThemeMode>(this.getInitialTheme());

  constructor() {
    this.applyTheme(this.theme());
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