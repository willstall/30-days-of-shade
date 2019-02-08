#ifdef GL_ES
    precision mediump float;
#endif

#define SECONDS 5.0
#define SAMPLES 20

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307



uniform float u_float;      // defaults to 0
uniform vec2 u_vec2;
uniform vec3 u_vec3;
uniform vec4 u_vec4;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform sampler2D u_texture_5;
uniform vec2 u_texture_5Resolution;

float sinc( float x, float k )
{
    float a = PI * ((float(k)*x-1.0));
    return sin(a)/a;
}

float easeInCubic(float t) {
    return t * t * t;
}

float easeOutCubic(float t) {
    return (t = t - 1.0) * t * t + 1.0;
}

float cubicPulse( float c, float w, float x )
{
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
}

vec3 debug_sdf(float sdf, bool full)
{
   vec3 color = vec3(1.0) - sign(sdf)*vec3(0.1,0.4,0.7);
   if(full)
   {
	color *= 1.0 - exp(-2.0*abs(sdf));
	color *= 0.89 + .5*cos(400.0*sdf);
	color = mix( color, vec3(1.0), 1.0-smoothstep(0.0,0.01,abs(sdf)) );
   }

    return color;
}

float random(float x)
{
    return fract(sin(x*100.00)*10000.0);
}

float random( in vec2 st )
{
	return fract( sin( dot(st.xy, vec2(-30.950,-10.810) )) * 43758.5453123  );	    
}

float dot2(in vec2 v ) { return dot(v,v); }

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,vec2(0))) + min(max(d.x,d.y),0.0);
}

