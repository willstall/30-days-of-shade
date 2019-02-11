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

float parabola( float x, float k )
{
    return pow( 4.0*x*(1.0-x), k );
}

float random( in vec2 st )
{
	return fract( sin( dot(st.xy, vec2(-30.950,-10.810) )) * 43758.5453123  );	    
}

float random(float x)
{
    return fract(sin(x*100.00)*10000.0);
}

vec4 randomCell(vec2 st)
{
    vec4 r = vec4(
        random(st),
        random(st+vec2(3.41,199.0)),
        random(st+vec2(0.17,71.0)),
        random(st+vec2(8.29,17.3))
    );
    r = step(vec4(0.005),r);
    return r;
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

float easeInCubic(float t) {
    return t * t * t;
}

float easeOutCubic(float t) {
    return (t = t - 1.0) * t * t + 1.0;
}

float stepUpDown(float begin, float end, float t)
{
  return step(begin, t) - step(end, t);
}

float cell(vec2 st, float phase )
{
    vec2 iPos = floor(st);
    vec2 fPos = fract(st);
    fPos = fPos * 2.0 - 1.0;

    const int COUNT = 4;

    // float t = u_time*0.0000001;
    float size = 1.0;

    // vec4 r = randomCell(iPos+floor(fPos)+t);

    vec3 points[COUNT];
    points[0] = vec3(1.0,1.0,0.0);
    points[1] = vec3(1.0,-1.0,0.0);
    points[2] = vec3(-1.0,1.0,0.0);
    points[3] = vec3(-1.0,-1.0,0.0);

    // float d = length((abs(st*rotate(PI*.25))-vec2(0.71,0.71)))-.1;
    // fPos *= rotate(u_time);

    float d = min(
        length(abs(fPos)-abs(vec2(-1.0,0.0))),
        length(abs(fPos)-abs(vec2(0.0,-1.0)))
        );

    for(int i = 0; i < COUNT; i++)
    {
        vec3 p = points[i];
        float r = random(vec2((iPos.x+p.x),(iPos.y+p.y)) + phase);
        r = step(0.5,r);

        float dist = length(fPos-p.xy*size) / size;
        dist -= 1.0;
        dist = abs(dist);
        dist /= r;

        d = min(d,dist);
    }

    return d;
}

vec3 time()
{
    float period = mod(u_time,SECONDS);
    vec3 t = vec3(
            fract(u_time/SECONDS),
            period,
            1.0-fract(period)
    );

    return t;       // return fract(length),period,period phase
}


/*

    float iPos = floor(x*scale);
    float fPos = fract(x*scale);

    return mix(random(iPos), random(iPos + 1.0), fPos);


    float period = mod(u_time,SECONDS);

    st.x += 3.0 * easeInCubic((1.0-fract(period))) * stepUpDown( 0.0, 1.0, period );
    st.x -= 3.0 * easeOutCubic(fract(period)) * stepUpDown( 4.0, 5.0, period );

*/

void main() {
    // timing, if using cos+sin times are doubled
    vec3 t = time();

    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    vec2 o_st = st;
    // st *= 5.0; 
    st *= 2.0;

    st += st * 1.0 * stepUpDown( 1.0, 2.0, t.y );
    st += st * 2.0 * stepUpDown( 2.0, 3.0, t.y );
    st += st * 3.0 * stepUpDown( 3.0, 4.0, t.y );
    st += st * 4.0 * stepUpDown( 4.0, 5.0, t.y );


    // st += st * 2.0 * stepUpDown( 0.5, 1.0, t.y );
    // st += st * 3.0 * stepUpDown( 1.0, 2.0, t.y );
    // st += st * 4.0 * stepUpDown( 2.0, 3.0, t.y );
    // st += st * 3.0 * stepUpDown( 3.0, 4.0, t.y );
    // st += st * 2.0 * stepUpDown( 4.0, 4.5, t.y );

    st.y += t.z;

    vec2 offset = vec2(0.1,0.5);

    offset += random(offset) * stepUpDown( 0.0, 1.0, t.y );
    offset += random(offset) * stepUpDown( 2.0, 3.0, t.y );
    offset += random(offset) * stepUpDown( 3.0, 4.0, t.y );
    offset += random(offset) * stepUpDown( 4.0, 5.0, t.y );

    // sdf
    vec3 sdf = vec3(0.0);        
        sdf.x = cell(st,offset.x)-.1;
        sdf.y = cell(st,offset.y)-.1;

    float m = sdf.z = mix(sdf.x,sdf.y,t.z);

        sdf = 1.0-smoothstep(0.0,0.001,sdf);
        // sdf.z = mix(sdf.x,sdf.y,easeOutCubic(0.5+0.5*sin(TWO_PI*t.x)));
        sdf.z = mix(sdf.x,sdf.y,t.z)-m;
        sdf = smoothstep(0.0,0.001,sdf);

    // lines
        float aa = 0.01;
        vec2 fPos = fract(st);
        float lines = smoothstep(abs(fPos.x)-aa,abs(fPos.x)+aa,1.0-aa*.5);
            lines = min(lines,smoothstep(abs(fPos.y)-aa,abs(fPos.y)+aa,1.0-aa*.5));

    float n = random(st);
    // color
    vec3 color = vec3(0.25);
        // color = mix(color,vec3(0.3), lines);
        // color = mix(color,vec3(0.03), pow(1.0-smoothstep(0.0,0.5,m+.3),.1));
        // color = mix(color,vec3(0.05), smoothstep(0.0,4.0,m));
        color = mix(color,vec3(1.0), sdf.z);
        color += -(length(o_st- .5) ) * .25 + n *.05;

        // color = mix(color,vec3(1.0), sdf.x);

    gl_FragColor = vec4(color, 1.0);
}