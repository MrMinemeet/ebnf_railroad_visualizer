/*
 * This work © 2024 by Alexander Voglsperger is licensed under CC BY 4.0.
 * To view a copy of this license, see the provided LICENSE file or visit https://creativecommons.org/licenses/by/4.0/
 */

import { Sym } from "../scannerparser/Sym.js";

export type letter = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z" | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"

/**
 * An identifier is a TS defined as a sequence of atomic letters:
 *
 * `IDENTIFIER = letter { letter } .`
 */
export class Identifier extends Sym {
	readonly letters: letter[];

	constructor(letters: letter[], id: number = -1) {
		if (letters.length === 0) {
			throw new Error("An identifier must have at least one letter");
		}
		super(letters.join(""), id);
		this.letters = letters;
	}

	toString(): string {
		return this.letters.join("");
	}
}