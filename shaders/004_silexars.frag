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

void main() {
    const int COUNT = 3;
	vec3 cmyk[ COUNT ];

    cmyk[0] = vec3(0.0,1.0,1.0);
    cmyk[1] = vec3(1.0,0.0,1.0);
    cmyk[2] = vec3(1.0,1.0,0.0);
	// cmyk[3] = vec3(0.0,0.0,0.0);

	vec3 c;
	float l,z=u_time;
	for(int i=0;i<3;i++) {
		vec2 uv,p=gl_FragCoord.xy/u_resolution.xy;
		uv=p;//*PI+atan(uv.x,uv.y)*2.0;        
		p-=.5;
        p*=rotate(45.0);
		p.x*=u_resolution.x/u_resolution.y;        
        // p *= 5.0;
		z+=.05;
		l=pow(length(p),.3);
		uv+=p/l*(sin(z)+1.)*abs(sin(l*9.-z*2.))*6.0 ;
        // c[i]= mod(uv.x,1.0)-.5;
        c[i] = length(mod(uv.x,1.0)-.5) * .33;

        // c *= cmyk[i] * length(mod(uv.x,1.0)-.5) * .33;        // color splitting doesn't work immediatly, trying a second pass

		//c[i]= 0.01/abs(mod(uv.x,1.0)-.5);//.01/length(abs(mod(uv,1.0)-.5));
	}

    // doing a second pass still doesn't work and is creating artifacts
    vec3 f = vec3(0.0);
    for(int i=0;i<COUNT;i++) {
        f += mix(c,cmyk[i],c[i]/2.0);   // solved color mixing using mix...strange that += base was causing issues
    }

    c=f*.7;;

    gl_FragColor=vec4(c/l,u_time);
	// gl_FragColor=vec4(c/l,u_time);  // cmyk conversion probably not working due to this line
}