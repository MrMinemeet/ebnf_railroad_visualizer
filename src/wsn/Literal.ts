/*
 * This work © 2024 by Alexander Voglsperger is licensed under CC BY 4.0.
 * To view a copy of this license, see the provided LICENSE file or visit https://creativecommons.org/licenses/by/4.0/
 */

import { Sym } from "../scannerparser/Sym.js";

/**
 * A literal is a TS defined as a sequence of atomic characters:
 *
 * `LITERAL = "\"" character { character } "\"" .`
 */
export class Literal extends Sym {
	constructor(characters: string, id: number = -1) {
		if (characters.length === 0) {
			throw new Error("A literal must have at least one character");
		}
		super(characters, id);
	}

	override toString(): string {
		return `"${super.toString()}"`;
	}
}