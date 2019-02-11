#ifdef GL_ES
    precision mediump float;
#endif

#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

mat2 rotate(float angle)
{
    return mat2( cos(angle),-sin(angle),sin(angle),cos(angle) );
}

float line(float d,float offset,float amount)
{
    amount *= 0.5;
    return step(offset-amount,d) * step(d,offset+amount);
}

float sline(float d,float offset,float amount)
{
    // amount *= 3.5;
    return smoothstep(offset-amount,offset+amount,d) * smoothstep(d-amount,d+amount,offset) * 1.0;
}

float smin( float a, float b, float k )
{
    float h = max( k-abs(a-b), 0.0 );
    return min( a, b ) - h*h*0.25/k;
}

vec2 center(vec2 st)
{
    float aspect = u_resolution.x/u_resolution.y;
    st.x = st.x * aspect - aspect * 0.5 + 0.5;
    return st;
}

float random( in vec2 st )
{
	return fract( sin( dot(st.xy, vec2(-30.950,-10.810) )) * 43758.5453123  );	    
}

void main()
{
    // timing, if using cos+sin times are doubled
    float seconds = 1.5;
    float t = fract(u_time/seconds);
    float t1 = (t - 0.5) * 2.0;

    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x/u_resolution.y;
        st = center(st);
        st = st * 2.0 - 1.0;    
        st *= .5;
        
        vec3 color = vec3(0.01);

    float r = random(st);

        for(int i=0;i<3;i++) {
            float a = atan(st.y,st.x)/PI;
            float d1 = length(st)-.01 - 0.003 * sin(TWO_PI * t);
            
            

            float ring = sline(d1,.3,.006);
            float center = sline(d1,.3,.003) * 3.00;
            float g = sline(d1,.3,.7);                
            float b = sline(d1,.3,3.0) * .005;   

            float p =  3.0 / float(i);
            st *= rotate( TWO_PI * t1 * (seconds * float(i) * 6.0) *.25);
            
            float d2 = length(st-0.25);  
                d2 = smoothstep(0.0,1.00,d2);
                d2 = pow(d2,3.1);
                
            float d = ring ;               
                d += pow(g,7.0) * .05 * r;                      
                d += b;
                d += center * 2.0 * (r * 4.9);                         
                d *= d2;
                d *= 1.1;
                d /= 1.15;
                
            
            color[i] = mix(color[i],1.0,d);
        }


        color *= 6.0 - (r*2.1);
        color = color.rgb;
        // color = color.gbb;

    gl_FragColor = vec4(color, 1.0);
}