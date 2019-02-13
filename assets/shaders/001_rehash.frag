/*

    daily: 001
    author: Will Stallwood
    insta: https://www.instagram.com/willstall/
    
*/

#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

vec2 center(vec2 st)
{
    float aspect = u_resolution.x/u_resolution.y;
    st.x = st.x * aspect - aspect * 0.5 + 0.5;
    return st;
}

float random(float x)
{
    return fract(sin(x*100.00)*100000.);
}

float random( vec2 st )
{
    return fract(sin(dot(sin(st.x*100.0),cos(st.y*100.0)))*10000.00);
}

mat2 rotate(float angle)
{
    return mat2( cos(angle),-sin(angle),sin(angle),cos(angle) );
}

// vec3 cmyk(int id) {
//     vec3 cmyk[ 4 ];

//     cmyk[0] = vec3(0.0,1.0,1.0);
//     cmyk[1] = vec3(1.0,0.0,1.0);
//     cmyk[2] = vec3(1.0,1.0,0.0);
//     cmyk[3] = vec3(0.33,0.33,0.33);

//     for (int i=0; i<4; i++) {
//         if (i == id) return cmyk[i];
//     }
// }

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 mSt = u_mouse/u_resolution;

    st = center( st );
    mSt = center( mSt );

    st -= 0.5;
    st *= rotate(-u_time);
    st *= 0.5 + 0.6 * abs(sin(u_time));
    st += 0.5;
    

    vec3 color = vec3(0.0);
        // color = vec3(st.x, st.y, abs(sin(u_time)));

    const int COUNT = 3;

    vec3 points[COUNT];    

    points[0] = vec3(0.25,0.5,0.0);
    points[1] = vec3(0.5,0.5,0.1);
    points[2] = vec3(0.75,0.5,0.0);
    // points[3] = vec3(mSt.x,mSt.y,0.0);

    points[2].x += .25 * sin(u_time);
    points[0].x -= .25 * sin(u_time);

    float power = 1.0 + .5 * abs(sin(u_time));  // ( 1.0 - 2.0 )
        // power = 1.0;

    float d = 1.0;
    vec3 p = points[0];

    for(int i = 0; i < COUNT; i++)
    {
        float dist = 0.0;
        vec3 point = points[i];

        dist = pow(
            pow(abs(st.x-point.x),power) +
            pow(abs(st.y-point.y),power)
            ,1.0/power);

        dist -= point.z;    // weight based on z

        if( d >= dist)
        {
            d = dist;
            p = points[i];
        }
    }

    float t = u_time * 10.0;
    d = pow(d, length(st-vec2(0.5) ));
    // d = step(0.13,abs(sin(d*100.0+t)));    // isolines
    d = sin(d*100.0+50.0*sin(t*.01)+t*.5);
    d = smoothstep(0.0,1.0,d);

    // color.r = 0.2 + 0.6 * length(p);
    // float ci = floor(3.0 * random(floor(p.xy*10.0)));

    // color = vec3(0.01,0.7,0.9) * random(floor(p.xy*10.0));
    // vec3 c = cmyk(int(ci));
    // c = vec3(length(c));
    // color *= 1.0 - d;

    color = vec3(d);
    gl_FragColor = vec4(color, 1.0);
}