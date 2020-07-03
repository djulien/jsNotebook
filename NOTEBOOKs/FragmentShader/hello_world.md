---
title: Fragment Shader Demo
authors: Patricio Gonzalez Vivo, Jen Lowe, djulien
references: https://thebookofshaders.com, https://github.com/patriciogonzalezvivo/thebookofshaders
keywords: OpenGL, WebGL, GLSL
description: interactive Javascript notebook Fragment Shader demo
---
# OpenGL Fragment Shader demo
This JavaScript Notebook demonstrates an interactive OpenGL fragment shader.

The shader/editor runs as JavaScript code within your browser and uses WebGL.  It is adapted from client-side portions of [The Book of Shaders on github](https://github.com/patriciogonzalezvivo/thebookofshaders).

[toc]

## Example Fragment Shader
Below is just one simple OpenGL shader example:

<div class="codeAndCanvas" data="./hello_world.frag"></div>

If you're reading this in a browser, the block of code above is interactive - click on it and edit the code to experiment.  Changes take effect immediately and will be displayed in the WebGL panel to the right of the shader code.

## Other Examples
The above shader example isn't very exciting.  For more examples and info about shaders, see [The Book of Shaders](https://thebookofshaders.com) by [Patricio Gonzalez Vivo](http://patriciogonzalezvivo.com) and [Jen Lowe](http://jenlowe.net), &copy; 2015 [Patricio Gonzalez Vivo](http://www.patriciogonzalezvivo.com).
<!--
        <p> <a href="?lan=jp">日本語</a> - <a href="?lan=ch">中文版</a> - <a href="?lan=kr">한국어</a> - <a href="?lan=es">Español</a> - <a href="?lan=pt">Portugues</a> - <a href="?lan=fr">Français</a> - <a href="?lan=it">Italiano</a> - <a href="?lan=de">Deutsch</a> - <a href="?lan=ru">Русский</a> - <a href=".">English</a></p>
-->

Here are some more interesting examples from [The Book of Shaders gallery](https://thebookofshaders.com/examples):

<div class="glslGallery" data="160401213245,160313193711,160313030533,160313025607,160313020334,160308160958,160308014412,160307213819,160306213426,160304203554,160304202332,160302022724,160219112614,160302003807,160302102102,160302101618"></div>

#### (shader plumbing)
This area pulls in additional JavaScript files used by the shader editor/viewer.
<!-- Highlight -->
<!-- <link type="text/css" rel="stylesheet" href="./css/github.css"> -->
<script type="text/javascript" src="./lib/highlight.min.js"></script>
<!-- GlslCanvas -->
<script type="text/javascript" src="./lib/glslCanvas/build/GlslCanvas.js"></script>
<!-- GlslEditor -->
<link type="text/css" rel="stylesheet" href="./lib/glslEditor/build/glslEditor.css">
<script type="application/javascript" src="./lib/glslEditor/build/glslEditor.js"></script>
<!-- GlslGallery -->
<link type="text/css" rel="stylesheet" href="./lib/glslGallery/build/glslGallery.css">
<script type="application/javascript" src="./lib/glslGallery/build/glslGallery.js"></script>
<!-- Main style -->
<!-- <link href="./css/bos-styles.css" rel="stylesheet" /> -->
<script type="text/javascript" src="./lib/bos-main.js" defer></script>

#### (eof)
