#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

#define SECONDS 5.0

uniform float u_float;      // defaults to 0
uniform vec2 u_vec2;
uniform vec3 u_vec3;
uniform vec4 u_vec4;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform sampler2D u_texture_7;
uniform vec2 u_texture_7Resolution;

float stepUpDown(float begin, float end, float t)
{
  return step(begin, t) - step(end, t);
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

vec3 time()
{
    float period = mod(u_time,SECONDS);
    vec3 t = vec3(fract(u_time/SECONDS),period, 1.0-fract(period));
    return t;       // return fract(length),period,period phase
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

float parabola( float x, float k ){
    return pow( 4.0*x*(1.0-x), k );
}

float easeInOutCubic(float t) {
    if ((t *= 2.0) < 1.0) {
        return 0.5 * t * t * t;
    } else {
        return 0.5 * ((t -= 2.0) * t * t + 2.0);
    }
}

float loop_noise(vec2 st)
{
    float loopLength = 5.;
    float transitionStart = 1.5;
    float t = mod(u_time, loopLength);

    float v1 = v_noise(st + t);
    float v2 = v_noise(st + t - loopLength);

    float transitionProgress = (t-transitionStart)/(loopLength-transitionStart);
    float progress = clamp(transitionProgress, 0., 1.);    
    return mix(v1, v2, progress);
}

float poly(vec2 st,int sides )
{
    // time
    vec3 t = time();
    float t1 = sin(TWO_PI*easeInOutCubic(t.x)*2.0);
    // hex
    
    st.y += .1;
    st = st * 2.0 - 1.0;
    st += st * .05 * t1;

    
    if(st.y < 0.0)
    {
        float a = 1.0-st.y;
        st.y *= pow(-a,11.0) * 3.0;

        // st.y *= v_noise(st*2.0+vec2(0.0,u_time*.25))*1.0;
        // float v1 = v_noise(st*1.0+vec2(0.0,0.0));
        // float v2 = v_noise(st*1.0+vec2(30.0,30.0));
        st.y *= loop_noise(st)*3.0;
        // st.y *= mix(v1,v2,parabola(abs(t1),0.5));
    }

    st.y += 0.15 * sin(TWO_PI*t.x);

    st *= rotate(TWO_PI*t.x+TWO_PI*easeInOutCubic(t.x)*2.0);    

    // st.y = abs(st.y);


    // Angle and radius from the current pixel
    float a = atan(st.x,st.y)+PI;
    float r = TWO_PI/float(sides);
    // Shaping function that modulate the distance
    float d = cos(floor(.5+a/r)*r-a)*length(st);
    // d = st.y;
    return d;
}

void main() {
    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    

    // sdf
    vec3 sdf = vec3(0.0);                
        sdf.x = poly(st,6) - 0.5;

    // relfect our x
        sdf.y = 0.0;

    // color
    float h = smoothstep(0.0,-0.5,st.y*2.0-1.0+.25);
    float b = smoothstep(0.0,-1.0,st.y*2.0-1.0+.25);

    float r = smoothstep(0.0,-1.0,st.y*2.0-1.0+.25);
    // float b = smoothstep(0.0,-1.0,st.y*2.0-1.0+.2);

    // sdf.x = mix(sdf.x,1.0-b,sdf.x);
    sdf.x = step(sdf.x,b);

    vec3 color = vec3(0.08);
        // color = vec3(st.x, st.y, abs(sin(u_time)));
        // color = debug_sdf(sdf.x,true);
        // color = mix(color,vec3(1.0), sdf);
        // color = mix(color,vec3(0.17), smoothstep(0.0,0.002,st.y*2.0-1.0+.2) );
        // color = mix(color,vec3(1.0), 1.0-smoothstep(0.0,0.002,sin(pow(sdf.x,.3)*30.0))*h);

        // color = mix(color,vec3(0.07),smoothstep(0.0,0.0002,sdf.x));
        color = mix(color,vec3(0.5),h);
        color = mix(color,vec3(1.0),1.0-smoothstep(0.0,0.002,sdf.x));
        color = mix(color,vec3(1.0),1.0-smoothstep(0.0,0.002,sdf.x));
        // color = mix(color,vec3(0.0), b);
        // color += mix(color,vec3(1.0), b*2.5);
        // color = mix(color,vec3(1.0,0.0,0.0),r);
        // color = 1.0 - color;

    gl_FragColor = vec4(color, 1.0);
}