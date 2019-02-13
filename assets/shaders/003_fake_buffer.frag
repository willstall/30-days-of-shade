/*

    daily: 003
    author: Will Stallwood
    insta: https://www.instagram.com/willstall/
    
*/

#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

uniform vec3 u_vec3;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

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

void main()
{
    vec2 st = gl_FragCoord.xy / u_resolution;
    st = center(st);

    vec3 color = vec3(0.0);
        // color.x = abs(sin(u_time));
        // color.y = st.y;
    
    float t = u_time * 2.0;
    float a = t;
    vec2 c = vec2(0.5);


    float d = 1.0;
    float degree = .31013;
    // float n = noise(c*vec2(sin(t)*.33))* 3.0;

    const int COUNT = 30;
    for( int i = 0; i < COUNT; i++)
    {   
        float division = float(i)/float(COUNT);
        vec2 p = vec2(
                    c.x + 0.2 * sin(a + PI * 8.0 * degree * division),
                    c.y + 0.2 * cos(a + TWO_PI * degree * division)
                );
            // p += n;//sin(n);
        float diff = length(st - p) * 3.0 / division;
            // diff -= noise(p+t);
            // diff -= 1.0 - fract(division + u_time);
        diff = step(0.1,diff);
        d += pow(division / float(COUNT),.9);
        // d += 1.0 - division;
        d = min(d,diff);    
    }

    // d = 1.0 - step(0.1,d);
    // d -= 0.5;

    vec3 c1 = vec3(0.4,0.4,0.1);
        // c1 = u_vec3;
        //0.4,0.4,0.1
    vec3 c2 = vec3(0.5,0.5,0.5);
    vec3 c3 = vec3(0.0,.1,0.2);

    color = palette(d+fract(t+d)*2.0,vec3(0.5),c1,c2,c3);

    color += d;

    gl_FragColor = vec4(color,1.0);
}