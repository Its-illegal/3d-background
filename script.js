// 1. Scene Setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Match the background color to the video's aesthetic
scene.background = new THREE.Color(0xdbe4ea);
// Add subtle fog to blend the edges of the plane into the background
scene.fog = new THREE.Fog(0xdbe4ea, 10, 25);

// 2. Camera Setup
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 4, 12);
camera.lookAt(0, 0, 0);

// 3. Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// 4. Lighting (Crucial for the metallic look)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Add a soft blue point light to enhance reflections
const pointLight = new THREE.PointLight(0xabcdef, 1.5, 20);
pointLight.position.set(-2, 3, 2);
scene.add(pointLight);

// 5. The Hovering Sphere
const sphereGeo = new THREE.SphereGeometry(1.2, 64, 64);
const sphereMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.15 // Low roughness for high reflection
});
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphere);

// 6. The Liquid Ripple Surface
const planeGeo = new THREE.PlaneGeometry(30, 30, 256, 256);
// Rotate plane to lay flat
planeGeo.rotateX(-Math.PI / 2);

const planeMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.8,
    roughness: 0.3
});

// Store a reference to the shader to update the time uniform
let planeShader;

// Inject custom GLSL to manipulate vertices for the ripple effect
planeMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    planeShader = shader;

    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform float uTime;
        `
    );

    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        
        // Calculate distance from center
        float dist = length(position.xz);
        
        // Mathematical wave formula: sin(distance * frequency - time * speed) * amplitude
        float ripple = sin(dist * 3.0 - uTime * 2.5) * 0.15;
        
        // Dampen the ripples as they move further away from the center sphere
        float dampening = max(0.0, 1.0 - (dist / 12.0));
        ripple *= dampening;
        
        transformed.y += ripple;
        `
    );
};

const plane = new THREE.Mesh(planeGeo, planeMat);
// Lower the plane slightly so the sphere hovers above it
plane.position.y = -1.5; 
scene.add(plane);

// 7. GSAP Animation for the Hovering Sphere
gsap.to(sphere.position, {
    y: 0.3, // Hover up to this point
    duration: 2.5,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1 // Loop infinitely
});

// 8. Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Update the uniform for the ripple shader
    if (planeShader) {
        planeShader.uniforms.uTime.value = elapsedTime;
    }

    renderer.render(scene, camera);
}
animate();

// 9. Handle Window Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
