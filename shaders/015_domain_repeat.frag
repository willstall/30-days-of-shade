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
uniform vec2 u_texture_5Resolution;

float linearstep(float begin, float end, float t) {
    return clamp((t - begin) / (end - begin), 0.0, 1.0);
}

float cubicPulse( float c, float w, float x )
{
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
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

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,vec2(0))) + min(max(d.x,d.y),0.0);
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

float cell(vec2 st)
{
    st -= 0.5;
    // st /= 0.25;
    st *= rotate(PI*.25);

    float d = sdBox(st,vec2(1.5,1.5));      // change box size because of space
    return d;
}

vec4 scene(vec2 st, float t)
{   
    st *= 6.0;

    // timing
    float iT = floor(t / .25);
    float fT = fract(t / .25);
        fT = pow(fT,.20);

    float spacing = 2.0;        
    vec2 pos = vec2(0.5,0.5);

    // ugh
    if(iT == -.0)    
        pos += vec2(0.0,-spacing)*fT;
    else if(iT == 1.0)    
        pos += vec2(0.0,-spacing) +
        vec2(-spacing,0.0)*fT;
    else if(iT == 2.0)    
        pos += vec2(-spacing,-spacing) + 
        vec2(0.0,spacing) *fT;
    else if(iT == 3.0)    
        pos += vec2(-spacing,0.0)+ 
        vec2(spacing,0.0) *fT;

    
    // crazy animation
    st -= pos * 2.0;
    st *= 0.8 * (1.0-fT);
    st *= rotate( TWO_PI / 4.0 * (iT + fT));

    // sdf
    vec4 sdf = vec4(0.0);
        sdf.x = cell(fract(st));

        // sdf.y = sdBox(st-pos,vec2(.25));

        // sdf.y = cell(st-pos)+1.15;

    return sdf;
}

float traceShadows(vec2 position, vec2 lightPosition,float t){
    vec2 direction = normalize(lightPosition - position);
    float lightDistance = length(lightPosition - position);

    float rayProgress =  0.0001;
    float nearest = 9999.0;
    float hardness = 8.50 + random(position) * .50;

    for(int i=0 ;i<SAMPLES; i++){
        vec4 scene = scene(position + direction * rayProgress,t);
        float sceneDist = scene.y;

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
    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    st = st * 2.0 - 1.0;

    // timing
    float seconds = 6.0;
    float t = fract(u_time/seconds);

    // sdf
    vec4 sdf = scene(st,t);

    // light & shadows
    vec2 light = vec2(0.0,0.0);
    float shadows = traceShadows(st,light,t);

    // colors
    vec3 background = vec3(254.0,226.0,223.0) / 255.0;
    vec3 shadow = vec3(0.07);

    vec3 cyan = vec3(51.0,180.0,182.0) / 255.0;
    vec3 blue = vec3(36.0,39.0,90.0) / 255.0;
    vec3 yellow = vec3(245.0,177.0,71.0) / 255.0;
    vec3 pink = vec3(240.0,41.0,86.0) / 255.0;

    const int COLOR_COUNT = 8;

    vec3 colors[COLOR_COUNT];
        colors[0] = cyan;
        colors[1] = background;
        colors[2] = blue;
        colors[3] = background;
        colors[4] = yellow;
        colors[5] = background;
        colors[6] = pink;
        colors[7] = background;

    // color
    vec3 color = vec3(0.07);
        color = background;        

    // color = mix(color,vec3(0.04),smoothstep(0.0,1.0,1.0-shadows));
    // color = mix(color,vec3(1.0), 1.0 - smoothstep(0.0,0.002,sdf.x));

    // color = mix(color,pink,ceil(fract(sdf.x*10.0)+1.0));
    // color = mix(color,pink,
    //     floor(mod(sdf.x*10.0,4.0))
    // );
    t = t * float(COLOR_COUNT) - 1.0;

    int color_index = int(floor(mod(sdf.x*20.0+t,float(COLOR_COUNT))));
    // float color_index = floor(mod(sdf.x*24.0,4.0));

    for(int i = 0; i < COLOR_COUNT; i++)
    {     
        vec3 c = colors[i];

        if(i == int(color_index)){
            color = mix(color,c,1.0 - smoothstep(0.0,0.003,sdf.x));
        }
    }

    // color -= background*.9 * (1.0 - smoothstep(0.0,0.003,shadows));
    // color = mix(color,shadow,smoothstep(0.0,1.0,1.0-shadows));

    // color correction
    // color -= pow(length(st)-.1,1.8) * 0.1;
    // color += .07;

    // moving cell
    // color = mix(color,pink,1.0-sign(sdf.y));

    // int color_index = int(floor(mod(sdf.x*20.0,float(COLOR_COUNT*2))));

    // for(int i = 0; i < COLOR_COUNT+COLOR_COUNT; i++)
    // {
    //     vec3 c = colors[i];

    //     if(mod(float(i),2.0) == 1.00)
    //     {
    //         c = background;

    //     }else if(i == color_index){
    //         color = mix(color,c,1.0 - smoothstep(0.0,0.003,sdf.x));
    //     }

    //     // color = mix(color,c*sdf.x,sdf.z)/.999;
    // }



    // color = mix(color,pink,fract(sdf.x*10.0));
    // color = mix(color,pink,floor(mod(fract(sdf.x*10.0),2.0)+1.0));

    // color = mix(color,vec3(1.0),sign(sdf.xyz));        
    // color = mix(color,vec3(1.0),sdf.xyz);
    // color = mix(color,debug_sdf(sdf.y,true),1.0);
    // color = mix(color,vec3(1.0),
    //     max(
    //         step( -0.0015 , st.x ) * step( st.x, 0.0015 ),
    //         step( -0.0015 , st.y ) * step( st.y, 0.0015 )
    //     )
    // );

    gl_FragColor = vec4(color, 1.0);
}