/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Sym } from "./Sym";
import { NTS } from "./NTS";

/**
 * Holds a production in form of `X' = X # .`
 * E.g.:
 * ```text
 * (0) X = char Y "a" . <br>
 * (1) Y = Numbers . <br>
 * (2) Y = Numbers Numbers . <br>
 * (3) Numbers = number number . <br>
 * ```
 * The stored symbols must **not** include the ending dot!
 */
export class Production {
	/** Number of the production (e.g. (0), (1), (2), …) */
	readonly num: number;
	/** Holds the individual symbols on the right side of the production */
	readonly symbols: Sym[];
	/** Holds the production as a string */
	readonly str: string;
	/** Holds the {@link NTS} it belongs to. (left side) */
	readonly nts: NTS;

	constructor(num: number, symbols: Sym[], nts: NTS) {
		this.num = num;
		this.symbols = symbols;
		this.str = `${nts.name} = ${symbols.map(s => s.name).join(" ")}`;
		this.nts = nts;
	}

	equals(other: Production): boolean {
		if (this.num !== other.num && this.symbols.length !== other.symbols.length) {
			return false;
		}

		// Shallow comparison of symbols
		for (let i = 0; i < this.symbols.length; i++) {
			if (!this.symbols[i].equals(other.symbols[i])) {
				return false;
			}
		}

		return true;
	}

	toString(): string {
		return `(${this.num}) ${this.str} .`;
	}
}