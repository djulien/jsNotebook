
// PARSING
//---------------------------------------------------------------

//  Graph plotter function take from
//  From http://blog.hvidtfeldts.net/index.php/2011/07/plotting-high-frequency-functions-using-a-gpu/
var preFunction = `
#ifdef GL_ES
  precision mediump float;
#endif

#define PI 3.14159265359

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float lineJitter = 0.5;
float lineWidth = 7.0;
float gridWidth = 1.7;
float scale = 0.0013;
float zoom = 2.5;
vec2 offset = vec2(0.5);

float rand (in float _x)
{
    return fract(sin(_x)*1e4);
}

float rand (in vec2 co)
{
    return fract(sin(dot(co.xy,vec2(12.9898,78.233)))*43758.5453);
}

float noise (in float _x)
{
    float i = floor(_x);
    float f = fract(_x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(rand(i), rand(i + 1.0), u);
}

float noise (in vec2 _st)
{
    vec2 i = floor(_st);
    vec2 f = fract(_st);
    // Four corners in 2D of a tile
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + 
            (c - a)* u.y * (1.0 - u.x) + 
            (d - b) * u.x * u.y;
}

float function(in float x)
{
    float y = 0.0;
`;

var postFunction = `
    return y;
}

vec3 plot2D(in vec2 _st, in float _width ) {
    const float samples = 3.0;

    vec2 steping = _width*vec2(scale)/samples;
    
    float count = 0.0;
    float mySamples = 0.0;
    for (float i = 0.0; i < samples; i++) {
        for (float j = 0.0;j < samples; j++) {
            if (i*i+j*j>samples*samples) 
                continue;
            mySamples++;
            float ii = i + lineJitter*rand(vec2(_st.x+ i*steping.x,_st.y+ j*steping.y));
            float jj = j + lineJitter*rand(vec2(_st.y + i*steping.x,_st.x+ j*steping.y));
            float f = function(_st.x+ ii*steping.x)-(_st.y+ jj*steping.y);
            count += (f>0.) ? 1.0 : -1.0;
        }
    }
    vec3 color = vec3(1.0);
    if (abs(count)!=mySamples)
        color = vec3(abs(float(count))/float(mySamples));
    return color;
}

vec3 grid2D( in vec2 _st, in float _width ) {
    float axisDetail = _width*scale;
    if (abs(_st.x)<axisDetail || abs(_st.y)<axisDetail) 
        return 1.0-vec3(0.65,0.65,1.0);
    if (abs(mod(_st.x,1.0))<axisDetail || abs(mod(_st.y,1.0))<axisDetail) 
        return 1.0-vec3(0.80,0.80,1.0);
    if (abs(mod(_st.x,0.25))<axisDetail || abs(mod(_st.y,0.25))<axisDetail) 
        return 1.0-vec3(0.95,0.95,1.0);
    return vec3(0.0);
}

void main(){
    vec2 st = (gl_FragCoord.xy/u_resolution.xy)-offset;
    st.x *= u_resolution.x/u_resolution.y;

    scale *= zoom;
    st *= zoom;

    vec3 color = plot2D(st,lineWidth);
    color -= grid2D(st,gridWidth);

    gl_FragColor = vec4(color,1.0);
}`;

var glslCanvas = [];
var glslEditors = [];
var glslGraphs = [];

function styleCodeBlocks() {
    // Highlight code blocks
    var list = document.getElementsByTagName("code");
    for(var i = 0; i < list.length; i++){
        if (list[i].className == "language-glsl" ||
            list[i].className == "language-bash" ||
            list[i].className == "language-cpp" ||
            list[i].className == "language-html" ||
            list[i].className == "language-processing" ){
            hljs.highlightBlock(list[i]);
        }
    }
}

