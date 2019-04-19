/*

    daily: 007
    author: Will Stallwood
    insta: https://www.instagram.com/willstall/
    
*/

#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

vec2 center(vec2 st)
{
    float aspect = u_resolution.x/u_resolution.y;
    st.x = st.x * aspect - aspect * 0.5 + 0.5;
    return st;
}

float mmax(float d, float d1, float d2)
{
    return min(d,  max(d1,d2));
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );

    vec3 color = vec3(0.1);

    float d0 = length(st - vec2(0.5));
    
    float d1 = length(st);
    float d2 = length(st - vec2(1.0));
    float d3 = length(st - vec2(1.0,0.0));
    float d4 = length(st - vec2(0.0,1.0));

    float t = u_time * 5.0;
    float d = 1.0;
        d = mmax(d,d0,d1);
        d = mmax(d,d0,d2);
        d = mmax(d,d0,d3);
        d = mmax(d,d0,d4);

    float g = smoothstep(0.3,0.4,sin(d*100.0+t));
        g += smoothstep(-3.,1.0,sin(d*100.0+t))*.2*sin(t*1.0);
        g *= smoothstep( .1, .2,sin(d*10.0+t*1.5));//-.1;
        g -= smoothstep(-.1,.2,sin(d*10.0+t*1.5))*.2*sin(t*1.0);
        
        
    color += g;

    // vignette
    color *= 1.0-(length(st-0.5)-.3);

    gl_FragColor = vec4(color, 1.0);
}