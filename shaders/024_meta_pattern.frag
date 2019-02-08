/*

    author: Will Stallwood
    daily: 024
    
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

uniform sampler2D u_texture_7;
uniform vec2 u_texture_7Resolution;

float random( in vec2 st )
{
	return fract( sin( dot(st.xy, vec2(-30.950,-10.810) )) * 43758.5453123  );	    
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

float smoothen(float d1, float d2) {
    float k = 1.5;
    return -log(exp(-k * d1) + exp(-k * d2)) / k;
}

float parabola( float x, float k ){
    return pow( 4.0*x*(1.0-x), k );
}

void main() {
    // timing, if using cos+sin times are doubled
    float seconds = 6.0;
    float t = fract(u_time/seconds);

    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    // st += pow(st,vec2(length(st-0.5))*50.3);
    // st = st * 2.0 - 1.0;
    st = center( st );
    // st *= st * ( 2.5 );
    // pattern
    float p = pattern( (st+vec2(0.0,parabola(t,1.0))) * .25 * rotate(TWO_PI*t) );

    // sdf
    vec2 pos = vec2( 0.5 );
        pos += vec2( 0.15 ) * rotate( TWO_PI * t );

    vec3 sdf = vec3(1.0);        
        sdf.x = p;
        // sdf.y = sign(sdf.x);
        sdf.y = length(st-pos);
        sdf.z = smoothen((sdf.y-.1)*15.0,sdf.x*(sdf.y-.17)*12.0-.1);
        // sdf.z = min(sdf.z,sdf.z - (.0 + .15 * sin(TWO_PI*t)));
        sdf.z += pow(sdf.y,10.0);
        // sdf.z = min(sdf.y,sdf.x*sdf.y/600.0);
        // sdf.z = sign(sdf.z);
        

    // color
    float n = random(st);
    vec3 color = vec3(0.07);
        // color = vec3(st.x, st.y, abs(sin(u_time)));
        // color = mix(color,vec3(1.0), sdf);
        color = mix(color,vec3(1.0), 1.0- smoothstep(0.0,0.0015,sdf.z));        
        color += -(length(st) - 1.5) * 0.01 * n;

    gl_FragColor = vec4(color, 1.0);
}