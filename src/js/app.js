
// Imports

const THREE = require('three');
const SimplexNoise = require('simplex-noise');

const MarchingCubes = require('./utils/marchingCubes.js').MarchingCubes;
const OrbitControls = require('./utils/orbitControls.js');

const { sin, cos, sqrt, floor, random } = Math;

const sqr = (x) => x * x;
const nsin = (x) => 0.5 + 0.5 * sin(x);
const log = (...args) => { console.log.apply(console, args); return args[0] };


// Global State

let globalState = {
  running: true,
  noiseScale: 20,
  resolution: 32
}


// Setup

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.set(-70, 10, 0);

const renderer = new THREE.WebGLRenderer();
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 50;
controls.maxDistance = 500;


// Loaders

const textureLoader = new THREE.TextureLoader();

const reflectionTex = textureLoader.load('img/2.jpg');
reflectionTex.mapping = THREE.EquirectangularReflectionMapping;
reflectionTex.encoding = THREE.sRGBEncoding;

//scene.background = reflectionTex;


// Scene Construction

const material = new THREE.MeshPhysicalMaterial({
  flatShading: true,
  color: 0x441111,
  metalness: 0.9,
  roughness: 0.2,
  //clearcoat: 0.4,
  //claercoatMap: reflectionTex,
  side: THREE.DoubleSide,
  envMap: reflectionTex,
  envMapIntensity: 3,
});

const cube = new THREE.Mesh(new THREE.BoxGeometry(36, 36, 36), new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true }));
scene.add(cube);

const light = new THREE.DirectionalLight(0x2222ff);
light.position.set(50, 0, 0);
//scene.add(light);

const pointLight = new THREE.PointLight(0xff2222);
pointLight.position.set(0, 0, 30);
scene.add(pointLight);

const plHelper = new THREE.PointLightHelper(pointLight);
scene.add(plHelper);


const ambientLight = new THREE.AmbientLight(0xffffff);
//scene.add(ambientLight);


// Marching Cubes

const marching = new MarchingCubes(globalState.resolution, material, false, false, 100000);
marching.position.set(0, 0, 0);
marching.scale.set(20, 20, 20);
scene.add(marching);


const simplex = new SimplexNoise(random());


// Render Loop

function update (Δt, time) {
  controls.update();


  // Update ferroplane

  marching.reset();

  const res    = globalState.resolution;
  const nScale = globalState.noiseScale;
  let timeFactor = time + 1.7 * sqr(nsin(time/10));

  for (let x = 0; x < res; x++) {
    for (let y = 0; y < res; y++) {
      for (let z = 0; z < res; z++) {
        let value4d = simplex.noise4D(x/nScale, y/nScale - timeFactor/5, z/nScale, timeFactor / 10);
        let value =
          value4d
          - 0.5 * (y/res)*(y/res)
          - 0.5 * z/res;

        marching.setCell(x, y, z, 1000 * value);
      }
    }
  }

  marching.addPlaneY(2, 12);
}

function render (Δt, time) {
	renderer.render(scene, camera);
}


// Frame Driver

let time  = 0;
let mtime = Date.now();
let start = Date.now();

function loop () {
  let now = Date.now();
  let Δt = mtime - now;
  mtime = now - start;
  time = mtime/1000;
  update(Δt, time);
  render(Δt, time);
  if (globalState.running) requestAnimationFrame(loop);
}


// Init

marching.init(floor(globalState.resolution));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
loop();


// -------

