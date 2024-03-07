/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Sym } from "./Sym";

/**
 * Holds a non-terminal symbol which by my convention is written with a capital letter.
 */
export class NTS extends Sym {

	constructor(name: string) {
		super(name);
	}

	isExpandable(): boolean {
		return true;
	}

	/**
	 * Returns the first part(s) of the production of the {@link NTS}
	 *
	 * @return the first part(s) of the production
	 */
	first(): Sym[] {
		const firsts = new Set<Sym>();
		// TODO: Implement first
		/*
		for (const prod of this.productions) {
			if (prod.symbols.length === 0) {
				continue;
			}

			// Check for left-recursion
			if (prod.symbols[0].equals(this)) {
				// Left-recursive -> Add firsts of symbol after left recursion
				prod.symbols[1].first().forEach(s => firsts.add(s));
			} else {
				// Not left-recursive -> Add firsts of first symbol
				prod.symbols[0].first().forEach(s => firsts.add(s));
			}
		}
		*/
		return [...firsts];
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	equals(_: Sym): boolean {
		// TODO: Implement equals
		/*
		// Compare sub-class and name
		if (other instanceof NTS && this.name === other.name) {
			// Compare productions length
			if (this.productions.length !== other.productions.length) {
				return false;
			}
			
			// Compare productions
			for (let i = 0; i < this.productions.length; i++) {
				if (!this.productions[i].equals(other.productions[i])) {
					return false;
				}
			}
		}
		*/

		return false;
	}
}