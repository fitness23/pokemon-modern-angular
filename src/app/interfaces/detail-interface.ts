export interface Ability2 {
    name: string;
    url: string;
}




export interface Sprites {
    front_default: string;
}

export interface Move2 {
    name: string;
    url: string;
}

export interface MoveLearnMethod {
    name: string;
    url: string;
}

export interface VersionGroup {
    name: string;
    url: string;
}

export interface VersionGroupDetail {
    level_learned_at: number;
    move_learn_method: MoveLearnMethod;
    version_group: VersionGroup;
}

export interface Move {
    move: Move2;
    version_group_details: VersionGroupDetail[];
}


export interface Ability {
    ability: Ability2;
    is_hidden: boolean;
    slot: number;
}

    export interface Detail {
        abilities?: Ability[];
        moves?: Move[];
        name?: string;
        sprites?: Sprites;
    }