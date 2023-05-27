import * as THREE from "three"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import vertexShader from "./shaders/vertex.glsl.js"
import fragmentShader from "./shaders/fragment.glsl.js"

var lats = [35.6839, 40.6943, 19.4333, 18.9667,-23.5504]
var longs = [139.7744, -73.9249,-99.1333,72.8333,-46.6339]
var wind;
var coal;
var turbines = [];
var plants = [];
var coldColor = new THREE.Color(0.3,0.6,1.0);
var warmColor = new THREE.Color(1.0,0.3,0.6);
var atmoColor = coldColor;

const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

var WIDTH = window.innerWidth - 30,
    HEIGHT = window.innerHeight - 30;

var angle = 75,
    aspect = WIDTH / HEIGHT,
    near = 0.1,
    far = 1000,
    rotationSpeed = 0.01;

let delta = 0;
let timeDelta = 0;

var container = document.getElementById('container');

var loader = new THREE.TextureLoader();
var objLoader = new GLTFLoader();

//Scene settings
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x00000);

//Camera settings
var camera = new THREE.PerspectiveCamera(angle, aspect, near, far);
camera.position.z = 10;

//Renderer settings
var renderer = new THREE.WebGLRenderer({antialiasing : true});
renderer.setSize(WIDTH, HEIGHT);
renderer.domElement.style.position = 'relative';
container.appendChild(renderer.domElement);
renderer.setPixelRatio(window.devicePixelRatio)
renderer.autoClear = false;
renderer.shadowMapEnabled = true;

//Light settings
var light = new THREE.SpotLight(0xFFFFFF, 1, 0, Math.PI / 2, 0.5);
light.position.setFromSphericalCoords(20, 30, 30);
light.target.position.set(camera.position);
scene.add(light);

/*
var light = new THREE.DirectionalLight(0xffffff, 5)
light.position.set(2, 2, 2);

*/

//Objects

//Planet
var planetMat = new THREE.MeshPhongMaterial();

loader.load('images/BlueMarble.jpg',
    function ( texture ) {
        planetMat.map = texture;
    });


planetMat.emissive.set(0x000030)

planetMat.normalMap = loader.load('images/earth-normalmap.jpg');
planetMat.normalScale = new THREE.Vector2(4,-4);

planetMat.displacementMap = loader.load('images/bumpmap.jpg');
planetMat.displacementScale = 0.5;

planetMat.specularMap = loader.load('images/earthspec1k.jpg')
planetMat.specular = new THREE.Color('#2e2e2e')

var planetGeo = new THREE.SphereGeometry(5,100,100);
var planetMesh = new THREE.Mesh(planetGeo, planetMat)

//Atmosphere
var atmoMat = new THREE.ShaderMaterial({
    vertexShader: vertexShader, 
    fragmentShader: fragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    uniforms:{
        atmoColor:{
            value: new THREE.Vector4(atmoColor.r,atmoColor.g,atmoColor.b, 1.0)
        }
    }
});


var atmoGeo = new THREE.SphereGeometry(5.5, 20, 20)
var atmoMesh = new THREE.Mesh(atmoGeo, atmoMat)

//Sea
var seaMat = new THREE.MeshPhongMaterial({color: 0x0c0c2c, blending: THREE.AdditiveBlending})

var seaGeo = new THREE.SphereGeometry(5.00005, 100, 100)
var seaMesh = new THREE.Mesh(seaGeo, seaMat)
seaMesh.renderOrder = 1

//Stars
var starGeometry = new THREE.BufferGeometry();
var starMaterial = new THREE.PointsMaterial({color:0xFFFFFF});
var stars = new THREE.Points(starGeometry, starMaterial);
var starVerts = []
for (let i = 0; i < 5000; i++) {
    const x = (Math.random()-0.5)*2000
    const y = (Math.random()-0.5)*2000
    const z = (Math.random()-0.5) *2000
    starVerts.push(x,y,z)
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3))