function loadGlslElements() {

    // Load single Shaders
    var canvas = document.getElementsByClassName("canvas");
    for (var i = 0; i < canvas.length; i++){
        glslCanvas.push(new GlslCanvas(canvas[i]));
    }

    // parse EDITORS
	var ccList = document.querySelectorAll(".codeAndCanvas");
	for(var i = 0; i < ccList.length; i++){
		if (ccList[i].hasAttribute("data")){
            var srcFile = ccList[i].getAttribute("data");
            var editor = new GlslEditor(ccList[i], {
                canvas_size: 250,
                canvas_follow: true,
                canvas_float: 'right',
                tooltips: true,
                exportIcon: true
            });
            editor.open(srcFile);
            glslEditors.push(editor);
        }
    }

    // parse GRAPHS
    var sfList = document.querySelectorAll(".simpleFunction");
    for(var i = 0; i < sfList.length; i++){
        if (sfList[i].hasAttribute("data")){
            var srcFile = sfList[i].getAttribute("data");
            glslGraphs.push(new GlslEditor(sfList[i], {
                canvas_width: 800,
                lineNumbers: false,
                canvas_height: 250,
                canvas_follow: true,
                canvas_float: false,
                frag_header: preFunction,
                frag_footer: postFunction,
                tooltips: true
            }).open(srcFile));
        }
    }
}

function insertAfter(newElement,targetElement) {
    var parent = targetElement.parentNode;
    if (parent.lastChild == targetElement) {
        parent.appendChild(newElement);
    } else {
        parent.insertBefore(newElement,targetElement.nextSibling);
    }
}

function captionizeImages() {
    if (!document.getElementsByTagName)
        return false;

    if (!document.createElement)
        return false;

    var images = document.getElementsByTagName("img");
    if (images.length < 1)
        return false;

    for (var i = 0; i < images.length; i++) {
        var title = images[i].getAttribute("alt");
        if (title && title !== ''){
            var divCaption = document.createElement("div");
            divCaption.className = "caption";
            var divCaption_text = document.createTextNode(title);
            divCaption.appendChild(divCaption_text);
            var divContainer = document.createElement("div");
            divContainer.className="imgcontainer";
            images[i].parentNode.insertBefore(divContainer,images[i]);
            divContainer.appendChild(images[i]);
            insertAfter(divCaption,images[i]);
        }
    }
}

// NAVIGATION
//-----------------------------------------------------------------------

function FormatNumberLength(num, length) {
    var r = "" + num;
    while (r.length < length) {
        r = "0" + r;
    }
    return r;
}

function checkUrl(url) {
    var request = false;
    if (window.XMLHttpRequest) {
            request = new XMLHttpRequest;
    } else if (window.ActiveXObject) {
            request = new ActiveXObject("Microsoft.XMLHttp");
    }

    if (request) {
            request.open("GET", url);
            if (request.status == 200) { return true; }
    }

    return false;
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/*
function previusPage() {
	var path = window.location.pathname;

	var n = parseInt( path.match( /[0-1].(?!.*[0-1])/ )[0] );
    var url;
	n -= 1;
    if(n < 0){
        url = "../";
    } else {
        url = "../" + FormatNumberLength(n,2) + "/";
    }

    var language = getParameterByName('lan');
    if (language !== ""){
        url += "?lan="+language;
    }

	window.location.href =  url;
}

function homePage() {
	window.location.href = "../";
}

function nextPage() {
	var path = window.location.pathname;

	var n = parseInt( path.match( /[0-1].(?!.*[0-1])/ )[0] );
	n += 1;
	var url = "../" + FormatNumberLength(n,2) + "/";

    var language = getParameterByName('lan');
    if (language !== ""){
        url += "?lan="+language;
    }

	window.location.href =  url;
}
*/

window.addEventListener("load", function(){
    window.scrollTo(0, 0);
    styleCodeBlocks();
    loadGlslElements();
    captionizeImages();
    window.scrollTo(0, 0);
    setTimeout(function () {
         window.scrollTo(0, 0);
    }, 500);
});
