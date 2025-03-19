/*!
 * Copyright (c) 2025 SingChun LEE @ Bucknell University. CC BY-NC 4.0.
 * 
 * This code is provided mainly for educational purposes at Bucknell University.
 *
 * This code is licensed under the Creative Commons Attribution-NonCommerical 4.0
 * International License. To view a copy of the license, visit 
 *   https://creativecommons.org/licenses/by-nc/4.0/
 * or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
 *
 * You are free to:
 *  - Share: copy and redistribute the material in any medium or format.
 *  - Adapt: remix, transform, and build upon the material.
 *
 * Under the following terms:
 *  - Attribution: You must give appropriate credit, provide a link to the license,
 *                 and indicate if changes where made.
 *  - NonCommerical: You may not use the material for commerical purposes.
 *  - No additional restrictions: You may not apply legal terms or technological 
 *                                measures that legally restrict others from doing
 *                                anything the license permits.
 */

// Check your browser supports: https://github.com/gpuweb/gpuweb/wiki/Implementation-Status#implementation-status
// Need to enable experimental flags chrome://flags/
// Chrome & Edge 113+ : Enable Vulkan, Default ANGLE Vulkan, Vulkan from ANGLE, Unsafe WebGPU Support, and WebGPU Developer Features (if exsits)
// Firefox Nightly: sudo snap install firefox --channel=latext/edge or download from https://www.mozilla.org/en-US/firefox/channel/desktop/

import FilteredRenderer from './lib/Viz/2DFilteredRenderer.js'
import Standard2DFullScreenObject from './lib/DSViz/Standard2DFullScreenObject.js'
import Standard2DPGAPosedVertexColorObject from './lib/DSViz/Standard2DPGAPosedVertexColorObject.js'
import LineStrip2DVertexObject from './lib/DSViz/LineStrip2DVertexObject.js'
import DemoTreeObject from './lib/DSViz/DemoTreeObject.js'
import PGA2D from './lib/Math/PGA2D.js'

async function init() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
      console.error("Canvas context (ctx) is not defined. Make sure your browser supports the HTML5 Canvas API.");
  }

  const sun = { x: 400, y: 300, radius: 50, color: 'yellow' };

  const planets = [
      { name: 'Mercury', a: 70, b: 50, speed: 0.04, color: 'gray', radius: 5 },
      { name: 'Venus', a: 100, b: 80, speed: 0.02, color: 'orange', radius: 8 },
      { name: 'Earth', a: 140, b: 120, speed: 0.015, color: 'blue', radius: 9, moon: { a: 20, b: 15, speed: 0.1, radius: 3 } },
      { name: 'Mars', a: 180, b: 160, speed: 0.01, color: 'red', radius: 7 },
  ];

  let angle = 0;

  function drawCelestialBody(x, y, radius, color) {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.closePath();
  }

  function drawRocketship(x, y) {
      if (!ctx) return;
      ctx.fillStyle = 'green';
      ctx.fillRect(x, y, 20, 40);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 10, y - 20);
      ctx.lineTo(x + 20, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'red';
      ctx.fillRect(x - 5, y + 30, 10, 10);
      ctx.fillRect(x + 15, y + 30, 10, 10);
  }

  function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCelestialBody(sun.x, sun.y, sun.radius, sun.color);
      planets.forEach((planet, index) => {
          let x = sun.x + planet.a * Math.cos(angle * planet.speed);
          let y = sun.y + planet.b * Math.sin(angle * planet.speed);
          drawCelestialBody(x, y, planet.radius, planet.color);
          
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle * planet.speed);
          ctx.restore();
          if (planet.moon) {
              let moonX = x + planet.moon.a * Math.cos(angle * planet.moon.speed);
              let moonY = y + planet.moon.b * Math.sin(angle * planet.moon.speed);
              drawCelestialBody(moonX, moonY, planet.moon.radius, 'white');
          }
      });

      let rocketX = sun.x + 220 * Math.cos(angle * 0.02);
      let rocketY = sun.y + 220 * Math.sin(angle * 0.02);
      drawRocketship(rocketX, rocketY);

      angle += 0.5; 
      requestAnimationFrame(animate);
  }

  animate();

}

init().then( ret => {
  console.log(ret);
}).catch( error => {
  const pTag = document.createElement('p');
  pTag.innerHTML = navigator.userAgent + "</br>" + error.message;
  document.body.appendChild(pTag);
  document.getElementById("renderCanvas").remove();
});
