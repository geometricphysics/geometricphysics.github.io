//
// eightjs.d.ts
//
// This file was created manually in order to support the eightjs library.
//
interface Scene
{
  add(mesh: Mesh): void;
  tearDown(): void;
  onContextLoss(): void;
  onContextGain(context: WebGLRenderingContext): void;
}
interface Euclidean3
{
  w: number;
  x: number;
  y: number;
  z: number;
  xy: number;
  yz: number;
  zx: number;
  xyz: number;
  add(mv: Euclidean3): Euclidean3;
  sub(mv: Euclidean3): Euclidean3;
  mul(mv: Euclidean3): Euclidean3;
  div(mv: Euclidean3): Euclidean3;
}
interface Camera
{
}
interface Geometry
{
}
interface Mesh
{
  attitude: Euclidean3;
  position: Euclidean3;
}
interface WebGLContextMonitor
{
  start(): void;
  stop(): void;
}
interface WebGLRenderer
{
  canvas: HTMLCanvasElement;
  context: WebGLRenderingContext;
  onContextLoss(): void;
  onContextGain(context: WebGLRenderingContext): void;
  render(scene: Scene, camera: Camera): void;
}
interface WindowAnimationRunner
{
  start(): void;
  stop(): void;
}
interface Workbench3D
{
  setUp(): void;
  tearDown(): void;
}
interface EIGHT
{
  scene(): Scene;
  perspectiveCamera(fov: number, aspect: number, near: number, far: number): Camera;
  webGLRenderer(): WebGLRenderer;
  mesh(geometry: Geometry): Mesh;
  boxGeometry(): Geometry;
  prismGeometry(): Geometry;
  scalarE3(w: number): Euclidean3;
  vectorE3(x: number, y: number, z: number): Euclidean3;
  bivectorE3(xy: number, yz: number, zx: number): Euclidean3;
  workbench3D(canvas: HTMLCanvasElement, renderer: WebGLRenderer, camera: Camera, window: Window): Workbench3D;
  windowAnimationRunner(tick: {(time: number): void;}, terminate: {(time: number): boolean;}, setUp: {(): void;}, tearDown: {(e: Error): void;}, window: Window): WindowAnimationRunner;
  webGLContextMonitor(canvas: HTMLCanvasElement, contextLoss: {(): void;}, contextGain: {(context: WebGLRenderingContext): void;}): WebGLContextMonitor;
}
declare var EIGHT: EIGHT;
