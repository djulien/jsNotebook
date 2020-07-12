#!/usr/bin/env node
//markdown server for FX notebooks
//for md engines available, see https://css-tricks.com/choosing-right-markdown-parser/
//browser-side based on example code from https://medium.com/@MartinMouritzen/how-to-run-php-in-node-js-and-why-you-probably-shouldnt-do-that-fb12abe955b0
//NOTE: need to apt install php + php-mbstring

"use strict"; //help find bugs
require('colors').enabled = true;
//  Object.defineProperty(String.prototype, "bright", {get() { return this.replace(ANSI_COLOR(true), (code) => { console.log("ccode", escnp(code)); return code; }); }});
require("magic-globals"); //__file, __line, __stack, __func, etc
const fs = require("fs");
//    fs.safeStatSync = (path) => try { return this.statSync(path); stat.isFile = reqstat.isFile.bind(reqstat); stat.isDirectory = reqstat.isDirectory.bind(reqstat); } //CAUTION: fs.stat() return error by statSync() throws
const pathlib = require("path");
const XRegExp = require("xregexp"); //https://github.com/slevithan/xregexp
//  String.prototype.XRE = function XRE(flags) { return XRE(this, flags); };
  Object.defineProperty(String.prototype, "XRE", {value: function(flags) { return XRE(this, flags); }});
const express = require('express');
//for express middleware, see https:github.com/senchalabs/connect#middleware
const serve_index = require("serve-index");
const serve_error = require("errorhandler");
const showdown = require("showdown"); //https://github.com/showdownjs/showdown/
//import Showdown from 'showdown';
const footnotes = require('showdown-ghost-footnotes'); //https://github.com/tivie/showdown-ghost-footnotes
const showdownToc = require('showdown-toc'); //https://github.com/ahungrynoob/showdown-toc
const exec = require('child_process').exec;
const flatted /*{parse, stringify}*/ = require('flatted'); //allows circular refs

//const NBEXT = ".md"; //".php"; //notebook extension aka file type
const app = express();
const rootdir = process.argv[2]? pathlib.join(__dirname, pathlib.relative(__dirname, process.argv[2])): process.cwd();
//const rootfiles = fs.readdirSync(rootdir).reduce((dict, file) => (dict[file] = true, dict), {});
//const template = pathlib.join(rootdir, "notebook.html"); //"notebook.html");
const template = pathlib.join(rootdir, fs.readdirSync(rootdir).reduce((found, file) => (pathlib.extname(file) == ".html")? file: found, "") || exc(`no html template found in '${rootdir}'`)); //find any (latest) html file
//const template = pathlib.join(rootdir, Object.keys(rootfiles).reduce((found, file) => (pathlib.extname(file).toLowerCase() == ".html")? file: found, "") || exc(`no html template found in '${rootdir}'`)); //find any (latest) html file
//console.log(`arg[2] '${process.argv[2]}'`.brightCyan);
//console.log(`cwd '${process.cwd()}'`.brightCyan);
//console.log("cwd", process.cwd());
//console.log("dirname", __dirname);
//console.log("rootdir", rootdir);
//console.log("rootfiles", Object.keys(rootfiles).join(", "));
//console.log("html template", template);

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
const converter = new showdown.Converter(opts);
converter.setFlavor('github'); //strike-thru, checklist, etc


///////////////////////////////////////////////////////////////////////////////
////
/// app routing:
//

//default (index) file types:
const exts = [".md", ".js", ".html"] //in order of preference, first = notebook
    .map((ext) => ext.toLowerCase()); //allow case-insenstive matching
//    .reverse(); //rearrange for easier prioritization
//const def_ext = exts.slice(-1)[0]; //default/preferred file type

//debug:
//app.use((req, res, next) => { console.log(`${++app.count || (app.count = 1)} ${req.method} '${req.url}'`.brightBlue, /*flatted.stringify(req)*/); next(); }); //log it first

//php files (could be index.php):
//app.use('*.php', function(request, response, next)
//app.use('/', function(request, response, next)

