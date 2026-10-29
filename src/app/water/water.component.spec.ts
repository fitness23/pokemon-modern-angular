import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WaterComponent } from './water.component';

describe('WaterComponent', () => {
  const url = 'https://pokeapi.co/api/v2/type/11';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaterComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(WaterComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load the water pokemon on creation and list them', async () => {
    const fixture = TestBed.createComponent(WaterComponent);
    const httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne(url).flush({
      pokemon: [
        { slot: 1, pokemon: { name: 'squirtle', url: 'a' } },
        { slot: 1, pokemon: { name: 'psyduck', url: 'b' } },
      ],
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const items = Array.from<HTMLLIElement>(fixture.nativeElement.querySelectorAll('li'));
    expect(items.map(li => li.textContent)).toEqual(['Squirtle', 'Psyduck']);
    httpMock.verify();
  });
});
