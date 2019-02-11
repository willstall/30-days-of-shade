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

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

float random( in vec2 st )
{
	return fract( sin( dot(st.xy, vec2(-30.950,-10.810) )) * 43758.5453123  );	    
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

float sdf_iso_lines(float sdf,float amt,float size, float ratio)
{
    // float amt = 0.02;
    // float size = 0.01;
    float half_amt = amt * .5;

    float minor = abs(fract(sdf/amt + 0.5)-0.5)*1.0;
    float major = abs(fract(sdf/(amt*ratio) + 0.5)-0.5)*1.0;

    minor = smoothstep(half_amt-size,half_amt+size,minor);
    major = smoothstep(half_amt-size,half_amt+size,major);

    float t = major*minor;
    return t;    
}

float cubicPulse( float c, float w, float x )
{
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
}

void main() {
    // config
    float scale = 3.0;
    float t = u_time/30.0 * 5.0;        // code works but is off by 1.0, this is a 6 second animation

    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );

    vec2 origin_st = st;

    // st.x += u_time;

    // modulate
    float r = noise(vec2(st.x+t, st.y));

    float offset = 0.07;
    vec2 pos = vec2(0.5);
        pos.x += offset * sin(TWO_PI*t);
        pos.y += offset * cos(TWO_PI*t);

    st.x += offset * sin(TWO_PI*t);
    st.y += offset * cos(TWO_PI*t);

    
    
    // sdf
    float c = 1.0 - length(st-pos);

    // c -= 2.0 / scale;
    c -= .70;
    // c = pow(1.00,.55*c);

    float d = 1.0;
    d = c;
    // d = 1.0-(length(st-0.5)/r)-.1;
    // d = 0.5+0.5*sin(pow(d*10.0,1.0));
    // d = smoothstep(0.3,1.0,d);
    
    // voronoi
    vec2 sSt = st * scale * scale;
    vec2 iSt = floor(sSt);
    vec2 fSt = fract(sSt);
    vec2 seed = vec2(31.00,1.0);    
    vec2 p;

    // get sdf based on neighbors
    for(int x = -1; x <= 1; x++)
    {
        for(int y = -1; y <= 1; y++)
        {
            vec2 offset = vec2(x,y);            
            vec2 point = random2(iSt+offset+seed);
                // point *= 0.5 + 0.5 * sin(u_time * 0.5 + TWO_PI * point );

            // float diff = length(fSt - point - offset);
            // float diff = pow(length(fSt-point-offset),3.0)*d;
            float diff = length(fSt-point-offset)*d;

            // diff *= d;
            // diff = smoothstep(0.0,c * scale,diff);
            if(d > diff)
            {
                d = diff;
                p = point;
            }
        }
    }

    // shade island
    float outside =  smoothstep(0.062,0.063,d+.04);
    float z = 1.0;
    
    z = sdf_iso_lines(d,pow(d,1.3),0.4,0.25);  // get isolines
    z = smoothstep(0.50,0.56,z);    // refine islines
    z = outside * smoothstep(0.0,1.0,z);   // remove outside
    z += 1.0-outside;   // remove holes

    float shade = max(c,1.0-outside);

    // make sdf without hard cuts to iterate shade through

    // z = d+.03;
    // z = cubicPulse(d,0.1,0.0);
    // z = max(z,smoothstep(0.0,0.2,c));

    

    // show topography as shades

    /*
    const int SHADES = 5;
    float s_f = 1.0/float(SHADES);
    float s = 1.0;
    float aa = 0.05;
    // aa = .03;

    for( int i = 0; i < SHADES;i++)
    {   
        float degree = float(i)/float(SHADES);
        // s -= smoothstep(.0+degree,.01+degree,d*s_f);
        // s -= smoothstep(.0+d*s_f,.01+d*s_f,d*s);
        s -= step(aa,d*degree)*s_f;
    }   
    */

    // z = min(s,z);
    // z = sign(length(pos-st)-.1);
    // color
    vec3 color = vec3(0.04);
    color = mix( color, vec3(1.0),1.0-z);

    // vignette
    c = length(origin_st-0.5);
    color += (vec3(-0.18)*c*random(origin_st)*.5+.1);

    // color = mix(color,vec3(.8),1.0-z*-s);
    
    // color = mix( color, vec3(0.1),z*s);

    // color += z*24.0;
    // color = mix( color, vec3(0.5),1.0-z+s);

    gl_FragColor = vec4(color, 1.0);
}