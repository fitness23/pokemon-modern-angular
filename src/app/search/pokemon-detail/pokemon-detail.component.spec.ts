import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Detail } from '../../interfaces/detail-interface';
import { PokemonDetailComponent } from './pokemon-detail.component';

describe('PokemonDetailComponent', () => {
  let fixture: ComponentFixture<PokemonDetailComponent>;

  const detail: Detail = {
    name: 'charmander',
    sprites: { front_default: 'charmander.png' },
    abilities: [{ ability: { name: 'blaze', url: '' }, is_hidden: false, slot: 1 }],
    moves: [
      { move: { name: 'scratch', url: '' }, version_group_details: [] },
      { move: { name: 'ember', url: '' }, version_group_details: [] },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PokemonDetailComponent] }).compileComponents();
    fixture = TestBed.createComponent(PokemonDetailComponent);
    fixture.componentRef.setInput('detail', detail);
    fixture.detectChanges();
  });

  const text = (selector: string) =>
    Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll(selector)).map(e => e.textContent);

  it('should render the name, sprite, abilities and moves', () => {
    expect(text('.name')).toEqual(['Name: Charmander']);
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('charmander.png');
    expect(text('.ability li')).toEqual(['Blaze']);
    expect(text('.move li')).toEqual(['Scratch', 'Ember']);
  });
});
