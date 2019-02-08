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

float v_noise(vec2 st,float edges) {
    // st = mod(st,edges);
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec2 u = f*f*(3.0-2.0*f);

    // return lerp(lrandom(i), lrandom((i + 1.0) % edges), u); 

    return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

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

float loop_noise(vec2 st)
{
    float loopLength = SECONDS;
    float transitionStart = SECONDS*.5;
    float t = mod(u_time, loopLength);

    float v1 = v_noise(st + t);
    float v2 = v_noise(st + t - loopLength);

    float transitionProgress = (t-transitionStart)/(loopLength-transitionStart);
    float progress = clamp(transitionProgress, 0., 1.);    
    return mix(v1, v2, progress);
}

void main() {
    // timing, if using cos+sin times are doubled
    float seconds = 5.0;
    vec3 t = time();

    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    st = st * 2.0 - 1.0;

    st *= rotate(PI*.5);
    // st *= rotate(TWO_PI*t.x);
    // st /= pow(length(st),-4.0);

    // sdf
    vec2 pos = st - vec2( 0.0 );
        // pos.x += r * sin(a);
        // pos.y += r * cos(a);

    // pos += sin(u_time);
    // pos += vec2( 0.57 ) * rotate( TWO_PI * t.x );

        // a = TWO_PI/(atan(pos.y,pos.x)+PI);
        // a += u_time;

    float r = .1;
    float a = atan(pos.y,pos.x);
        r = length(pos);
        r *= abs(cos(abs(a)*2.0));

    t.x += fract(t.x-.5);

    float t1 = smoothstep(0.5,1.0,t.x);
    float t2 = smoothstep(0.0,0.5,t.x);

    
    float n = .5 * loop_noise(vec2(abs(a*.50),r)*20.0);

    // float n = .5 * v_noise(vec2(a,r+t.x)*20.0);
        // n *= .5 * v_noise(vec2(a,r+t.x)*20.0);
        // n *= v_noise(vec2(sin(a),r)*20.0,3.*-t.x)*5.0;

        // n *= 10.0;
        r += n;
        // r = pow(r,n*20.0);


    vec3 sdf = vec3(1.0);        
        // sdf.x = length(pos)-.3;
        sdf.x = r-.3;
        sdf.x = smoothstep(0.0,0.001,sdf.x);

    // color
    vec3 color = vec3(0.07);
        // color = vec3(st.x, st.y, abs(sin(u_time)));
        color = mix(color,vec3(1.0), sdf.x);
        color = mix(color,vec3(0.0),abs(st.y/8.0));

    gl_FragColor = vec4(color, 1.0);
}