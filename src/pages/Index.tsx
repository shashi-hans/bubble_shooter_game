
import React, { useEffect, useRef } from 'react';

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Game variables
    let bubbles: Bubble[] = [];
    let arrows: Arrow[] = [];
    let particles: Particle[] = [];
    let score = 0;
    let gameTime = 0;
    let mouseX = 0;
    let mouseY = 0;

    // Bubble class
    class Bubble {
      x: number;
      y: number;
      radius: number;
      color: string;
      speedY: number;
      direction: number;

      constructor() {
        this.x = Math.random() * (canvas.width * 0.4) + 50; // Left side of screen
        this.y = Math.random() * canvas.height;
        this.radius = 20 + Math.random() * 20;
        this.color = this.getRandomColor();
        this.speedY = 1 + Math.random() * 2;
        this.direction = Math.random() > 0.5 ? 1 : -1;
      }

      getRandomColor(): string {
        const colors = [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
          '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update(): void {
        this.y += this.speedY * this.direction;
        
        // Bounce off top and bottom
        if (this.y <= this.radius || this.y >= canvas.height - this.radius) {
          this.direction *= -1;
        }

        // Add slight horizontal movement
        this.x += Math.sin(gameTime * 0.01 + this.y * 0.005) * 0.5;
      }

      draw(): void {
        // Draw bubble with gradient
        const gradient = ctx.createRadialGradient(
          this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
          this.x, this.y, this.radius
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.darkenColor(this.color));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      darkenColor(color: string): string {
        // Simple color darkening
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    // Arrow class
    class Arrow {
      x: number;
      y: number;
      speedX: number;
      speedY: number;
      angle: number;

      constructor(startX: number, startY: number, targetX: number, targetY: number) {
        this.x = startX;
        this.y = startY;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 8;
        this.speedX = (dx / distance) * speed;
        this.speedY = (dy / distance) * speed;
        this.angle = Math.atan2(dy, dx);
      }

      update(): void {
        this.x += this.speedX;
        this.y += this.speedY;
      }

      draw(): void {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw arrow
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.lineTo(10, -5);
        ctx.moveTo(15, 0);
        ctx.lineTo(10, 5);
        ctx.stroke();
        
        ctx.restore();
      }
    }

    // Particle class for explosion effects
    class Particle {
      x: number;
      y: number;
      speedX: number;
      speedY: number;
      life: number;
      maxLife: number;
      color: string;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.speedX = (Math.random() - 0.5) * 10;
        this.speedY = (Math.random() - 0.5) * 10;
        this.life = 30;
        this.maxLife = 30;
        this.color = color;
      }

      update(): void {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.1; // Gravity
        this.life--;
      }

      draw(): void {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create initial bubbles
    const createBubbles = () => {
      for (let i = 0; i < 8; i++) {
        bubbles.push(new Bubble());
      }
    };

    // Collision detection
    const checkCollisions = () => {
      for (let i = arrows.length - 1; i >= 0; i--) {
        const arrow = arrows[i];
        
        for (let j = bubbles.length - 1; j >= 0; j--) {
          const bubble = bubbles[j];
          const dx = arrow.x - bubble.x;
          const dy = arrow.y - bubble.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < bubble.radius) {
            // Create particles
            for (let k = 0; k < 10; k++) {
              particles.push(new Particle(bubble.x, bubble.y, bubble.color));
            }
            
            // Remove bubble and arrow
            bubbles.splice(j, 1);
            arrows.splice(i, 1);
            score += 10;
            break;
          }
        }
        
        // Remove arrows that go off screen
        if (arrow.x < 0 || arrow.x > canvas.width || arrow.y < 0 || arrow.y > canvas.height) {
          arrows.splice(i, 1);
        }
      }
    };

    // Handle shooting
    const shoot = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const targetX = clientX - rect.left;
      const targetY = clientY - rect.top;
      const startX = canvas.width - 50;
      const startY = canvas.height / 2;
      
      arrows.push(new Arrow(startX, startY, targetX, targetY));
    };

    // Handle mouse movement for aiming
    const updateMousePosition = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = clientX - rect.left;
      mouseY = clientY - rect.top;
    };

    // Event listeners
    canvas.addEventListener('click', (e) => {
      shoot(e.clientX, e.clientY);
    });

    canvas.addEventListener('mousemove', (e) => {
      updateMousePosition(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      shoot(touch.clientX, touch.clientY);
      updateMousePosition(touch.clientX, touch.clientY);
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      updateMousePosition(touch.clientX, touch.clientY);
    });

    // Game loop
    const gameLoop = () => {
      gameTime++;
      
      // Clear canvas
      ctx.fillStyle = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw bubbles
      bubbles.forEach(bubble => {
        bubble.update();
        bubble.draw();
      });

      // Update and draw arrows
      arrows.forEach(arrow => {
        arrow.update();
        arrow.draw();
      });

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.update();
        particle.draw();
        
        if (particle.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // Check collisions
      checkCollisions();

      // Add new bubbles occasionally
      if (Math.random() < 0.01 && bubbles.length < 12) {
        bubbles.push(new Bubble());
      }

      // Draw aiming arrow
      const shooterX = canvas.width - 50;
      const shooterY = canvas.height / 2;
      const dx = mouseX - shooterX;
      const dy = mouseY - shooterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 10) { // Only show if mouse is not too close to shooter
        ctx.save();
        ctx.translate(shooterX, shooterY);
        ctx.rotate(Math.atan2(dy, dx));
        
        // Draw aiming line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.min(distance * 0.5, 150), 0);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw arrow head for aiming
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        const arrowLength = Math.min(distance * 0.5, 150);
        
        ctx.beginPath();
        ctx.moveTo(arrowLength, 0);
        ctx.lineTo(arrowLength - 10, -5);
        ctx.lineTo(arrowLength - 10, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
      }

      // Draw detailed arrow shooter (now facing left)
      ctx.save();
      ctx.translate(shooterX, shooterY);
      
      // Draw arrow body
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#FF8C00';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      // Arrow shaft (facing left)
      ctx.rect(-5, -3, 30, 6);
      ctx.fill();
      ctx.stroke();
      
      // Arrow head (pointing left)
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(5, -10);
      ctx.lineTo(5, -4);
      ctx.lineTo(25, -4);
      ctx.lineTo(25, 4);
      ctx.lineTo(5, 4);
      ctx.lineTo(5, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Arrow fletching (on the right side now)
      ctx.beginPath();
      ctx.moveTo(25, -6);
      ctx.lineTo(35, -8);
      ctx.lineTo(30, 0);
      ctx.lineTo(35, 8);
      ctx.lineTo(25, 6);
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();

      // Draw score
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 20, 40);

      // Draw instructions
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Tap/Click to shoot arrows at bubbles!', canvas.width / 2, canvas.height - 30);

      requestAnimationFrame(gameLoop);
    };

    // Initialize game
    createBubbles();
    gameLoop();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default Index;
