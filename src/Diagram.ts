/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Grammar } from "./Grammar";
import { Sym } from "./symbols/Sym";
import rr from "./railroad.js";
import { Literal } from "./wsn/Literal";
import { Identifier } from "./wsn/Identifier";
import { Production } from "./wsn/Production";
import { Expression } from "./wsn/Expression";
import { Term } from "./wsn/Term";
import { Factor, FactorType } from "./wsn/Factor";
import { isUppercase } from "./ChooChoo";


const railroadCss = `
<style>
svg.railroad-diagram {
	background-color: hsl(30,20%,95%);
}
svg.railroad-diagram path {
	stroke-width: 3;
	stroke: black;
	fill: rgba(0,0,0,0);
}
svg.railroad-diagram text {
	font: bold 14px monospace;
	text-anchor: middle;
	white-space: pre;
}
svg.railroad-diagram text.diagram-text {
	font-size: 12px;
}
svg.railroad-diagram text.diagram-arrow {
	font-size: 16px;
}
svg.railroad-diagram text.label {
	text-anchor: start;
}
svg.railroad-diagram text.comment {
	font: italic 12px monospace;
}
svg.railroad-diagram g.non-terminal text {
	/*font-style: italic;*/
}
svg.railroad-diagram rect {
	stroke-width: 3;
	stroke: black;
	fill: hsl(120,100%,90%);
}
svg.railroad-diagram rect.group-box {
	stroke: gray;
	stroke-dasharray: 10 5;
	fill: none;
}
svg.railroad-diagram path.diagram-text {
	stroke-width: 3;
	stroke: black;
	fill: white;
	cursor: help;
}
svg.railroad-diagram g.diagram-text:hover path.diagram-text {
	fill: #eee;
}
</style>
`;

export class Diagram {
	private grammar: Grammar;
	private diagram: any = undefined;

	constructor(grammar: Grammar) {
		this.grammar = grammar;
		this.diagram = rr.Diagram(this.forProduction(grammar.syntax.productions[0]));
	}

	private forProduction(prod: Production): any {
		const idk = this.generateFrom(prod.expr);
		return rr.Sequence(idk);
	}

	private forExpression(expr: Expression): any {
		const terms = [];
		for (const term of expr.terms) {
			terms.push(this.generateFrom(term));
		}

		const first = terms.shift();
		if (terms.length === 0) {
			return first;
		} else {
			return rr.Sequence(first, rr.Optional(...terms));
		}
	}

	private forTerm(term: Term): any {
		const factors = [];
		for (const factor of term.factors) {
			factors.push(this.generateFrom(factor));
		}

		const first = factors.shift();
		if (factors.length === 0) {
			return first;
		} else {
			return rr.Sequence(first, ...factors);
		}
	}

	private forFactor(factor: Factor): any {
		switch (factor.type) {

			case FactorType.Identifier:
			case FactorType.Literal:
				return this.generateFrom(factor.value);

			case FactorType.Group:
				return rr.Group(this.generateFrom(factor.value));

			case FactorType.Repetition:
				return rr.ZeroOrMore(this.generateFrom(factor.value));

			case FactorType.Optionally:
				return rr.Optional(this.generateFrom(factor.value));

			default:
				throw new Error(`Unknown factor type: $
				Y = number .
				Y = number number .{factor.type}`);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private generateFrom(sym: Sym): any {
		let val: any;
		switch (true) {
			case sym instanceof Expression:
				val = this.forExpression(sym);
				break;

			case sym instanceof Term:
				val = this.forTerm(sym);
				break;

			case sym instanceof Factor:
				val =  this.forFactor(sym);
				break;

			case sym instanceof Identifier:
				if (isUppercase(sym.toString())) {
					val = rr.NonTerminal(sym.toString());
				} else {
					val = rr.Terminal(sym.toString());
				}
				break;

			case sym instanceof Literal:
				val =  rr.Terminal(sym.toString());
				break;
		}

		return val;
	}


	toHtml(): string {
		return `
		<!DOCTYPE html>
		<html>
			<head>
				<title>Test</title>
			</head>
			<body>
				<div>
					<h2>Grammar</h2>
					<pre>${this.grammar.toString()}</pre>
				</div>
				<div class="diagram">
					${this.toSvg().replace('>', `>${railroadCss}`)}
				</div>
			</body>
		</html>
		`;
	}

	/**
	 * A diagram in SVG format
	 * @returns {string} The diagram in SVG format
	 */
	toSvg(): string {
		if (this.diagram === undefined) {
			return "";
		} else {
			return this.diagram.toString() as string;
		}
	}

	toString(): string {
		return this.diagram.toString();
	}
}