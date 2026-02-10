// Moving Mesh Gradient Background
class MeshGradient {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      console.error('WebGL not supported');
      return;
    }

    this.time = 0;
    this.init();
    this.resize();
    this.animate();
  }

  init() {
    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader with moving mesh gradient
    const fragmentShaderSource = `
      precision mediump float;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 v_uv;
      
      // Gradient colors - black and white palette
      vec3 color1 = vec3(1.0, 1.0, 1.0);   // Pure white
      vec3 color2 = vec3(0.92, 0.92, 0.92); // Light gray
      vec3 color3 = vec3(0.15, 0.15, 0.15); // Dark gray
      vec3 color4 = vec3(0.05, 0.05, 0.05); // Near black
      
      // Noise function
      float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      // Smooth noise
      float smoothNoise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      
      void main() {
        vec2 st = v_uv;
        vec2 pos = st * 3.0;
        
        // Create moving points for mesh
        vec2 point1 = vec2(0.3 + 0.2 * sin(u_time * 0.5), 0.3 + 0.2 * cos(u_time * 0.3));
        vec2 point2 = vec2(0.7 + 0.15 * sin(u_time * 0.4), 0.2 + 0.25 * cos(u_time * 0.6));
        vec2 point3 = vec2(0.2 + 0.25 * sin(u_time * 0.3), 0.8 + 0.15 * cos(u_time * 0.5));
        vec2 point4 = vec2(0.8 + 0.2 * sin(u_time * 0.6), 0.7 + 0.2 * cos(u_time * 0.4));
        
        // Calculate distances to points
        float d1 = length(st - point1);
        float d2 = length(st - point2);
        float d3 = length(st - point3);
        float d4 = length(st - point4);
        
        // Create weights based on inverse distance
        float w1 = 1.0 / (d1 * d1 + 0.1);
        float w2 = 1.0 / (d2 * d2 + 0.1);
        float w3 = 1.0 / (d3 * d3 + 0.1);
        float w4 = 1.0 / (d4 * d4 + 0.1);
        
        float totalWeight = w1 + w2 + w3 + w4;
        
        // Blend colors based on weights
        vec3 finalColor = (color1 * w1 + color2 * w2 + color3 * w3 + color4 * w4) / totalWeight;
        
        // Add subtle noise for texture
        float noiseValue = smoothNoise(pos + u_time * 0.1) * 0.02;
        finalColor += noiseValue;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Create shaders
    this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    this.fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    this.program = this.createProgram(this.vertexShader, this.fragmentShader);

    // Create geometry (full screen quad)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    // Get attribute and uniform locations
    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.timeUniformLocation = this.gl.getUniformLocation(this.program, 'u_time');
    this.resolutionUniformLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
  }

  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }

  createProgram(vertexShader, fragmentShader) {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program linking error:', this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size to match the business card
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    // Set CSS size to fill the container
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render() {
    // Clear and use program
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);

    // Set uniforms
    this.gl.uniform1f(this.timeUniformLocation, this.time);
    this.gl.uniform2f(this.resolutionUniformLocation, this.canvas.width, this.canvas.height);

    // Set up attributes
    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  animate() {
    this.time += 0.016; // ~60fps
    this.render();
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('mesh-gradient');
  if (canvas) {
    // Store instance reference for resize handling
    const meshGradientInstance = new MeshGradient(canvas);
    canvas._meshGradientInstance = meshGradientInstance;
    
    // Handle resize
    window.addEventListener('resize', () => {
      // The canvas will automatically resize with its container
      if (meshGradientInstance) {
        meshGradientInstance.resize();
      }
    });
  }
});