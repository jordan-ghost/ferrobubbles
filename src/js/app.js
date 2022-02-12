
// Imports

const THREE = require('three');
const SimplexNoise = require('simplex-noise');

const MarchingCubes = require('./utils/marchingCubes.js').MarchingCubes;
const OrbitControls = require('./utils/orbitControls.js');


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
camera.position.set(10, 10, 50);

const renderer = new THREE.WebGLRenderer();
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 50;
controls.maxDistance = 500;


// Scene Construction

const material = new THREE.MeshStandardMaterial({
  flatShading: true,
  color: 0x111111,
  metalness: 0.9,
  roughness: 0.2,
  side: THREE.DoubleSide
});


const light = new THREE.DirectionalLight(0x2222ff);
light.position.set(50, 50, 0);
scene.add(light);

const pointLight = new THREE.PointLight(0xff2222);
pointLight.position.set(0, 0, 100);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xffffff);
//scene.add(ambientLight);


// Marching Cubes

const mesh = new MarchingCubes(globalState.resolution, material, true, true, 100000);
mesh.position.set(0, 0, 0);
mesh.scale.set(20, 20, 20);
scene.add(mesh);

const simplex = new SimplexNoise(Math.random());


// Render Loop

function update (Δt) {
  controls.update();
}

function render (Δt, time) {
  updateCubes(mesh, time/1000, 10, true, false, false);
	renderer.render(scene, camera);
}


// Frame Driver

let time  = Date.now();
let start = Date.now();

function animate () {
  let now = Date.now();
  let Δt = time - now;
  time = now - start;
  update(Δt, time);
  render(Δt, time);
  if (globalState.running) requestAnimationFrame(animate);
}


// Init

mesh.init(Math.floor(globalState.resolution));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
animate();


// -------

function updateCubes (object, time, numblobs, floor, wallx, wallz) {
  object.reset();

  const subtract = 12;
  const strength = 1.2 / ((Math.sqrt(numblobs) - 1) / 4 + 1);

  let cx = 8 + 4 *  Math.sin(time*10);
  let cy = 8 + 4 *  Math.cos(time*10);
  let cz = 8 + 4 * -Math.sin(time*10);

  for (let x = 0; x < globalState.resolution; x++) {
    for (let y = 0; y < globalState.resolution; y++) {
      for (let z = 0; z < globalState.resolution; z++) {
        let value4d = simplex.noise4D(
          x/globalState.noiseScale,
          y/globalState.noiseScale - time/5,
          z/globalState.noiseScale,
          time / 10);
        object.setCell(x, y, z,
          1000 * value4d
          - 500 * y/globalState.resolution
          - 500 * z/globalState.resolution
        );
      }
    }
  }

  object.addPlaneY(2, 12);
}

