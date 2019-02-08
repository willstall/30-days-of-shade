#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

#define SECONDS 6.0
#define OCTAVES 7
#define SEED 43758.5453123

uniform float u_float;      // defaults to 0
uniform vec2 u_vec2;
uniform vec3 u_vec3;
uniform vec4 u_vec4;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform sampler2D u_texture_7;
uniform vec2 u_texture_7Resolution;

float easeOutCubic(float t) {
    return (t = t - 1.0) * t * t + 1.0;
}

float easeInCubic(float t) {
    return t * t * t;
}

float easeInOutCubic(float t) {
    if ((t *= 2.0) < 1.0) {
        return 0.5 * t * t * t;
    } else {
        return 0.5 * ((t -= 2.0) * t * t + 2.0);
    }
}

float linearstep(float begin, float end, float t)
{
    return clamp((t - begin) / (end - begin), 0.0, 1.0);
}

float linearstepUpDown(float upBegin, float upEnd, float downBegin, float downEnd, float t) {
    return linearstep(upBegin, upEnd, t) - linearstep(downBegin, downEnd, t);
}

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        SEED);
}

float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float pattern( in vec2 p, in vec2 o,in float m, out vec2 q, out vec2 r )
{
    // p *= length(o);
    q.x = fbm( p + vec2(0.0,0.0) + m );
    q.y = fbm( p + vec2(5.2,1.3) + m );

    r.x = fbm( p + 4.0*q + vec2(1.7,9.2));
    r.y = fbm( p + 4.0*q + vec2(8.3,2.8));

    return fbm( p + 4.0 * r );
}

float sdLine( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
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

float offset(float o,float t)
{
   return o / easeOutCubic(linearstep(0.0,1.2,t));
}

void main() {
    // timing, if using cos+sin times are doubled
    vec3 t = time();

    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    st = st * 2.0 - 1.0;

    // config
    float speed = 0.03;
        speed *= u_time*1.5;

    vec2 pos = vec2( 2.0 );    // x => top, y => bottom ; positions of lines
        // pos += vec2( 0.17 ) * rotate( TWO_PI * t.x );
    float spacing = 0.13;
    float size = 0.005;
    float invert = 0.0;
    float drop_offset = 1.2;
    // sequence - need to animate all five down, then fade them out, then mod by 2 and invert colors...finally...sequence each with a staggar
    float pos_timing = mod(u_time,SECONDS*.5);
    
        pos.x = mix(2.0,0.5,
            easeOutCubic(linearstep(0.0,2.0,pos_timing)));
        pos.y = mix(2.0,-0.5,
            easeOutCubic(linearstep(0.0,1.0,pos_timing)));


        size = mix(size,2.0,
            easeInCubic(linearstep(1.5,3.0,pos_timing)));

        invert = stepUpDown(0.5,1.0,t.x);

    // noise
    vec2 o = vec2(1.0,1.0);
    vec2 q,r;
    float p = pattern(st,o,speed, q, r);
    vec2 sdf_p;
    // sdf
    vec3 sdf = vec3(1.0);
        sdf_p = mix(pos,pos,linearstep(0.0,drop_offset,pos_timing));
        sdf.x = min(sdf.x,sdLine(st,vec2(sdf_p.x,-spacing*2.).yx,vec2(sdf_p.y,-spacing*2.).yx)*p-size); 

        sdf_p = mix(pos+1.0,pos,linearstep(0.0,drop_offset,pos_timing));
        sdf.x = min(sdf.x,sdLine(st,vec2(sdf_p.x,-spacing).yx,vec2(sdf_p.y,-spacing).yx)*p-size); 

        sdf_p = mix(pos+2.0,pos,linearstep(0.0,drop_offset,pos_timing));
        sdf.x = min(sdf.x,sdLine(st,vec2(sdf_p.x,0.0).yx,vec2(sdf_p.y,0.0).yx)*p-size); 

        sdf_p = mix(pos+3.0,pos,linearstep(0.0,drop_offset,pos_timing));
        sdf.x = min(sdf.x,length(st-vec2(spacing,sdf_p.y))*p-size); 

        sdf_p = mix(pos+4.0,pos,linearstep(0.0,drop_offset,pos_timing));
        sdf.x = min(sdf.x,sdLine(st,vec2(sdf_p.x,spacing*2.).yx,vec2(sdf_p.y,spacing*2.).yx)*p-size); 

    //  sdf.x = mix(sdf.x,1.0-sdf.x,invert);
    // color
    vec3 color = vec3(0.0);
        // color = mix(color,vec3(1.0), invert*-1.0);
        color = mix(color,vec3(1.0), 1.0-smoothstep(0.0,0.002,sdf.x));
        color = mix(color,1.0-color,invert);
        color += 0.09;
        color *= 1.0+dot(st*.5,st*.5)*random(st)*.5;

    gl_FragColor = vec4(color, 1.0);
}