objLoader.load( 'Decarbonize.glb', function ( gltf ) {
    const decarb = gltf.scene;
    coal = decarb.children[2];
    wind = decarb.children[1]
    wind.attach(decarb.children[0])
    wind.scale.set(0.03,0.4,0.03)
    coal.scale.set(0.2,0.2,0.2)
    placeOnSphere(wind, turbines)
    placeOnSphere(coal, plants)
    turbines.forEach(turbine => {
        turbine.visible = false;
    });
});



function placeOnSphere(object, array) {
    var phi;
    var theta;
    for (var i = 0; i < lats.length; i++){
        //lats[i] = -(lats[i]-90)
        theta = (Math.PI/180)* lats[i]
        phi = (Math.PI/180)* longs[i]
        var clone = object.clone()
        clone.position.setFromSphericalCoords(5.1, phi, theta);
        clone.lookAt(planetMesh.position);
        clone.rotateX(-1.57);
        array.push(clone)
        planetMesh.add(clone);
    }
    
}
/*
var coalMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 5), new THREE.MeshBasicMaterial({color: 0x00FF00}))
coalMesh.position.setFromSphericalCoords(5, 1, 2)
scene.add(coalMesh);
*/
scene.add(planetMesh);
scene.add(atmoMesh);
scene.add(seaMesh);
scene.add(stars)
camera.lookAt(planetMesh.position);

const onMouseClick = (event) => {
    pointer.x = (event.clientX/ window.innerWidth) * 2 -1
    pointer.y = -(event.clientY/ window.innerHeight) * 2 +1
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(scene.children)
    console.log(intersects)
    if (intersects.length > 5) {
        scene.remove(intersects[2])
        scene.remove(intersects[3])
    }
}


var controls = new OrbitControls( camera, renderer.domElement);
controls.addEventListener('start', animate );
window.addEventListener("mousedown", onMouseClick)

var params = new function() { 
    this.sealevel = 1;
    this.atmOn = true;
    this.seaOn = true;
    this.planetOn = true;
    this.normScale = 1;
    this.renewableIndex = 0;
} 

const gui = new dat.GUI();
gui.add(params,"sealevel", 1, 1.002, 0.00001).name("Sea Level");
gui.add(planetMat,"displacementScale", 0, 3, 0.01).name("Displacement")
gui.add(params,"renewableIndex", 0, 5).name("Renewables");
gui.add(params,"normScale", 1, 5, 0.01).name("Normal Map Strength")
//gui.add(planetMesh.rotation,"y", 0, 10, 0.1).name("Rotation");
gui.add(params,"atmOn", true, false).name("Atmosphere");
gui.add(params,"seaOn", true, false).name("Sea");
gui.add(params,"planetOn", true, false).name("Planet");


function render() {
    seaMesh.scale.x = params.sealevel
    seaMesh.scale.y = params.sealevel
    seaMesh.scale.z = params.sealevel
    atmoMesh.visible = params.atmOn
    seaMesh.visible = params.seaOn
    planetMesh.visible = params.planetOn
    params.sealevel += delta/1000000;
    planetMat.normalScale = new THREE.Vector2(4,-4).multiplyScalar(params.normScale)
    light.position.setFromSphericalCoords(20, 30, timeDelta)
    atmoColor = coldColor.lerp(warmColor, delta/1000);
    atmoMat.uniforms.atmoColor.value = new THREE.Vector4(atmoColor.r,atmoColor.g,atmoColor.b, 1.0)
    for (let i = 0; i < params.renewableIndex; i++) {
        turbines[i].visible = true;
        plants[i].visible = false;
    }

    turbines.forEach(turbine => {
        var kid = turbine.children[0];
        kid.rotateY(delta/100);
        kid.scale.set(0.1,0.2,0.1)
    });
    renderer.render(scene, camera);
}

function animate(){
    requestAnimationFrame(animate);
    if (params.renewableIndex > 3)
    {
        if (delta > 0.0001)
        {
            delta -= 0.00002
        }      
    }

    delta += 0.00001;
    console.log(delta)
    timeDelta += 0.00001;
    
    render();
}






