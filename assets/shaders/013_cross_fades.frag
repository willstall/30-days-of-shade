#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

#define SAMPLES 34

uniform float u_float;
uniform vec2 u_vec2;
uniform vec3 u_vec3;
uniform vec4 u_vec4;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform sampler2D u_texture_5;

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

float sdTriangleIsosceles( in vec2 p, in vec2 q )
{
    p.x = abs(p.x);
    
    vec2 a = p - q*clamp( dot(p,q)/dot(q,q), 0.0, 1.0 );
    vec2 b = p - q*vec2( clamp( p.x/q.x, 0.0, 1.0 ), 1.0 );
    float s = -sign( q.y );
    vec2 d = min( vec2( dot(a,a), s*(p.x*q.y-p.y*q.x) ),
                  vec2( dot(b,b), s*(p.y-q.y)  ));

    return -sqrt(d.x)*sign(d.y);
}

float sdCross( in vec2 p, in vec2 b, float r ) 
{
    p = abs(p); p = (p.y>p.x) ? p.yx : p.xy;
    
    vec2  q = p - b;
    float k = max(q.y,q.x);
    vec2  w = (k>0.0) ? q : vec2(b.y-p.x,-k);
    return sign(k)*length(max(w,0.0)) + r;
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

vec4 scene(vec2 st,float t)
{    
    float scale = .05 * cos(TWO_PI * t * 3.0);
    // float outer_scale = .05 * sin(TWO_PI * t * 6.0);

    float crossSize = .2 - .55 * scale;
    vec4 d = vec4(0.0);  
        d.x = length(st);        
        d.y = sdCross((st)*rotate( TWO_PI * t * +5.0),vec2(0.27-0.027,0.12-0.03)*crossSize,-0.025*crossSize)/crossSize;
        d.y = min(-(d.x-.14-.99*scale),d.y);    
        d.z = abs(d.x - .28 + 1.65*scale)-.0012;
        d.z = min(d.z,abs(d.x - .3 - 4.35*scale)-.012);
        d.y = min(-d.y,d.z);// * sin(TWO_PI * t * 25.0);           // seizure mode
        d.z = abs(d.x - .35 + .14 * cos(TWO_PI * t * 3.0))-.007;
    
    const int cuts = 3;
    float cutSize = 1.0/float(cuts);//*.25;    
    float gap = 0.02 + 0.8 * abs(cos(TWO_PI*t*1.0));
    float cutLength = 1.0;  //sdf

    st *= rotate(-TWO_PI*t*5.0);
    for(int i = 0; i < 3; i++)
    {
        
        cutLength = min(cutLength,sdTriangleIsosceles(st*rotate(TWO_PI*cutSize*2.0*float(i)*2.0),vec2(gap,0.5)));
    }

    d.z = max(d.z,-cutLength);
    d.x = d.x-.14-.99*scale;

    return d;
}

float traceShadows(vec2 position, vec2 lightPosition, float t){
    vec2 direction = normalize(lightPosition - position);
    float lightDistance = length(lightPosition - position);

    float rayProgress = 0.0;
    // float nearest = 9999.0;

    for(int i=0 ;i<SAMPLES; i++){
        vec4 s = scene(position + direction * rayProgress,t);
        float sceneDist = min(s.z,s.x);

        if(sceneDist <= 0.0){
            return 0.0;
        }

        if(rayProgress > lightDistance){
            // return clamp(nearest,0.0,1.0);
            return 1.0;
        }

        // nearest = min(nearest, sceneDist);
        rayProgress = rayProgress + sceneDist;
    }

    return 0.0;
}

void main() {
    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    st -= 0.5;

    vec2 mSt = u_mouse / u_resolution;
    mSt = center( mSt );
    mSt -= 0.5;

    // timing
    float seconds = 5.0;
    float t = fract(u_time/seconds);

    // scene
    vec2 light = vec2(0.0);
    light = vec2(0.0,1.0);
        // light *= vec2(.5 * rotate(PI*.33 + PI*.33 * t * -0.0));
        // light = vec2( 25.0 * sin(TWO_PI * seconds * 1.0), 1.0 );
        // light += vec2(.5 * rotate(TWO_PI * t * 3.0));
        // light += vec2(.18 * rotate(TWO_PI * t * 5.0));

    vec4 sdf = scene(st,t);

    float shadows = traceShadows(st,light,t);

    // color
    vec3 color = vec3(0.07);       
        color = mix(color,vec3(0.3),pow(st.y-.5,.45)*random(st)*.25);

        // color = debug_sdf(d.z,true);
        color = mix(color,vec3(0.9),(1.0-smoothstep(0.0,0.001,shadows))*-pow(sdf.x*random(st)*.5,.7));
        // color = mix(color,vec3(0.2),(1.0-smoothstep(0.0,0.001,max(shadows,-sdf.x))));
        // color = mix(color,vec3(0.2),(1.0-smoothstep(0.0,0.001,shadows)));
        color = mix(color,vec3(1.0),1.0-smoothstep(0.0,0.001,sdf.y));        
        color = mix(color,vec3(1.0),1.0-smoothstep(0.0,0.001,sdf.z));
        // color = mix(color,1.0-color,sign(abs(sdf.y-.01)));
        color = mix(color,1.0-color,pow(sin(TWO_PI*t*3.0),10.0));


    gl_FragColor = vec4(color, 1.0);
}