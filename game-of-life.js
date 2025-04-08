// game-of-life.js
const GRID_SIZE = 256;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;

async function initGameOfLife(renderer) {
  const device = renderer._device;
  const format = renderer._canvasFormat;

  let initialState = new Uint32Array(CELL_COUNT);
  const createInitialState = () => {
    for (let i = 0; i < CELL_COUNT; ++i) {
      initialState[i] = Math.random() > 0.8 ? 1 : 0;
    }
  };
  createInitialState();
  console.log("First 100 cells:", initialState.slice(0, 100));


  const cellStateBuffers = [0, 1].map(() =>
    device.createBuffer({
      size: initialState.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    })
  );
  device.queue.writeBuffer(cellStateBuffers[0], 0, initialState);

  const cellTexture = device.createTexture({
    size: [GRID_SIZE, GRID_SIZE],
    format: 'r8uint',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
  });

  const computeShaderCode = `
    @group(0) @binding(0) var<storage, read> src : array<u32>;
    @group(0) @binding(1) var<storage, read_write> dst : array<u32>;

    const width = ${GRID_SIZE}u;
    const height = ${GRID_SIZE}u;

    fn getIndex(x: u32, y: u32) -> u32 {
        return (y % height) * width + (x % width);
    }

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let x = id.x;
        let y = id.y;
        if (x >= width || y >= height) { return; }

        var liveNeighbors: u32 = 0u;
        for (var dx: i32 = -1; dx <= 1; dx++) {
            for (var dy: i32 = -1; dy <= 1; dy++) {
                if (dx == 0 && dy == 0) { continue; }
                let nx = (i32(x) + dx + i32(width)) % i32(width);
                let ny = (i32(y) + dy + i32(height)) % i32(height);
                liveNeighbors += src[getIndex(u32(nx), u32(ny))];
            }
        }

        let idx = getIndex(x, y);
        let current = src[idx];
        dst[idx] = select(0u, 1u, (liveNeighbors == 3u || (liveNeighbors == 2u && current == 1u)));
    }`;

  const computeModule = device.createShaderModule({ code: computeShaderCode });
  const computePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: { module: computeModule, entryPoint: 'main' }
  });

  const bindGroups = [0, 1].map(i =>
    device.createBindGroup({
      layout: computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: cellStateBuffers[i] } },
        { binding: 1, resource: { buffer: cellStateBuffers[1 - i] } },
      ]
    })
  );

  const renderShaderCode = `
    @group(0) @binding(0) var cellTex: texture_2d<u32>;

    struct VertexOut {
      @builtin(position) position: vec4<f32>,
      @location(0) texCoord: vec2<f32>
    };

    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> VertexOut {
      var pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
      );

      var uv = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 0.0), vec2<f32>(0.0, 1.0),
        vec2<f32>(0.0, 1.0), vec2<f32>(1.0, 0.0), vec2<f32>(1.0, 1.0)
      );

      var out: VertexOut;
      out.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
      out.texCoord = uv[vertexIndex];
      return out;
    }

    @fragment
    fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
      let texCoord = vec2<u32>(in.texCoord * vec2<f32>(${GRID_SIZE}.0, ${GRID_SIZE}.0));
      let value = textureLoad(cellTex, texCoord, 0).r;
      return select(vec4<f32>(0.0, 0.0, 0.0, 1.0), vec4<f32>(1.0, 1.0, 1.0, 1.0), value == 1u);
    }`;

  const renderModule = device.createShaderModule({ code: renderShaderCode });
  const renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: renderModule, entryPoint: 'vs_main' },
    fragment: {
      module: renderModule,
      entryPoint: 'fs_main',
      targets: [{ format }]
    },
    primitive: { topology: 'triangle-list' }
  });

  const renderBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: cellTexture.createView() }]
  });

  let step = 0;

  function update() {
  console.log('Game of Life: update called, step =', step);
  const computeEncoder = device.createCommandEncoder();

  // Run compute pass
  const computePass = computeEncoder.beginComputePass();
  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, bindGroups[step % 2]);
  computePass.dispatchWorkgroups(GRID_SIZE / 8, GRID_SIZE / 8);
  computePass.end();

  // Submit compute work
  device.queue.submit([computeEncoder.finish()]);

  // Create a staging buffer for reading compute result
  const stagingBuffer = device.createBuffer({
    size: CELL_COUNT * 4,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  });

  const copyEncoder = device.createCommandEncoder();
  copyEncoder.copyBufferToBuffer(
    cellStateBuffers[(step + 1) % 2], 0,
    stagingBuffer, 0,
    CELL_COUNT * 4
  );
  device.queue.submit([copyEncoder.finish()]);

  stagingBuffer.mapAsync(GPUMapMode.READ).then(() => {
    const arrayBuffer = stagingBuffer.getMappedRange();
    const u32 = new Uint32Array(arrayBuffer);
    const u8 = new Uint8Array(CELL_COUNT);
    for (let i = 0; i < CELL_COUNT; i++) {
      u8[i] = u32[i] ? 255 : 0;
    }
    stagingBuffer.unmap();

    // Write cell data to r8uint texture
    device.queue.writeTexture(
      { texture: cellTexture },
      u8,
      { bytesPerRow: GRID_SIZE },
      [GRID_SIZE, GRID_SIZE, 1]
    );

    // Render texture to screen
    const renderEncoder = device.createCommandEncoder();
    const renderPass = renderEncoder.beginRenderPass({
      colorAttachments: [{
        view: renderer._context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 1 }
      }]
    });
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(6);
    renderPass.end();
    device.queue.submit([renderEncoder.finish()]);
  });

  step++;
}
  
    step++;
  

  function reset() {
    createInitialState();
    device.queue.writeBuffer(cellStateBuffers[0], 0, initialState);
    device.queue.writeBuffer(cellStateBuffers[1], 0, initialState);
    step = 0;
  }

  return { update, reset };
}

export default initGameOfLife;
