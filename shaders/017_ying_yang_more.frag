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

uniform sampler2D u_texture_5;
uniform vec2 u_texture_5Resolution;

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

vec4 ying(vec2 st)
{
    vec2 ying = vec2(0.5,0.0);
    vec2 yang = vec2(-0.5,0.0);
    vec2 center = ying.yy;

    float yi = length(st-ying);
    float ya = length(st-yang);

    vec3 size = vec3(1.0,0.5,0.125);
        // size *= sin(u_time);
        // size.x *= sin(t);
        // size.y /= sin(t);
        // size.z /= cos(t);

    vec4 sdf = vec4(0.0);
        sdf.x = length(st-center) - size.x;
        sdf.y = yi-size.y;
        sdf.z = max(sdf.x,-sdf.y);
        sdf.y = ya-size.y;
        sdf.w = max(sdf.z,-sdf.y);
        sdf.y = sdBox(st+vec2(0.0,size.y),vec2(size.x+size.y,size.y));
        sdf.w = max(sdf.w,-sdf.y);
        sdf.y = max(sdf.z,-sdf.w);
        sdf.z = ya-size.z;
        sdf.y = max(sdf.y,-sdf.z);
        // sdf.x
    return sdf;    
}

vec4 yang(vec2 st)
{
    st *= rotate(PI);
    vec4 yang = ying(st);
        yang.y = max(yang.y,yang.x);
        yang *= -1.0;

    return yang;
}

vec4 yang_negative(vec2 st)
{
    st *= rotate(PI);
    vec4 yang = ying(st);
        yang.y = max(yang.x,-yang.z);

    return yang;
}

void main() {
    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;    

    st = center( st );
    st = st * 2.0 - 1.0;
    st *= 2.0;

    // timing
    float seconds = 5.0;
    float t = fract(u_time/seconds);

    // st *= rotate(t*5.0);
    st *= 1.0+.05 * sin(TWO_PI*t*2.0);

    st *= rotate(TWO_PI*t*1.0);
    vec4 yi = ying(st);
    vec4 ya = yang(st);
    st *= rotate(TWO_PI*t*3.0);

    // st *= rotate(TWO_PI*t*5.0);

    vec4 ya_negative = yang_negative(st);

        // sdf.y = min(yi-.5,ya-.5)*sdf.x;     // outer
        // sdf.z = min(yi-.125,ya-.125)*sdf.x;     // inner
        // sdf.x = max(sdf.x,(yi-.5));
        // d = max(r-0.25,a+.3);
        // d = sin(a+a * -TWO_PI * 3.0 * t);

    // swirl
    st *= 1.7 * abs(sin(TWO_PI*t));
    vec2 pos = vec2( st );
    
    float r = length(pos);
    float u = 1.125;

    float d = max(-yi.y,ya_negative.y);

    float a = (atan(pos.y,pos.x) + PI)*0.5;
        a -= 1.00 * u * exp( r / TWO_PI * 2.0 * u);

        // a = sin(a+a+t*TWO_PI*5.0)/t/7.0;
        a = sin(a+a+t*TWO_PI);
        // a = -.0;
        // sdf.x *= a+t;

    // float l = length(sqrt(ya * ya_negative * ya * ya_negative)*2.0 );
    // float d = mix(ya.y,ya_negative.y,l*30.0);
    
    // color
    vec3 color = vec3(0.0);
        // color += sign(sdf.xyz);
        // color += sdf.x;
        // color += sign(sdf.w);
        // color += sign(sdf.z);
        // color += step(a*t*PI,max(ya.y,yi.y));
        // color += ya.y;
        // color += step(0.01,d);

    // ying yang    

        color = mix(color,vec3(1.0),step(0.000001,ya_negative.x));
        // color += mix(color,vec3(0.03),1.0-sign(yi.x*a+a))*-0.15;
        color = mix(color,vec3(0.07),1.0-sign(ya_negative.x*a));
        color = mix(color,vec3(0.5),1.0-sign(ya.z*a));        
        color = mix(color,vec3(1.00),1.0-sign(yi.y*a)); 
        // color += step(0.00001,ya_negative.y);

    gl_FragColor = vec4(color, 1.0);
}