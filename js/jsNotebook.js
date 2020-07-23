    ///////////////////////////////////////////
   //                                       //
  //  jsNotebook shared logic (0-install)  //
 //                                       //
///////////////////////////////////////////

//0-install jsNotebook logic
//Copyright (c) 2020 djulien

//rev history:
// 0.20.7  7/15/20  DJ  reworked to use Showndown, webpack


"use strict"; //catch more bugs
debug("loading jsNotebook main logic, doc state:", document.readyState);
//NOTE: need import() rather than import ... from syntax; see https://github.com/parcel-bundler/parcel/issues/2358
import * as Showdown from "showdown"; //"https://unpkg.com/showdown@1.9.1/dist/showdown.min.js";
//const footnotes = require("showdown-ghost-footnotes");
import * as footnotes from "showdown-ghost-footnotes"; //"https://unpkg.com/showdown-ghost-footnotes@0.0.6/dist/showdown-ghost-footnotes.min.js"; //https://github.com/tivie/showdown-ghost-footnotes
//const toc = require("showdown-toc");
import /* * as*/ showdownToc from "showdown-toc"; //"https://unpkg.com/showdown-toc@1.0.1/dist/index.js"; //https://github.com/tivie/showdown-toc

const VER = "0.20.7.D";
//load CSS here so caller doesn't see it:
//import "./jsNotebook.css";
//import BkgImage from './rings.png';
import /*styles from*/ "../css/jsNotebook.scss";
//import "./index.html"; //kludge: copy parent HTML file to output

const isHTML_re = /^\s*<html\b[^>]*>/i;
//const str = "abc <script x> def </script> ghi <ascript> jkl </scripty..> mno";
//console.log(fixup(str, true));


//////////////////////////////////////////////////////////////////////////////
////
/// Viewer/editor (browser side)
//

const opts =
{
    omitExtraWLInCodeBlocks: true, //omit trailing newlines in code blocks
    parseImgDimensions: true, //image dimensions; ex:  ![foo](foo.jpg =100x80) 
//    simplifiedAutoLink: true, //enable automatic linking to urls
    strikethrough: true, //strikethrough syntax. ~~strikethrough~~
    tables: true, //tables. Example: | h1    | \n |:------| \n | 100   |
    tasklists: true, //GFM tasklists; ex:  - [x] This 
    simpleLineBreaks: true, //line breaks as <br>, without 2 spaces at line end
    backslashEscapesHTMLTags: true, //HTML tag escaping; ex: \<div>foo\</div>
    underline: true, //underline double/triple underscores; ex: __underlined word__.
//    completeHTMLDocument: true, //output complete <html>, <head>, <body> tags
    metadata: true, //doc metadata at top of doc between ««« and »»» or --- and --- 
    extensions: [footnotes, showdownToc({ toc: [] })],
};
const converter = new Showdown.Converter(opts);
converter.setFlavor('github'); //strike-thru, checklist, etc


