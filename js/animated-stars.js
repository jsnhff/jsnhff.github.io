(function() {
  console.log('Starfield script loaded!');

  function initStarfield() {
    console.log('Initializing starfield...');

    // Set backgrounds to black immediately
    document.body.style.backgroundColor = '#000000';
    document.documentElement.style.backgroundColor = '#000000';

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'starfield-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-999;pointer-events:none;background:#000';

    const ctx = canvas.getContext('2d');

    // Size canvas
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create stars
    const stars = [];
    const starCount = 300;

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
        baseOpacity: Math.random() * 0.4 + 0.7
      });
    }

    console.log('Created', stars.length, 'stars');

    // Animate
    function animate() {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;

      stars.forEach(star => {
        const twinkle = Math.sin(time * star.speed + star.phase);
        const opacity = star.baseOpacity + twinkle * 0.3;

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    // Add to page
    document.body.insertBefore(canvas, document.body.firstChild);

    // Start animation
    animate();
    console.log('Starfield animation started!');
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStarfield);
  } else {
    initStarfield();
  }
})();
