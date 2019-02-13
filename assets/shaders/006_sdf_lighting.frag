/*

    daily: 006
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

uniform sampler2D u_buffer0;
uniform sampler2D u_buffer1;

vec3 FindNormal(sampler2D tex, vec2 uv, float u)
{
    //u is one uint size, ie 1.0/texture size
    vec2 offsets[4];
    offsets[0] = uv + vec2(-u, 0);
    offsets[1] = uv + vec2(u, 0);
    offsets[2] = uv + vec2(0, -u);
    offsets[3] = uv + vec2(0, u);
    
    float hts[4];
    for(int i = 0; i < 4; i++)
    {
        hts[i] = texture2D(tex, offsets[i]).x;
    }
    
    vec2 _step = vec2(1.0, 0.0);
    
    vec3 va = normalize( vec3(_step.xy, hts[1]-hts[0]) );
    vec3 vb = normalize( vec3(_step.yx, hts[3]-hts[2]) );
    
    return cross(va,vb).rbg; //you may not need to swizzle the normal
    
}

vec3 palette(float t,vec3 a,vec3 b,vec3 c,vec3 d )
{
    return a + b * cos( TWO_PI * (c*t+d));
}

vec2 center(vec2 st)
{
    float aspect = u_resolution.x/u_resolution.y;
    st.x = st.x * aspect - aspect * 0.5 + 0.5;
    return st;
}

vec3 colorize(float d,float t)
{
    return palette(d+t,vec3(0.5),
        vec3(0.5,0.5,0.5),
        vec3(0.5,0.5,0.5),
        vec3(0.0,.1,0.2));    
}

void main()
{
    vec2 st;    

    vec3 buffer,color;

    #ifdef BUFFER_0      
        st = gl_FragCoord.xy / u_resolution.xy;
        st = center(st);
        buffer = texture2D(u_buffer0, st).rgb;
        // buffer *= 0.9999;       
        vec2 position = vec2(0.5+0.1*sin(u_time),0.5+0.1*cos(u_time));
        // float t = u_time * 1.0;
        float d = length(st - position) - .3;
        // d = length(st - vec2(0.5)) - .1;

        d = abs(sin(d*20.0))-0.6;

        // d = step(0.1,d); 
        d = smoothstep(0.0,0.3,d);
        color = vec3(0.0);      
        color += d;

        // color = mix(buffer,color,.03);
        // color *= d;

        gl_FragColor = vec4(color, 1.0);
    #elif defined( BUFFER_1 )
        st = gl_FragCoord.xy / u_resolution.xy;

        // we generate the normal map here, but we can change it?
        vec2 mSt = u_mouse / u_resolution;
        float l = abs(length(mSt-vec2(0.5)));
        vec2 offset = vec2(0.01 * dot(mSt,vec2(0.5)));
        // mSt = abs(length(mSt-0.5));
        vec3 normal = FindNormal(u_buffer0,st,0.02);//0.003+0.02*l);    remove lighting distance for daily
        // normal = step(0.01,normal);
        color = normal;  
        gl_FragColor = vec4(color, 1.0);
    #else   
        st = gl_FragCoord.xy / u_resolution.xy;        

        buffer = texture2D(u_buffer1, st).rgb;
        // buffer.g = 0.0;
        // vec3 buffer0 = texture2D(u_buffer0, st).rgb;
        color = texture2D(u_buffer0, st).rgb;

        vec2 mSt = u_mouse / u_resolution;
        float mouse = step(0.01,length(center(st) - center(mSt)) - .001);

        vec3 position = vec3(0.5+0.1*sin(u_time)*3.0,0.5+0.1*cos(u_time)*3.0,0.5);
        vec3 mPosition = vec3(mSt.x,mSt.y,0.5);
        vec3 light = vec3(.5*sin(-u_time),0.5*cos(-u_time),0.5); 

        light.rg = reflect(mSt,position.rg);
        light = cross(mPosition,position);

        float l = dot(buffer.rb,light.rg);
        float d = min(length(color),length(st-mSt)-3.1);
        color = length(color)*length(d) + (step(0.9,d) + vec3(length(d) * l));
        color = colorize(length(color),u_time);

        gl_FragColor = vec4(color, 1.0);
    #endif
}