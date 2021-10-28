import './style.css'
import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import * as dat from 'dat.gui'
// import { SphereGeometry } from 'three';

// loading
const textureLoader = new THREE.TextureLoader();
const dot = textureLoader.load('/textures/disc.png');

// Debug
// const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Objects
// Default Sphere Geometry should be 6, 128, 128
const sphereGeometry = new THREE.SphereBufferGeometry(3, 96, 96);

// Materials
const material = new THREE.PointsMaterial({
    size: 0.01,
    color: 0x000000,
    // aplhaMap: dot
});

// Mesh
const sphere = new THREE.Points(sphereGeometry,material)
scene.add(sphere)

// Lights

const pointLight = new THREE.PointLight(0x242424, 0.1)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight);

// *****
//  Adds visual helper in the scene to help light color and placement.
// *****

// const light1 = gui.addFolder('light 1');
// light1.add(pointLight.position, 'y').min(-3).max(3).step(0.01)
// light1.add(pointLight.position, 'x').min(-6).max(6).step(0.01)
// light1.add(pointLight.position, 'z').min(-3).max(3).step(0.01)
// light1.add(pointLight, 'intensity').min(0).max(10).step(0.01)

// const light1Color = {
//     color: 0xffffff
// }
// light1.addColor(light1Color, 'color').onChange(() => {
//     pointLight.color.set(light1Color.color);
// })
// const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
// scene.add(pointLightHelper);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 8
scene.add(camera)



/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))



/**
 * Update Sphere Geometry
 */
const count = sphere.geometry.attributes.position.count; 
const positionClone = new Float32Array( sphere.geometry.attributes.position.array );
const normalsClone = new Float32Array( sphere.geometry.attributes.normal.array );
const damping = 0.15;
const speed = 1000;

function updateSphere(){

    const now = performance.now() / speed;
    // const positions = sphere.geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
        // indices
        const ix = i * 3
        const iy = i * 3 + 1
        const iz = i * 3 + 2

        // use uvs to calculate wave
        // Perlin Noise adds "Randomness" to the waves
        const uX = perlin.get(sphere.geometry.attributes.uv.getX(i), sphere.geometry.attributes.uv.getY(i))  * Math.PI * 16
        const uY = perlin.get(sphere.geometry.attributes.uv.getX(i), sphere.geometry.attributes.uv.getY(i))  * Math.PI * 16

        // calculate current vertex wave height
        const xangle = (uX + now)
        const yangle = (uY + now)
        const xsin = Math.sin(xangle) * damping
        const ycos = Math.cos(yangle) * damping
        
        // Set new positions to vertex
        sphere.geometry.attributes.position.setX(i, positionClone[ix] + normalsClone[ix] * (xsin + ycos))
        sphere.geometry.attributes.position.setY(i, positionClone[iy] + normalsClone[iy] * (xsin + ycos))
        sphere.geometry.attributes.position.setZ(i, positionClone[iz] + normalsClone[iz] * (xsin + ycos))
    }

    // Sphere Geometry needs to be updated after every change.
    sphere.geometry.computeVertexNormals();
    sphere.geometry.normalsNeedUpdate = true;
    sphere.geometry.verticesNeedUpdate = true;
    sphere.geometry.attributes.position.needsUpdate = true;
}

/**
 * Mouse Events
 */
document.addEventListener('mousemove', onDocumentMouseMove)

let mouseX = 0;
let mouseY = 0;

let targetX = 0;
let targetY = 0;

const windowX = window.innerWidth / 2;
const windowY = window.innerHeight / 2;

function onDocumentMouseMove(event){
    mouseX = (event.clientX - windowX);
    mouseY = (event.clientY - windowY);
}


/**
 * Animate
 */

// Add clock to keep track of time.
const clock = new THREE.Clock();
function animate() {
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    const elapsedTime = clock.getElapsedTime()

    // Update objects
    sphere.rotation.y = .2 * elapsedTime;

    sphere.rotation.y += .5 * (targetX - sphere.rotation.y)
    sphere.rotation.x += .05 * (targetY - sphere.rotation.x)
    sphere.position.z += 0.2 * (targetY - sphere.rotation.x)

    // Update Sphere Geometry every frame
    updateSphere();

    // Render
    renderer.render(scene, camera)

    requestAnimationFrame(animate);
}
animate();
