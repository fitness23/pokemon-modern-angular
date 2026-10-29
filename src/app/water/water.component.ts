import { Component, computed, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpService } from '../services/http.service';
import { Filter } from '../interfaces/filters-interface';

@Component({
  selector: 'app-water',
  templateUrl: './water.component.html',
  styleUrls: ['./water.component.scss'],
  imports: [TitleCasePipe],
})
export class WaterComponent {
  private readonly httpService = inject(HttpService);

  readonly waterPokemon = rxResource({
    stream: () => this.httpService.getWaterPokemon(),
    defaultValue: [] as Filter[],
  });

  // value() throws while the resource is in an error state, so fall back to an empty list
  readonly pokemon = computed(() => this.waterPokemon.hasValue() ? this.waterPokemon.value() : []);
}
