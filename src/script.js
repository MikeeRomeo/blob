import "./style.css";
import * as THREE from "three";
import * as dat from "dat.gui";

const gui = new dat.GUI();
const canvasContainer = document.getElementById( 'canvas-container' );
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;
const settings = {
	speed: 0.03,
	density: 1.6,
	strength: 0.3,
	pointSize: 1.5,
  pointColor: 0x9d9fa8,
  backgroundColor: 0xffffff,
};
gui.add(settings, "speed", 0.01, 1, 0.01);
gui.add(settings, "density", 0, 10, 0.01);
gui.add(settings, "strength", 0, 2, 0.01);
gui.add(settings, "pointSize", 0, 2, 0.01);

gui.addColor(settings, 'pointColor').onChange(function(value) {

  settings.pointColor = value;

});

gui.addColor(settings, 'backgroundColor').onChange(function(value) {

  settings.background = value;

});
// gui.add(settings, "pointSize", 0, 2, 0.01);

/**
 * Mouse and target coords
 * **/
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
let speedMod = 0.001;

const noise = `
  // GLSL textureless classic 3D noise "cnoise",
  // with an RSL-style periodic variant "pnoise".
  // Author:  Stefan Gustavson (stefan.gustavson@liu.se)
  // Version: 2011-10-11
  //
  // Many thanks to Ian McEwan of Ashima Arts for the
  // ideas for permutation and gradient selection.
  //
  // Copyright (c) 2011 Stefan Gustavson. All rights reserved.
  // Distributed under the MIT license. See LICENSE file.
  // https://github.com/ashima/webgl-noise
  //

  vec3 mod289(vec3 x)
  {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 mod289(vec4 x)
  {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x)
  {
    return mod289(((x*34.0)+1.0)*x);
  }

  vec4 taylorInvSqrt(vec4 r)
  {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  vec3 fade(vec3 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
  }

  // Classic Perlin noise, periodic variant
  float pnoise(vec3 P, vec3 rep)
  {
    vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
  }
`;

const vertexShader = `  
  varying vec3 vNormal;
  
  uniform float uTime;
  uniform float uSpeed;
  uniform float uNoiseDensity;
  uniform float uNoiseStrength;
  uniform float uPointSize;
  
  ${noise}
  
  void main() {
    float t = uTime * uSpeed;
    float distortion = pnoise((normal + t) * uNoiseDensity, vec3(10.0)) * uNoiseStrength;

    vec3 pos = position + (normal * distortion);
    
    vNormal = normal;
    gl_PointSize = uPointSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
  }  
`;

const fragmentShader = `
  varying vec2 v_uv;
  uniform vec2 u_mouse;
  uniform vec2 u_resolution;
  uniform vec3 u_color;
  uniform float u_time;
  uniform vec3 uColor;
  
  void main() {
    vec2 v = u_mouse / u_resolution;
    vec2 uv = gl_FragCoord.xy / u_resolution;

    gl_FragColor = vec4(uColor, 1.0).rgba;
  }
`;

// const btn = document.querySelector("#change-effect-1");
// btn.addEventListener("click", function(){
//   morphObject();
// });

