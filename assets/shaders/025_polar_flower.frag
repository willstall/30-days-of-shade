/*

    daily: 025
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

uniform sampler2D u_texture_7;
uniform vec2 u_texture_7Resolution;

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

float pattern(vec2 st)
{
    float scale = 10.0;
    
    st *= 10.0;

    vec2 iPos = fract(st);
    vec2 fPos = fract(st);

    float size = 0.1;
    float d = length(fPos-0.5) - size;
    return d;
}

void main() {
    // timing, if using cos+sin times are doubled
    float seconds = 6.0;
    float t = fract(u_time/seconds);

    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );

    st = st * 2.0 - 1.0;
    st *= rotate( TWO_PI*t* 1.0 );

    float l = length(st*(1.3+1.0*sin(TWO_PI*t*1.0)))-1.5*(0.5+0.5*cos(TWO_PI*t*1.0));//abs(sin(u_time));

    st = pow(st,1.0-vec2(pow(l,l)) );
    // st += u_time * .13;
    // st = st + 1.0 * .5;

    // sdf
    vec2 pos = vec2( 0.5 );
        // pos += vec2( 0.17 ) * rotate( TWO_PI * t );

    float t1 = t * 2.0 - 1.0;
    vec3 sdf = vec3(1.0);        
        sdf.x = pattern(st+ t1) - 0.01;
        sdf.z = abs(length(st-.9))-.13;
        sdf.y = min(sdf.y,sdf.z);
        sdf.y = 1.0-smoothstep(0.0,0.13,sdf.x);

    // color
    vec3 color = vec3(0.07);
        // color = vec3(st.x, st.y, abs(sin(u_time)));
        // color = mix(color,vec3(1.0), sdf);
        color = mix(color,vec3(1.0), sdf.y);
        color = mix(color,vec3(1.0), sdf.z);

    gl_FragColor = vec4(color, 1.0);
}