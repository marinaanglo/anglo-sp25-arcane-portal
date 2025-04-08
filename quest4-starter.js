import Renderer from "./lib/Viz/2DRenderer.js";
import FireWorkObject from "./lib/DSViz/FireWorkObject.js";
import ParticleSystemObject from "./lib/DSViz/ParticleSystemObject.js";
import StandardTextObject from "./lib/DSViz/StandardTextObject.js";

async function init() {
    const canvas = document.createElement("canvas");
    canvas.id = "renderCanvas";
    document.body.appendChild(canvas);

    const renderer = new Renderer(canvas);
    await renderer.init();

    // renderer.setClearColor(0, 1, 0, 1); 

    const particleSystem = new ParticleSystemObject(renderer._device, renderer._canvasFormat);
    await renderer.appendSceneObject(particleSystem);

    const instructions = new StandardTextObject("fps: ? \nDrag your cursor\nChange directions w/ 'q'\nCreate explosions w/ 'w'");
    let fps = 0;
    const targetDelta = 1000 / 60;
    let lastTime = Date.now();

    const animate = () => {
        let delta = Date.now() - lastTime;
        if (delta > targetDelta) {
            ++fps;
            lastTime = Date.now() - (delta % targetDelta);
            renderer.render();
        }
        requestAnimationFrame(animate);
    };

    let dragging = false;
    let fireworks = [];
    let pushPullMode = -1;

    window.addEventListener("keydown", (e) => {
        switch (e.key.toLowerCase()) {
            case "q":
                pushPullMode *= -1;
                break;
            case "w":
                const firework = createFirework(renderer, "circle");
                fireworks.push(firework);
                console.log("fireworks!");
                break;
        }
    });

    canvas.addEventListener("mousedown", (e) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        particleSystem.mouseInteraction(x, y, pushPullMode);
        dragging = true;
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        particleSystem.mouseInteraction(x, y, pushPullMode);
    });

    canvas.addEventListener("mouseup", () => {
        dragging = false;
    });

    setInterval(() => {
        instructions.updateText(
            "fps: " + fps + "\nDrag your cursor\nChange directions w/ 'q'\nCreate explosions w/ 'w'"
        );
        fps = 0;
    }, 1000);

    lastTime = Date.now();
    animate();
    return renderer;
}

async function createFirework(renderer, shape = "circle") {
    const x = 2 * Math.random() - 1;
    const y = 2 * Math.random() - 1;
    const firework = new FireWorkObject(renderer._device, renderer._canvasFormat, x, y);

    // If your FireWorkObject supports shape, you could do something like:
    // firework.setShape(shape); // <-- You'd need to implement this in the class

    await renderer.appendSceneObject(firework);
    return firework;
}

init()
    .then((r) => console.log(r))
    .catch((err) => {
        const p = document.createElement("p");
        p.innerHTML = navigator.userAgent + "</br>" + err.message;
        document.body.appendChild(p);
        document.getElementById("renderCanvas").remove();
    });
