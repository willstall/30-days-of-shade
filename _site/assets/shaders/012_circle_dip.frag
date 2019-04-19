/*

    daily: 012
    author: Will Stallwood
    insta: https://www.instagram.com/willstall/
    
*/

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

float fbm(vec2 st, vec3 powers, float scale)
{
    st /= scale;
    float d = noise(st)*scale;
        d += noise(st+powers.x)*scale;
        d += noise(st+powers.y)*scale;
        d += noise(st+powers.z)*scale;
        // d /= 3.0;
        d *= .33;

    return d;
}

mat2 rotate(float angle)
{
    return mat2( cos(angle),-sin(angle),sin(angle),cos(angle) );
}

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,vec2(0))) + min(max(d.x,d.y),0.0);
}


// float sdEquilateralTriangle( in vec2 p )
// {
//     float k = sqrt(3.0);
    
//     p.x = abs(p.x) - 1.0;
//     p.y = p.y + 1.0/k;
//     if( p.x + k*p.y > 0.0 ) p = vec2( p.x - k*p.y, -k*p.x - p.y )/2.0;
//     p.x -= clamp( p.x, -2.0, 0.0 );
//     return -length(p)*sign(p.y);
// }

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
	color *= 0.89 + .5*cos(80.0*sdf);
	color = mix( color, vec3(1.0), 1.0-smoothstep(0.0,0.01,abs(sdf)) );
   }

    return color;
}

float sdf_iso_lines(float sdf,float amt,float size, float ratio)
{
    // float amt = 0.02;
    // float size = 0.01;
    float half_amt = amt * .5;
    float m_size = 0.01;
    
    float minor = abs(fract(sdf/amt + 0.5)-0.5)*1.0;
    float major = abs(fract(sdf/(amt*ratio) + 0.5)-0.5)*1.0;

    minor = smoothstep(half_amt-size,half_amt+size,minor);
    major = smoothstep(amt*ratio-size,amt*ratio+size,major);

    float t = major*minor;
    return t;    
}



float scene(vec2 st)
{

    // pos.y += 0.3;
    // repeat pos
    // vec2 rep = vec2(0.25,0.25);
        // rep = mod(pos,rep)-0.5*rep;

    //sdf
    float t = u_time/30.0 * 10.0;

    vec2 pos = st-vec2(0.5);
        pos.y += .09;

    float fade =fract(pos.y);
    float offset = .35 * sin(TWO_PI * t);
    float circ = length(pos+vec2(0.0,-.3+offset))-.1;
    float tri = 0.0;//sdEquilateralTriangle((pos-vec2(0.0,-0.045))/.2)*.2;
    tri = circ-.12+0.03*fade*sin(TWO_PI * t);

    float box = sdBox(vec2(st.x,st.y),vec2(3.0,pow(0.07,st.y))*sin(st.y*1000.0)+.2);
    
       // 1.0-pow(0.5-st.y,0.5);

    float jitter = 0.5-0.5*sin(pos.y*500.0)-.12;
    float fBox = sdBox(pos-vec2(0.0,-0.25),vec2(.5,.25));

    t = sin(TWO_PI * t);

    float n = fbm(pos+sin(t),vec3(t*0.4,t*1.4,-t*3.3),0.21);//noise(pos/.13+u_time*3.33)*.13;//*noise(pos)*noise(pos+vec2(3.0,5.0)))/3.0;
    // n = smoothstep(0.0,0.0,st.y);
    float d = tri;
    // t = fade;

    float top = max(tri,-fBox);
    float m_top = min(top-(n*pow(fade*2.9,3.5))*fade*3.0,top);

    float bottom = max(tri,fBox);
    // bottom = max(bottom,-fade);
    // d = max(tri-pow(st.y,0.5-n),-fBox);    
    // d = max(-top,-bottom);
    // d = d / top;

    // jitter = smoothstep(0.0,0.4,pow(jitter,fade*.5));
    jitter = jitter*pos.y*fade;
    // jitter = jitter*pow(fade,pos.y*.01);
    // jitter *= 0.5-0.5*sin(jitter*TWO_PI)-.3;
    // jitter = pow(jitter,1.1);
    // jitter *= abs(sin(jitter)-0.2*jitter);
    // jitter *= sin(fade*offset*TWO_PI)-.3;
    jitter *= min(circ,fade)-(pos.y*fade)*3.0;
    jitter = smoothstep(0.0,0.99,jitter);

    // jitter = pow(fade,1000.0);      // give us a decent fade to work with the bottom
    // jitter = sin(pos.y*500.0)*d;
    // jitter = smoothstep(0.0,5.0,0.01-jitter);

    d = mix(top,m_top,0.3+fade);
    d = min(d,fBox);
    d = max(d,-max(bottom,-jitter*5.0));

    // d = pow(fade,8.0);      // give us a decent fade to work with the bottom
    // d = sin(pos.y*300.0)*d;

    // d = box;
    // d = jitter;
    // d = step(0.0001,d);


    // d = sign(d);
    return d;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    // st *= 2.0 - 1.0;

    // st *= 2.0;

    vec2 fPos = fract(st);
    vec2 iPos = floor(st);

    // if(iPos == vec2(0.0))
    // {
    //     st = st - 4.0;
    // }else if(iPos == vec2(0.0,1.0))
    // {
    //     st = vec2(0.0);
    // }

    float d = scene(st);
    // d *= 1.0-mod(st.y,1.0);
    // d = smoothstep(0.0,0.001,d);
    // float t = u_time * 1.33;
    // float offsetStrength = 2.0;
    // vec2 pos = vec2(
    //     fPos.x-offsetStrength*sin(t),
    //     fPos.y-offsetStrength*cos(t)
    // );
    // pos += vec2(33.0,10.1);

    // const int SHADES = 4;
    // float s_f = 1.0/float(SHADES);
    // float s = 1.0;
    // float aa = .001 * cos(HALF_PI+t);
    // // float r = .01 * noise(pos);

    // for( int i = 0; i < SHADES;i++)
    // {   
    //     float degree = float(i)/float(SHADES);
    //     // s -= smoothstep(.0+degree,.01+degree,d*s_f);
    //     // s -= smoothstep(.0+d*s_f,.01+d*s_f,d*s);
    //     s -= step(aa/d,d*degree)*s_f;

    // } 

    vec3 color = vec3(1.0);
    // color = vec3(1.0) * d;
    // color += pow(fPos.y-.5,.3);     // cool way to get nice gradient in center of screen
    // color += pow(fPos.y-.25,.3);

    // color = vec3(1.0) * smoothstep(0.0,0.0001,d * pow(fPos.y-.41,0.13)+.01);// * pow(fPos.y-.41,.3)+.3;
    // d *= -(pow(fPos.y-.41,0.13)+.01)*0.001;
    d = smoothstep(0.0,0.0001,d);
    d = mix(d,0.1,pow(fPos.y-.41,0.43)+.005 + random(st) *.03 );
    d = smoothstep(0.0,0.5,d);
    color = mix(color,vec3(0.05),1.0-d);
    // color += smoothstep(0.0,0.0001,d * pow(fPos.y-.41,0.13)+.01);

    // color = mix(color,debugSdf(d,true),1.0);

    gl_FragColor = vec4(color, 1.0);
}