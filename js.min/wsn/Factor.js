"use strict";import{Sym as s}from"../scannerparser/Sym.js";export var FactorType;(function(t){t[t.Identifier=0]="Identifier",t[t.Literal=1]="Literal",t[t.Group=2]="Group",t[t.Repetition=3]="Repetition",t[t.Optionally=4]="Optionally"})(FactorType||(FactorType={}));export class Factor extends s{constructor(r,i,n=-1){let e;switch(r){case FactorType.Group:e=`(${i})`;break;case FactorType.Repetition:e=`{${i}}`;break;case FactorType.Optionally:e=`[${i}]`;break;default:e=i.toString();break}super(e,n),this.type=r,this.value=i}toString(){switch(this.type){case FactorType.Group:return`(${this.value})`;case FactorType.Repetition:return`{${this.value}}`;case FactorType.Optionally:return`[${this.value}]`;default:return this.value.toString()}}}