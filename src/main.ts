import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';




function convertTo3DCoordinates(latitude: number, longitude: number, radius: number) {
    var phi = (90 - latitude) * Math.PI / 180;
    var theta = (longitude + 180) * Math.PI / 180;

    var x = -radius * Math.sin(phi) * Math.cos(theta);
    var y = radius * Math.cos(phi);
    var z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

class SatelliteObject {
    latitude = 0
    longitude = 0
    id = 0
    selected = false

    modelClone = this.createSatellite(new THREE.Vector3())
    paths: THREE.Line<THREE.BufferGeometry<THREE.NormalBufferAttributes>, THREE.LineBasicMaterial>[] | null = null

    constructor(latitude: number, longitude: number, id: number, selected = false) {
        this.latitude = latitude
        this.longitude = longitude
        this.id = id
        this.selected = selected

        this.update(this.latitude, this.longitude)

        // adding to scene
        group.add(this.modelClone)
        console.log(this.modelClone)

    }


    update(latitude: number, longitude: number) {

        // convert lon and lat to coordinate
        let coordinate = convertTo3DCoordinates(latitude, longitude, 2.5)

        // setting position and rotation
        this.modelClone.position.set(coordinate.x, coordinate.y, coordinate.z)

        // Calculate the direction vector towards the origin
        var direction = new THREE.Vector3().subVectors(scene.position, this.modelClone.position).normalize();

        // Calculate the quaternion representing the rotation towards the origin
        var quaternion = new THREE.Quaternion().setFromUnitVectors(this.modelClone.up, direction);

        // Apply the rotation to the model scene
        this.modelClone.setRotationFromQuaternion(quaternion);



        // creating paths
        if (this.paths != null) {

            // delete the previous path
            group.remove(this.paths[0])
            group.remove(this.paths[1])

            // create the path again
            this.paths = this.createSatellitePath(coordinate, this.selected)
        } else {
            this.paths = this.createSatellitePath(coordinate, this.selected)
        }
    }

    private createSatellitePath(coordinate: THREE.Vector3, selected = false) {

        // Create the circular path
        const circleGeometry = new THREE.BufferGeometry().setFromPoints(
            new THREE.Path().absarc(0, 0, 2.5, 0, Math.PI * 2, true).getSpacedPoints(50)
        );

        // creating material
        let circleMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        if (selected) circleMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

        let quaternion = new THREE.Quaternion();
        quaternion = quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0).normalize(), coordinate.clone().normalize())
        circleGeometry.applyQuaternion(quaternion)
        const circle = new THREE.Line(circleGeometry, circleMaterial);


        // showing line
        const points = [];
        points.push(coordinate);
        points.push(new THREE.Vector3(0, 0, 0));

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const line = new THREE.Line(lineGeometry, material);


        // adding to scene
        group.add(circle)
        group.add(line)

        return [circle, line]
    }

    private createSatellite(pos: THREE.Vector3) {
        let modelClone = model.scene.clone()

        modelClone.name = 'satellite'
        modelClone.position.set(pos.x, pos.y, pos.z)
        modelClone.scale.set(0.02, 0.02, 0.02)

        return modelClone
    }

    remove() {

        // removing all items
        group.remove(this.modelClone)
        if (this.paths != null) {
            group.remove(this.paths[0])
            group.remove(this.paths[1])
        }
    }

}

class App {
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    modelLoader: GLTFLoader;
    raycaster: THREE.Raycaster;

    satelliteObjects = Array<SatelliteObject>()
    container: HTMLDivElement

