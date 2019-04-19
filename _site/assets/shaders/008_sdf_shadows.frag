/*

    daily: 008
    author: Will Stallwood
    insta: https://www.instagram.com/willstall/
    
*/

#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

#define SAMPLES 30
#define COUNT 2

uniform float u_float;
uniform vec2 u_vec2;
uniform vec3 u_vec3;
uniform vec4 u_vec4;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float cubicPulse( float c, float w, float x )
{
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
}

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,vec2(0))) + min(max(d.x,d.y),0.0);
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

float morph(vec2 st, vec2 pos, float size, float m)
{
    float c = length(st-pos)-size;//-0.01*sin(u_time);
    float s = sdBox(st-pos,vec2(size))-.013;

    return mix(c,s,m);
}

float scene(vec2 st) {
    // this is where our sdf world is going to be
    vec2 position = vec2(0.5);

    float t = 0.5-0.5*sin(u_time);
    // float s = 0.5-0.5*sin(u_time);

    float r = u_time*2.0;

    st -= 0.5;
    st *= rotate(r);
    st += 0.5;

    float d = 0.0;
    d = morph(st,position,0.1,t);

    // t = r + sin(r);

    float dist = 0.18 + 0.15 * t;
    float offset = 0.0;//PI*.13;
    for(int i = 0; i < COUNT; i++)
    {
        float p = float(i)/ float(COUNT);
        vec2 w = vec2(
            position.x+dist*sin(r+sin(r)+TWO_PI*p+offset),
            position.y+dist*cos(r+sin(r)+TWO_PI*p+offset));
        float c = length(st-w)-.025;
        c = morph(st,w,.02,t);
        d = min(d,c);
    }

    return d;
}

float traceShadows(vec2 position, vec2 lightPosition){
    vec2 direction = normalize(lightPosition - position);
    float lightDistance = length(lightPosition - position);

    float rayProgress = 0.0;
    // float nearest = 9999.0;

    for(int i=0 ;i<SAMPLES; i++){
        float sceneDist = scene(position + direction * rayProgress);

        if(sceneDist <= 0.0){
            return 0.0;
        }
        if(rayProgress > lightDistance){
            // return clamp(nearest,0.0,1.0);
            return 1.0;
        }

        // nearest = min(nearest, sceneDist);
        rayProgress = rayProgress + sceneDist;
    }

    return 0.0;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );

    // light
    vec2 pos = vec2(0.5);
    vec3 light = vec3(0.5+.3*sin(u_time),1.3,.5);
        light = vec3(-0.3,1.3,.5);
        light = vec3(0.5+1.0*sin(-u_time*1.0),0.5+1.0*cos(-u_time*1.0),.5);       //rotating light
        // light = vec3(.5+3.0*sin(u_time),.5+3.0*cos(u_time),.5);       //rotating light
        // light = vec3(
            // .5+.0+3.0*abs(sin(u_time*.25))+sin(-15.0),
            // .5+.0+3.0*abs(sin(u_time*.25))+cos(-15.0),.5);       //zooming light

    // scene 
    float sdf = scene(st);
    float shadows = traceShadows(st,light.xy);

    // add debug light
    // sdf = min(sdf,length(st-light.xy)-light.z);

    // cutoff sdf
    // sdf = step(0.001,-sign(sdf));
    sdf = smoothstep(0.001,0.003,-sdf);

    // vignette
    float vignette = pow((1.0-length(st-0.5)-.01),.7)*0.5;

    // color
    vec3 color = vec3(0.07);
    color += sdf;
    color += max(shadows * 0.1,-vignette);
    color += vignette;

    

    gl_FragColor = vec4(color, 1.0);
}

/*

ffmpeg -r 30 -i %03d.png -vf scale=640:640 -vcodec libx264 -vb 2048k -bufsize 2048k -minrate 2048k -maxrate 2048k -pix_fmt yuv420p -strict 2 test.mp4

ffmpeg -i %03d.png -i palette.png -filter_complex "scale=400 : thumbsdown:flags=lanczos[x];[x][1:v]paletteuse" -r 30 out.gif

*/

// sdf experiments
// d = -sign(d);    // sign and step 0.001 render almost the same result
// d = step(0.01,abs(d));  // taking abs value gives me a ring
// d = exp(-6.0*abs(d));      // shiny ring with exp of abs distance