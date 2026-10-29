import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FireComponent } from './fire.component';

describe('FireComponent', () => {
  const url = 'https://pokeapi.co/api/v2/type/10';
  const body = { pokemon: [{ slot: 1, pokemon: { name: 'charmander', url: 'a' } }] };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FireComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(FireComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not request anything until the button is pressed', () => {
    const fixture = TestBed.createComponent(FireComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectNone(url);
    expect(fixture.nativeElement.textContent).toContain('Press the button above.');
  });

  it('should disable the button while loading, then list the pokemon', async () => {
    const fixture = TestBed.createComponent(FireComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    button.click();
    fixture.detectChanges();
    const req = httpMock.expectOne(url);
    fixture.detectChanges();
    expect(button.disabled).toBeTrue();

    req.flush(body);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(button.disabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('li').textContent).toBe('Charmander');
    expect(fixture.nativeElement.textContent).not.toContain('Press the button above.');
  });

  it('should request again when the button is pressed a second time', async () => {
    const fixture = TestBed.createComponent(FireComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    button.click();
    fixture.detectChanges();
    httpMock.expectOne(url).flush(body);
    await fixture.whenStable();
    fixture.detectChanges();

    button.click();
    fixture.detectChanges();
    httpMock.expectOne(url).flush(body);
  });

  it('should keep rendering when the request fails', async () => {
    const fixture = TestBed.createComponent(FireComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    button.click();
    fixture.detectChanges();
    httpMock.expectOne(url).error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(button.disabled).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Press the button above.');
  });
});
