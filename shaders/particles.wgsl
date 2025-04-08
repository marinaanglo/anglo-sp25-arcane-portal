struct Particle {
  pos: vec2<f32>,
  initPos: vec2<f32>,
  vel: vec2<f32>,
  life: f32,
  maxLife: f32,
};

@group(0) @binding(0)
var<storage, read> particlesIn: array<Particle>;

@group(0) @binding(1)
var<storage, read_write> particlesOut: array<Particle>;

@group(0) @binding(2)
var<uniform> u_mouse: vec2<f32>; // optional — only if you’re using it


struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) color: vec4f
};

@vertex
fn vertexMain(
  @builtin(instance_index) instanceIndex: u32,
  @builtin(vertex_index) vertexIndex: u32
) -> VertexOutput {
  let particle = particlesIn[instanceIndex];
  let size = 0.01;

  // A unit square made of two triangles
  var quad = array<vec2f, 6>(
    vec2f(-1.0, -1.0),
    vec2f(1.0, -1.0),
    vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0),
    vec2f(1.0, -1.0),
    vec2f(1.0, 1.0),
  );

  let offset = quad[vertexIndex] * size;
  var output: VertexOutput;
  output.pos = vec4f(particle.pos + offset, 0.0, 1.0);
  output.color = vec4f(1.0, 0.0, 0.0, 1.0); // Red
  return output;
}

@fragment
fn fragmentMain(@location(0) color: vec4f) -> @location(0) vec4f {
  return color;
}

@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  if (i >= arrayLength(&particlesIn)) { return; }

  var p = particlesIn[i];

  p.life += 0.016;
  if (p.life >= p.maxLife) {
    p.pos = vec2<f32>(
      f32(i % 100) / 50.0 - 1.0,
      f32((i / 100) % 100) / 50.0 - 1.0
    );
    p.vel = vec2<f32>(0.0, 0.0);
    p.life = 0.0;
    p.maxLife = 1.0 + f32(i % 10) * 0.2;
  }

  let gravity = vec2<f32>(0.0, -0.0005);
  let central = normalize(-p.pos) * 0.0001;
  let accel = gravity + central;

  p.vel += accel;
  p.pos += p.vel;

  // wrap around screen
  if (p.pos.x > 1.0) { p.pos.x -= 2.0; }
  if (p.pos.x < -1.0) { p.pos.x += 2.0; }
  if (p.pos.y > 1.0) { p.pos.y -= 2.0; }
  if (p.pos.y < -1.0) { p.pos.y += 2.0; }

  particlesOut[i] = p;
}
