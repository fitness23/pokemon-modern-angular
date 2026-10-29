import { Component, input } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Detail } from '../../interfaces/detail-interface';

@Component({
  selector: 'app-pokemon-detail',
  templateUrl: './pokemon-detail.component.html',
  styleUrls: ['./pokemon-detail.component.scss'],
  imports: [TitleCasePipe],
})
export class PokemonDetailComponent {
  readonly detail = input.required<Detail>();
}
