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

float exponentialInOut(float t) {
  return t == 0.0 || t == 1.0
    ? t
    : t < 0.5
      ? +0.5 * pow(2.0, (20.0 * t) - 10.0)
      : -0.5 * pow(2.0, 10.0 - (t * 20.0)) + 1.0;
}

float random(float x)
{
    return fract(sin(x*100.00)*10000.0);
}

float smoothCellRandom(float x,float scale)
{   
    float iPos = floor(x*scale);
    float fPos = fract(x*scale);

    return mix(random(iPos), random(iPos + 1.0), smoothstep(0.,1.,fPos));
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

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,vec2(0))) + min(max(d.x,d.y),0.0);
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

void main() {
    // timing, if using cos+sin times are doubled
    float seconds = 5.0;
    vec3 t = time();

    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    st = st * 2.0 - 1.0;

    // sdf
    float size = 0.4;// + 0.01 * abs(sin(TWO_PI*t.x));
    float angle = TWO_PI * .41;
    // float n = v_noise(st+u_time*.3);
    float n = loop_noise(st-.25);
    // float r = smoothCellRandom(st.y,20.0);

    vec2 pos = vec2( st*rotate(angle) );
        pos.y += .16;

    vec3 sdf = vec3(1.0);   
        sdf.x = sdBox(st,vec2(size));       // box
        sdf.y = pos.y;                      // angle
        sdf.z = pos.y+n*.2;                 // noise
        // sdf.y = sdf.y + fract(sdf.z*30.0);
        // sdf.y = min(sdf.y,sdf.z);
        sdf.y = pow(sdf.y,.5);
        sdf.y = min(sdf.y+sdf.z,sdf.z);
        // sdf.y = sdf.y+sdf.z;

    // color
    
    float square = 1.0-smoothstep(0.0,0.00001,sdf.x);
    
    const int SHADES = 35;
    float s_f = 1.0/float(SHADES);
    float s = 1.0;
    float aa = 0.07;
    // aa = .03;

    for( int i = 0; i < SHADES;i++)
    {   
        float degree = float(i)/float(SHADES);
        // s -= smoothstep(.0+degree,.01+degree,d*s_f);
        // s -= smoothstep(.0+d*s_f,.01+d*s_f,d*s);
        s -= step(aa,sdf.y*degree)*s_f;
    }   
    s = 1.0-s;
    s *= square;
    s = smoothstep(0.7,1.0,s);

    float ns = loop_noise(st*130.0);
    float speckles = step(0.5,ns);
        speckles += step(0.5,ns*3.0)*.07;

    vec3 color = vec3(0.9137, 0.9137, 0.9137);
        // color = mix(color,vec3(1.0)*sdf.y, 1.0-smoothstep(0.0,0.001,sdf.x));

        color = mix(color,vec3(0.1255, 0.1255, 0.1255), square);

        // color = mix(color,vec3(1.0), sdf.y);
        color = mix(color,vec3(0.302, 0.302, 0.302), speckles*square);
        color = mix(color,vec3(0.8941, 0.8902, 0.8902), s);

        // color = mix(color,vec3(1.0), 1.0-smoothstep(0.0,2.0,sin(sdf.z*20.0)));

    gl_FragColor = vec4(color, 1.0);
}