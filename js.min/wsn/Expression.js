"use strict";import{Sym as s}from"../scannerparser/Sym.js";export class Expression extends s{constructor(t,r=-1){super(t.map(o=>o.toString()).join(" | "),r),this.terms=t}toString(){return this.terms.map(t=>t.toString()).join(" | ")}}