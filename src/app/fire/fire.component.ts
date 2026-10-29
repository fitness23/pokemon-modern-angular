import { Component, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpService } from '../services/http.service';
import { Filter } from '../interfaces/filters-interface';

@Component({
  selector: 'app-fire',
  templateUrl: './fire.component.html',
  styleUrls: ['./fire.component.scss'],
  imports: [TitleCasePipe],
})
export class FireComponent {
  private readonly httpService = inject(HttpService);
  private readonly started = signal(false);

  readonly items = rxResource({
    params: () => this.started() || undefined, // undefined keeps the resource idle: no request until the first click
    stream: () => this.httpService.getFirePokemon(),
    defaultValue: [] as Filter[],
  });

  // value() throws while the resource is in an error state, so fall back to an empty list
  readonly pokemon = computed(() => this.items.hasValue() ? this.items.value() : []);

  load() {
    if (this.started()) {
      this.items.reload();
    } else {
      this.started.set(true);
    }
  }
}
