/*
 * This work © 2024 by Alexander Voglsperger is licensed under CC BY 4.0.
 * To view a copy of this license, see the provided LICENSE file or visit https://creativecommons.org/licenses/by/4.0/
 */

import { Sym } from '../scannerparser/Sym.js';
import { Term } from './Term.js';

/**
 * A sequence of terms defined as:
 *
 * `EXPRESSION = TERM { "|" TERM } .`
 */
export class Expression extends Sym {
	readonly terms: Term[];

	constructor(terms: Term[], id: number = -1) {
		super(terms.map(t => t.toString()).join(" | "), id);
		this.terms = terms;
	}

	toString(): string {
		return this.terms.map(t => t.toString()).join(" | ");
	}
}