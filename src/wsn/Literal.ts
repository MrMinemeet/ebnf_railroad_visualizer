/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { TS } from "../symbols/TS";
import { letter } from "./Identifier";

export type character = letter | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

/**
 * A literal is a TS defined as a sequence of atomic characters:
 *
 * `LITERAL = "\"" character { character } "\"" .`
 */
export class Literal extends TS {
	readonly characters: character[];

	constructor(characters: character[]) {
		if (characters.length === 0) {
			throw new Error("A literal must have at least one character");
		}
		super(`"${characters.join("")}"`);
		this.characters = characters;
	}

	toString(): string {
		return `"${this.characters.join("")}"`;
	}
}