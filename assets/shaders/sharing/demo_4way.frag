// Author: Will Stallwood
// Title: 4 ways

#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

#define SECONDS 1.0

uniform vec2 u_resolution;
uniform float u_time;

float getsat(vec3 c)
{
    float mi = min(min(c.x, c.y), c.z);
    float ma = max(max(c.x, c.y), c.z);
    return (ma - mi)/(ma+ 1e-7);
}

//from my "Will it blend" shader (https://www.shadertoy.com/view/lsdGzN)
vec3 iLerp(in vec3 a, in vec3 b, in float x)
{
    vec3 ic = mix(a, b, x) + vec3(1e-6,0.,0.);
    float sd = abs(getsat(ic) - mix(getsat(a), getsat(b), x));
    vec3 dir = normalize(vec3(2.*ic.x - ic.y - ic.z, 2.*ic.y - ic.x - ic.z, 2.*ic.z - ic.y - ic.x));
    float lgt = dot(vec3(1.0), ic);
    float ff = dot(dir, normalize(ic));
    ic += 1.5*dir*sd*ff*lgt;
    return clamp(ic,0.,1.);
}

// 3 way color mix
vec3 mix_colors(vec3 c1,vec3 c2, vec3 c3, float x)
{
    vec3 b = iLerp(c1,c2,smoothstep(0.0,0.5,x));
    b = iLerp(b,c3,smoothstep(0.5,1.0,x));
    return b;    
}

// 4 way color mix
vec3 mix_colors(vec3 c1, vec3 c2, vec3 c3, vec3 c4,float x)
{
    vec3 b = iLerp(c1,c2,smoothstep(0.0,0.33,x));
    b = iLerp(b,c3,smoothstep(0.33,0.66,x));
    b = iLerp(b,c4,smoothstep(0.66,1.00,x));
    return b;
}

float mirror(float x)
{
    return 2.0*abs(x-0.5);
}

void main()
{
    float time = fract(u_time/SECONDS);
    
    vec2 st = gl_FragCoord.xy/u_resolution;
    float aspect = u_resolution.x/u_resolution.y;
    st.x = st.x * aspect - aspect * 0.5 + 0.5;

    // give it a bit of movement
    st.x += time;
    st.x = fract(st.x);

    float x = st.x;
    float mirror_x = mirror(x);
    float x_blend_y = x + 0.15*sin(TWO_PI * st.y*80.0);
    float divisions = 4.0;

    x_blend_y += floor(st.y*divisions)/divisions;
    x_blend_y += 4.0*time;
    x_blend_y = mod(x_blend_y,4.0);

    vec3 c1 = vec3(1.0, 0.7451, 0.851);
    vec3 c2 = vec3(1.0, 0.0, 0.5843);
    vec3 c3 = vec3(0.3451, 0.8471, 1.0);
    vec3 c4 = vec3(0.1333, 0.0, 0.1059);

    // circle
    float c = step(0.0,-(length(fract(st*divisions*2.0)-0.5)-0.125+0.0125*sin(u_time*2.0)));

    // 3 color
    vec3 three_color = mix_colors(c1,c2,c3,fract(u_time*5.0));

    // 4 color    
    vec3 four_color = mix_colors(c1,c2,c3,c4,x);
    vec3 four_color_mirror = mix_colors(c1,c2,c3,c4,mirror_x);
    vec3 four_color_blend = mix_colors(c1,c2,c3,c4,x_blend_y);

    // show results         
    vec3 bg = c1;
    vec3 col = vec3(bg);
    // col.rg = st;

    // boring color thing
    // col = four_color;
    // col = four_color_mirror;

    // color demo
    col = four_color_blend;
    col = mix(col,three_color,c);

    gl_FragColor = vec4(col,1.0);
}