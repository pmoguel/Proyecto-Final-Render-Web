import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * Base
 */
const gui = new GUI()
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

scene.background = new THREE.Color('#09041a')

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Stars (Hueco en el centro)
 */
const starGeometry = new THREE.BufferGeometry()
const starCount = 5000
const positions = new Float32Array(starCount * 3)
const colors = new Float32Array(starCount * 3)

const minRadiusStars = 7; 
const maxRangeStars = 200; 

for (let i = 0; i < starCount; i++) {
    const i3 = i * 3
    let x, y, z;
    let distance;

    do {
        x = (Math.random() - 0.5) * maxRangeStars;
        y = (Math.random() - 0.5) * maxRangeStars;
        z = (Math.random() - 0.5) * maxRangeStars;
        distance = Math.sqrt(x*x + y*y + z*z); 
    } while (distance < minRadiusStars); 

    positions[i3 + 0] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
    
    colors[i3 + 0] = Math.random()
    colors[i3 + 1] = Math.random()
    colors[i3 + 2] = Math.random()
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
    vertexColors: true,
    size: 0.15,
    sizeAttenuation: true
}))
scene.add(stars)

/**
 * TEXT RING
 */
const textString = "PATRICIO MOGUEL   ✯   PATRICIO MOGUEL   ✯   ";

const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d');
const fontSize = 100;
const fontStyle = `bold ${fontSize}px Helvetica, Arial, sans-serif`;
tempCtx.font = fontStyle;
const textMetrics = tempCtx.measureText(textString);
const textWidth = textMetrics.width;

const canvasText = document.createElement('canvas');
canvasText.width = textWidth;
canvasText.height = 256; 
const ctx = canvasText.getContext('2d');

ctx.fillStyle = 'rgba(0,0,0,0)'; 
ctx.fillRect(0, 0, canvasText.width, canvasText.height);
ctx.font = fontStyle;
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(textString, canvasText.width / 2, canvasText.height / 2);

const textTexture = new THREE.CanvasTexture(canvasText);
textTexture.colorSpace = THREE.SRGBColorSpace;
textTexture.minFilter = THREE.LinearFilter; 
textTexture.magFilter = THREE.LinearFilter;

const cylinderGeometry = new THREE.CylinderGeometry(6, 6, 3, 64, 1, true);
const cylinderMaterial = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true,
    side: THREE.DoubleSide,
    alphaTest: 0.1
});

const textCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
textCylinder.position.y = 1.2; 
textCylinder.scale.x = -1; 
textCylinder.rotation.z = Math.PI * 0.1;
textCylinder.rotation.x = Math.PI * 0.1;

scene.add(textCylinder);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 1.2, 3.5); 
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.target.set(0, 1.2, 0); 
controls.minDistance = 3.5;   
controls.maxDistance = 3.5; 

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true 
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Model Loader
 */
let mixer = null
let model = null 

const gltfLoader = new GLTFLoader();

gltfLoader.load(
    '/models/patmog/patmog.gltf',
    function (gltf)  {
        model = gltf.scene; 
        model.scale.set(7, 7, 7); 
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        
        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y) + 1.2; 
        model.position.z += (model.position.z - center.z);
        
        scene.add(model);

        mixer = new THREE.AnimationMixer(model);
        const clip = gltf.animations[1] ? gltf.animations[1] : gltf.animations[0];
        if(clip){
            const action = mixer.clipAction(clip);
            action.play();
        }
    }
);

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    if(mixer) {
        mixer.update(deltaTime)
    }

    if(textCylinder) {
        textCylinder.rotation.y = elapsedTime * 0.8
    }

    if(model) {
        model.rotation.y = -elapsedTime * 0.2
    }

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()