"use strict";var b=Object.defineProperty;var m=(d,t)=>b(d,"name",{value:t,configurable:!0});import{Grammar as k}from"./Grammar.js";import n from"./external/railroad.js";import{Literal as S}from"./wsn/Literal.js";import{Identifier as w}from"./wsn/Identifier.js";import{Production as v}from"./wsn/Production.js";import{Expression as A}from"./wsn/Expression.js";import{Term as F}from"./wsn/Term.js";import{Factor as E,FactorType as u}from"./wsn/Factor.js";import{isUppercase as N}from"./ChooChoo.js";export class Diagram{static{m(this,"Diagram")}constructor(t,e){this.grammar=t,this.pathStack=[],this.expandingNtsPaths=[],this.collectPaths=!1,this.startSymbolName=e}static fromString(t,e){return this.fromGrammar(k.fromString(t),e)}static fromGrammar(t,e){return new Diagram(t,e||"")}generateDiagram(){const t=this.startSymbolName.length>0?this.grammar.getProductionFromName(this.startSymbolName):this.grammar.syntax.productions[0];return n.Diagram(this.generateFrom(t))}forProduction(t){const e=this.generateFrom(t.expr);return n.Sequence(e)}forExpression(t){const e=[];for(const s of t.terms)e.push(this.generateFrom(s));const a=e.shift();return e.length===0?a:n.Choice(Math.floor((e.length+1)/2),a,...e)}forTerm(t){if(t.factors.length===1)return console.debug("Term only has one factor. Generating from single factor without any optimizations/changes."),this.generateFrom(t.factors[0]);const e=t.factors.findIndex(s=>s.type===u.Repetition);if(e===-1)return console.debug("No repetition found. Generating basic sequence."),this.generateBasicSequence(t.factors);const a=t.factors[e].value;if(a.terms.length!==1)return console.debug("Repetition has multiple terms (i.e. contains optionals). Can't compact."),this.generateBasicSequence(t.factors);{let s=e-1,i=a.terms[0].factors.length-1;for(;s>=0&&i>=0;s--,i--){const r=a.terms[0].factors[i].value,o=t.factors[s].value;if(!r.equals(o))break}if(i>=0){const r=a.terms[0].factors.slice(0,i+1);if(r.every(o=>o.isTS())){console.debug("Advanced compaction possible. Generating compacted sequence with separator on backedge.");const o=[],l=a.terms[0].factors.slice(i+1,a.terms[0].factors.length);for(const f of l)o.push(this.forFactor(f));const g=[];for(const f of r.reverse())g.push(this.forFactor(f));if(o.length!==0){const f=n.OneOrMore(n.Sequence(...o),n.Sequence(...g.reverse())),p=[];for(let h=0;h<t.factors.length;h++){if(h==e){p.push(f);continue}else if(e-a.terms[0].factors.length+r.length<=h&&h<e)continue;p.push(this.forFactor(t.factors[h],a.id===t.factors[h].value.id))}return n.Sequence(...p)}}}let c=!0;for(s=e-1,i=a.terms[0].factors.length-1;s>=0&&i>=0;s--,i--){const r=a.terms[0].factors[i].value,o=t.factors[s].value;if(!r.equals(o)){c=!1;break}}if(c){console.debug("Simple compaction possible. Generating compacted sequence with OneOrMore loop.");const r=[];for(let o=0;o<t.factors.length;o++)e-a.terms[0].factors.length<=o&&o<e||r.push(this.forFactor(t.factors[o],a.id===t.factors[o].value.id));return n.Sequence(...r)}}return console.debug("Can't be compacted or visually prepared. Generating basic sequence."),this.generateBasicSequence(t.factors)}generateBasicSequence(t){const e=[];for(const a of t)e.push(this.generateFrom(a));return n.Sequence(...e)}forFactor(t,e=!1){const a=this.generateFrom(t.value);switch(t.type){case u.Identifier:case u.Literal:return a;case u.Group:return n.Sequence(a);case u.Repetition:if(e)return n.OneOrMore(a);{const s=t.value;if(s.terms.every(i=>i.factors.every(c=>c.isTS()))){const i=[];for(const c of s.terms){const r=[];for(const o of c.factors.slice().reverse())r.push(this.generateFrom(o));i.push(n.Sequence(...r))}return n.OneOrMore(n.Skip(),n.Choice(Math.floor(i.length/2),...i))}return n.ZeroOrMore(a)}case u.Optionally:return n.Optional(a);default:throw new Error(`Unknown factor type: ${t.type}`)}}generateFrom(t){this.pathStack.push(t.id);let e;switch(!0){case t instanceof v:e=this.forProduction(t);break;case t instanceof A:e=this.forExpression(t);break;case t instanceof F:e=this.forTerm(t);break;case t instanceof E:e=this.forFactor(t);break;case t instanceof w:if(N(t.toString())){this.collectPaths&&this.expandingNtsPaths.push(this.pathStack.slice());const a=this.pathStack.join("-");if(this.pathStack.length<Diagram.MAX_EXPANSION_DEPTH&&this.expandingNtsPaths.some(s=>s.join("-")===a))try{const s=this.grammar.getProductionFromName(t.toString());e=n.Group(this.generateFrom(s.expr),t.name,a)}catch{throw new Error(`Production '${t.toString()}' not found, but required for expansion`)}else e=n.NonTerminal(t.toString(),{title:a})}else e=n.Terminal(t.toString());break;case t instanceof S:e=n.Terminal(t.toString());break}return this.pathStack.pop(),e}toSvg(t=new Set){return this.expandingNtsPaths=[...t],this.injectMarkers(this.generateDiagram().toString())}injectMarkers(t){const e=document.createElementNS("http://www.w3.org/2000/svg","defs");{const r=document.createElementNS("http://www.w3.org/2000/svg","marker");r.setAttribute("id","outgoing-loop-arrow"),r.setAttribute("viewBox","0 0 10 10"),r.setAttribute("markerWidth","10"),r.setAttribute("markerHeight","10"),r.setAttribute("markerUnits","strokeWidth"),r.setAttribute("refX","10.7"),r.setAttribute("refY","3.2");const o=document.createElementNS("http://www.w3.org/2000/svg","polygon");o.setAttribute("class","outgoing-arrow"),o.setAttribute("points","2.5,5 8,2.5 8,7.5"),o.setAttribute("style","fill:black;stroke:black;stroke-width:2"),o.setAttribute("transform","rotate(130, 5, 5), scale(0.5)"),r.appendChild(o),e.appendChild(r)}{const r=document.createElementNS("http://www.w3.org/2000/svg","marker");r.setAttribute("id","incoming-loop-arrow"),r.setAttribute("viewBox","0 0 10 10"),r.setAttribute("markerWidth","10"),r.setAttribute("markerHeight","10"),r.setAttribute("markerUnits","strokeWidth"),r.setAttribute("refX","0.4"),r.setAttribute("refY","4.75");const o=document.createElementNS("http://www.w3.org/2000/svg","polygon");o.setAttribute("class","incoming-arrow"),o.setAttribute("points","2.5,5 8,2.5 8,7.5"),o.setAttribute("style","fill:black;stroke:black;stroke-width:2"),o.setAttribute("transform","rotate(-30, 5, 5), scale(0.5)"),r.appendChild(o),e.appendChild(r)}const a=t.replace(">",`>${e.outerHTML}`),s=/<path d="M([\d.]+ [\d.]+)a10 10 0 0 0 -10 10v([\d.]+)a10 10 0 0 0 10 10"><\/path>/g,i=/<path d="M([\d.]+ [\d.]+)a10 10 0 0 0 10 -10v(-?[\d.]+)a10 10 0 0 0 -10 -10"><\/path>/g;return a.replace(s,(r,o,l)=>`<path d="M${o}a10 10 0 0 0 -10 10v${l}a10 10 0 0 0 10 10" marker-start="url(#outgoing-loop-arrow)"></path>`).replace(i,(r,o,l)=>`<path d="M${o}a10 10 0 0 0 10 -10v${l}a10 10 0 0 0 -10 -10" marker-start="url(#incoming-loop-arrow)"></path>`)}getAllNtsPaths(){return this.collectPaths=!0,this.generateDiagram(),this.collectPaths=!1,new Set(this.expandingNtsPaths)}toString(){return this.generateDiagram().toString()}}Diagram.MAX_EXPANSION_DEPTH=30;
