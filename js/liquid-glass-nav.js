// Liquid Glass Navigation Pills
class LiquidGlassPills {
  constructor() {
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupPills());
    } else {
      this.setupPills();
    }
  }

  setupPills() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach((link, index) => {
      this.createGlassPill(link, index);
    });
  }

  createGlassPill(link, index) {
    // Create pill container
    const pill = document.createElement('div');
    pill.className = 'glass-pill';
    
    // Create canvas for WebGL effect
    const canvas = document.createElement('canvas');
    canvas.className = 'glass-pill-canvas';
    canvas.width = 200;
    canvas.height = 80;
    
    // Wrap the link content
    const originalText = link.textContent;
    link.innerHTML = '';
    link.appendChild(pill);
    pill.appendChild(canvas);
    
    const textSpan = document.createElement('span');
    textSpan.className = 'glass-pill-text';
    textSpan.textContent = originalText;
    pill.appendChild(textSpan);

    // Initialize WebGL for this pill
    this.initWebGL(canvas, index);
    
    // Add interaction events
    this.addInteractions(pill, canvas, index);
  }

  initWebGL(canvas, index) {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.warn('WebGL not supported for glass pill', index);
      return;
    }

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader for glass effect
    const fragmentShaderSource = `
      precision mediump float;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_hover;
      varying vec2 v_uv;
      
      // Glass distortion
      vec2 glassDistortion(vec2 uv, float time, float hoverIntensity) {
        // Create pill shape mask
        vec2 center = uv - 0.5;
        float pillMask = smoothstep(0.4, 0.35, length(center * vec2(1.8, 3.0)));
        
        if (pillMask < 0.1) return uv;
        
        // Liquid distortion
        vec2 distortion = vec2(
          sin(uv.y * 6.0 + time * 1.5) * 0.015,
          cos(uv.x * 4.0 + time * 1.2) * 0.012
        ) * pillMask * (0.5 + hoverIntensity * 0.5);
        
        return uv + distortion;
      }
      
      // Fresnel effect for glass edges
      float fresnel(vec2 uv, float power) {
        vec2 center = uv - 0.5;
        float dist = length(center * vec2(1.8, 3.0));
        return pow(1.0 - smoothstep(0.0, 0.4, dist), power);
      }
      
      // Pill shape
      float pillShape(vec2 uv) {
        vec2 center = uv - 0.5;
        float pill = length(center * vec2(1.8, 3.0));
        return smoothstep(0.4, 0.35, pill);
      }
      
      void main() {
        vec2 uv = v_uv;
        
        float pillMask = pillShape(uv);
        if (pillMask < 0.01) {
          discard;
        }
        
        vec2 distortedUV = glassDistortion(uv, u_time, u_hover);
        
        // Glass effects
        float fresnelRim = fresnel(distortedUV, 2.0) * 0.6;
        float fresnelCore = fresnel(distortedUV, 0.8) * 0.3;
        
        // Combine effects
        float alpha = (fresnelRim + fresnelCore) * pillMask;
        alpha = mix(alpha * 0.4, alpha * 0.8, u_hover);
        
        // Glass tint
        vec3 glassColor = mix(
          vec3(0.95, 0.95, 0.98), 
          vec3(0.98, 0.96, 1.0), 
          u_hover
        );
        
        gl_FragColor = vec4(glassColor, alpha);
      }
    `;

    // Create shader program
    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = this.createProgram(gl, vertexShader, fragmentShader);

    // Setup geometry
    const positions = new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Get locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
    const hoverLocation = gl.getUniformLocation(program, 'u_hover');

    // Store WebGL context and data
    canvas._glContext = {
      gl, program, positionBuffer, positionLocation,
      timeLocation, resolutionLocation, mouseLocation, hoverLocation,
      time: 0, hover: 0, mouseX: 0, mouseY: 0
    };

    // Start render loop for this canvas
    this.renderLoop(canvas);
  }

  createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }

  createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program error:', gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }

  addInteractions(pill, canvas, index) {
    const ctx = canvas._glContext;
    if (!ctx) return;

    pill.addEventListener('mouseenter', () => {
      this.animateValue(ctx, 'hover', 1.0, 300);
    });

    pill.addEventListener('mouseleave', () => {
      this.animateValue(ctx, 'hover', 0.0, 500);
    });

    pill.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      ctx.mouseX = (e.clientX - rect.left) / rect.width;
      ctx.mouseY = 1.0 - (e.clientY - rect.top) / rect.height;
    });
  }

  animateValue(ctx, property, target, duration) {
    const start = ctx[property];
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);
      
      ctx[property] = start + (target - start) * eased;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  renderLoop(canvas) {
    const ctx = canvas._glContext;
    if (!ctx) return;

    const render = () => {
      const { gl, program, positionBuffer, positionLocation,
              timeLocation, resolutionLocation, mouseLocation, hoverLocation } = ctx;

      ctx.time += 0.016;

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);

      // Set uniforms
      gl.uniform1f(timeLocation, ctx.time);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(mouseLocation, ctx.mouseX, ctx.mouseY);
      gl.uniform1f(hoverLocation, ctx.hover);

      // Set attributes
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      requestAnimationFrame(render);
    };

    render();
  }
}

// Initialize
new LiquidGlassPills();