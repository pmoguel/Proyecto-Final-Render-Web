import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Base
 */
const gui = new GUI()
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

scene.background = new THREE.Color('#000000')

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// --- ENTORNO ---
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

/**
 * --- LUCES FRÍAS ---
 */
const light1 = new THREE.PointLight(0x00ffff, 20, 50); 
scene.add(light1);

const light2 = new THREE.PointLight(0xffffff, 20, 50); 
scene.add(light2);

const light3 = new THREE.PointLight(0x0044ff, 30, 50); 
scene.add(light3);

/**
 * General Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0) 
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0)
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Stars
 */
const starGeometry = new THREE.BufferGeometry()
const starCount = 5000
const positions = new Float32Array(starCount * 3)
const colors = new Float32Array(starCount * 3)
const minRadiusStars = 7; 
const maxRangeStars = 200; 

const tempColor = new THREE.Color();

for (let i = 0; i < starCount; i++) {
    const i3 = i * 3
    let x, y, z, distance;
    do {
        x = (Math.random() - 0.5) * maxRangeStars;
        y = (Math.random() - 0.5) * maxRangeStars;
        z = (Math.random() - 0.5) * maxRangeStars;
        distance = Math.sqrt(x*x + y*y + z*z); 
    } while (distance < minRadiusStars); 
    
    positions[i3 + 0] = x; 
    positions[i3 + 1] = y; 
    positions[i3 + 2] = z;

    const h = 0.50 + Math.random() * 0.15; 
    const s = 0.8 + Math.random() * 0.2;
    const l = 0.6 + Math.random() * 0.4;

    tempColor.setHSL(h, s, l);

    colors[i3 + 0] = tempColor.r; 
    colors[i3 + 1] = tempColor.g; 
    colors[i3 + 2] = tempColor.b;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

const starsMaterial = new THREE.PointsMaterial({ 
    vertexColors: true, 
    size: 0.15,
    sizeAttenuation: true,
    transparent: true,
    blending: THREE.AdditiveBlending 
});

const stars = new THREE.Points(starGeometry, starsMaterial);
scene.add(stars)

/**
 * Sizes & Camera
 */
const sizes = { width: window.innerWidth, height: window.innerHeight }
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 1.2, 3.5); 
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.target.set(0, 1.2, 0); 
controls.minDistance = 3.5; controls.maxDistance = 3.5; 

/**
 * --- RAYCASTER (INTERACTIVIDAD) ---
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let spaceshipModel = null; 

window.addEventListener('pointermove', (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = - (event.clientY / sizes.height) * 2 + 1;
});

let currentIntersect = null; 

// --- AQUÍ PONES TU LINK ---
window.addEventListener('click', () => {
    if(currentIntersect) {
        window.open('https://www.instagram.com/mogu3l_/', '_blank');
    }
});


/**
 * Loaders
 */
let mixer = null
let mainModel = null 
const textGroup = new THREE.Group(); 
scene.add(textGroup);

const spaceshipGroup = new THREE.Group();
scene.add(spaceshipGroup);

const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

const normalTexture = textureLoader.load('/models/patmog/normal-map.jpg'); 

// 2. CABEZA
gltfLoader.load(
    '/models/patmog/patmog.gltf',
    function (gltf)  {
        mainModel = gltf.scene; 
        mainModel.scale.set(7, 7, 7); 
        
        mainModel.traverse((child) => {
            if(child.isMesh && child.material) {
                child.material.roughness = 0.7; 
                child.material.metalness = 0.5;  
                child.material.envMapIntensity = 0.9; 
            }
        });

        const box = new THREE.Box3().setFromObject(mainModel);
        const center = box.getCenter(new THREE.Vector3());
        mainModel.position.x += (mainModel.position.x - center.x);
        mainModel.position.y += (mainModel.position.y - center.y) + 1.2; 
        mainModel.position.z += (mainModel.position.z - center.z);
        scene.add(mainModel);
        mixer = new THREE.AnimationMixer(mainModel);
        const clip = gltf.animations[1] ? gltf.animations[1] : gltf.animations[0];
        if(clip){ const action = mixer.clipAction(clip); action.play(); }
    }
);

