/*
 * Copyright (c) 2024. Alexander Voglsperger
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