import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// COLOR DE FONDO: Versión más oscura de #130832
scene.background = new THREE.Color('#09041a')


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Stars (Con colores aleatorios)
 */
const starGeometry = new THREE.BufferGeometry()
const starCount = 5000

// Array para posiciones
const positions = new Float32Array(starCount * 3)
// Array para colores
const colors = new Float32Array(starCount * 3)

for (let i = 0; i < starCount; i++) {
    const i3 = i * 3

    // Posiciones
    positions[i3 + 0] = (Math.random() - 0.5) * 200 // x
    positions[i3 + 1] = (Math.random() - 0.5) * 200 // y
    positions[i3 + 2] = (Math.random() - 0.5) * 200 // z

    // Colores
    colors[i3 + 0] = Math.random() // R
    colors[i3 + 1] = Math.random() // G
    colors[i3 + 2] = Math.random() // B
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

const starMaterial = new THREE.PointsMaterial({
    vertexColors: true,
    size: 0.15,
    sizeAttenuation: true
})

const stars = new THREE.Points(starGeometry, starMaterial)
scene.add(stars)


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
camera.position.set(2, 2, 2)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


/**
 * Model Loader
 */
let mixer = null
const gltfLoader = new GLTFLoader();

gltfLoader.load(
    '/models/patmog/patmog.gltf',
    function (gltf)  {
        gltf.scene.scale.set(5, 5, 5);
        scene.add(gltf.scene);

        // Animation
        mixer = new THREE.AnimationMixer(gltf.scene);
        
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

    // Model animation
    if(mixer) {
        mixer.update(deltaTime)
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()