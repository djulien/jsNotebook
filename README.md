# Interactive Javascript Notebook (0-install)
[toc]

## Introduction
A [jsNotebook](https://github.com/djulien/jsNotebook) is an interactive web page using JavaScript - like a [Jupyter Notebook](https://jupyter.org), except that it runs Javascript instead of Python ('cause I'm a Javascript fan &#x1F601;).  This particular implementation is more simplistic.  jsNotebooks are serverless, 0-install, and require no special tools - a simple text editor can be used to create or edit a jsNotebook.  (A few lines of boilerplate text must also be added to each jsNotebook page to accomplish this).

jsNotebook pages are stored as **Markdown** (text) files to allow quick and easy formatting.  [Showdown](https://github.com/showdownjs/showdown) is used to render the Markdown text as **HTML** for display in the browser, where it can then be viewed or edited *interactively* (not there yet).

jsNotebook pages can be as simple as static Markdown/text, or as complex as an entire web app.  They can contain HTML tags (including &lt;script&gt;), or pull in additional HTML, CSS, Javascript, or other files from a web server or public CDN.  For example, here is a 100 x 50 px cyan rectangle using an HTML \<div> tag: <div style="width: 100px; height: 50px; background-color: #0ff; border: 1px solid black;"></div>

jsNotebook pages are intended to be compact and self-contained (except for CDNs), similar in concept to [TiddlyWiki](https://tiddlywiki.com).  They are "serverless" and can be stored in a local file system or on a web server, or shared easily as a text file attachment in an email.

jsNotebooks can be created from scratch, but the easiest way is to simply open an existing/example jsNotebook and then edit and save it with a different file name.  The first jsNotebook filename opened must end with **".html"** (so the browser knows how to render it), but subsequent jsNotebooks do not have this restriction if they are dragged and dropped onto a previously open jsNotebook.

## Example Directives
The Markdown syntax is described on the [Showdown syntax wiki page](https://github.com/showdownjs/showdown/wiki/Showdown's-Markdown-syntax).  Here are a few examples:

Code fragment:
```
void main() {
    gl_FragColor = vec4(1,0,0,1);	// ERROR
}
```

Bullet list:
* first item
* second item
* third item

Table:
| Column 1 | column 2 | col 3 |
| -------- | -------- | ----- |
| *first*  | row | \... |
| **second** | row | \... |

Tasklists (GFM Style):
- [x] write this intro
- [ ] create more examples

For a complete description of Markdown syntax, see the [Showdown syntax wiki page](https://github.com/showdownjs/showdown/wiki/Showdown's-Markdown-syntax).

## Status
jsNotebook is still <span style="background-color: #fa4; padding: 2px 4px; border: 1px solid;">under construction</span>, but the current status is: <span style="background-color: #4c4; padding: 2px 4px; border: 1px solid;">usable</span>.

Current status/TODO:
- [x] POC/example
- [x] render MD to HTML (now 0-install, serverless)
- [x] basic styling
- [x] bundling/CDN/github
- [x] auto-generate TOC from headings
- [ ] add more/fancier examples
- [ ] documentation
- [ ] merge README.md + index.html
- [ ] #includes
- [ ] preprocessor? (regexpp?)
- [ ] drag+drop
- [ ] allow in-place Notebook editing
- [ ] save edited Notebook to local/server
- [ ] file mgr tab/widget
- [ ] allow HTML/CSS/JS template editing (tabs)
- [ ] add extensions: showdown-icon, katex-latex?
- [ ] CI auto-build (bundle) status

## etc
trying other types of footnotes ...
foo bar[^1] is a very[^n] foo bar[^n] [^1]: This is my first footnote [^n]: Visit http://ghost.org [^n]: A final footnote

## References
[^showdown]: source: https://github.com/showdownjs/showdown
   wiki: https://github.com/showdownjs/showdown/wiki/Showdown's-Markdown-syntax

#### (0-install boilerplate)
<!-- jsNotebook 0.20.7.D: append lines below for 0-install -->
<noscript>ERROR: This jsNotebook can't be displayed unless JavaScript is enabled.</noscript>
<script src="https://raw.githubusercontent.com/djulien/jsNotebook/master/dist/jsNotebook.js" dev-src="./dist/jsNotebook.js" cdn-src="https://unpkg.com/jsNotebook@0.20.7/dist/jsNotebook.min.js" localhost-src="http://localhost:3000/js/jsNotebook.js" type="text/javascript" defer></script>
<style type="text/css">
/* inline styles in case Javascript is disabled */
html, div { background-color: #333; }
noscript {
  position: absolute; top: 10%; left: 10%; right: 10%;
  font-size: 1.5em; font-weight: bold;
  padding: 6px 12px;
  background-color: #300;
  border: 2px solid #f00;
  color: #f00;
}
</style>
#### (eof)