//enable CORS:
//from https://enable-cors.org/server_expressjs.html
app.use((req, resp, next) =>
{
    resp.header("Access-Control-Allow-Origin", "null"); //allow access from local files
    resp.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//rewrite url for index files and inherited files:
app.use((req, resp, next) =>
{
//	console.log(`processing '${request.originalUrl}'`.brightBlue);
//	execPHP.parseFile(request.originalUrl, function(phpResult)
//	const phpFolder = process.cwd(); //__dirname; //'';
//console.log("ANY: req.url", req.url, "req.originalUrl", req.originalUrl);
//    /*app.altdir =*/ app.alturl = false;
//    [app.altdir, rootdir].some((lookdir, inx) => //, inx, all) =>
//    {
//	    if (all.indexOf(lookdir) != inx) return; //dup
//        if (!lookdir) return false; //continue
    const reqpath = pathlib.join(/*app.altdir ||*/ rootdir, req.url); //originalUrl); //this.phpFolder + fileName; //pathlib.resolve(this.phpFolder, fileName);
    const altpath = app.altdir && pathlib.join(rootdir, pathlib.relative(app.altdir, req.url)); //inherited files
//    const [reqtop, reqtail] = reqpath.split("/", 1);
//	const fixpath = reqpath.replace(/\/\d\d\//, "/"); //BOS kludge: ##/file => file
//	if (!pathlib.extname(reqpath)) //check for index file
//	{
//            const index_file = pathlib.join(reqpath, "index"); //.php"); //default PHP file
//            const index_file = /*pathlib.join(reqpath,*/ fs.readdirSync(reqpath).filter((file) => pathlib.basename(file).toLowerCase() == "index").sort((lhs, rhs) => -exts.indexOf(lhs) - -exts.indexOf(rhs))[0]; //reduce((found, file) => (pathlib.basename(file) == "index")? file: found, "") || exc(`no html template found in '${rootdir}'`)); //find any (latest) html file
//            exts.reduce((found, ext) => (!found && fs.existsSync(index_file + ext))? reqpath = index + ext: found, ""); //|| reqpath; //fs.existsSync(reqpath)? reqpath: fixpath;
//	}
//	const stat = {isFile: () => false, isDirectory: () => false}; //kludge: use dummy stat if file !exists
//console.log(stat.isFile(), stat.isDirectory());
//	try { Object.assign(stat, {isFile, isDirectory} = fs.statSync(reqpath)); } //CAUTION: fs.stat() return error by statSync() throws
//	try { const reqstat = fs.statSync(reqpath); stat.isFile = reqstat.isFile.bind(reqstat); stat.isDirectory = reqstat.isDirectory.bind(reqstat); } //CAUTION: fs.stat() return error by statSync() throws
//	catch (exc) { console.log(`EXC: ${exc}`.brightRed); }
//console.log(relpath(reqpath), safeStat(reqpath).isFile(), safeStat(reqpath).isDirectory(), safeStat(reqpath).isDirectory()? fs.readdirSync(reqpath).filter((file) => pathlib.basename(file, pathlib.extname(file)).toLowerCase() == "index").length: "!dir", safeStat(reqpath).isDirectory()? fs.readdirSync(reqpath).map((file) => pathlib.basename(file, pathlib.extname(file))).join(","): "!dir");
    const found_file =
        safeStat(reqpath).isFile()? reqpath:
        safeStat(reqpath).isDirectory()? pathlib.join(reqpath, default_file(reqpath, /*req.url != "/"*/ true) || "."): //root dir contains template; don't auto-expand
        !altpath? "":
        safeStat(altpath).isFile()? altpath:
        safeStat(altpath).isDirectory()? pathlib.join(altpath, default_file(altpath, true) || "."):
        "";
    const newreq = relpath(found_file || "NOT FOUND", "/");
//console.log("url".brightBlue, req.url, "req".brightBlue, reqpath, "altdir".brightBlue, app.altdir, "altpath".brightBlue, altpath, "found".brightBlue, found_file, "newurl".brightBlue, newreq);
//console.log("reqpath", reqpath, "isfile", safeStat(reqpath).isFile(), "isdir", safeStat(reqpath).isDirectory(), "def file", safeStat(reqpath).isDirectory() && default_file(reqpath), "altpath", altpath, "found", found_file);
console.log(`${++app.count || (app.count = 1)} ${req.method} '${req.url}'`.brightBlue, (`${req.url}` == newreq) || `=> '${newreq}'`.brightCyan); //, "req", relpath(reqpath), "alt", relpath(altpath || "(none)")); //, cwd '${relpath(process.cwd())}', look[${inx}] in '${relpath(lookdir)}'`.brightBlue); //debug file chooser
//    if (!found_file) return false; //continue
    if (found_file) app.alturl = req.url = newreq; //relpath(found_file, "/");
//    return true; //break
//        if (pathlib.extname(want_file).toLowerCase() != exts.latest) { req.url = relpath(want_file, ""); return false; } //next(); return true; } //resp.sendFile(want_file); //static file
/*
//PHP server:
	const phpPath = "/usr/bin/php"; //'C:\\Users\\Martin\\Desktop\\Dropbox\\Mediumprojects\\phpinnode\\php\\php.exe';
	const cmd = phpPath + ' ' + pathlib.basename(want_file);
console.log(`executing PHP '${cmd}' from ${pathlib.dirname(want_file)}`.brightCyan);
	exec(cmd, {cwd: pathlib.dirname(want_file)}, (error, stdout, stderr) =>
	{
		if (error) throw (error + "").brightRed;
		if (stderr) console.error(stderr.brightRed);
		resp.write(stdout);
		resp.end();
	});
*/
//    });
//console.log(`fwd to '${req.url}' from '${req.originalUrl}'`);
    next(); //send rewritten url to next handler
});

//notebook render:
app.use(`*${exts[0]}`, (req, resp, next) =>
{
    const reqpath = pathlib.join(rootdir, app.alturl || req.url); //this.phpFolder + fileName; //pathlib.resolve(this.phpFolder, fileName);
    app.alturl = false; //kludge: req.url loses update, so carry as custom prop
//            const cwd = process.cwd();
    const basename = pathlib.basename(reqpath, pathlib.extname(reqpath));
    const wantdir = pathlib.dirname(reqpath); //need to be here for relative paths to work
//    app.altdir = /*(wantdir != cwd) &&*/ (wantdir != rootdir) && wantdir; //look for dep files here as well (fs inheritance)
console.log("md render".brightBlue, relpath(reqpath), "relpath".brightBlue, relpath(reqpath, ""), "alturl".brightBlue, app.alturl, "req.url".brightBlue, req.url, "req.originalUrl".brightBlue, req.originalUrl);
    const text = fs.readFileSync(reqpath).toString();
//no worky    if (altdir) process.chdir(altdir);
//if (app.altdir) console.log(`chdir '${relpath(app.altdir)}'`.brightCyan);
//console.log(`render '${relpath(reqpath)}' into html`.brightBlue);
    const sent = [false, true].some((wrap_html) =>
    {
        converter.setOption("completeHTMLDocument", wrap_html);
        const html = render(converter.makeHtml(text)); //, pathlib.basename(reqpath, pathlib.extname(reqpath)));
        const is_html = html.match(/<html\b[^>]*>/i); //CAUTION: might have lang attr
//console.log(`rendered with html? ${converter.getOption("completeHTMLDocument")}, got html? ${!!is_html} ${html.length}:'${escnp(html, {maxlen: 100})}'`);
        if (!is_html) return false; //continue
        const metadata = converter.getMetadata();
	if (numkeys(metadata)) console.log("metadata".brightBlue, JSON.stringify(metadata));
	const tags = ["$&"];
//	const {keywords, description, title} = metadata;
	tags.push(`<base href="${relpath(reqpath, "")}" comment="helps find dep files" />`); //set default location for dep files
	["keywords", "desription"].forEach((tag) => metadata[tag] && tags.push(`<meta name="${tag}" content="${metadata[tag]}" />`));
//console.log(`sent ${html.length} bytes`.brightBlue);
	const html_fixup = html
	    .replace(/<head\b[^>]*>/i, tags.join("\n")) //first <base> overrides, insert right after <head>
	    .replace(/\$\{title\}/g, metadata.title || basename);
        app.altdir = /*(wantdir != cwd) &&*/ (wantdir != rootdir) && relpath(wantdir, ""); //pathlib.join(wantdir, pathlib.relative(wantdir, rootdir)); //wantdir; //look for dep files here as well (fs inheritance); how to get from local folder to template files
//console.log("altdir".brightBlue, app.altdir);
        resp.end(html_fixup);
        return true; //break
    });
//    if (!found) exc("can't render md into  html");
//if (app.altdir) console.log(`chdir back to '${relpath(rootdir)}'`.brightCyan);
//no worky    if (altdir) process.chdir(rootdir);
//    if (!sent) app.altdir = false;
//    resp.end();
//        return true;
//    });
    if (!sent) next(); //just send static file
});

//directories:
//obsolete:app.use(express.directory(rootdir)); //stackoverflow.com/questions/6294186/express-js-any-way-to-display-a-file-dir-listing
app.use(serve_index(rootdir, {icons: true})); //stackoverflow.com/questions/6294186/express-js-any-way-to-display-a-file-dir-listing

//static files (css, js, etc):
app.use(express.static(rootdir)); //process.cwd())); //execPHP.phpFolder)); //"."));
//if (process.env.NODE_ENV == "development")
app.use(serve_error());


const port = 3000;
app.listen(port, (thing) =>
{
    const cwd = process.cwd();
//	console.log(JSON.stringify(thing));
    const mydate = fs.statSync(__filename).mtime;
    const ver = (mydate.getMonth() + 1) + "/" + mydate.getDate() + "/" + mydate.getFullYear() + " " + mydate.getHours() + ":" + nn(mydate.getMinutes()) + ":" + nn(mydate.getSeconds());
    console.log(`FX Notebook server (ver ${ver}):\nlistening on localhost:${port}\nroot dir ${(rootdir != cwd)? "(chdir) ": ""}'${rootdir}'\ntemplate '${relpath(template)}'`.brightGreen);
    if (rootdir != cwd) process.chdir(rootdir);
});


function render(contents, title)
{
    const html = render.template || (render.template = fs.readFileSync(template).toString());
    return html
        .replace(/\$\{contents\}/g, contents); //"g" in case there is a commented-out occurrence
//	.replace(/\$\{title\}/g, title);
}


///////////////////////////////////////////////////////////////////////////////
////
/// helper functions:
//

function relpath(str, show_root)
{
    const retval = pathlib.join(show_root || ".", pathlib.relative(rootdir, str));
    const prefix = !(pathlib.isAbsolute(retval) || retval.startsWith("."))? "./": "";
//    const want_debug = !(relpath.count++ || (relpath.count = 1));
//if (want_debug) console.log(`++c ${++relpath.count}, relpath('${str}', '${show_root || "."}') => '${prefix + retval}'`);
    return (show_root === "")? (prefix + retval).replace(/^\./, ""): prefix + retval;
/*
//    if (typeof show_root == "undefined") show_root = null;
    if (arguments.length < 2) show_root = "."; //cwd
//    return pathlib.relative(str, rootdir); //wrong
    for (var use_root = rootdir; use_root; use_root = pathlib.dirname(use_root))
    {
        const rootdir_re = new RegExp("(?<!\\w)" + escre(use_root), "g");
        const retval = str.replace(rootdir_re, show_root);
//console.log(`relpath: old '${old()}', new '${better()}', cwd '${process.cwd()}'`);
if (want_debug) console.log(`ret? ${retval != use_root}, relpath('${str}', '${use_root}') => '${retval}'`);
	if (retval != use_root) return retval;
        const new_root = pathlib.dirname(show_root) || pathlib.join(show_root, "..");
    }
    return str;
*/
}


//make a string safe for use in regex pattern:
//allow caller to designate additional chars to be escaped, or all chars, or double escape
function escre(str, want_all) //, more)
{
//    return str.replace(/[()\[\]{}+\-*?]/g, "\\$&");
    if (want_all && (typeof want_all != "string")) return tostr(str).replace(/[^]/g, (ch) => ((want_all == 2)? '\\\\': '\\') + (ch || 's+')); //(ch? '$&': 's+'));
//allow caller to treat extra chars as special RE char to be escaped:
    return tostr(str).replace(new RegExp(`[${/*dedupe*/("-+.*?^$|{}()[]\\" + tostr(want_all)).replace(/[\^\-\]\\]/g, "\\$&")}]`, "g"), (ch) => "\\" + (ch || "s+")); //ch? "\\$&": "\\s+"); //+ tostr(more).replace(/[\s\S]/g, "\\$&").join("");
}


//esc non-printable chars:
//esc all non-printable chars (except newline):
//optionally exclude ANSI color codes
function escnp(str, {want_color = true, keep_color = true, show_spaces = true, want_newline = false, radix = null, arysep = null, maxlen = null} = {})
{
//common regex sub-patterns:
//    const ESC = `\\\\`; //escape char; CAUTION: double esc here
    const VisibleSpace = "\u00b7"; //String.fromCharCode(0xa4); //easier for debug o
//common regex ("g" flag for all matches):
//    const ANYCHAR_re = /[^]/g;
    const NEWLINE_re = /\r?\n/g; //used for spliting lines
//    const UNICODE_re = /[\u0100-\uffff]/g; //gu; // /(?:[(){}])#\d+/g;
    const NONPRINT_xre = `
        ${keep_color? `(?<keep> ${ANSI_COLOR()} ) |`: ""}  #CAUTION: need placeholder for non-color if using unnamed captures
        (?! \\n ) [^\\x20-\\x7e] |  #non-printable chars (except newline)
        [\\u0100-\\uffff]  #Unicode chars
#        [\\u0000-\\u001f\\u007f-\\uffff]  #non-printable or Unicode chars
        `/*.xre_tidy*/.XRE("gx");
//console.log("keep_color", keep_color, "np-re-src", NONPRINT_xre.xregexp.source);
    const retval = tostr(str, radix, arysep)
//common special chars:
//        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t")
//        .replace(/\b/g, "\\b")
//        .replace(/\e/g, "\\e")
//all others:
//        .replace(/[\u0100-\uffff]/g, (uchar) => `\\u${("000" + uchar.charCodeAt(0).toString(16)).slice(-4)}`) //esc Unicode chars first so they aren't matched with other non-printables
//        .replace(/[\u0100-\uffff]/g, (uchar) => `\\u${uchar.charCodeAt(0).toString(16).padStart(4, "0")}`) //esc Unicode chars first so they aren't matched with other non-printables
//        .replace(/[^\x20-\x7e]/g, (match) => `\\x${hex(match.charCodeAt(0), false)}`);
        .replace(NONPRINT_xre, (chr/*, keep*/) => chr.keep || `\\u${chr.charCodeAt(0).toString(16).padStart(4, "0")}`.replace(/\\u00/g, "\\x")[want_color? "brightRed": "nop"]) //CAUTION: use named capture to avoid ofs/instr args
        [show_spaces? "replace": "nop"](/ /g, VisibleSpace) //make it easier to see white space
              [want_newline? "nop": "replace"](NEWLINE_re, "\\n"[want_color? "brightCyan": "nop"]); //draw attention to newlines (for easier debug)
    return (maxlen && (retval.length > maxlen))? retval.slice(0, maxlen) + " ...": retval;
}

//convert something to string:
//use this if thing might be numeric; this is more correct than using || "" for falsey values
function tostr(thing, radix, arysep) //, prefix)
{
    return ((typeof thing == "number") || radix)? ((radix === "0x")? radix + thing.toString(16): (+thing).toString(radix || 10)):
        ((typeof thing == "string") || (typeof thing == "undefined"))? thing || "":
        Array.isArray(thing)? thing.join(arysep || ","):
        Buffer.isBuffer(thing)? thing.toString():
        XRegExp.isRegExp(thing)? thing.raw_src || thing.source || thing.xregexp.source:
        (typeof thing == "object")? json_tidy(CircularJSON.stringify(thing)):
        thing.toString(); //something other than Buffer or Object?
}


//clean up XRE pattern for readability (easier debug):
//might also be required if newlines are stripped or interfere with comments
function xre_tidy(xre, max_spaces = 1)
{
    const ESC = `\\\\`; //escape char; CAUTION: double esc here
    const NOT_ESC = `(?<! ${ESC} )`; //negative look-behind for escape char
    const QUO_STR = `(?: ${NOT_ESC} " (?: ${ESC} " | [^"] )* " | ${NOT_ESC} ' (?: ${ESC} ' | [^'] )* ' | ${NOT_ESC} \` (?: ${ESC} \` | [^\`] )* \` )`; //don't use named capture; might occur multiple times in pattern
    const NOT_QUOTED = `${QUO_STR} |`; //`(?<! ${QUO_STR})`;
//debugger;
    const COMMENTS_xre = `${NOT_QUOTED} ${NOT_ESC} (?<comment> \\# .* ) $`.XRE("gmx"); //delete regex comments
//    const CommentsNewlines_re = /(?<![\\])#.*\n|\n/g;  //strip comments + newlines in case caller comments out parent line
    return /*unindent*/tostr(xre)
        .replace(COMMENTS_xre, (match, comment) => comment? "": match) //remove comments and leading white space, preserve strings
        .replace(/\(\?\:\)/g, "") //kludge: hide what appears to be XregExp artifacts
        .replace(/\s+/g, " ".repeat(max_spaces)); //{2,} /*.replace(/\n\s*-/g, " ")*/.escnl; //condense white space (assumes "x" flag)
}


//make JSON a little easier to read (for debug):
//CAUTION: possible recursion (1 level only)
function json_tidy(str) //...args)
{
    const retval = tostr(str) //JSON.stringify(...args))
        .replace(/,(?="?\w)/gi, ", ") //also put a space after "," for easier readability
        .replace(/"(?!\d)(\w+)":/g, "$1: ".brightBlue); //remove quotes from key names, put space after if no fmter passed in
    return retval;
}


//return ANSI color code pattern for regex:(chr.charCodeAt(0) < 0x100)? 2: 4
//pass color === true for any color (captured), falsey for end of color, undef for either
//NOTE: unnamed capture allows multiple usage within same regex
//NOTE: regex uses "x" (extended) format
function ANSI_COLOR(color) //, want_xre) //= true)
{
    const pattern = `\\x1B  #ASCII Escape char
        \\[
        ${(color === true)? "( [\\d;]+ )": //(?: \\d ; )? \\d+ )": //any color (captured)
          (color === false)? "0": //end of color
          color || //specific color
          "( [\\d;]+ | 0 )" //\\d ; \\d+ | 0 )" //any color start or end (captured)
          }
        m  #terminator
        `; //.xre_tidy;
    return pattern; //(want_xre /*!== false*/)? new XRegExp(pattern, "xg"): pattern; //(want_xre || "g")
}


//create xregex:
function XRE(pattern, flags)
{
//    const want_debug = XRE.debug;
//    XRE.debug = false; //auto-reset; CAUTION: do this before other function calls to prevent recursion
    const retval = new XRegExp(pattern, flags || "x");
    if (retval.xregexp.source != pattern) Object.assign(retval, {raw_src: pattern, tidy_src: xre_tidy(pattern)}); //keep exact copy of source pattern (for cloning or debug); don't clutter if same
    retval.want_scope = ~(flags || "").indexOf("g")? 'all': 'one'; //kludge: force replace-all to work
    retval.srcline = [srcline(+2, true), srcline(+1, true)];
//    retval.debug = want_debug;
//    if (want_debug)
//            (/*XRE.busy? console.error:*/ debug)("XRE:", json_tidy(JSON.stringify(retval, null, 2)), srcline(+2)); //CAUTION: don't use debug() inside XRE(); causes recursion
    return retval;
}


//return "file:line#":
//mainly for debug or warning/error messages
//optional depth to show ancestor
function srcline(depth, want_func)
{
    const want_path = (depth < 0);
    const  __mystack = __stack.filter((frame) => (pathlib.basename(frame.getFileName() || "????") == `${__file}.${__ext}`)); //only look at my functions
//    srcline.nested = 0; //auto-reset
    const new_depth = (Math.abs(depth || 0)) + (srcline.nested || 0) + 2; //+1 for globals.get __mystack() +1 for globals.get __stack()
    const new_srcline = `@${__file}${frdesc(__mystack[new_depth])}`;
//if (!__mystack.length) { console.error("no my stack?"); process.exit(); }
    return new_srcline;

    function frdesc(fr)
    {
        if (!fr) fr = {getFunctionName: () => "none", getLineNumber: () => "??"};
        return (want_func? `(${fr.getFunctionName() || "anon"})`: "") + ":" + fr.getLineNumber();
    }
}


function default_file(path, any_name)
{
    const specials = {index: 1, 'no-index': -1};
    const best = fs.readdirSync(path)
//        .filter((file) => (pathlib.basename(file, pathlib.extname(file)).toLowerCase() == "index") || (pathlib.extname(file) == def_ext))
//	.sort((lhs, rhs) => -exts.indexOf(lhs.toLowerCase()) - -exts.indexOf(rhs.toLowerCase()))[0];
	.map((name) => ({name, ext: pathlib.extname(name), base: pathlib.basename(name, pathlib.extname(name))})) //CAUTION: need "()" around "{}" to disambiguate object literal from function body
//	.filter(({base, ext_inx}) => !ext_inx || (base.toLowerCase() == "index")) //|| (ext == exts[0]))
	.map((file) => Object.assign(file, {is_index: specials[file.base.toLowerCase()] || 0, ext_inx: exts.indexOf(file.ext.toLowerCase()) >>> 1})) //uint32; leave msb for index offset
	.filter((file) => file.is_index || (any_name && (file.ext_inx != (-1 >>> 1))))
	.map((file) => Object.assign(file, {order: file.ext_inx + 100 * (file.is_index || 2)}))
	.sort((lhs, rhs) => (lhs.order - rhs.order) || lhs.base.localeCompare(rhs.base))
//	.map((file, inx) => (console.log(`files[${inx}] ${JSON.stringify(file)}`), file))
	[0] || {};
console.log("best:".brightBlue, JSON.stringify(best), "retval".brightBlue, (best.is_index >= 0) && best.name);
    return (best.is_index >= 0) && best.name;
//    function order(file) { return file.ext_inx + 100 * !file.is_index; }
}

function safeStat(path)
{
    if ((safeStat.cache || {}).path != path) safeStat.cache = {path, stat: inner(path)};
    return safeStat.cache.stat;

  function inner(path)
  {
    try { return fs.statSync(path); } //throws error if !exists :(
    catch (exc) { if (!~exc.toString().indexOf("ENOENT")) console.log(`EXC: ${exc}`.brightRed); }
    return {isFile: () => false, isDirectory: () => false}; //kludge: use dummy stat if file !exists
  }
}

function numkeys(obj) { return Object.keys(obj || {}).length; }

function exc(msg) { throw `${msg} @:${srcline(+1)}`.brightRed; }

function nn(val) { return (val + "").padStart(2, "0"); }

//eof
