import * as THREE from "three"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import vertexShader from "https://raw.githubusercontent.com/Decarbonize/main/shaders/vertexglsl.js"
import fragmentShader from "https://raw.githubusercontent.com/Decarbonize/main/shaders/fragmentglsl.js"

//Initialization
var lats = [35.6839, 40.6943, 19.4333, 18.9667,-23.5504]
var longs = [139.7744, -73.9249,-99.1333,72.8333,-46.6339]
var wind;
var coal;
var turbines = [];
var plants = [];
var coldColor = new THREE.Color(0.3,0.6,1.0);
var warmColor = new THREE.Color(1.0,0.3,0.6);
var colorOffset = 0.6;
var atmoColor = coldColor;
var degrees = new TextGeometry();


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

loader.load('https://raw.githubusercontent.com/UpsilonAlpha/Decarbonize/cefcb75a3c53e61f8fb905edaa363d1900e1db68/images/BlueMarble.jpg',
    function ( texture ) {
        planetMat.map = texture;
    });


planetMat.emissive.set(0x000030)

planetMat.normalMap = loader.load('https://raw.githubusercontent.com/UpsilonAlpha/Decarbonize/main/images/earth-normalmap.jpg');
planetMat.normalScale = new THREE.Vector2(4,-4);

planetMat.displacementMap = loader.load('https://raw.githubusercontent.com/UpsilonAlpha/Decarbonize/main/images/bumpmap.jpg');
planetMat.displacementScale = 0.5;

planetMat.specularMap = loader.load('https://raw.githubusercontent.com/UpsilonAlpha/Decarbonize/main/images/earthspec1k.jpg')
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
var seaMat = new THREE.MeshPhongMaterial({color: 0x0000FF, opacity: 0.15})
seaMat.transparent = true;
var seaGeo = new THREE.SphereGeometry(5.00005, 100, 100)
var seaMesh = new THREE.Mesh(seaGeo, seaMat)
seaMesh.renderOrder = -1

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

objLoader.load('https://raw.githubusercontent.com/Decarbonize/main/Decarbonize.glb', function ( gltf ) {
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
    this.normScale = 1;
    this.bumpScale = 0;
    this.renewableIndex = 0;
    this.timeMoving = true;
    this.atmOn = true;
    this.seaOn = true;
    this.planetOn = true;
    this.starsOn = true;
    this.itemsOn = true;

} 

const gui = new dat.GUI();

gui.add(planetMat,"displacementScale", 0, 3, 0.01).name("Displacement")
gui.add(params,"renewableIndex", 0, 5).name("Renewables");
gui.add(params,"normScale", 0, 5, 0.01).name("Normal Map Strength")
gui.add(params,"bumpScale", 0, 5, 0.01).name("Bump Map Strength")
gui.add(params,"sealevel", 1, 1.0002, 0.00001).name("Sea Level");
gui.add(planetMesh.rotation,"y", 0, 10, 0.1).name("Rotation");

gui.add(params,"timeMoving", true, false).name("Time Progression");
gui.add(params,"atmOn", true, false).name("Atmosphere");
gui.add(params,"seaOn", true, false).name("Sea");
gui.add(params,"planetOn", true, false).name("Planet");
gui.add(params,"starsOn", true, false).name("Stars");
gui.add(params,"itemsOn", true, false).name("Items");




function render() {
    seaMesh.scale.x = params.sealevel
    seaMesh.scale.y = params.sealevel
    seaMesh.scale.z = params.sealevel
    atmoMesh.visible = params.atmOn
    seaMesh.visible = params.seaOn
    stars.visible = params.starsOn
    planetMesh.visible = params.planetOn
    params.sealevel = 1+delta/1000;
    planetMat.normalScale = new THREE.Vector2(4,-4).multiplyScalar(params.normScale)
    light.position.setFromSphericalCoords(20, 30, timeDelta)
    atmoMat.uniforms.atmoColor.value = new THREE.Vector4(atmoColor.r,atmoColor.g,atmoColor.b, 1.0)
    //container.innerHTML = `${delta*10}°C`
    if (params.renewableIndex > 3){
        if (colorOffset > 0.6){
            atmoColor.setHSL(colorOffset, 1.0, 0.65);
            colorOffset -= 0.00001;
        }
    }
    else{

        if (colorOffset < 0.95){  
            atmoColor.setHSL(colorOffset, 1.0, 0.65);
            colorOffset += 0.00001;
        }
    }
    

    for (let i = 0; i < turbines.length; i++) {
        if (params.itemsOn){
            if (i <= params.renewableIndex){
                turbines[i].visible = true;
                plants[i].visible = false;
            }
            else{
                turbines[i].visible = false;
                plants[i].visible = true;
            }
        }
        else{
            turbines[i].visible = false;
            plants[i].visible = false;
        }
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
    if (params.timeMoving){
        if (params.renewableIndex > 3)
        {
            if (delta > 0.0001)
            {
                delta -= 0.00002
                
            }      
        }
        
        delta += 0.00001;
        console.log(delta)
        timeDelta += 0.0001;
    }
    render();
}






