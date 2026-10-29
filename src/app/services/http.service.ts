import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Detail } from '../interfaces/detail-interface';
import { Filter } from '../interfaces/filters-interface';
import { Item } from '../interfaces/items-interface';

interface FilterListResponse {
  results: Filter[];
}

interface TypeResponse {
  pokemon: Item[];
}

@Injectable({ providedIn: 'root' })
export class HttpService {
  private readonly http = inject(HttpClient);

  getApi() {
    return 'https://pokeapi.co/api/v2';
  }

  getTypes(): Observable<Filter[]> {
    return this.http
      .get<FilterListResponse>(`${this.getApi()}/type`)
      .pipe(
        catchError((err) => this.errorHandler(err)),
        map((res) => res.results)
      );
  }

  getAbilities(): Observable<Filter[]> {
    return this.http
      .get<FilterListResponse>(`${this.getApi()}/ability`)
      .pipe(
        catchError((err) => this.errorHandler(err)),
        map((res) => res.results)
      );
  }

  getWaterPokemon(): Observable<Filter[]> {
    return this.http
      .get<TypeResponse>(`${this.getApi()}/type/11`)
      .pipe(
        catchError((err) => this.errorHandler(err)),
        map((res) => res.pokemon.map((item) => item.pokemon))
      );
  }

  getFirePokemon(): Observable<Filter[]> {
    return this.http
      .get<TypeResponse>(`${this.getApi()}/type/10`)
      .pipe(
        catchError((err) => this.errorHandler(err)),
        map((res) => res.pokemon.map((item) => item.pokemon))
      );
  }

  getPokemonList(searchUrl: string): Observable<Item[]> {
    return this.http.get<TypeResponse>(searchUrl).pipe(
      catchError((err) => this.errorHandler(err)),
      map((res) => res.pokemon)
    );
  }

  getPokemonDetail(searchUrl: string): Observable<Detail> {
    return this.http
      .get<Detail>(searchUrl)
      .pipe(catchError((err) => this.errorHandler(err)));
  }

  errorHandler(error: HttpErrorResponse) {
    return throwError(() => new Error(error.message || 'server error.'));
  }
}
