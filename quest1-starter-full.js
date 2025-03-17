class Renderer{constructor(canvas){this._canvas=canvas;this._objects=[];this._clearColor={r:0,g:56/255,b:101/255,a:1};}
async init(){if(!navigator.gpu){throw Error("WebGPU is not supported in this browser.");}
const adapter=await navigator.gpu.requestAdapter();if(!adapter){throw Error("Couldn't request WebGPU adapter.");}
this._device=await adapter.requestDevice();this._context=this._canvas.getContext("webgpu");this._canvasFormat=navigator.gpu.getPreferredCanvasFormat();this._context.configure({device:this._device,format:this._canvasFormat,});this.resizeCanvas();window.addEventListener('resize',this.resizeCanvas.bind(this));}
resizeCanvas(){const devicePixelRatio=window.devicePixelRatio||1;const width=window.innerWidth*devicePixelRatio;const height=window.innerHeight*devicePixelRatio;this._canvas.width=width;this._canvas.height=height;this._canvas.style.width=`${window.innerWidth}px`;this._canvas.style.height=`${window.innerHeight}px`;this._canvas.style.transformOrigin="center";this.render();}
async appendSceneObject(obj){await obj.init();this._objects.push(obj);}
renderToSelectedView(outputView){for(const obj of this._objects){obj?.updateGeometry();}
let encoder=this._device.createCommandEncoder();const pass=encoder.beginRenderPass({colorAttachments:[{view:outputView,clearValue:this._clearColor,loadOp:"clear",storeOp:"store",}]});for(const obj of this._objects){obj?.render(pass);}
pass.end();const computePass=encoder.beginComputePass();for(const obj of this._objects){obj?.compute(computePass);}
computePass.end();const commandBuffer=encoder.finish();this._device.queue.submit([commandBuffer]);}
render(){this.renderToSelectedView(this._context.getCurrentTexture().createView());}}
class SceneObject{static _objectCnt=0;constructor(device,canvasFormat){if(this.constructor==SceneObject){throw new Error("Abstract classes can't be instantiated.");}
this._device=device;this._canvasFormat=canvasFormat;SceneObject._objectCnt+=1;}
getName(){return this.constructor.name+" "+SceneObject._objectCnt.toString();}
async init(){await this.createGeometry();await this.createShaders();await this.createRenderPipeline();await this.createComputePipeline();}
async createGeometry(){throw new Error("Method 'createGeometry()' must be implemented.");}
updateGeometry(){}
loadShader(filename){return new Promise((resolve,reject)=>{const xhttp=new XMLHttpRequest();xhttp.open("GET",filename);xhttp.setRequestHeader("Cache-Control","no-cache, no-store, max-age=0");xhttp.onload=function(){if(xhttp.readyState===XMLHttpRequest.DONE&&xhttp.status===200){resolve(xhttp.responseText);}
else{reject({status:xhttp.status,statusText:xhttp.statusText});}};xhttp.onerror=function(){reject({status:xhttp.status,statusText:xhttp.statusText});};xhttp.send();});}
async createShaders(){throw new Error("Method 'createShaders()' must be implemented.");}
async createRenderPipeline(){throw new Error("Method 'createRenderPipeline()' must be implemented.");}
render(pass){throw new Error("Method 'render(pass)' must be implemented.");}
async createComputePipeline(){throw new Error("Method 'createComputePipeline()' must be implemented.");}
compute(pass){throw new Error("Method 'compute(pass)' must be implemented.");}}
class Standard2DVertexObject extends SceneObject{constructor(device,canvasFormat,vertices){super(device,canvasFormat);this._vertices=vertices;}
async createGeometry(){this._vertexBuffer=this._device.createBuffer({label:"Vertices "+this.getName(),size:this._vertices.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,});this._device.queue.writeBuffer(this._vertexBuffer,0,this._vertices);this._vertexBufferLayout={arrayStride:2*Float32Array.BYTES_PER_ELEMENT,attributes:[{shaderLocation:0,format:"float32x2",offset:0,}],};}
async createShaders(){let shaderCode=await this.loadShader("/shaders/optimized_standard2d.wgsl");this._shaderModule=this._device.createShaderModule({label:" Shader "+this.getName(),code:shaderCode,});}
async createRenderPipeline(){this._renderPipeline=this._device.createRenderPipeline({label:"Render Pipeline "+this.getName(),layout:"auto",vertex:{module:this._shaderModule,entryPoint:"vertexMain",buffers:[this._vertexBufferLayout]},fragment:{module:this._shaderModule,entryPoint:"fragmentMain",targets:[{format:this._canvasFormat}]}});}
render(pass){pass.setPipeline(this._renderPipeline);pass.setVertexBuffer(0,this._vertexBuffer);pass.draw(this._vertices.length/2);}
async createComputePipeline(){}
compute(pass){}}
async function init(){const canvasTag=document.createElement('canvas');canvasTag.id="renderCanvas";document.body.appendChild(canvasTag);const adapter=await navigator.gpu.requestAdapter();const device=await adapter.requestDevice();const context=canvasTag.getContext("webgpu");const canvasFormat=navigator.gpu.getPreferredCanvasFormat();context.configure({device:device,format:canvasFormat,});const triangleVertices=new Float32Array([0.0,0.5,-0.5,0.0,0.5,0.0,]);const rectangleVertices=new Float32Array([-0.5,-0.75,0.5,-0.75,0.5,0.0,-0.5,-0.75,0.5,0.0,-0.5,0.0,]);const allStarVertices=new Float32Array([0.0,0.0,0.1,-0.2,-0.2,-0.4,-0.2,-0.1,0.2,-0.1,0.0,-0.3,0.0,-0.3,0.2,-0.4,0.1,-0.2,]);const triangleBuffer=device.createBuffer({size:triangleVertices.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,});device.queue.writeBuffer(triangleBuffer,0,triangleVertices);const rectangleBuffer=device.createBuffer({size:rectangleVertices.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,});device.queue.writeBuffer(rectangleBuffer,0,rectangleVertices);const starBuffer=device.createBuffer({size:allStarVertices.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST,});device.queue.writeBuffer(starBuffer,0,allStarVertices);const triangleColorBuffer=device.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,});device.queue.writeBuffer(triangleColorBuffer,0,new Float32Array([1.0,0.0,0.0,1.0]));const rectangleColorBuffer=device.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,});device.queue.writeBuffer(rectangleColorBuffer,0,new Float32Array([0.0,1.0,0.0,1.0]));const starColorBuffer=device.createBuffer({size:4*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST,});device.queue.writeBuffer(starColorBuffer,0,new Float32Array([1.0,1.0,1.0,1.0]));const vertCode=`
    struct VertexOutput {
        @builtin(position) pos: vec4f,
    };

    @vertex
    fn vertexMain(@location(0) pos: vec2f) -> VertexOutput {
        var output: VertexOutput;
        output.pos = vec4f(pos, 0.0, 1.0);
        return output;
    }
  `;const fragCode=`
    struct Uniforms {
        color: vec4f,
    };

    @group(0) @binding(0) var<uniform> uniforms: Uniforms;

    @fragment
    fn fragmentMain() -> @location(0) vec4f {
        return uniforms.color; // Use the uniform color
    }
  `;const shaderModule=device.createShaderModule({code:vertCode+fragCode,});const bindGroupLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"},},],});const triangleBindGroup=device.createBindGroup({layout:bindGroupLayout,entries:[{binding:0,resource:{buffer:triangleColorBuffer},},],});const rectangleBindGroup=device.createBindGroup({layout:bindGroupLayout,entries:[{binding:0,resource:{buffer:rectangleColorBuffer},},],});const starBindGroup=device.createBindGroup({layout:bindGroupLayout,entries:[{binding:0,resource:{buffer:starColorBuffer},},],});const renderPipeline=device.createRenderPipeline({layout:device.createPipelineLayout({bindGroupLayouts:[bindGroupLayout],}),vertex:{module:shaderModule,entryPoint:"vertexMain",buffers:[{arrayStride:2*Float32Array.BYTES_PER_ELEMENT,attributes:[{format:"float32x2",offset:0,shaderLocation:0,},],}],},fragment:{module:shaderModule,entryPoint:"fragmentMain",targets:[{format:canvasFormat}],},});const encoder=device.createCommandEncoder();const pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:0.0,g:0.0,b:0.5,a:1.0},loadOp:"clear",storeOp:"store",}],});pass.setPipeline(renderPipeline);pass.setBindGroup(0,triangleBindGroup);pass.setVertexBuffer(0,triangleBuffer);pass.draw(triangleVertices.length/2);pass.setBindGroup(0,rectangleBindGroup);pass.setVertexBuffer(0,rectangleBuffer);pass.draw(rectangleVertices.length/2);pass.setBindGroup(0,starBindGroup);pass.setVertexBuffer(0,starBuffer);pass.draw((allStarVertices.length)/2);pass.end();device.queue.submit([encoder.finish()]);}
init().then(()=>{console.log("Rendering complete.");}).catch((error)=>{console.error("Error initializing WebGPU:",error.message);const pTag=document.createElement('p');pTag.innerHTML=error.message;document.body.appendChild(pTag);});