export interface Pokemon {
    name: string;
    url: string;
}

    export interface Item {
        pokemon: Pokemon;
        slot: number;
    }