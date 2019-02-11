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

float random(float x)
{
    return fract(sin(x*100.00)*10000.0);
}

float random( in vec2 st )
{
	return fract( sin( dot(st.xy, vec2(-30.950,-10.810) )) * 43758.5453123  );	    
}

float noise (in vec2 st)
{
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

float parabola( float x, float k )
{
    return pow( 4.0*x*(1.0-x), k );
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

float sdLine( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

float sdEllipse( in vec2 p, in vec2 ab )
{
    p = abs(p); if( p.x > p.y ) {p=p.yx;ab=ab.yx;}
    float l = ab.y*ab.y - ab.x*ab.x;
	
    float m = ab.x*p.x/l;      float m2 = m*m; 
    float n = ab.y*p.y/l;      float n2 = n*n; 
    float c = (m2+n2-1.0)/3.0; float c3 = c*c*c;
	
    float q = c3 + m2*n2*2.0;
    float d = c3 + m2*n2;
    float g = m + m*n2;

    float co;
    if( d < 0.0 )
    {
        float h = acos(q/c3)/3.0;
        float s = cos(h);
        float t = sin(h)*sqrt(3.0);
        float rx = sqrt( -c*(s + t + 2.0) + m2 );
        float ry = sqrt( -c*(s - t + 2.0) + m2 );
        co = (ry+sign(l)*rx+abs(g)/(rx*ry)- m)/2.0;
    }
    else
    {
        float h = 2.0*m*n*sqrt( d );
        float s = sign(q+h)*pow(abs(q+h), 1.0/3.0);
        float u = sign(q-h)*pow(abs(q-h), 1.0/3.0);
        float rx = -s - u - c*4.0 + 2.0*m2;
        float ry = (s - u)*sqrt(3.0);
        float rm = sqrt( rx*rx + ry*ry );
        co = (ry/sqrt(rm-rx)+2.0*g/rm-m)/2.0;
    }

    vec2 r = ab * vec2(co, sqrt(1.0-co*co));
    return length(r-p) * sign(p.y-r.y);
}

vec3 scene( vec2 st, float t)
{
   const int COUNT = 5;
    vec3 points[COUNT];
        points[0] = vec3(0.75,0.45,1.0);
        points[1] = vec3(-0.75,0.45,-1.0);
        points[2] = vec3(1.0,0.0,1.0);
        points[3] = vec3(-1.0,0.0,-1.0);
        points[4] = vec3(0.0,-1.5,0.0);

    vec3 center_offset = vec3(0.0,.6,0.0);
        center_offset.y += 0.1 * sin(TWO_PI*t*1.0);

    float height = points[0].y - points[COUNT-1].y;

    vec3 sdf = vec3(1.0);
    for(int i = 0; i < COUNT; i++)
    {
        vec3 p = points[i];
        float percent = p.y/height;
        float para = parabola(percent,5.0);        
        float even = 3.0*floor(mod(float(i),2.0));

        points[i].x = p.x * sin( TWO_PI * t);
        points[i].y =  p.y + 0.1 * ( para * even) * cos(TWO_PI * t);

        float dist_to_center = length(p.xy - st - vec2(0.0,p.y) );
   
        float dist = length(p.xy+center_offset.xy-st);
        // points[i].x -= dist*-.33 * cos(TWO_PI*t);

        // points[i].xz *= rotate(TWO_PI*t);

        if(dist < sdf.x)
            sdf.x = dist;
    }
    // could write this loop much better probably if I start from behind and had a dynamic condition
    float power = 40.3;

    for(int i = 0; i < COUNT; i++)
    {
        vec3 pi = points[i];            

        for(int j = 0; j < COUNT; j++)
        {
            vec3 pj = points[j];

            if(pi == pj)
                continue;

            // vec2 p = st-center_offset.xy;
            
            // float dist = fract(sin(sdLine(st-center_offset.xy,pi.xy,pj.xy)*2.0)-sin(TWO_PI*sdf.y*.1*t));


            float dist = sdLine(st-center_offset.xy,pi.xy,pj.xy);
            // dist = fract(pow(dist*2.0,.5))*(8.0*sdf.y);
            dist = fract(pow(dist*10.0,.025))*(100.0*sdf.y);

            // float dist = pow(
            // pow(abs(st.x-pj.x-pi.x),power) +
            // pow(abs(st.y-pj.y-pi.y),power)
            // ,1.0/power);

                // dist -= -0.1*dist*sdf.y*(pi.z-pj.z);   

            if(dist < sdf.y)
                sdf.y = dist;
        }
    }

    // sdf.z = sdEllipse(st,points[COUNT-1].xy-center_offset.xy);
    sdf.z = sdEllipse(st - points[COUNT-1].xy,vec2(0.21,0.02)+center_offset.yx);


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
    float seconds = 3.0;
    float t = fract(u_time/seconds);
    // float t1 = ( t - 0.5 ) * 2.0;
    // space
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st = center( st );
    st = st * 2.0 - 1.0;
    st *= 2.0;

    // points   
    vec2 light = vec2(1.0,1.0);
    vec3 sdf = scene(st,t);
    // float shadows = traceShadows(st,light,t);

    vec2 pos = vec2( 0.5 );

    // color
    vec3 color = vec3(0.12);
        // color = mix(color,vec3(0.5),sdf);
        // color = mix(color,vec3(1.0),sign(sdf));

        // color = mix(color,vec3(0.9),1.0-step(0.00001,shadows));   // show lines


        // color = mix(color,vec3(1.0),1.0-sign(sdf.x-.03));   // show points

    // float n = mix(
    //         step(0.13*noise(st*.1),noise(st/.115+cos(t))),
    //         step(0.01*noise(st*4.4),noise(st/.115+sin(t))),
    //         sin(TWO_PI*t*1.0));

        // sdf.y = clamp(sdf.y,-1.,0.01);
        color = mix(color,vec3(0.15),abs(st.y+1.5) * .1 * random(st));// / n);
        // color *= mix(color,vec3(.8),n);

        color = mix(color,vec3(1.0),1.0-smoothstep(0.0,0.01,(sdf.z-.0001)));   
        // color = mix(color,vec3(.09),1.0-smoothstep(0.0,0.1,(sdf.y-0.09)));
        color = mix(color,vec3(1.0),1.0-smoothstep(0.0,0.01,(sdf.y-.003)));   


        

        
        

        // color = mix(color,vec3(1.0),sdf.y);   // show lines

    gl_FragColor = vec4(color, 1.0);
}