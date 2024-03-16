/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Factor } from "./Factor.js";
import { Sym } from "../scannerparser/Sym.js";

/**
 * A Term is a sequence of factors defined as:
 *
 * `TERM = FACTOR { FACTOR } .`
 */
export class Term extends Sym {
	readonly factors: Factor[];

	constructor(factors: Factor[], id: number = -1) {
		if (factors.length === 0) {
			throw new Error("A term must have at least one factor");
		}
		super(factors.map(f => f.toString()).join(" "), id );
		this.factors = factors;
	}

	toString(): string {
		return this.factors.map(f => f.toString()).join(" ");
	}
}