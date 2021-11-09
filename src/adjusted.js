var Perplex = Perplex || {};

Perplex.Blob = (function () {
  var blob = {};

  var myScene = null;
  var requestId;

  const canvasContainer = document.getElementById("canvas-container");
  
  blob.Init = function () {
    // myScene.init();
    // detectIfSubmenuIsOutView();
  };
  
  const settings = {
    speed: 0.03,
    density: 1.5,
    strength: 0.3,
    pointSize: 1.3,
  };

  let speedMod = 0.001;
  // let mouseX = 0;

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

  class Scene {
    constructor() {
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
      this.renderer.setClearColor("white", 1);
      this.camera = new THREE.PerspectiveCamera(
        45,
        canvasContainer.offsetWidth / canvasContainer.offsetHeight,
        0.1,
        4
        );
      this.camera.position.set(0, 0, 4);

      this.scene = new THREE.Scene();
      
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
          uColor: { value: new THREE.Color(0x00061a) },
        },
      });
      this.mesh = new THREE.Points(geometry, material);      
      this.scene.add(this.mesh);

      this.fog = new THREE.Fog('white', 1.9, 2.9);
    }

    addEvents() {
      window.addEventListener("resize", this.resize.bind(this));
      this.resize();
      window.addEventListener('blur', this.stop.bind(this));
      window.addEventListener('focus', this.start.bind(this));
 
      const btn1 = document.querySelector("#canvas-interact-1");
      btn1.addEventListener("mouseover", this.animateColor.bind(this, 0x00061a));
      const btn2 = document.querySelector("#canvas-interact-2");
      btn2.addEventListener("mouseover", this.animateColor.bind(this, 0x3311bb));
      const btn3 = document.querySelector("#canvas-interact-3");
      btn3.addEventListener("mouseover", this.animateColor.bind(this, 0xef4189));
      const btn4 = document.querySelector("#canvas-interact-4");
      btn4.addEventListener("mouseover", this.animateColor.bind(this, 0x3311bb));

      const interactiveElements = document.querySelectorAll(".canvas-interact-element");
      for(let btn of interactiveElements){
        btn.addEventListener("mouseenter", this.morphBlob.bind(this));
        btn.addEventListener("mouseleave", this.resetAllMorphs.bind(this));
      }
    }



    morphBlob(){
      this.animateRotation(100, 500, 300);
    }


    animateRotation(start, end, duration) {
      let startTimestamp = null;

      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        speedMod = Math.floor(progress * (end - start) + start) / 1000;
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }

    animateColor(newColor) {
      this.mesh.material.uniforms.uColor.value = new THREE.Color(newColor);
    }

    resetAllMorphs() {
      this.animateRotation(500, 100, 300);
      this.animateColor(0x00061a);
    }

    resize() {
      let width = canvasContainer.offsetWidth;
      let height = canvasContainer.offsetHeight;

      this.camera.aspect = width / height;
      this.renderer.setSize(width, height);

      this.camera.updateProjectionMatrix();
    }

    start() {
      if (!requestId) {
        requestId = window.requestAnimationFrame(this.animate.bind(this));
      }
    }
    
    stop() {
      if (requestId) {
        window.cancelAnimationFrame(requestId);
        requestId = undefined;
      }
    }

    animate() {
      requestId = undefined;

      // requestAnimationFrame(this.animate.bind(this));
      this.render();
      
      this.start();
    }


    render() {
      this.camera.lookAt(this.scene.position);
      
      // Update uniforms
      this.mesh.material.uniforms.uTime.value = this.clock.getElapsedTime();

      // Update objects
      this.mesh.rotation.y = 0.05 * this.clock.getElapsedTime();
      this.mesh.rotation.y += 0.02 * (speedMod - this.mesh.rotation.y);
      this.mesh.rotation.x += 0.05 * (speedMod - this.mesh.rotation.x);

      this.mesh.scale.x += 0.014 * (speedMod - this.mesh.rotation.x);
      this.mesh.scale.y += 0.014 * (speedMod - this.mesh.rotation.x);
      this.mesh.scale.z += 0.014 * (speedMod - this.mesh.rotation.x);

      this.renderer.render(this.scene, this.camera);
    }
  }

  myScene = new Scene();

  return blob;
})();
