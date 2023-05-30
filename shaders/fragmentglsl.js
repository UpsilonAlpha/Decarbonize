const fragmentShader =`
uniform vec4 atmoColor;
varying vec3 vertexNormal;

    void main(){
        float intensity = pow(0.9 - dot(vertexNormal, vec3(0.0, 0.0, 1.0)),1.5);
        gl_FragColor = atmoColor*intensity;
    }

`
export default fragmentShader