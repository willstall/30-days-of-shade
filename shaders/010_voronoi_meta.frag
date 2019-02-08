#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

uniform float u_float;
uniform vec2 u_vec2;
uniform vec3 u_vec3;
uniform vec4 u_vec4;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

/*

Inspiration:
https://www.instagram.com/p/BkaBfJplv6y/

*/

vec3 palette(float t,vec3 a,vec3 b,vec3 c,vec3 d )
{
    return a + b * cos( TWO_PI * (c*t+d));
}

vec3 colorize(float d,float t)
{
    return palette(d+t,vec3(0.5),
        vec3(0.5,0.5,0.2),
        vec3(1.0,1.0,1.0),
        vec3(0.3,.2,0.2));    
}

float random( in vec2 st )
{
	return fract( sin( dot(st.xy, vec2(-30.950,-10.810) )) * 43758.5453123  );	    
}

float random( in float x )
{
    return fract(sin(x)*102670.0);
}

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
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

float manhattan_distance(vec2 x, vec2 y, float power)   // really wants a power of 1..2
{
    return pow(
            pow(abs(x.x-y.x),power) +
            pow(abs(x.y-y.y),power)
            ,1.0/power);
}

void main() {
    // config
    float scale = 3.0;
    float d = 1.0;
    float meta = 1.0;

    vec2 p = vec2(0.0);
    vec2 mp = vec2(0.0);

    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    // st *= pow(length(st-0.5),0.5);
    st = center( st );   
    // st.x = mod(abs(pow(st.x-.5,.5+0.5*sin(u_time*.33))),1.0);
    // st = st * 2.0 - 1.0;

    // st *= scale*sin(u_time);
    
    vec2 sSt = st * scale * scale;
    sSt.y += u_time*.33;
    vec2 iSt = floor(sSt);
    vec2 fSt = fract(sSt);
    
    // get sdf based on neighbors
    for(int x = -1; x <= 1; x++)
    {
        for(int y = -1; y <= 1; y++)
        {
            vec2 offset = vec2(x,y);            
            vec2 point = random2(iSt+offset);
                point = 0.5 + 0.5 * sin(u_time * 0.5 + TWO_PI * point );

            // float diff = length(fSt - point - offset);
            float diff = manhattan_distance(fSt-point,offset,d+1.0+1.0*(0.5+0.5*sin(u_time)));
            float mDiff = diff * meta;

            if(meta > mDiff)
            {
                meta = mDiff;
                mp = point;
            }
            // diff *= d;
            // diff = smoothstep(0.0,c * scale,diff);
            if(d > diff)
            {
                d = diff;
                p = point;
            }
        }
    }

    meta = smoothstep(0.0001,0.001,abs(meta-.3)*mod(meta*30.0,4.0)-.3);
    meta += ceil(st*scale).x * sin(u_time*.33);
    
    // color    
    float color_id = random(floor(st*scale)+915392.0);
    float space_id = random(floor(st-p*scale)+189291.0);

    vec3 color = vec3(0.0);

    color = vec3(6.0,0.67,1.0) * colorize(meta*space_id,color_id+u_time*.13);
    color += (length(fract(st*scale))-.5)*.1;
    color += vec3(0.05,0.05,0.06);

    // fade config
    float fadeDuration = 15.0;    
    float fadeTime = 0.8;    
    vec3 fadeColor = vec3(246.0/255.0,49.0/255.,94.0/255.0);    
    // fade
    
    float fTime = mod( u_time, fadeDuration );
    float fT = 1.0;
    fT *= smoothstep(  0.0, fadeTime, fTime );
    fT *= 1.0 - smoothstep( fadeDuration-fadeTime, fadeDuration, fTime );

    color = mix(color,fadeColor,1.0-fT);

    gl_FragColor = vec4(color, 1.0);
}