//can only use "await" inside async function:
async function main()
{
//don't start until deferred script(s) load:
console.log("ready state:", document.readyState);
    if (document.readyState != "complete")
        if ((document.readyState == "loading") || !document.documentElement.app)
            await wait4event("DOMContentLoaded");

debug("dom READY(fulfilled)");
    const notes = document.getElementById("notes") || document.body; //can be named element or just body
    notes.isHTML = function() { return this.innerHTML.match(isHTML_re); }; ///^\s*<html\b[^>]*>/i); };
    notes.md2html = function(force)
    {
        if (!force && this.isHTML()) return;
        this.svtext = this.innerHTML;
        const html = fixup(converter.makeHtml(fixup(this.innerHTML, false)), true); //.replace(/\[toc\]/gi, "\n$&")) //, pathlib.basename(reqpath, pathlib.extname(reqpath)));
//            .replace(/\bp>\s*<ul>\s*<li\b/g, "p><ul><li"); //kludge: avoid space https://stackoverflow.com/questions/5322288/reduce-gap-between-html-ul-and-li-elements
//            .replace(/>(?=<(ul|ol|li)\b)/gi, ">@")
//            .replace(/\s+(?=<li\b)/gi, ""); //(match, index, input) => (console.log("trim", input.slice(index - 5, index + 20)), "")); //""); //"<ul"); //kludge: avoid space https://stackoverflow.com/questions/5322288/reduce-gap-between-html-ul-and-li-elements; cut >=one space/newline only, to allow extra space to be forced; positive look-ahead
//            .replace(/<(?<=(ul|ol)\b[^>]*>)\s+<li\b/gi, "@"); //positive look-behind
//            .replace(/\s+(?=<li\b)/gi, "@"); //positive look-ahead
//const txt = html.match(/bullet list[^]{20}/i);
//console.log("bullet", txt);
        this.metadata = converter.getMetadata();
        this.innerHTML = html;
//debug("md -> html", html.length);
//    if (numkeys(main.metadata)) debug("got metadata"/*.brightBlue*/, JSON.stringify(main.metadata));
//    else debug("NO metadata");
    };
    notes.html2md = function(force)
    {
        if (!force && !notes.isHTML()) return;
        this.innerHTML = this.metadata?
            `----\n${this.metadata}\n----\n` + this.svtext:
            this.svtext;
    };

//const s2d = style2dict(styleof(notes));
//debug(Object.keys(s2d).join(", "));
debug(`old notes class '${notes.classList}', bgcolor: '${style2dict(styleof(notes)).backgroundColor}'`, "inner", notes.innerHTML.length + ":" + notes.innerHTML.slice(0, 30) + " ...");
    notes.md2html();
    notes.classList.add("jsNotebook");
/////////////////    notes.setAttribute("contentEditable", true); //mainly for dev/debug
//user_pref("capability.policy.policynames", "allowclipboard");
//user_pref("capability.policy.allowclipboard.sites", "https://www.mozilla.org");
//user_pref("capability.policy.allowclipboard.Clipboard.cutcopy", "allAccess");
//user_pref("capability.policy.allowclipboard.Clipboard.paste", "allAccess");
/*
    notes.addEventListener('focus', () =>
    {
debug("focus", notes.isHTML());
        notes.md2html();
    });
    notes.addEventListener('blur', () =>
    {
debug("blur", notes.isHTML());
        notes.html2md();
    });
*/
    notes.addEventListener('input', () =>
    {
        debug('edited', notes.isHTML());
//        setTimeout(notes.html2ms, 0.5e3);
        notes.dirty = true;
    });
debug(`new notes class '${notes.classList}', bgcolor: '${style2dict(styleof(notes)).backgroundColor}'`, "inner", notes.innerHTML.length + ":" + notes.innerHTML.slice(0, 30) + " ...");

    drag_and_drop();
}
main(); //could use IIFE, but this is easier to read


//////////////////////////////////////////////////////////////////////////////
////
/// drag + drop
//

//from MDN API doc, example at: jsfiddle.net/radonirinamaminiaina/zfnj5rv4/
var dragged;

