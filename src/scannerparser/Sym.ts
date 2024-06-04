/*
 * Copyright (c) 2024. Alexander Voglsperger
 */
import { isUppercase } from "../ChooChoo.js";

/**
 * Base class for all parts of a grammar (terminal symbols and non-terminal symbols).
 * Holds the name of the part and the follow parts of the part.
 *
 * See:
 * * {@link NTS}
 * * {@link TS}
 */
export abstract class Sym {
	readonly name: string;
	readonly id: number;

	constructor(name: string, id: number = -1) {
		this.name = name;
		this.id = id;
	}

	toString(): string {
		return this.name;
	}

	equals(other: Sym): boolean {
		return this.name == other.name;
	}

	/**
	 * Returns true if the symbol is a terminal symbol.
	 * @returns true if the symbol is a literal or a lower case identifier
	 */
	isTS(): boolean {
		return !isUppercase(this.name) || this.name.startsWith('"');
	}
}