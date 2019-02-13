/*

    daily: 026
    author: Will Stallwood
    insta: https://www.instagram.com/willstall/
    
*/

#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

#define SAMPLES 20

uniform float u_float;
uniform vec2 u_vec2;
uniform vec3 u_vec3;
uniform vec4 u_vec4;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform sampler2D u_texture_5;
uniform vec2 u_texture_5Resolution;

float cubicPulse( float c, float w, float x )
{
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
}

float random( in vec2 st )
{
	return fract( sin( dot(st.xy, vec2(-30.950,-10.810) )) * 43758.5453123  );	    
}

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
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

vec3 debug_sdf(float sdf, bool full)
{
   vec3 color = vec3(1.0) - sign(sdf)*vec3(0.1,0.4,0.7);
   if(full)
   {
	color *= 1.0 - exp(-2.0*abs(sdf));
	color *= 0.89 + .5*cos(80.0*sdf);
	color = mix( color, vec3(1.0), 1.0-smoothstep(0.0,0.01,abs(sdf)) );
   }

    return color;
}

float cell(vec2 st)
{      
    float seconds = 5.0;
    float t = u_time/seconds;
    // space
    st = st * 2.0 - 1.0; 
    vec2 r = random2(st);
    // config
    float angle = PI * r.y;
    st *= rotate(angle+TWO_PI*t*40.0);
    float ring_size = mix(0.01 * sin(TWO_PI*t),0.01 * sin(TWO_PI*t*2.0) + 0.3  * floor(st.x*10.0)/10.0,cos(TWO_PI*t));
    // rotate
    
    // sdf
    float d = length(st) - 0.1 - 0.5 * sin(TWO_PI*log(t));    
    // ring_size *= -abs(sin(TWO_PI*t*angle+t));

    d = abs(d+ring_size*-abs(sin(TWO_PI*t*angle+t))) - ring_size;

    // d = abs(d+ring_size) - ring_size * -abs(sin(TWO_PI*t));
    // d *= sin(TWO_PI*t);

    float g = st.y;
    d *= pow(g,exp(sin(TWO_PI*t)));

    // d *= 0.5 - 0.5 * sin(d*3.0);
    // d = abs(d*0.3)*0.3;
    // d = abs(0.5 + 0.5 * sin(d*3.0)-.01)-.01;
    // float b = sdBox(st,vec2(0.5,0.0));

    // d = max(d,-b);

    // cut in half

    // randomly rotate on a 45?


    return d;
}

vec4 scene(vec2 st, float t)
{   
    vec4 sdf = vec4(0.0);
        sdf.x = cell(st);

    return sdf;
}

float traceShadows(vec2 position, vec2 lightPosition,float t){
    vec2 direction = normalize(lightPosition - position);
    float lightDistance = length(lightPosition - position);

    float rayProgress =  0.0001;
    float nearest = 9999.0;
    float hardness = 8.50 + random(position) * .50;

    for(int i=0 ;i<SAMPLES; i++){
        vec4 scene = scene(position + direction * rayProgress,t);
        float sceneDist = min(scene.x,scene.y);

        if(sceneDist <= 0.0){
            return 0.0;
        }
        if(rayProgress > lightDistance){
            return clamp(nearest,0.0,1.0);
            //return 1.0;
        }

        nearest = min(nearest, hardness * sceneDist / rayProgress);
        rayProgress = rayProgress + sceneDist;
    }

    return 0.0;
}

void main() {
    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    // st = st * 2.0 - 1.0;

    // timing
    float seconds = 6.0;
    float t = fract(u_time/seconds);

    // sdf
    vec4 sdf = scene(st,t);

    // light & shadows
    vec2 light = vec2(2.0,2.0);
    // float shadows = traceShadows(st,light,t);

    // color
    vec3 color = vec3(0.07);
        // color = mix(color,vec3(0.04),smoothstep(0.0,1.0,1.0-shadows));
        color = mix(color,vec3(1.0), 1.0 - smoothstep(0.0,0.002,sdf.x));

    // debug
        // color = mix(color,vec3(1.0),sign(sdf.xyz));        
        // color = mix(color,vec3(1.0),sdf.xyz);
        color = mix(color,vec3(1.0),
            max(
                step( -0.0015 , st.x ) * step( st.x, 0.0015 ),
                step( -0.0015 , st.y ) * step( st.y, 0.0015 )
            )
        );

    gl_FragColor = vec4(color, 1.0);
}