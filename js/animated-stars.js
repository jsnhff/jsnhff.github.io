// Subtle Animated Starfield
// Lightweight, performant star animation using Canvas
class AnimatedStarfield {
  constructor() {
    this.init();
  }

  init() {
    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'starfield-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.zIndex = '-999';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.backgroundColor = '#000000';
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    // Insert canvas as first child of body
    document.body.insertBefore(this.canvas, document.body.firstChild);

    // Set body and html background to black
    document.body.style.backgroundColor = '#000000';
    document.documentElement.style.backgroundColor = '#000000';

    console.log('Starfield initialized:', this.canvas.width, 'x', this.canvas.height);

    // Initialize stars
    this.stars = [];
    this.resizeCanvas();
    this.createStars();

    // Handle resize
    window.addEventListener('resize', () => this.resizeCanvas());

    // Start animation
    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  createStars() {
    // Create more visible stars
    const starCount = 300;
    this.stars = [];

    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        // Varied sizes for depth
        radius: Math.random() * 2 + 0.5,
        // Random twinkle speed
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        // Random phase offset for varied twinkling
        phase: Math.random() * Math.PI * 2,
        // Base opacity - brighter
        baseOpacity: Math.random() * 0.4 + 0.7
      });
    }
  }

  animate() {
    // Clear with black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw stars with subtle twinkle
    this.stars.forEach(star => {
      // Calculate twinkle using sine wave
      const twinkle = Math.sin(Date.now() * star.twinkleSpeed * 0.001 + star.phase);
      const opacity = star.baseOpacity + twinkle * 0.3;

      // Draw star
      this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AnimatedStarfield());
} else {
  new AnimatedStarfield();
}