function drag_and_drop()
{
  console.log("set up drag+drop");
  /* events fired on the draggable target */
  document.addEventListener("drag", function( event ) {

  }, false);

  document.addEventListener("dragstart", function( event ) {
      // store a ref. on the dragged elem
      dragged = event.target;
      // make it half transparent
      event.target.style.opacity = .5;
  }, false);

  document.addEventListener("dragend", function( event ) {
      // reset the transparency
      event.target.style.opacity = "";
  }, false);

  /* events fired on the drop targets */
  document.addEventListener("dragover", function( event ) {
      // prevent default to allow drop
      event.preventDefault();
  }, false);

  document.addEventListener("dragenter", function( event ) {
      // highlight potential drop target when the draggable element enters it
      if ( event.target.className == "dropzone" ) {
          event.target.style.background = "purple";
      }
//TODO: DataTransfer.setDragImage()

  }, false);

  document.addEventListener("dragleave", function( event ) {
      // reset background of potential drop target when the draggable element leaves it
      if ( event.target.className == "dropzone" ) {
          event.target.style.background = "";
      }
//TODO: DataTransfer.setDragImage()

  }, false);

  document.addEventListener("drop", function( event )
{
      // prevent default action (open as link for some elements)
      event.preventDefault();
  console.log("DROP: ", event.dataTransfer.types.length, ...event.dataTransfer.types);
  for (item of event.dataTransfer.items)
  {
//     if (item.type
     item.getAsString(theString => { if (theString) console.log("got str", theString); })
    const theFile = item.getAsFile();
   if (!theFile)
   {
      // move dragged elem to the selected drop target
      if ( event.target.className == "dropzone" ) {
          event.target.style.background = "";
          dragged.parentNode.removeChild( dragged );
          event.target.appendChild( dragged );
      }
      continue;
   }

    console.log("dropped a file: ", theFile); //Object.keys(theFile));
  console.log("name:", theFile.name, "size:", theFile.size, "type:", theFile.type, "modified:", theFile.lastModifiedDate);
  const reader = new FileReader()

    reader.onloadend = event => {
      if (event.target.readyState !== FileReader.DONE)
        return console.log('Failed to load file');
//        ? resolve({name: file.name, fullpath: fullpath, source: convert(event.target.result)})
        const contents = convert(event.target.result);
           console.log("file name", theFile.name, "contents", contents.length, contents);
    const newHTML = document.open("text/html", "replace"); 
            newHTML.write(contents); 
            newHTML.close(); 
  console.log("REPLACED DOC");
    }

//  return new Promise(function (resolve, reject) {
    reader.readAsArrayBuffer(theFile)

//NO WORKY: console.log("got dropped:", item.getData());
  
  }
    
  }, false); //no bubble
}


 // convert binary to text
    function convert (buffer) {
      let binary = ''
      const bytes = new Uint8Array(buffer)
      let length = bytes.byteLength
      for (let i = 0; i < length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      return binary
    }


//////////////////////////////////////////////////////////////////////////////
////
/// misc helpers
//

//fix up markdown before/after handing it to Showdown:
function fixup(mdtext, ishtml = mdtext.match(isHTML_re))
{
    return !ishtml?
        no_shebang(mdtext): //strip shebang (interferes with metadata detect)
        mdtext //kludge: prevent unwanted line breaks in output
            .replace(/\s+(?=<(?:no)?script\b)/gi, "") //"@") //+ look-ahead
            .replace(/(?<=<\/(?:no)?script\b[^>]*>)\s+/gi, "") //"#") //+ look-behind
            .replace(/\s+(?=<style\b)/gi, "") //"@") //+ look-ahead
            .replace(/(?<=<\/style\b[^>]*>)\s+/gi, "") //"@") //+ look-behind
            .replace(/\s+(?=<!--)/gi, "") //"@") //+ look-ahead
            .replace(/(?<=-->)\s+/gi, "") //"@") //+ look-behind
            .replace(/\s+(?=<li\b)/gi, ""); //(match, index, input) => (console.log("trim", input.slice(index - 5, index + 20)), "")); //""); //"<ul"); //kludge: avoid space https://stackoverflow.com/questions/5322288/reduce-gap-between-html-ul-and-li-elements; cut >=one space/newline only, to allow extra space to be forced; positive look-ahead
}


function wait4event(evtname)
{
    return new Promise((resolved, reject) =>
    {
        document.addEventListener(evtname, () => resolved(`got ${evtname} evt`));
        setTimeout(() => reject(`evt ${evtname} timed out`), 1e3);
    });
}


function applyStyle(dom_elt, className)
{
    if (dom_elt.classList.contains(className)) return;
debug("old body class list: ", dom_elt.classList);
//    dom_elt.classList += className;
    dom_elt.classList.add(className);
debug("new body class list: ", dom_elt.classList);
}


function styleof(dom_elt)
{
    return document.defaultView.getComputedStyle(dom_elt, "").cssText;
}

function style2dict(styleText)
{
    const attrs = styleText
        .matchAll(/([\w\-]+)\s*:\s*([^;\s]*)\s*;/g) || [] //name, value pairs
debug("attrs", JSON.stringify(attrs));
    return Array.from(attrs)
//        .sort((lhs, rhs) => lhs[1].localeCompare(rhs[1]) || lhs[2].localeCompare(rhs[2])) //sort in case order varies; mainly for easier debug
        .reduce((attrs, [_, name, value]) => ((value != "") && (attrs[name.replace(/-\w/g, (str) => str.slice(1).toUpperCase())] = value), attrs), {}); //convert attr name to camel case
}


function unindent(str)
{
//debug(str.charCodeAt(0), str.charCodeAt(1), str.charCodeAt(9), str.charCodeAt(10));
    const indented = str.match(/^\r?\n?([^\S\r\n]+)/) || [, ""]; //check indentation of first line
    debug("indent len", indented[1].length, escnp(indented[1]));
    return (indented[1].length? str.replace(new RegExp(`^\\r?\\n?\\s{${indented[1].length}}`, "gm"), ""): str)
        .replace(/[^\S\r\n]+$/, ""); //trim trailng horiz space as well as well
}

function plural(n, multi, single)
{
    plural.suffix = (n == 1)? single || "": multi || "s";
    return n; //fluent
}


//escape non-printing chars (for debug):
function escnp(str, {use_color = true, keep_color = true, show_spaces = true, want_newline = false} = {}) //, radix = null, arysep = null} = {})
{
    const VisibleSpace = "\u00b7"; //String.fromCharCode(0xa4); //easier for debug of len/spacing
    const ColorPlaceholder = "\ubeef"; //placeholder to preserve color codes
    const NewlinePlaceholder = "\ufeed"; //placeholder to preserve color codes
    const highlight = /*use_color? (str) => str.cyan_lt:*/ (str) => str;
    return str.toString()
        .replace(/\r/g, highlight("\\r"))
        .replace(/\n/g, want_newline? NewlinePlaceholder: highlight("\\n"))
        .replace(/\t/g, highlight("\\t"))
        .replace(/[\u1000-\uffff]/g, (ch) => highlight(`\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`))
        .replace(/\x1b(?=\[[\d;]+m)/g, keep_color? ColorPlaceholder: highlight("\\[")) //use placeholder to preserve color codes
        .replace(/[^\x20-\x7e]/g, (ch) => highlight(`\\x${ch.charCodeAt(0).toString(16).padStart(2, "0")}`))
        .replace(/\ubeef/g, "\x1b") //restore color codes
        .replace(/\ufeed/g, "\n") //restore newlines
        .replace(/ /g, show_spaces? VisibleSpace: " "); //make it easier to see white space
}

//strip out shebang:
function no_shebang(str, multi)
{
    const shebang_re = /^#![^\n]*\n/;
    if (multi) shebang_re.flags += "mg";
    return str.replace(shebang_re, "");
}


function numkeys(obj) { return Object.keys(obj || {}).length; }

function debug(...args)
{
//        const err = new Error(); //Error.captureStackTrace(err);
    const stkfr = (new Error()).stack.split("\n")[1];
//console.log(typeof stkfr);
//console.log(typeof (new Error()).stack);
//console.log("stkfr", stkfr);
//console.log("stline", stline);
    const [, line, col] = (stkfr || "no-fr?").match(/:(\d+):(\d+)(:\d+)?/); //, "$1"); // (_, line, col) => `:${line - stline}:${col}`); //"@$1");
//console.log(stkfr);
    if (!debug.stline) debug.stline = +line - 10; //compensate for parcel
//console.log("debug#", debug.stline, line, stkfr.slice(-20));
//TODO: fix parcelled line# (newlines?)
    console.log("DEBUG:", ...args, `@ME:${line - debug.stline}:${col}`);
}


//////////////////////////////////////////////////////////////////////////////
////
/// junk/obsolete
//

//function extensions()
//{
//    Object.defineProperty(Array.prototype, "push_fluent", {value: function(...args) { this.push(...args); return this; }});
//}


//debug("js loaded");
//}());
console.log("jsNotebook main logic loaded");

/*
function tabstrip()
{
    document.getElementById("tabstrip")
        .getElementsByTagName("button") //querySelectorAll(".tabstrip button"));
	.forEach((button) => button.onclick = gotab); //.addEventListener("click", gotab)); //function(evt)
}
*/

function get_title()
{
    document.title = "** " + document.baseURI;
}

function get_notes()
{
//allow user to wrap notes in various ways:
    const notes = get_notes.nodes = [];
    const singleton = document.getElementById("notes");
    if (singleton) notes.push(singleton);
    notes.push(...Array.from(document.getElementsByName("notes")));
    notes.push(...Array.from(document.getElementsByClassName("notes")));
    notes.push(...Array.from(document.getElementsByTagName("notes")));
    notes.push(...Array.from(document.getElementsByTagName("pre"))); //allows text to display if Javascript disabled
    notes.forEach((note) => note.style.display = "none"); //hide HTML markup; styled markup will be displayed later
//    get_notes.indented = notes.reduce((note) => note.innerText.split(/\r?\n))
debug("raw text", escnp(notes.map((note) => note.innerText.replace(/ +$/, "")).join("<hr/>")));
    get_notes.text = notes.map((note) => unindent(note.innerText.replace(/ +$/, ""))).join("<hr/>");
    debug(`found ${plural(notes.length)} notes section${plural.suffix}, textlen ${get_notes.text.length}:'${escnp(get_notes.text)}'`);
//    return get_notes.cached = notes; //.forEach()
}

function wrap()
{
//debug("TODO: move notes to wrapper");
//    const wrapper = `<div id="nb-wrapper"></div>`;
//    document.body.insertAdjacentHTML("beforeend", wrapper);
//    document.getElementById("nb-wrapper").innerText = get_notes.text
//    const wrapper = document.getElementsByTagName("::before") || [];
//debug(wrapper.length);
//debug((document.getElementById("::before") || {}).id);
    document.body.insertAdjacentHTML("beforeend", `<div id="nb-scroller"><h1>title</h1>${get_notes.text}</div>`);
//    const wrapper = document.getElementById("nb-wrapper");
//    wrapper.style = window.getComputedStyle(document.querySelector("body"), ":before");
//debug(JSON.stringify(wrapper.style));
}

function make_tabs()
{
//    const tabs = document.createDocumentFragment();
//    document.body.appendChild(tabs);
//    tabs.innerHTML = `
    const tabs = `
<div class="tabs">
    <button class="tab-link" onclick="gotab(event, this.innerText)" x-id="defaultOpen">Notes</button>
    <button class="tab-link" onclick="gotab(event, this.innerText)">Logic</button>
    <button class="tab-link" onclick="gotab(event, this.innerText)">Styles</button>
    <button class="tab-link" onclick="gotab(event, this.innerText)">Container</button>
    <button class="tab-link" onclick="gotab(event, this.innerText)">Files</button>
</div>
<div id="Notes" class="tab-content">
    <textarea>
        <h3>Notes</h3>
        <p>notes md here</p>
    </textarea>
</div>
<div id="Logic" class="tab-content">
    <textarea>
        <h3>Logic</h3>
        <p>parent js here</p>
    </textarea>
</div>
<div id="Styles" class="tab-content">
    <textarea>
        <h3>Styles</h3>
        <p>parent css here</p>
    </textarea>
</div>
<div id="Container" class="tab-content">
    <textarea>
        <h3>Container</h3>
        <p>parent html here</p>
    </textarea>
</div>
<div id="Files" class="tab-content">
    <textarea>
        <h3>Files</h3>
        <p>file mgr here</p>
    </textarea>
</div>
`;
    document.body.insertAdjacentHTML("beforeend", tabs);
    make_tabs.links = Array.from(document.getElementsByClassName("tab-link"));
    make_tabs.contents = Array.from(document.getElementsByClassName("tab-content"));
    debug(`made ${plural(make_tabs.links.length)} tab${plural.suffix}, ${plural(make_tabs.contents.length)} tab content${plural.suffix}`);
}

//NOTE: HTML is not sanitized, according to https://marked.js.org/#/README.md#README.md
function fill_tabs()
{
//    document.getElementById("Notes").insertAdjacentHTML("beforeend", `<pre x-id="notes">${get_notes.text || "(notes here)"}</pre>`);
//    document.getElementById("Notes").getElementsByTagName("textarea")[0].innerText = get_notes.text || "(no notes)";
//    document.getElementById("Notes").innerHTML = marked(get_notes.text || "(no notes)");
    CodeMirror.fromTextArea(document.getElementById("Notes").getElementsByTagName("textarea")[0])
}

function gotab(evt, label) //= {target: document.getElementiById("tabstrip").getElementsByTagName("button")[0]}, label)
{
    if (!gotab.tabs) //first time: cache data
//    {
	gotab.tabs = Array.from(document.getElementsByClassName("tabstrip")) //[]; //in case more than 1 tabstrip (useless?)
            .reduce((alltabs, tabstrip) =>
		(alltabs.push(...Array.from(tabstrip.getElementsByTagName("button")).map((button) =>
		    ({
			button: (button.onclick = gotab, button),
			contents: document.getElementById(button.innerText),
		    }))),
	         alltabs), []);
//	        .map((tab) => alltabs.push(tab)));
debug("got", gotab.tabs.length, "tabs using selector");
//        .getElementsByTagName("button") //querySelectorAll(".tabstrip button"));
//	gotab.buttons.forEach((button) => button.onclick = gotab); //.addEventListener("click", gotab)); //function(evt)
//        gotab.links = Array.from(document.getElementsByClassName("tab-link"));
//        gotab.contents = Array.from(document.getElementsByClassName("tab-content"));
//    }
    const target = ((evt || {}).currentTarget || gotab.tabs[0].button); //default first tab
//debug("caller evt.target", ((evt || {}).currentTarget || gotab.buttons[0]).tagName); //JSON.stringify(event.target));
//debug("caller this", ((evt || {}).currentTarget || gotab.buttons[0]).innerText); //JSON.stringify(this));
//    const links2 = Array.from(document.getElementById("tabstrip").getElementsByTagName("button")); //querySelector(".tabstrip button"));
debug("go tab", label || target.innerText || "(first)", "of", gotab.tabs.length);
//debug(typeof document.getElementsByClassName("tab-content"), JSON.stringify(document.getElementsByClassName("tab-content")));
    gotab.tabs.forEach(({button, contents}) =>
    {
	const select = (button.innerText == target.innerText) && " active";
	button.className = button.className.replace(" active", "") + (select || "");
        contents.style.display = select? "block": "none";
    });
}

//function tab(label, contents)
//{
//    return `
//        <div id="${label}" class="tab-content">
//            ${contents || "<h3>(${label} contents here)</h3>" || "<p>${label} contents here ...</p>"}
//        </div>`;
//}

function junk()
{
//simple markdown example editor is at: https://vuejs.org/v2/examples/index.html#Markdown%20Editor
//fancier markdown editor (based on Toast UI editor): https://panjiachen.github.io/vue-element-admin/#/components/markdown
//split panes example from: https://github.com/yansern/vue-multipane

//in case parent doesn't override:
//        const { Splitpanes, Panel} = splitpanes;
//        import { Multipane, MultipaneResizer } from "../node_modules/vue-multipane/dist/vue-multipane.js";
  new Vue(
  {
    el: "#app",
    components: {splitpanes},
  });
/*
  const app = new Vue(
  {
    el: "#editor",
    data: { input: "# hello", },
    computed:
    {
      compiledMarkdown: function() { return marked(this.input, { sanitize: true}); },
    },
    methods:
    {
      update: _.debounce(function(e) { this.input = e.target.value; }, 300),
    },
  });
*/
}

function junk_html()
{
/*
    <splitpanes class="default-theme">
      <pane min-sie="10">
        <div>editor<br/>EDITOR</div>
      </pane>
      <pane>
          <div>preview<br/>PREVIEW</div>
      </pane>
    </splitpanes>
    <div id="editor">
      <textarea :value="input" @input="update"></textarea>
      <div v-html="compiledMarkdown"></div>
    </div>
    <div id="app-2">
      <span v-bind:title="message">
        hover mouse for a few sec
        to see dyn title
      </span>
    </div>
*/
}

/*
<script type="text/javascript" src="https://unpkg.com/showdown@1.9.1/dist/showdown.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/showdown-ghost-footnotes@0.0.6/dist/showdown-ghost-footnotes.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/showdown-toc@1.0.1/dist/index.js"></script>
<script>
const ver = "1.9.1";
const url = 'https://rawgit.com/showdownjs/showdown/' + ver + '/dist/showdown.min.js';
const scrp = document.createElement('script');
  scrp.setAttribute("type","text/javascript");
  scrp.src = url;
  document.head.appendChild(scrp);
console.log(`showdown script loaded from '${url}'`);
</script>
*/

//eof

