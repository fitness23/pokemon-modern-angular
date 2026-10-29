import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  const api = 'https://pokeapi.co/api/v2';
  const typeUrl = `${api}/type/10`;
  const abilityUrl = `${api}/ability/66`;
  const detailUrl = `${api}/pokemon/4`;
  const charmander = { slot: 1, pokemon: { name: 'charmander', url: detailUrl } };

  let fixture: ComponentFixture<SearchComponent>;
  let component: SearchComponent;
  let httpMock: HttpTestingController;

  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const el = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);

  const choose = (selector: string, value: string) => {
    const select = el(selector) as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne(`${api}/type`).flush({ results: [{ name: 'fire', url: typeUrl }] });
    httpMock.expectOne(`${api}/ability`).flush({ results: [{ name: 'blaze', url: abilityUrl }] });
    await settle();
  });

  afterEach(() => httpMock.verify());

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should fill the type and ability selects from the api', () => {
    const typeOptions = Array.from(fixture.nativeElement.querySelectorAll('#types option')) as HTMLOptionElement[];
    const abilityOptions = Array.from(fixture.nativeElement.querySelectorAll('#abilities option')) as HTMLOptionElement[];

    expect(typeOptions.map(o => o.textContent)).toEqual(['Please select', 'Fire']);
    expect(abilityOptions.map(o => o.textContent)).toEqual(['Please select', 'Blaze']);
  });

  it('should ask the user to search before any selection is made', () => {
    expect(el('.useSearch')).toBeTruthy();
    expect(el('table')).toBeNull();
  });

  it('should list pokemon for a chosen type and reset the ability select', async () => {
    choose('#abilities', abilityUrl);
    httpMock.expectOne(abilityUrl).flush({ pokemon: [] });
    await settle();

    choose('#types', typeUrl);
    httpMock.expectOne(typeUrl).flush({ pokemon: [charmander] });
    await settle();

    expect(component.myForm.controls.abilities.value).toBeNull();
    expect(el('.useSearch')).toBeNull();
    expect(el('table tr:nth-child(2) td').textContent).toBe('Charmander');
  });

  it('should not search when "Please select" is chosen', () => {
    const select = el('#types') as HTMLSelectElement;
    choose('#types', select.options[0].value);

    httpMock.expectNone('null');
    expect(el('.useSearch')).toBeTruthy();
  });

  it('should show the pokemon detail and scroll to the top when a pokemon is viewed', async () => {
    spyOn(window, 'scroll');
    choose('#types', typeUrl);
    httpMock.expectOne(typeUrl).flush({ pokemon: [charmander] });
    await settle();

    (el('.viewPokemon') as HTMLAnchorElement).click();
    fixture.detectChanges();
    httpMock.expectOne(detailUrl).flush({
      name: 'charmander',
      sprites: { front_default: 'charmander.png' },
      abilities: [{ ability: { name: 'blaze', url: '' }, is_hidden: false, slot: 1 }],
      moves: [{ move: { name: 'scratch', url: '' }, version_group_details: [] }],
    });
    await settle();

    expect(el('#detail .name').textContent).toContain('Charmander');
    expect(el('#detail .ability li').textContent).toBe('Blaze');
    expect(el('#detail .move li').textContent).toBe('Scratch');
    expect((el('#detail img') as HTMLImageElement).getAttribute('src')).toBe('charmander.png');
    expect(window.scroll).toHaveBeenCalled();
  });
});
