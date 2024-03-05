/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Production } from "./symbols/Production";
import { NTS } from "./symbols/NTS";
import { TS } from "./symbols/TS";
import { Sym } from "./symbols/Sym";


/**
 * Represents the parsed grammar.
 */
export class Grammar {
	readonly grammar: Production[];

	constructor(grammar: Production[]) {
		this.grammar = grammar;
	}

	/**
	 * Creates a new {@link Grammar} instance from a given string containing a grammar.
	 * @param grammar The grammar to parse. The individual productions must be separated by a newline and formatted as required by {@link Production}.
	 * @returns 
	 */
	static fromString(grammar: string): Grammar {
		const prodStrings = grammar.trim().split("\n");
		const productions = this.parseProductions(prodStrings);

		return new Grammar(productions);
	}

	/**
	 * Parses the productions of the grammar, adds them to respective {@link NTS} and returns them.
	 * @param grammar The grammar to parse.
	 * @returns The parsed productions.
	 * @throws If a symbol on the left side of the "=" could not be found in NTS
	 */
	private static parseProductions(grammar: string[]): Production[] {
		// TODO: Add support for Extended-BNF

		const parsedNTS = this.parseNTS(grammar);
		const productions: Production[] = [];

		// Create each production and add to respective NTS instance
		let idx = 1;
		for (const line of grammar) {
			const leftSide = line.split("=")[0].trim();
			const rightSide = line.split("=")[1].trim()
				.substring(0, line.split("=")[1].trim().length - 1)
				.trim();

			// Find leftSide-NTS in NTSs
			const curNTS = parsedNTS.find(n => n.name === leftSide);
			if (curNTS === undefined) {
				throw new Error(`Could not find NTS ${leftSide} in NTSs!`);
			}

			// Split the right side into the effective symbols
			const symbols: Sym[] = [];
			for (const sym of rightSide
				.split(" ")
				.filter(p => p.trim().length !== 0)
			) {
				// Try to find symbol in parsedNTS, if not found then add as TS
				symbols.push(parsedNTS.find(n => n.name === sym) || new TS(sym));
			}

			// Create new production, add to curNTS and productions
			const prod = new Production(idx++, curNTS, symbols);
			curNTS.productions.push(prod);
			productions.push(prod);
		}

		return productions;
	}

	/**
	 * Extracts the {@link NTS}s from a given grammar.
	 * @param grammar The grammar to extract the NTSs from.
	 * @returns The extracted NTSs.
	 * @throws If a production is invalid.
	 */
	private static parseNTS(grammar: string[]): NTS[] {
		const nts = new Set<NTS>();

		for (const line of grammar) {
			const parts = line.split("=");
			if (parts.length !== 2) {
				throw new Error(`Invalid production '${line}'! A line must only contain one '='!`);
			}

			nts.add(new NTS(parts[0].trim()));
		}

		return [...nts];
	}
}