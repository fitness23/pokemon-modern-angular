import { Component, computed, effect, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpService } from '../services/http.service';
import { Item } from '../interfaces/items-interface';
import { Filter } from '../interfaces/filters-interface';
import { PokemonDetailComponent } from './pokemon-detail/pokemon-detail.component';

type SearchField = 'types' | 'abilities';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  imports: [ReactiveFormsModule, TitleCasePipe, PokemonDetailComponent],
})
export class SearchComponent {
  private readonly httpService = inject(HttpService);
  private readonly fb = inject(FormBuilder);

  readonly myForm = this.fb.group({
    types: this.fb.control<string | null>(null),
    abilities: this.fb.control<string | null>(null),
  });

  private readonly searchUrl = signal<string | null>(null);
  private readonly detailUrl = signal<string | null>(null);

  readonly pokemonTypes = rxResource({
    stream: () => this.httpService.getTypes(),
    defaultValue: [] as Filter[],
  });

  readonly pokemonAbilities = rxResource({
    stream: () => this.httpService.getAbilities(),
    defaultValue: [] as Filter[],
  });

  readonly items = rxResource({
    params: () => this.searchUrl() ?? undefined, // undefined keeps the resource idle
    stream: ({ params }) => this.httpService.getPokemonList(params),
    defaultValue: [] as Item[],
  });

  readonly detail = rxResource({
    params: () => this.detailUrl() ?? undefined,
    stream: ({ params }) => this.httpService.getPokemonDetail(params),
  });

  // value() throws while a resource is in an error state, so fall back to empty values
  readonly typeList = computed(() => this.pokemonTypes.hasValue() ? this.pokemonTypes.value() : []);
  readonly abilityList = computed(() => this.pokemonAbilities.hasValue() ? this.pokemonAbilities.value() : []);
  readonly itemList = computed(() => this.items.hasValue() ? this.items.value() : []);
  readonly detailValue = computed(() => this.detail.hasValue() ? this.detail.value() : undefined);

  constructor() {
    effect(() => {
      if (this.detail.hasValue()) {
        this.scrollPage();
      }
    });
  }

  setSearchUrl(fieldChanged: SearchField) {
    const otherField: SearchField = fieldChanged === 'types' ? 'abilities' : 'types';
    const url = this.myForm.controls[fieldChanged].value;

    // The "Please select" option has the value "null", which means no search.
    this.searchUrl.set(url && url !== 'null' ? url : null);
    this.myForm.controls[otherField].patchValue(null);
  }

  viewPokemon(pokemonUrl: string) {
    this.detailUrl.set(pokemonUrl);
  }

  private scrollPage() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }
}