// 3. TEXTO
gltfLoader.load(
    '/models/patmog/texto.gltf', 
    function (gltf) {
        const textMesh = gltf.scene;

        const chromeMaterial = new THREE.MeshStandardMaterial({
            color: 0xccffff, 
            metalness: 1.0,  
            roughness: 0.1, 
            envMapIntensity: 1.5, 
            flatShading: true, 
            side: THREE.DoubleSide
        });

        textMesh.traverse((child) => {
            if (child.isMesh) {
                if(child.geometry.attributes.color) child.geometry.deleteAttribute('color');
                child.material = chromeMaterial;
            }
        });

        const box = new THREE.Box3().setFromObject(textMesh);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.z); 
        if(maxDim > 0) {
            const scaleFactor = 12 / maxDim;
            textMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        } else {
            textMesh.scale.set(10, 10, 10);
        }

        const boxFinal = new THREE.Box3().setFromObject(textMesh);
        const centerFinal = boxFinal.getCenter(new THREE.Vector3());
        textMesh.position.x = -centerFinal.x;
        textMesh.position.y = -centerFinal.y;
        textMesh.position.z = -centerFinal.z;

        textGroup.add(textMesh);
        textGroup.position.y = 1.2;
        textGroup.rotation.x = Math.PI * 0.1;
        textGroup.rotation.z = Math.PI * 0.1;
    }
);

// 4. NAVE ESPACIAL
gltfLoader.load(
    '/models/patmog/nave.gltf', 
    function (gltf) {
        spaceshipModel = gltf.scene;

        spaceshipModel.traverse((child) => {
            if(child.isMesh) {
                child.material.envMapIntensity = 1.0; 
                child.material.roughness = 0.3;
                child.material.metalness = 0.8;
            }
        });

        const box = new THREE.Box3().setFromObject(spaceshipModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.z, size.y);
        
        if(maxDim > 0) {
            const scaleFactor = 2 / maxDim; 
            spaceshipModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }

        // --- CAMBIO AQUÍ: NAVE ORBITA MÁS CERCA ---
        spaceshipModel.position.set(4, 0, 0); // Ajusta este valor (4 es bastante cerca, 5 o 6 más separado)
        
        spaceshipGroup.add(spaceshipModel);
        
        spaceshipGroup.position.y = 1.2;
        spaceshipGroup.rotation.z = -Math.PI * 0.15; 
        spaceshipGroup.rotation.x = Math.PI * 0.1;

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

    if(mixer) mixer.update(deltaTime);

    // Luces
    const dist = 12; 
    const speed = 0.3; 
    
    light1.position.set(Math.sin(elapsedTime * speed) * dist, Math.sin(elapsedTime * speed * 3) * 4, Math.cos(elapsedTime * speed) * dist);
    light2.position.set(Math.sin(elapsedTime * speed + 2) * dist, Math.cos(elapsedTime * speed * 2) * 4, Math.cos(elapsedTime * speed + 2) * dist);
    light3.position.set(Math.sin(elapsedTime * speed + 4) * dist, 0, Math.cos(elapsedTime * speed + 4) * dist);

    // Rotaciones
    textGroup.rotation.y = elapsedTime * 0.8;
    if(mainModel) mainModel.rotation.y = -elapsedTime * 0.2;
    
    spaceshipGroup.rotation.y = -elapsedTime * 0.3; 

    if(spaceshipModel) {
        spaceshipModel.rotation.z = Math.sin(elapsedTime * 2) * 0.2; 
    }

    // Raycaster logic
    if(spaceshipModel) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(spaceshipModel, true);

        if(intersects.length > 0) {
            if(currentIntersect === null) {
                canvas.style.cursor = 'pointer'; 
            }
            currentIntersect = intersects[0];
        } else {
            if(currentIntersect) {
                canvas.style.cursor = 'default'; 
            }
            currentIntersect = null;
        }
    }

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()