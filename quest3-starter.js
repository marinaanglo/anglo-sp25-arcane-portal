import initGameOfLife from './game-of-life.js';
import Renderer from '/lib/Viz/2DRenderer.js';
import Camera from '/lib/Viz/2DCamera.js';
import StandardTextObject from '/lib/DSViz/StandardTextObject.js';

async function init() {
  const canvasTag = document.createElement('canvas');
  canvasTag.id = "renderCanvas";
  document.body.appendChild(canvasTag);

  const renderer = new Renderer(canvasTag);
  await renderer.init();

  const camera = new Camera();
  const game = await initGameOfLife(renderer);

  let paused = false;
  let speed = 1;
  let fps = '??';
  let frameCnt = 0;
  const fpsText = new StandardTextObject('fps: ' + fps);
  const helpText = new StandardTextObject('[Space] Pause | [R] Reset | [+/-] Speed | Arrows/WASD Move | Q/E Zoom');

  const moveSpeed = 0.05;
  const zoomMin = 0.1;
  const zoomMax = 2.0;

  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case ' ': paused = !paused; break;
      case 'r': case 'R': game.reset(); break;
      case '+': case '=': speed = Math.min(60, speed + 1); break;
      case '-': case '_': speed = Math.max(1, speed - 1); break;

      case 'ArrowUp': case 'w': case 'W': camera.moveUp(moveSpeed); break;
      case 'ArrowDown': case 's': case 'S': camera.moveDown(moveSpeed); break;
      case 'ArrowLeft': case 'a': case 'A': camera.moveLeft(moveSpeed); break;
      case 'ArrowRight': case 'd': case 'D': camera.moveRight(moveSpeed); break;

      case 'q': case 'Q':
        camera.zoomIn();
        if (camera._pose[4] > zoomMax) camera._pose[4] = zoomMax;
        if (camera._pose[5] > zoomMax) camera._pose[5] = zoomMax;
        break;
      case 'e': case 'E':
        camera.zoomOut();
        if (camera._pose[4] < zoomMin) camera._pose[4] = zoomMin;
        if (camera._pose[5] < zoomMin) camera._pose[5] = zoomMin;
        break;
    }
  });

  let lastCalled = Date.now();
  function renderFrame() {
    const elapsed = Date.now() - lastCalled;
    if (elapsed > 1000 / 60) {
      ++frameCnt;
      lastCalled = Date.now();

      if (!paused) {
        for (let i = 0; i < speed; i++) game.update();
      }

      renderer.render();
    }
    requestAnimationFrame(renderFrame);
  }

  renderFrame();

  setInterval(() => {
    fpsText.updateText('fps: ' + frameCnt);
    frameCnt = 0;
  }, 1000);

  return renderer;
}

init().then(ret => {
  console.log("Renderer ready:", ret);
}).catch(error => {
  const pTag = document.createElement('p');
  pTag.innerHTML = navigator.userAgent + "</br>" + error.message;
  document.body.appendChild(pTag);
  document.getElementById("renderCanvas").remove();
});