// function morphObject(){
//   console.log('morphing time');
//   settings.strength = 1; 
//   setTimeout(function(){ 
//     console.log("Hello");
//     settings.strength = 0.2; 
//   }, 1000);
// }
class Scene {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true,});
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
		this.renderer.setSize( canvasContainer.offsetWidth, canvasContainer.offsetHeight);
		this.renderer.setClearColor("white", 0);
    
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      4
    );
    this.camera.position.set(0, 0, 4);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xff0000 );

    this.clock = new THREE.Clock();
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    this.init();
    this.animate();
  }

  init() {
    this.addCanvas();
    this.addElements();
    this.addEvents();
  }

  

  addCanvas() {
    const canvas = this.renderer.domElement;
    canvas.classList.add("webgl");
    canvasContainer.appendChild(canvas);
  }

  addElements() {
    const geometry = new THREE.IcosahedronBufferGeometry(1.2, 48);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: settings.speed },
        uNoiseDensity: { value: settings.density },
        uNoiseStrength: { value: settings.strength },
				uPointSize: { value: settings.pointSize },
        uColor: { value: new THREE.Color(0x9d9fa8) },
      },
    });
    this.mesh = new THREE.Points(geometry, material);
    this.scene.add(this.mesh);

    
		this.fog = new THREE.Fog("white", 1.9, 2.9);
  }

  addEvents() {
    window.addEventListener("resize", this.resize.bind(this));
    this.resize();
    document.addEventListener("mousemove", this.onDocumentMouseMove.bind(this));
    // document.getElementById("test1").onclick = function() {this.changeBlob.bind(this)};
    const btn = document.querySelector("#change-effect-1");
    btn.addEventListener("click", this.animateSettings.bind(this, settings, [50, 1500, 300], [80, 1600, 400], 300));
    const btn2 = document.querySelector("#change-effect-2");
    btn2.addEventListener("click", this.animateColor.bind(this, 0x00061a));
    const btn3 = document.querySelector("#change-effect-3");
    btn3.addEventListener("click", this.animateColor.bind(this, 0xEF4189));
    const btn4 = document.querySelector("#change-effect-4");
    btn4.addEventListener("click", this.animateColor.bind(this, 0x3311BB));
    const btn5 = document.querySelector("#change-effect-5");
    btn5.addEventListener("click", this.resetAllMorphs.bind(this));
  }

  animateSettings(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.speed = Math.floor(progress * (end[0] - start[0]) + start[0]) / 1000;
      obj.density = Math.floor(progress * (end[1] - start[1]) + start[1]) / 1000;
      obj.strength = Math.floor(progress * (end[2] - start[2]) + start[2]) / 1000;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // animateRotation(start, end, duration) {
  //   let startTimestamp = null;
  //   const step = (timestamp) => {
  //     if (!startTimestamp) startTimestamp = timestamp;
  //     const progress = Math.min((timestamp - startTimestamp) / duration, 1);
  //     speedMod = Math.floor(progress * (end - start) + start) / 1000;
  //     if (progress < 1) {
  //       window.requestAnimationFrame(step);
  //     }
  //   };
  //   window.requestAnimationFrame(step);
  // }
  
  animateColor(newColor) {
    this.mesh.material.uniforms.uColor.value = new THREE.Color(newColor);
  }

  resetAllMorphs() {
    this.animateSettings(settings, [80, 1600, 400], [50, 1500, 300], 300);
    // this.animateRotation(600, 100, 300);
    this.animateColor(0x00061A);
  }

  resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    this.camera.aspect = width / height;
    this.renderer.setSize(width, height);

    this.camera.updateProjectionMatrix();
  }

  onDocumentMouseMove(event) {
    const windowX = window.innerWidth / 2;
    const windowY = window.innerHeight / 2;

    mouseX = event.clientX - windowX;
    mouseY = event.clientY - windowY;
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.render();
  }

  render() {
    // this.controls.update();

    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    // Update uniforms
    this.mesh.material.uniforms.uTime.value = this.clock.getElapsedTime();
    this.mesh.material.uniforms.uSpeed.value = settings.speed;
    this.mesh.material.uniforms.uNoiseDensity.value = settings.density;
    this.mesh.material.uniforms.uNoiseStrength.value = settings.strength;
    this.mesh.material.uniforms.uPointSize.value = settings.pointSize;
    this.mesh.material.uniforms.uColor.value = new THREE.Color(settings.pointColor);
    this.scene.background = new THREE.Color( settings.backgroundColor );


     // Update objects
     this.mesh.rotation.y = .2 * this.clock.getElapsedTime();
     this.mesh.rotation.y += .5 * (speedMod - this.mesh.rotation.y);
     this.mesh.rotation.x += .05 * (speedMod - this.mesh.rotation.x);
     this.mesh.position.z += 0.15 * (speedMod - this.mesh.rotation.x);

    this.renderer.render(this.scene, this.camera);
  }
}

new Scene();
