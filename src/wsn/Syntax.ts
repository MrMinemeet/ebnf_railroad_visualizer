/*
 * This work © 2024 by Alexander Voglsperger is licensed under CC BY 4.0.
 * To view a copy of this license, see the provided LICENSE file or visit https://creativecommons.org/licenses/by/4.0/
 */

import { Production } from './Production.js';
import { Sym } from '../scannerparser/Sym.js';

/**
 * A syntax is a sequence of productions defined as:
 *
 * `SYNTAX = PRODUCTION { PRODUCTION } .`
 */
export class Syntax extends Sym {
	readonly productions: Production[];

	constructor(productions: Production[], id: number = -1) {
		super(productions.map(p => p.toString()).join("\n"), id);
		this.productions = productions;
	}

	toString(): string {
		return this.productions.map(p => p.toString()).join("\n");
	}
}