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

float random(float x)
{
    return fract(sin(x*31.00)*10000.0);
}

float random(vec2 st)
{
    return fract(
        dot(
            sin(st.x*132.00),
            sin(st.y*107.00)        
        )*10000.0);
}

float smoothCellRandom(float x,float scale)
{   
    float iPos = floor(x*scale);
    float fPos = fract(x*scale);

    return mix(random(iPos), random(iPos + 1.0), smoothstep(0.,1.,fPos));
}

float peakCellRandom(float x,float scale)
{   
    float iPos = floor(x*scale);
    float fPos = fract(x*scale);

    return mix(random(iPos), random(iPos + 1.0), fPos);
}

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,vec2(0))) + min(max(d.x,d.y),0.0);
}

float sdEquilateralTriangle(  in vec2 p )
{
    float k = sqrt(3.0);
    
    p.x = abs(p.x) - 1.0;
    p.y = p.y + 1.0/k;
    
    if( p.x + k*p.y > 0.0 ) p = vec2( p.x - k*p.y, -k*p.x - p.y )/2.0;
    
    p.x -= clamp( p.x, -2.0, 0.0 );
    
    return -length(p)*sign(p.y);
}

/*
float opScale( in vec3 p, in float s, in sdf3d primitive )
{
    return primitive(p/s)*s;
}
*/

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

vec3 debugSdf(float sdf, bool full)
{
   vec3 color = vec3(1.0) - sign(sdf)*vec3(0.1,0.4,0.7);
   if(full)
   {
	color *= 1.0 - exp(-2.0*abs(sdf));
	color *= 0.8 + 0.2*cos(80.0*sdf);
	color = mix( color, vec3(1.0), 1.0-smoothstep(0.0,0.01,abs(sdf)) );
   }

    return color;
}

void main()
{
    // config
    float t = u_time*.13;
    float r = smoothstep(0.0,1.0,PI*sin(t*3.0)+.5);
    // float r2 = smoothstep(0.0,1.0,PI*cos(t*1.0)+.5);

    float size = 0.35;
    float margin = 0.05;
    float border = 0.02;
    float pinch = 0.1;

    float base = size;
    float major = size + border + margin;
    float minor = size + border + margin * 3.0;

    base -= pinch*r;
    major -= pinch*r;
    minor += pinch*r;

    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    st = st * 2.0 - 1.0;

    // rotate
    vec2 origin_st = st;
    st *= rotate(TWO_PI*.5*r);

    // sdf
    vec2 pos = st+vec2(0.0,0.1);
    float d = 0.0;

    // noise
    float n = smoothCellRandom(origin_st.x+t*3.0,.7);
    n *= smoothCellRandom(n+60.0,2.0);
    // n = mix(1.0,n,r);
    // n = n*r;

    // triangle
    float tri = sdEquilateralTriangle(pos/base)*base;
    tri = max(smoothstep(0.0,20.0,sin((origin_st.y+n+t*.5)*80.0)),tri);
    d = tri;

    // major outline
    float major_tri = sdEquilateralTriangle(pos/major)*major;
    major_tri = abs(major_tri+border*.25)-border*.25;
    d = min(d,major_tri);
    // d = major_tri;
    // d = max(major_tri,-tri);
    
    // minor outine
    float minor_tri = sdEquilateralTriangle(pos/minor)*minor;
    minor_tri = abs(minor_tri+border)-border;
    d = min(d,minor_tri);
    // d = minor_tri;

    // color
    vec3 color = vec3(0.1);        
    color = mix(color,vec3(1.0),1.0-smoothstep(0.0,0.002,d));
    color += vec3(1.0) * (1.0-smoothstep(0.0,.15,pow(major_tri,0.9)))*.05;

    // vignette
    float vignette = pow((1.0-length(st/3.0)-.01),.7)*.4;
    color += vignette;

    // debug
    // d = tri;
    // d = smoothstep(0.0,1.0,sin((origin_st.y+n)*200.0));
    // color = debugSdf(d,true);

    gl_FragColor = vec4(color, 1.0);
}

/*

vec3 q = mod(p,c)-0.5*c;
    return primitve( q );

*/