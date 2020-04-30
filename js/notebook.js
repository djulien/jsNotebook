//notebook common logic:
"use strict";
"TODO: magic-globals";

//don't start until deferred scripts load:
debug(document.readyState);
//if (true); else
if ((document.readyState == "complete") || ((document.readyState != "loading") && !document.documentElement.app)) main();
else document.addEventListener("DOMContentLoaded", main);

//create tabs, select default tab:
function main()
{
//    throw "parent should override main()";
    debug(document.readyState);
    get_title();
    get_notes();
//    Array.from(document.getElementsByClassName("tab-link")).forEach((tab) => tab.className = tab.className.replace(" active", ""));
//    tab.click();
wrap();
return;
    make_tabs();
    fill_tabs();
    gotab();
}

function get_title()
{
    document.title = "** " + document.baseURI; //TODO: get correct name
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
//debug("raw text", escnp(notes.map((note) => note.innerText.replace(/ +$/, "")).join("<hr/>")));
    get_notes.text = notes.map((note) => unindent(note.innerText.replace(/ +$/, ""))); //.join("<hr/>");
    debug(`found ${plural(notes.length)} notes section${plural.suffix}, textlen ${notes.join("<hr/>").length}:'${escnp(notes.join("<hr/>"))}'`);
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
//    const wrapper = document.getElementById("nb-wrapper");
//    wrapper.style = window.getComputedStyle(document.querySelector("body"), ":before");
//debug(JSON.stringify(wrapper.style));

//    document.body.insertAdjacentHTML("beforeend", `<div id="scroller"><h1>title</h1>${get_notes.text}</div>`);
//debug(JSON.stringify(document.currentScript));
//debug(JSON.stringify(document.location));
    document.body.insertAdjacentHTML("beforeend", `<div id="scroller"></div>`);
//return;
//github.com/editorjs/@editorjs
//github.com/codex-team/editor.js/blob/release/2.18/example/example.html
//editorjs.io/the-first-plugin
//editorjs.io/saving-data
//debug(endpt("test"));
    const ed = new EditorJS(
    {
        holder: "scroller",
        onReady: () =>
        {
//kludge: simulate mouse event to set focused style:
//https://stackoverflow.com/questions/6157929/how-to-simulate-a-mouse-click-using-javascript
//            document.getElementsByClassName("ce-block")[0].dispatchEvent(new MouseEvent("click",
//            {
//                view: window,
//                bubbles: true,
//                cancelable: true,
//                clientX: 20,
//            }));
            debug("editorJS: ready");
        },
        onChange: () => debug("editorJS: content changed"),
        autofocus: true, //CAUTION: prevents placeholder from showing
//        placeholder: "Enter text here",
        logLevel: "VERBOSE", //"ERROR",
        initialBlock: "paragraph", //default tool
        data: //initial contents
        {
            blocks:
            [
                {type: "header", data: {text: "Title ...", level: 1, }, },
//                {type: "paragraph", data: {text: "Enter more text here ...", }, },
            ]
//                get_notes.text
//                    .map((note) => )
        },
        tools: //CAUTION: key names are written to output file
        {
/*
            embed: //github.com/editor-js/embed
            {
                class: Embed,
//                config: //CAUTION: passing services here will not enable others
//                {
//                    services: {youtube: true},
//                },
                inlineToolbar: true,
                shortcut: "CTRL+E", //"CMD+SHIFT+E",
            },
            list: //github.com/editor-js/list
            {
                class: List,
                inlineToolbar: true,
                shortcut: "CTRL+L", //"CMD+SHIFT+L",
            },
*/
            header: //github.com/editor-js/header
            {
                class: Header,
                config:
                {
                    placeholder: "Enter new header",
                    levels: [2, 3, 4, 5, 6], //put level 1 at start, doesn't repeat
                    defaultLevel: 3,
                },
                inlineToolbar: true,
                shortcut: "CTRL+H", //"CMD+SHIFT+H",
            },
            paragraph: //github.com/editor-js/paragraph; built-in?
            {
                class: Paragraph,
                inlineToolbar: true,
                shortcut: "CTRL+P", //"CMD+SHIFT+P",
            },
/*
            image: //github.com/editor-js/image; NOTE: needs server-side logic
            {
                class: ImageTool,
                config:
                {
                    endpoints: { byFile: endpt("uploader"), byUrl: endpt("fetcher"), },
                    additionalRequestData: {more: "tbd"},
                },
            },
            link: //github.com/editor-js/link; NOTE: needs server-side logic
            {
                class: LinkTool,
                config: {endpoint: endpt("fetcher"), },
                inlineToolbar: true,
            },
*/
            code: //github.com/editor-js/code
            {
                class: CodeTool,
                placeholder: "insert code here",
                shortcut: "CTRL+C", //"CMD+SHIFT+C",
            },
/*
            table: //github.com/editor-js/table
            {
                class: Table,
                placeholder: "insert code here",
                config: {rows: 2, cols: 2, },
                inlineToolbar: true,
                shortcut: "CTRL+T", //"CMD+SHIFT+T",
            },
*/
            checklist: //github.com/editor-js/checklist
            {
                class: Checklist,
                inlineToolbar: true,
                shortcut: "CTRL+K", //"CMD+SHIFT+K",
            },
            marker: //github.com/editor-js/marker
            {
                class: Marker,
                inlineToolbar: true,
                shortcut: "CTRL+M", //"CMD+SHIFT+M",
            },
//warning
//attaches
//personality
//simple-image
            raw: //github.com/editor-js/raw
            {
                class: RawTool,
                placeholder: "<tag></tag>",
                inlineToolbar: true,
                shortcut: "CTRL+M", //"CMD+SHIFT+M",
            },
            quote: //github.com/editor-js/quote
            {
                class: Quote,
                quotePlaceholder: "quote ...",
                captionPlaceholder: "caption ...",
                inlineToolbar: true,
                shortcut: "CTRL+Q", //"CMD+SHIFT+Q",
            },
            inlineCode: //github.com/editor-js/inline
            {
                class: InlineCode,
                placeholder: "<tag></tag>",
                inlineToolbar: true,
                shortcut: "CTRL+I", //"CMD+SHIFT+I",
            },
//<!-- TODO
//underline
//editorjs-php
//audio
//            my: My,
        },
    });
//    debug(`editorJS is ${ed.isReady || "NOT "}ready`);
return;
    ed.save()
        .then((data) => debug("out:", data))
        .catch((exc) => debug("EXC:", exc));
//return;
//    document.body.insertAdjacentHTML("beforeend", `<textarea id="scroller"></textarea>`);
//    CodeMirror.fromTextArea(document.getElementById("scroller"))
//debug(JSON.stringify(CodeMirror.modes), JSON.stringify(CodeMirror.mimeModes));
//    const cm = CodeMirror(document.getElementById("scroller"),
//    {
//        value: get_notes.text,
//        lineNumbers: true,
//        mode: "htmlmixed",
////        theme: .cm-s-[name],
//        autoFocus: true,
//    })
//https://codemirror.net/doc/manual.html
//        .on("change", (inst, {from, to, text, removed, origin}) => debug("EVT: changed")) //(instance: CodeMirror, changeObj: object)type: string, func: (...args))
//        .on("viewportChange", (inst, from, to) => debug("EVT: scrolled"))
//        .on("gutterContextMenu", (inst, line, gutter_string, {Event}) => debug("EVT: ctx menu"))
////        "focus", "blur", "scroll", "optionChange"
//        .Doc.on("change", (doc, changes) => debug("doc EVT: change"));
//+AddOns
}

function endpt(name) { return document.location.href.replace(/[^\/]+$/, "") + name; } //.href..baseURI + name; }

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

function gotab(evt, label)
{
debug("go tab", label || "(first)");
//debug(typeof document.getElementsByClassName("tab-content"), JSON.stringify(document.getElementsByClassName("tab-content")));
    make_tabs.links.forEach((tab) => tab.className = tab.className.replace(" active", ""));
    ((evt || {}).currentTarget || make_tabs.links[0]).className += " active";
    make_tabs.contents.forEach((tab, inx) => tab.style.display = ((tab.id == label) || (!inx && !label))? "block": "none");
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

function debug(...args)
{
//        const err = new Error(); //Error.captureStackTrace(err);
    const stkfr = (new Error()).stack.split("\n")[1];
    const srcline = stkfr.replace(/^.*?(:\d+:\d+)(:\d+)?$/i, "@$1");
//console.log(stkfr);
    console.log("DEBUG:", ...args, srcline);
}

//eof