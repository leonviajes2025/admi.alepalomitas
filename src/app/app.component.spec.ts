import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    window.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideHttpClient()]
    }).compileComponents();
  });

  it('should create the app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });

  it('should keep the shell hidden until the user logs in', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Panel administrativo');
  });
});