/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Sym } from "../scannerparser/Sym";

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
}