float sdLine( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

float sdTrapezoid( in vec2 p, in float r1, float r2, float he )
{
    vec2 k1 = vec2(r2,he);
    vec2 k2 = vec2(r2-r1,2.0*he);

    p.x = abs(p.x);
    vec2 ca = vec2(p.x-min(p.x,(p.y < 0.0)?r1:r2), abs(p.y)-he);
    vec2 cb = p - k1 + k2*clamp( dot(k1-p,k2)/dot2(k2), 0.0, 1.0 );
    
    float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
    
    return s*sqrt( min(dot2(ca),dot2(cb)) );
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

float round_border(float shape1, float shape2, float radius){
    vec2 position = vec2(shape1, shape2);
    float distanceFromBorderIntersection = length(position);
    return distanceFromBorderIntersection - radius;
}

float stepUpDown(float begin, float end, float t) {
  return step(begin, t) - step(end, t);
}

vec3 scene(vec2 st, float t)
{
    float slide = 0.5+0.5*sin(TWO_PI*t);
    slide = 1.0-exp(slide);
    slide = cubicPulse(slide,1.0,0.0);
    // slide = sinc(slide,.3);

    float period = mod(u_time,SECONDS);
        st.x += 3.0 * easeInCubic((1.0-fract(period))) * stepUpDown( 0.0, 1.0, period );
        st.x -= 3.0 * easeOutCubic(fract(period)) * stepUpDown( 4.0, 5.0, period );
        // st.x += 3.0 * period * stepUpDown( 0.0, 3.0, period );
        // st.x += 3.0 * (1.0-period) * stepUpDown( 4.0, 5.0, period );

    // st.x += mix(1.0,-1.0,slide);

    // sdf
    float a = (0.5+0.5*sin(TWO_PI*t*2.0));
        a = pow(a,3.9);
        a = .24 * a;

    float size = .5;
	    size = size - size * 2.5 * a;
    
    float spacing = .14;
        spacing += a;

    float rounding = 0.025;
    	rounding = rounding + rounding * 2.5 * a;

    vec2 offset = vec2(0.0,-0.15);

    st *= rotate(-TWO_PI * 2.0 * easeInCubic((1.0-fract(period))) * stepUpDown( 2.0, 3.0, period ));

    // offset.y *= 3.0 * pow(cos(TWO_PI*t),1.1);
    offset.y -= a * 1.5;
    st += offset;
    
    vec3 sdf = vec3(1.0);        
        // top bun
        sdf.x = length(st-vec2(0.0,-0.22))-size-0.025;
        sdf.y = sdBox(st-vec2(0.,size*.5),vec2(size*1.,size*.5))+0.025;
        sdf.x = max(sdf.x,sdf.y)-rounding;

        // bottom bun
        sdf.y = sdTrapezoid(st+vec2(0.0,spacing*3.0),size-0.0,size,.05);
        sdf.x = min(sdf.x,sdf.y);

        // patty
        sdf.z = sdLine(st,vec2(-size,-spacing*2.0),vec2(size,-spacing*2.0));
        // sdf.z = min(sdf.x,sdf.y);
        
        // scquiggle
    float y = .015 * sin(.1*st.x*300.0+TWO_PI*t) - spacing;   
        sdf.y = sdLine(st,vec2(-size,y),vec2(size,y));
        // sdf.y = min(sdf.x,sdf.y);
    
    	// rounding
        sdf -= rounding;
    // morph
        st -= offset;
        st *= rotate(TWO_PI*t*10.0);

        float d1 = length(st)-size*.75;        
        float d2 = max(d1,sdBox(st,vec2(size,size*.5)));

        
        float d = mix(d1,d2,0.5+0.5*sin(TWO_PI*t*1.0)) - rounding;

        float m = 0.5+0.5*cos(TWO_PI*t*2.0);
        m = pow(m,5.9);

        sdf = mix(sdf,vec3(d),m);

        return sdf;
}

float traceShadows(vec2 position, vec2 lightPosition,float t){
    vec2 direction = normalize(lightPosition - position);
    float lightDistance = length(lightPosition - position);

    float rayProgress =  0.0001;
    float nearest = 9999.0;
    float hardness = 8.50 + random(position) * .50;

    for(int i=0 ;i<SAMPLES; i++){
        vec3 scene = scene(position + direction * rayProgress,t);
        float sceneDist = min(min(scene.x,scene.y),scene.z);
        // sceneDist = scene.x;

        if(sceneDist <= 0.0){
            return 0.0;
        }
        if(rayProgress > lightDistance){
            return clamp(nearest,0.0,1.0);
            //return 1.0;
        }

        nearest = min(nearest, hardness * sceneDist / rayProgress);
        rayProgress = rayProgress + sceneDist;
    }

    return 0.0;
}

void main() {
    // timing, if using cos+sin times are doubled    
    float t = fract(u_time/SECONDS);

    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    st = st * 2.0 - 1.0;

    st *= 1.0;

    // sdf
    vec3 sdf = scene(st,t);

    // light
    vec2 light = vec2(1.0,1.0);
        // light.x += 1.0 * cos(TWO_PI*t*1.0);

    float shadows = traceShadows(st,light,t);

    // color
    // vec3 c_bun = vec3(0.845,0.758,0.708);
    // vec3 c_patty = vec3(00.800,0.312,0.396);
    // vec3 c_lettuce = vec3(0.478,0.800,0.564);
    // vec3 c_bg = vec3(0.910,0.906,0.915);
    // vec3 c_shadow = vec3(0.875,0.871,0.880);

    // alt color
    vec3 c_bun = vec3(0.970,0.828,0.723);
    vec3 c_patty = vec3(0.930,0.293,0.419);
    vec3 c_lettuce = vec3(0.548,0.990,0.353);
    vec3 c_bg = vec3(0.820,0.446,0.625);
    vec3 c_shadow = vec3(0.710,0.361,0.515);

    vec3 color = vec3(c_bg);
        color = mix(color,c_shadow,1.0-smoothstep(0.0,0.005,shadows));    
        color = mix(color,c_patty,1.0-smoothstep(0.0,0.005,sdf.z));
        color = mix(color,c_lettuce,1.0-smoothstep(0.0,0.005,sdf.y));
        color = mix(color,c_bun,1.0-smoothstep(0.0,0.005,sdf.x));
        


        color += color * 0.1;

    // vignette
        // color += 1.0-(length(st)-0.07) *.01;

    gl_FragColor = vec4(color, 1.0);
}