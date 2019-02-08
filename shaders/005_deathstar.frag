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

vec3 palette(float t,vec3 a,vec3 b,vec3 c,vec3 d )
{
    return a + b * cos( TWO_PI * (c*t+d));
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

float innerStroke(float sdf, float size)
{
    size *= 0.5;
    return max(sdf,-max(sdf - size, sdf-size));
}

float stroke(float sdf, float size)
{
    // return sdf-size;
    // return max(sdf-size,-(sdf+size));
    return sdf-size;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    st = center( st );    

    vec2 st2 = st;    

    st2 -= 0.5;
    st2.x += u_time*0.013;
    st2 *= rotate(45.0);
    // st2 *= rotate(u_time*.0006);
    st2 += 0.5;
    
    float t = u_time;
    vec3 color = vec3(0.1);
        // color = vec3(st.x, st.y, abs(sin(u_time)));

    float p = length(st-vec2(0.5+0.14*sin(t),0.5+0.14*cos(t)));

    float d1 = length(st-vec2(0.5)) - .2;
    float d2 = sin(+st2.x*200.0);
    float d3 = p-.2;

    d1 = max(d1,-d3) + .01 * sin(u_time);

    // d1 = innerStroke(d1,.1);
    // d1 = stroke(d1,0.01);

    d1 = smoothstep(0.1,0.107,d1);

    d1 = max(-d1,d2) + max(-d1,-d2);
    // d1 = max(d1,d2) + min(d1,d2);
    d1 = smoothstep(0.1,0.5,d1);

    // d1 = 0.5 - 0.5 * sin(st.x*100.0);


    // d1 = d3;
    color += d1;

    // color
    vec3 c1 = vec3(0.74,0.7082,0.1);
        
    vec3 c2 = vec3(0.69,0.68,0.16);
    vec3 c3 = vec3(0.67,.87,0.206);

    //c2 = vec3(1.0);     // locks into color orbit

    //c3 = vec3(1.0);
    
    // color = palette(max(d1,d3)+fract(u_time)*10.0,vec3(0.5),c1,c2,c3);
    //color = palette((max(d1,d3))-mod(u_time,.2)*5.0,vec3(0.5),c1,c2,c3);

    // color = palette((max(d1,mod(pow(p,4.0),.5)-.25))-u_time*3.0,vec3(0.5),c1,c2,c3);

    // color = palette((max(d1,mod(p,.2)-.25))-fract(u_time*3.0),vec3(0.5),c1,c2,c3);
    // color = palette((max(d1,pow(p,.85)-.1))-u_time*PI*1.0,vec3(0.5),c1,c2,c3);

    // vignette
    // color += (1.0 - length(st-vec2(0.5) -.1))*.09*abs(sin(u_time));

    color += (1.0 - pow(p,.9))*(0.08+.04*abs(sin(u_time*.33)));

    // color.r = d1+0.2;
    // color.g = d1-0.2;

    gl_FragColor = vec4(color, 1.0);
}