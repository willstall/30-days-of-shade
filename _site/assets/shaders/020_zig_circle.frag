/*

    daily: 020
    author: Will Stallwood
    insta: https://www.instagram.com/willstall/
    
*/

#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

uniform float u_float;      // defaults to 0
uniform vec2 u_vec2;
uniform vec3 u_vec3;
uniform vec4 u_vec4;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform sampler2D u_texture_5;
uniform vec2 u_texture_5Resolution;

float random( in vec2 st )
{
	return fract( sin( dot(st.xy, vec2(-30.950,-10.810) )) * 43758.5453123  );	    
}

float round_merge(float shape1, float shape2, float radius){
    vec2 intersectionSpace = vec2(shape1 - radius, shape2 - radius);
    intersectionSpace = min(intersectionSpace, 0.0);
    float insideDistance = -length(intersectionSpace);
    float simpleUnion = min(shape1, shape2);
    float outsideDistance = max(simpleUnion, radius);
    return  insideDistance + outsideDistance;
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

vec3 palette(float t,vec3 a,vec3 b,vec3 c,vec3 d )
{
    return a + b * cos( TWO_PI * (c*t+d));
}

vec3 colorize(float d,float t,vec3 base)
{
    return palette(d+t,base,
        vec3(0.5,0.5,0.5),
        vec3(0.5,0.5,0.5),
        vec3(0.0,.1,0.2));    
}

vec3 colorize(float d,float t)
{
    return palette(d+t,vec3(0.5),
        vec3(0.5,0.5,0.5),
        vec3(0.5,0.5,0.5),
        vec3(0.0,.1,0.2));    
}

float cubicPulse( float c, float w, float x )
{
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
}

float parabola( float x, float k )
{
    return pow( 4.0*x*(1.0-x), k );
}

mat2 rotate(float angle)
{
    return mat2( cos(angle),-sin(angle),sin(angle),cos(angle) );
}

vec2 center(vec2 st)
{
    float aspect = u_resolution.x/u_resolution.y;
    st.x = st.x * aspect - aspect * 0.5 + 0.5;
    return st;
}

vec3 zig(vec2 st, float scale, float t, float rotation)
{
    st = st * 2.0 - 1.0;
    st *= scale;
    st *= rotate(rotation);

    // st.y += noise(st-.06)*2.13;

    st += t;

    float y_offset = 0.5;

    vec3 sdf = vec3(1.0);   
        sdf.x = st.y - floor(st.x) - y_offset;
        sdf.y = st.x - floor(st.y - y_offset)  - 1.0;
        sdf.z = max(sdf.x,sdf.y);
        // sdf.z = step(0.35,sdf.z);

    return sdf;
}

vec3 rgb2hsb( in vec3 c ){
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz),
                 vec4(c.gb, K.xy),
                 step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r),
                 vec4(c.r, p.yzx),
                 step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
                d / (q.x + e),
                q.x);
}

vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {
    // timing, if using cos+sin times are doubled
    float seconds = 5.0;
    float t = fract(u_time/seconds);

    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );    

    // st = st * 2.0 - 1.0;
    // st *= 3.0;
    // st *= rotate(PI*.25);

    // st += u_time;

    // float y_offset = 0.5;
    vec3 sdf = vec3(1.0);   
        sdf.x = zig(st,.5,t,PI*.25).z;
        sdf.y = zig(st,.75,t*2.0,PI*.25).z;
        sdf.z = zig(st,1.0,t*3.0,PI*.25).z;

        // sdf.x = sdf.x*sdf.y*sdf.z*.33;
        // sdf.x = round_merge(sdf.x,sdf.y,.83);

        // sdf = smoothstep(-0.25,0.25,sdf);
        // sdf = smoothstep(-0.25,0.25,sdf);
        

    vec2 sizing = vec2(dot(st.x,st.y)*3.0,sin(TWO_PI*t));
    float size = noise(sizing*1.);
    // size = 0.1;

    // float d = step(0.3,(sdf.x+sdf.y+sdf.z) / 2.0);
    float c = length(st-.5) - .1;
        // c = fract(c*3.0);
    vec3 d = vec3(0.0);
        d.x = step(0.5*size,sdf.x);
        d.y = step(0.5*size,sdf.y);
        d.z = step(0.5*size,sdf.z);
        d = max(d,step(0.13+0.03*sin(TWO_PI*t),c));   // circle cut out

        // d.y = d.x;
        // d.y = step(0.3,(sdf.x+sdf.y+sdf.z) / 2.0);
        // d.z = step(0.6,max(-sdf.x,sdf.z));

        // sdf = smoothstep(0.3,.301,sdf);

    sdf = smoothstep(0.3,.301,sdf);

    float phase = sin(TWO_PI*t);//u_time*1.33;
        // sdf.x = colorize(sdf.x, phase).z;
        // sdf.y = colorize(sdf.y, phase + TWO_PI*.33).x;
        // sdf.z = colorize(sdf.z, phase + TWO_PI*.66).x;


        // sdf.x = st.y - floor(st.x) - y_offset;
        // sdf.y = st.x - floor(st.y - y_offset)  - 1.0;
        // sdf.z = max(sdf.x,sdf.y);
        // sdf.z = step(0.35,sdf.z);

    // color
    vec3 color = vec3(0.07);
        color = mix(color,vec3(0.24), sdf.y);
        color = mix(color,vec3(0.2), sdf.x);
        // color = mix(color,vec3(1.0), sdf.z);

        // color = mix(color,sdf,1.0-d.x);


        // color = vec3(0.0, 0.0, .125);

        color = mix(color,vec3(.1),1.0-sdf);
        color = mix(color,vec3(1.0),1.0-d);
        // color = colorize(5.5,sin(TWO_PI*t),color);

        color /= hsb2rgb(color)*4.0;
        // color = hsb2rgb(color);

        // color += vec3(2.0,2.0,1.0);

        color *= vec3(30.0,1.,1.7);  

        // color *= u_vec3 * 30.0;
        // color /= vec3(2.0,2.0,1.0);

        // color *= 3.0;

        // color = mix(color,vec3(st.x, st.y, .5),1.0-color);

        
        
        // color -= length(st-.5)- .915; * (random(st)*.125);
        color -= length(st-.5) - .395 + .1* (random(st)*.125);

        // color = mix(color,vec3(1.0), sdf);


        // color = mix(color,vec3(1.0), smoothstep(0.0,0.001,sdf.x));

    gl_FragColor = vec4(color, 1.0);
}