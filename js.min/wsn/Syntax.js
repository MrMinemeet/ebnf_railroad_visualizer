"use strict";import{Sym as r}from"../scannerparser/Sym.js";export class Syntax extends r{constructor(t,n=-1){super(t.map(o=>o.toString()).join(`
`),n),this.productions=t}toString(){return this.productions.map(t=>t.toString()).join(`
`)}}
