# EBNF Railroad Diagram Visualizer
A client-side browser-based tool for visualizing EBNF grammars as railroad diagrams.
Uses the [Wirth Syntax Notation](https://en.wikipedia.org/wiki/Wirth_syntax_notation) (*WSN*) for EBNF, as this is the common format used by the [Institute for System Software](https://ssw.jku.at/) (SSW) at Johannes Kepler University.

This project is a part of the course [Project in Software Engineering](https://ssw.jku.at/Teaching/Lectures/PSE/2024SS/index.html) at the SSW and is supervised by [Dr. Markus Weninger](https://ssw.jku.at/General/Staff/Weninger/).

## Usage
The grammar expects a correctly formatted EBNF grammar in WSN. Uppercase identifiers are treated as Non-Terminal Symbols (*NTS*). Lowercase identifiers are treated as Terminal Symbols (*TS*) which cannot be broken down further, e.g. `an` which may stand for a-z, A-Z and 0-9.

The grammar is automatically parsed and visualized as a railroad diagram when an input is detected. Currently errors are only logged to the console, but the plan is to display them in the UI.

## Example
The following input results in the railroad diagram below:
```ebnf
Path = Dir { Dir } Name .
Dir = ( Name | "." [ "." ] ) "/" .
Name = an { an } .
```
![Example railroad diagram for given grammar](./images/basic_railroad_diagram.jpg)

## Features
* **Error Information:** In the case that an error occurs during scanning or parsing of the input grammar, a small description is written below the grammar as shown:  
![Example of message for faulty grammar](./images/faulty_grammar_input.jpg)

* **NTS Expansion:** NTS are displayed as rectangles and can be expanded by clicking them. The definition of the NTS is then displayed in a dashed box as shown:  
![Example railroad diagram with expanded NTS](./images/expanded_railroad_diagram.jpg)

## TODOs
* Make UI nicer and a bit more user-friendly. Maybe also add some instructions and a dark mode 🌕
* Fix "too much recursion" when expanding NTS that contain themselves
* Make a small "x" on the top left of the expanded NTS box to close it.  
  Another possibility is to add a "x" when hovering a expanded NTS box name.
* Change color when hovering NTS that can be expanded

## Included Dependencies / Other Resources
- [railroad.js](https://github.com/tabatkins/railroad-diagrams) by Tab Atkins Jr. (and others) with some modifications (see comment in the file at line ~16)
- [github-mark.svg](https://github.com/logos) by GitHub