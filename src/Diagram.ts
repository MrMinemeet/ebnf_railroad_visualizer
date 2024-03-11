/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Grammar } from "./Grammar";
import { Sym } from "./symbols/Sym";
import rd from "./railroad.js";
import { Literal } from "./wsn/Literal";
import { Identifier } from "./wsn/Identifier";
import { Term } from "./wsn/Term";
import { Syntax } from "./wsn/Syntax";


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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private diagram: any = undefined;

	constructor(grammar: Grammar) {
		this.grammar = grammar;
		this.diagram = this.generateFrom(grammar.syntax);
	}
	
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private generateFrom(sym: Sym): any[] {
		const diag = [];


		switch (true) {
			// TODO: Add more cases for others

			case sym instanceof Identifier:
			case sym instanceof Literal:
				diag.push(rd.Terminal(sym.toString()));
				break;
		}
		

		return diag;
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
}