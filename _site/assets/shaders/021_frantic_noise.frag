/*

    daily: 021
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

float parabola( float x, float k )
{
    return pow( 4.0*x*(1.0-x), k );
}

vec3 hash( vec3 p ) // replace this by something better. really. do
{
	p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

vec2 random2(vec2 st){
    st = vec2( dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

// Value Noise by Inigo Quilez - iq/2013
// https://www.shadertoy.com/view/lsf3WH
float v_noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

float noise( in vec3 x )
{
    // grid
    vec3 p = floor(x);
    vec3 w = fract(x);
    
    // quintic interpolant
    vec3 u = w*w*w*(w*(w*6.0-15.0)+10.0);

    
    // gradients
    vec3 ga = hash( p+vec3(0.0,0.0,0.0) );
    vec3 gb = hash( p+vec3(1.0,0.0,0.0) );
    vec3 gc = hash( p+vec3(0.0,1.0,0.0) );
    vec3 gd = hash( p+vec3(1.0,1.0,0.0) );
    vec3 ge = hash( p+vec3(0.0,0.0,1.0) );
    vec3 gf = hash( p+vec3(1.0,0.0,1.0) );
    vec3 gg = hash( p+vec3(0.0,1.0,1.0) );
    vec3 gh = hash( p+vec3(1.0,1.0,1.0) );
    
    // projections
    float va = dot( ga, w-vec3(0.0,0.0,0.0) );
    float vb = dot( gb, w-vec3(1.0,0.0,0.0) );
    float vc = dot( gc, w-vec3(0.0,1.0,0.0) );
    float vd = dot( gd, w-vec3(1.0,1.0,0.0) );
    float ve = dot( ge, w-vec3(0.0,0.0,1.0) );
    float vf = dot( gf, w-vec3(1.0,0.0,1.0) );
    float vg = dot( gg, w-vec3(0.0,1.0,1.0) );
    float vh = dot( gh, w-vec3(1.0,1.0,1.0) );
	
    // interpolation
    return va + 
           u.x*(vb-va) + 
           u.y*(vc-va) + 
           u.z*(ve-va) + 
           u.x*u.y*(va-vb-vc+vd) + 
           u.y*u.z*(va-vc-ve+vg) + 
           u.z*u.x*(va-vb-ve+vf) + 
           u.x*u.y*u.z*(-va+vb+vc-vd+ve-vf-vg+vh);
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

void main() {
    // timing, if using cos+sin times are doubled
    float seconds = 5.0;
    float t = fract(u_time/seconds);
    float t1 = t * 2.0 - 1.0;
    float t2 = parabola(t,1.0);
            // t1 = (t * 2.0) - 1.0;

    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );

    vec2 pos = vec2( 0.5 );
        // pos += vec2( .13 ) * rotate( TWO_PI * t );

    // noise
    float transitionStart = 4.5;
    float time_scale = 3.0;
    float time = mod(u_time, seconds);
    float seed= 41.0;

    float v1 = noise(vec3(st-pos,seed+time_scale*time));
    float v2 = noise(vec3(st-pos,seed+time_scale*(time - seconds)));

    float transitionProgress = (time-transitionStart)/(seconds-transitionStart);
    float progress = clamp(transitionProgress, 0., 1.);

    // An improvement could be to use a curve to interpolate between the two
    float n = mix(v1, v2, progress)*5.16;

    // float n = 0.0;
        // n = v_noise((st-pos)*50.16);
        // n = noise(
        //     vec3(st-pos,
        //     PI*t1)*2.16);
        // n = noise(
            // vec3(st-pos,
            // t2)*2.16);
            
    // sdf
    vec3 sdf = vec3(1.0);        
        sdf.x = length(st-0.5)-(.1-.07 * n);
        sdf.y = sign(sdf.x);
        sdf.z = sin(sdf.x*100.0);

    const int SHADES = 20;
    float s_f = 1.0/float(SHADES);
    float s = 1.0;
    float aa = 0.012;
    float d = sdf.x;
    // aa = .03;

    for( int i = 0; i < SHADES;i++)
    {   
        float degree = float(i)/float(SHADES);
        // s -= smoothstep(.0+degree,.01+degree,d*s_f);
        // s -= smoothstep(.0+d*s_f,.01+d*s_f,d*s);
        s -= step(aa,d*degree)*s_f;
    }  

    // color
    vec3 color = vec3(0.0);
        // color = vec3(st.x, st.y, abs(sin(u_time)));
        // color = mix(color,vec3(1.0), 1.0-sdf.x);
        color = mix(color,vec3(1.0),s);


    gl_FragColor = vec4(color, 1.0);
}