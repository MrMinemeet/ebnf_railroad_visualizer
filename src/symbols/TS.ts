/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Sym } from "./Sym";

/**
 * Holds a terminal symbol which by my convention is written with a non-capital letter.
 */
export class TS extends Sym {
	constructor(name: string) {
		super(name);
	}

	isExpandable(): boolean {
		return false;
	}

	first(): Sym[] {
		return [this];
	}

	/**
	 * Checks if equals based on the type and the name.
	 * @param other The other symbol to compare with
	 * @returns true if the other symbol is a terminal symbol and has the same name
	 */
	equals(other: Sym): boolean {
		return other instanceof TS && this.name === other.name;
	}
	
}