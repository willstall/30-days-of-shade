# [30 Days of Shade](http://30daysofshade.com)
An interactive demo of my 30 days of shaders in GLSL using GLSLCanvas. Yes, I know there are 31 days in January =)

## [Watch and Edit Here](https://willstall.github.io/30-days-of-shade/)

- All the shaders: [/assets/shaders](https://github.com/willstall/30-days-of-shade/tree/master/assets/shaders)
- All the videos: [/assets/videos](https://github.com/willstall/30-days-of-shade/tree/master/assets/videos)

### Resources to Learn From
- [the book of shaders](http://thebookofshaders.com)
- [iq articles](http://iquilezles.org/www/index.htm)
- [alan zucconi tutorials](https://www.alanzucconi.com/tutorials/)
- [ronja's tutorials](https://www.ronja-tutorials.com)
- [minion's art gif tutorials](https://minionsart.github.io/tutorials/)
- [adam ferriss p5js examples](https://github.com/aferriss/p5jsShaderExamples)

### Shader Tools
- [glslEditor](https://github.com/patriciogonzalezvivo/glslEditor)
- [glslViewer](https://github.com/patriciogonzalezvivo/glslViewer)
- [shadertoy](http://www.shadertoy.com)
- [kodelife](https://hexler.net/software/kodelife/)

### Math Tools
- [Math as Code](https://github.com/Jam3/math-as-code)
- [Desmos Graphic Calculator](https://www.desmos.com/calculator)
- [Quick Guide for Desmos Calculator](https://mathvault.ca/desmos-guide/)
- [Shader Shop by Tobyschachman](http://tobyschachman.com/Shadershop/editor/)
- [iq Graph Toy](http://www.iquilezles.org/apps/graphtoy/)

### Idea Generation
- [Stupid Shader Idea Generator (I'm sorry)](https://willstall.github.io/shadiness/)
- [Generative Word Bubbles](https://www.twinword.com/ideas/graph/)

### Just For Fun
- [cpu vs gpu] (https://www.youtube.com/watch?time_continue=27&v=-P28LKWTzrI)

## Recording your own shaders
I use a combination of [FFMPEG](https://ffmpeg.org) and [glslViewer](https://github.com/patriciogonzalezvivo/glslViewer) in order to create my looping videos for both [instagram](https://www.instagram.com/willstall/) and [twitter](https://twitter.com/willstall). A sequence of images is created with glslViewer and then turned into a video using FFMPEG. To make things even easier I created a very basic shell script to automate all of this. Here it is!

Usage:
  record.sh fileName duractionInSeconds folderName
Example:
  record.sh exampleFile.frag 5 exampleFolder

- [My Automated Video Shell Script](https://github.com/willstall/30-days-of-shade/tree/master/assets/shaders/record.sh)
