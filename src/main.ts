import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mod } from 'three/examples/jsm/nodes/Nodes.js';


// setting up scene
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.useLegacyLights = false;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 0);

// controls.enablePan = false;
// controls.enableDamping = true;


let modelLoader = new GLTFLoader();
let model = await modelLoader.loadAsync('./scene.gltf');

let group = new THREE.Group()


// adding lightning
var ambientLight = new THREE.AmbientLight(0xffffff, 3); // Soft white light
scene.add(ambientLight);


// loading texture
var textureLoader = new THREE.TextureLoader();
let earthDiffusedTexture = await textureLoader.loadAsync('./earth-diffused-texture.jpg');
let earthBumpTexture = await textureLoader.loadAsync('./earth-bump-texture.jpg');
let earthSpecularTexture = await textureLoader.loadAsync('./earth-specular-texture.jpg');



function createEarth() {
    // setting up earth model
    var geometry = new THREE.SphereGeometry(2, 32, 32);
    var material = new THREE.MeshPhongMaterial({ map: earthDiffusedTexture, bumpMap: earthBumpTexture, specularMap: earthSpecularTexture });
    // material.bumpScale = 0.01
    // material.specular = new THREE.Color('white')

    var earthMesh = new THREE.Mesh(geometry, material);
    // adding rotation offset
    return earthMesh
}


// function posToCircle(pos: THREE.Vector3) {
//     //ball
//     const geometry = new THREE.SphereGeometry(0.2);
//     geometry.translate(pos.x, pos.y, pos.z)
//     const material = new THREE.MeshBasicMaterial({ color: 0xffaabb });
//     const cube = new THREE.Mesh(geometry, material);
//     group.add(cube);

//     //circle
//     const len = pos.length()
//     const circleGeometry = new THREE.BufferGeometry().setFromPoints(
//         new THREE.Path().absarc(0, 0, len, 0, Math.PI * 2, true).getSpacedPoints(20)
//     );
//     const circleMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
//     let quaternion = new THREE.Quaternion();
//     quaternion = quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0).normalize(), pos.normalize())
//     circleGeometry.applyQuaternion(quaternion)
//     const circle = new THREE.Line(circleGeometry, circleMaterial);
//     group.add(circle);
// }


function createSatellitePath(latitude: number, longitude: number, showLine = true) {

    // let coordinate = convertTo3DCoordinates(20.5937, 78.9629, 2.5)
    let coordinate = convertTo3DCoordinates(latitude, longitude, 2.5)

    createSatellite(coordinate)

    // Create the circular path
    const circleGeometry = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, 2.5, 0, Math.PI * 2, true).getSpacedPoints(50)
    );

    const circleMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

    let quaternion = new THREE.Quaternion();
    quaternion = quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0).normalize(), coordinate.clone().normalize())
    circleGeometry.applyQuaternion(quaternion)
    const circle = new THREE.Line(circleGeometry, circleMaterial);



    // showing line
    if (showLine) {
        const points = [];
        points.push(coordinate);
        points.push(new THREE.Vector3(0, 0, 0));

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const line = new THREE.Line(lineGeometry, material);

        return [circle, line]
    } else {
        return [circle]
    }

}


group.add(createEarth())

createSatellitePath(-27.440049, 135.427246).forEach(element => {
    group.add(element)
});

createSatellitePath(-5.440049, 135.427246).forEach(element => {
    group.add(element)
});

createSatellitePath(50.440049, 135.427246).forEach(element => {
    group.add(element)
});

createSatellitePath(-5.440049, 30.427246).forEach(element => {
    group.add(element)
});

createSatellitePath(-50.440049, 135.427246).forEach(element => {
    group.add(element)
});

createSatellitePath(20.5937, 78.9629).forEach(element => {
    group.add(element)
});




function createSatellite(pos: THREE.Vector3) {
    let modelClone = model.scene.clone()
    modelClone.position.set(pos.x, pos.y, pos.z)
    modelClone.scale.set(0.02, 0.02, 0.02)

    // Calculate the direction vector towards the origin
    var direction = new THREE.Vector3().subVectors(scene.position, modelClone.position).normalize();

    // Calculate the quaternion representing the rotation towards the origin
    var quaternion = new THREE.Quaternion().setFromUnitVectors(modelClone.up, direction);

    // Apply the rotation to the model scene
    modelClone.setRotationFromQuaternion(quaternion);

    group.add(modelClone)
}



scene.add(group)


function convertTo3DCoordinates(latitude: number, longitude: number, radius: number) {
    var phi = (90 - latitude) * Math.PI / 180;
    var theta = (longitude + 180) * Math.PI / 180;

    var x = -radius * Math.sin(phi) * Math.cos(theta);
    var y = radius * Math.cos(phi);
    var z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}



// Render loop

let previousTimestamp = 0;
const earthSpeed = 0.1;
camera.position.z = 10

function animate(timestamp: number) {
    controls.update();
    // calculating delta time in second, because requestAnimationFrame will give time in milliseconds
    const delta = (timestamp - previousTimestamp) / 1000
    previousTimestamp = timestamp

    group.rotation.y += earthSpeed * delta;


    // rerender the scene
    renderer.render(scene, camera);

    requestAnimationFrame(animate);
}

// Start the animation loop
requestAnimationFrame(animate);