#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

#define SAMPLES 20

uniform float u_float;
uniform vec2 u_vec2;
uniform vec3 u_vec3;
uniform vec4 u_vec4;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform sampler2D u_texture_5;
uniform vec2 u_texture_5Resolution;

float parabola( float x, float k )
{
    return pow( 4.0*x*(1.0-x), k );
}

float cubicPulse( float c, float w, float x )
{
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
}

float random(float x)
{
    return fract(sin(x*100.00)*10000.0);
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

float lnoise(float x, float edges) {

    // cycle the edges
    x = mod(x,edges);

    float i = floor(x); // floored integer component
    float f = fract(x); // fractional component
    float u = f*f*f*(f*(f*6.-15.)+10.); // use f to generate a curve

    // interpolate from the current edge to the next one wrt cycles
    return mix(random(i), mod(random(i + 1.0),edges), u); 
}

float smoothCellRandom(float x,float scale)
{   
    float iPos = floor(x*scale);
    float fPos = fract(x*scale);

    return mix(random(iPos), random(iPos + 1.0), smoothstep(0.,1.,fPos));
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

float waves(vec2 st, float t)
{
    float loopLength = 2.;
    float transitionStart = 1.5;
    float time = mod(u_time, loopLength);

    float v1 = smoothCellRandom(st.x + time,3.1);
    float v2 = smoothCellRandom(st.x + time - loopLength,.5);

    float transitionProgress = (time-transitionStart)/(loopLength-transitionStart);
    float progress = clamp(transitionProgress, 0., 1.);

    // An improvement could be to use a curve to interpolate between the two
    float result = mix(v1, v2, progress);
    return result;    
}

vec4 scene(vec2 st, float t)
{   
    vec2 pos = vec2(0.0);
        // pos += 0.1 * rotate( TWO_PI * t ) );     // rotate

    vec3 popsicle_size = vec3(0.25,0.34,0.04);      // width, height, corner radius
    vec2 stick_size = vec2(0.0,0.5);    // width, height

    vec2 offset = vec2(0.0);
        offset += vec2(1. * sin(TWO_PI * t * 1.0),0.0);

    // float n = noise(st + offset);
    float r = 1.0;//smoothCellRandom((st.x)+5.1*sin(TWO_PI*t),.085);
        r = smoothCellRandom((st.x+90.0),2.05)/2.0;
        // r -= smoothCellRandom((st.x+1.0)-u_time*1.0,0.85);
        // r = smoothCellRandom(st.x+19.0,.8);
        // r -= smoothCellRandom(st.x+r,2.5);
        // r *= 0.5;

        // r = smoothCellRandom(st.x+19.0,.4 + .1 + t);
        
        // r = mix(smoothCellRandom(st.x-1.0,.8+sin(TWO_PI*t)), smoothCellRandom(st.x+9.0,.8+cos(TWO_PI*t)),smoothstep(0.0,1.0,abs(sin(TWO_PI*t*5.0))));
        // r = mix(smoothCellRandom(st.x,.8), smoothCellRandom(st.x + 1.0,.8), parabola(t+1.0,1.0));

    // t = min(5.0*t, 1.0) * 0.5;  // change t in order to front load objects

    // timing for coming together
    float t1 = min(3.0*t, 1.0) * 0.5;
        t1 = sin(TWO_PI*t1);
        

    // timing for dissolve
    float t2 = min(0.8 * fract(t+.15)+.2, 1.0);
        t2 = cos(TWO_PI*t2);

    // t1 = t2 =0.0;       // keep popsicle still for debugging

    vec2 stick_offset = vec2(0.0);
        stick_offset.y += 2.5 * t1;

    vec2 popsicle_offset = vec2(0.0);
        popsicle_offset.y -= 2.5 * t1;

    vec4 sdf = vec4(0.0);

        // popsicle
        sdf.x = sdBox(st+popsicle_offset,vec2(popsicle_size.x,popsicle_size.y));      // box
        sdf.y = sdBox(st+popsicle_offset+vec2(0.0,popsicle_size.z),vec2(popsicle_size.x-popsicle_size.z,popsicle_size.y-popsicle_size.z))-popsicle_size.z;      // bottom corners
        sdf.x = min(sdf.x,sdf.y);
        sdf.y = length(st+popsicle_offset+vec2(0.0,-popsicle_size.y))-popsicle_size.x;    // top
        sdf.x = min(sdf.x,sdf.y);   // combine

        // stick
        sdf.y = sdBox(st+stick_offset,vec2(stick_size.x,stick_size.y))-0.06;    // stick
        
        // color
        // st *= rotate(TWO_PI * t * 2.0);
        vec2 local_st = st*rotate(TWO_PI * t * -2.0);
        sdf.w = vec2(st).y - 1.0  + r;
        sdf.z = smoothstep(-1.0,1.0,sdf.w) * 2.0 - 1.0;
        sdf.z = max(sdf.x,sdf.z);   // frame the noise

        // dissolve popsicle
        float dissolve = 1.0-(st.y+4.*t2)-smoothCellRandom(st.x+cos(TWO_PI*t)*4.8,3.4)*0.07;

        // sdf.x = dissolve;
        sdf.x = max(sdf.x,-dissolve);
        sdf.z = max(sdf.z,-dissolve);

        // sdf.x = max(sdf.x,(st.y-2.0+2.0*t1+smoothCellRandom(st.x+u_time,2.5)));

        // sdf.x = max(sdf.y,-sdf.w*t*3.0);

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
        float sceneDist = min(scene.x,scene.y);

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

void main()
{
    // timing
    float seconds = 5.0;
    float t = fract(u_time/seconds);

    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    st = st * 2.0 - 1.0;
    st *= rotate(TWO_PI * t * 5.0);

    st *= 0.8 + +.25 * (0.5-0.5*cos(TWO_PI * t * 2.0));
    // sdf
    vec4 sdf = scene(st,t);

    // colors
    vec3 pink = vec3(251.0,201.0,255.0)/255.0;
    vec3 pinker = vec3(255.0,161.0,212.0)/255.0;
    vec3 yellow = vec3(254.0,249.0,203.0)/255.0;
    vec3 green = vec3(123.0,255.0,245.0)/255.0;
    vec3 blue = vec3(50.0,239.0,255.0)/255.0;
    vec3 stick = vec3(246.0,244.0,231.0)/255.0 + 0.065;

    vec3 background = vec3(212.0,225.0,226.0)/255.0;
        // background = vec3(191.0)/255.0;
    
    // vec3 shadow = vec3(194.0,214.0,218.0)/255.0 +.0;
    vec3 shadow = vec3(194.0,207.0,210.0)/255.0 +.05;
        // shadow = vec3(200.0)/255.0;
    // shadow = vec3(190.0,220.0,230.0)/255.0;
    
    // new colors, but introduces artifacts
    // background = vec3(207.0,237.0,244.0)/255.0;
    // shadow = mix(background,vec3(0.0),0.03);

    const int color_count = 5;

    vec3 colors[color_count];
        colors[0] = pinker;
        colors[1] = yellow;
        colors[2] = green;
        colors[3] = blue;
        colors[4] = pink;

    // light
    vec2 light = vec2(2.0,2.0);
        light *= rotate(TWO_PI * t * 5.0);

    float shadows = traceShadows(st,light,t);

    // color
    vec3 color = vec3(0.07);
    color = background;
    // color -= .2 * (1.0-length(st)-.5) + random(st) * .01;
    color = mix(color,shadow,smoothstep(0.0,1.0,1.0-shadows));
    color = mix(color,stick, 1.0 - smoothstep(0.0,0.002,sdf.y));
    color = mix(color,pink, 1.0 - smoothstep(0.0,0.002,sdf.x));
    
    // color the popsicle
    float z = pow( -sdf.w,8.55 ) * 10.0+ 50. * fract(t);
    int color_index = int(floor(mod(z,float(color_count))));

    for(int i = 0; i < color_count; i++)
    {
        vec3 c = colors[i];
        if(i == color_index)
            color = mix(color,c,1.0 - smoothstep(0.0,0.003,sdf.z));

        // color = mix(color,c*sdf.x,sdf.z)/.999;
    }

    color *= color * 1.0;



    // popsicle w/o wave coloring
    // color = vec3(0.07);
    // color = mix(color,stick, 1.0 - step(0.0,sdf.y));
    // color = mix(color,pink, 1.0 - step(0.0,sdf.x));
    // color = mix(color,pinker, 1.0 - step(0.0,sdf.z));

    // color = vec3(1.0)*debug_sdf(sdf.z,true);
    // color = vec3(1.0)*debug_sdf(sdf.x,true);
    // color = vec3(1.0)*debug_sdf(shadows,true);
    // color += shadows;

    gl_FragColor = vec4(color, 1.0);
}