    constructor(container: HTMLDivElement) {
        this.container = container
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.offsetWidth , container.offsetHeight);
        this.renderer.useLegacyLights = false;
        container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0.5, 0);

        this.modelLoader = new GLTFLoader();

        this.raycaster = new THREE.Raycaster();

        var ambientLight = new THREE.AmbientLight(0xffffff, 3); // Soft white light
        scene.add(ambientLight);
        scene.add(group)
        this.init()

    }
    protected init() {
        // this.renderer.domElement.addEventListener('click', (e) => {
        //     const mouse = new THREE.Vector2();
        //     mouse.x = (e.clientX / this.container.offsetWidth) * 2 - 1;
        //     mouse.y = - (e.clientY / this.container.offsetHeight) * 2 + 1;

        //     console.log(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight)

        //     this.checkIntersection(mouse);
        // });

        //meshes and models
        group.add(this.createEarth())

        //temp
        let temp = Array<{ id: number, latitude: number, longitude: number, selected: boolean }>()
        temp.push({
            id: 0,
            latitude: -27.440049,
            longitude: 135.427246,
            selected: false
        })

        temp.push({
            id: 1,
            latitude: -5.440049,
            longitude: 100,
            selected: true
        })


        temp.push({
            id: 2,
            latitude: 50,
            longitude: 100,
            selected: false
        })


        temp.push({
            id: 3,
            latitude: -50,
            longitude: 100,
            selected: false
        })



        this.updateObjects(temp)

    }

    private checkIntersection(mouse: THREE.Vector2) {

        this.raycaster.setFromCamera(mouse, this.camera);

        const intersects = this.raycaster.intersectObject(group, true);

        if (intersects.length > 0) {

            const selectedObject = intersects[0].object;
            console.log(selectedObject)
            //selectedObject.material.color.set('#69f');

        } else {

            // outlinePass.selectedObjects = [];

        }

    }
    animate() {
        this.controls.update();

        this.renderer.render(scene, this.camera);
    }
    resize() {

    }
    private updateObjects(objects: Array<{ id: number, latitude: number, longitude: number, selected: boolean }>) {

        let matchedObject = Array<SatelliteObject>()

        // updating previous objects
        this.satelliteObjects.forEach(item => {
            const index = this.findSameObject(item.id, objects)

            // if match found
            if (index != -1) {

                // update the object if coordinate changes or selected changes
                if (item.latitude != objects[index].latitude || item.longitude != objects[index].longitude || item.selected != objects[index].selected) {

                    item.selected = objects[index].selected
                    item.update(objects[index].latitude, objects[index].longitude)
                }

                matchedObject.push(item)

                // removing the matched object from search
                objects.splice(index, 1)

            } else {

                // remove the object from render
                item.remove()
            }
        });


        // creating the remaining elements
        objects.forEach(item => {
            const obj = new SatelliteObject(item.latitude, item.longitude, item.id, item.selected)
            matchedObject.push(obj)
        });

        this.satelliteObjects = matchedObject
    }
    private findSameObject(id: number, objects: Array<{ id: number, latitude: number, longitude: number, selected: boolean }>) {
        for (let index = 0; index < objects.length; index++) {

            if (objects[index].id == id) {
                return index
            }

        }

        return -1
    }
    private createEarth() {
        // setting up earth model
        var geometry = new THREE.SphereGeometry(2, 32, 32);
        var material = new THREE.MeshPhongMaterial({ map: earthDiffusedTexture, bumpMap: earthBumpTexture, specularMap: earthSpecularTexture });
        // material.bumpScale = 0.01
        // material.specular = new THREE.Color('white')

        var earthMesh = new THREE.Mesh(geometry, material);
        // adding rotation offset
        return earthMesh
    }

}

let modelLoader = new GLTFLoader();
let model = await modelLoader.loadAsync('./scene.gltf');

var textureLoader = new THREE.TextureLoader();
let earthDiffusedTexture = await textureLoader.loadAsync('./earth-diffused-texture.jpg');
let earthBumpTexture = await textureLoader.loadAsync('./earth-bump-texture.jpg');
let earthSpecularTexture = await textureLoader.loadAsync('./earth-specular-texture.jpg');

var scene = new THREE.Scene();
var group = new THREE.Group()

const app = new App(document.querySelector('#canvas-holder') as HTMLDivElement);

let previousTimestamp = 0;
const earthSpeed = 0.1;
app.camera.position.z = 5

function animate(timestamp: number) {
    // calculating delta time in second, because requestAnimationFrame will give time in milliseconds
    const delta = (timestamp - previousTimestamp) / 1000
    previousTimestamp = timestamp

    group.rotation.y += earthSpeed * delta;

    app.animate()
    // rerender the scene

    requestAnimationFrame(animate);
}

// // Start the animation loop
requestAnimationFrame(animate);


