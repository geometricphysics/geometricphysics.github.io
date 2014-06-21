// declare var EIGHT: any;

declare module EIGHT
{
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
    sub(mv: Euclidean3): Euclidean3;
    mul(mv: Euclidean3): Euclidean3;
  }
  interface Scene
  {
    add(mesh: Mesh): void;
    tearDown(): void;
    onContextLoss(): void;
    onContextGain(context: WebGLContext): void;
  }
  interface Canvas
  {
  }
  interface Camera
  {
  }
  interface WebGLContext
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
    canvas: Canvas;
    context: WebGLContext;
    onContextLoss(): void;
    onContextGain(context: WebGLContext): void;
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
  static scene(): Scene;
  static perspectiveCamera(fov: number, aspect: number, near: number, far: number): Camera;
  static webGLRenderer(): WebGLRenderer;
  static mesh(geometry: Geometry): Mesh;
  static boxGeometry(): Geometry;
  static prismGeometry(): Geometry;
  static scalarE3(w: number): Euclidean3;
  static vectorE3(x: number, y: number, z: number): Euclidean3;
  static bivectorE3(xy: number, yz: number, zx: number): Euclidean3;
  static workbench3D(canvas: Canvas, renderer: WebGLRenderer, camera: Camera, window): Workbench3D;
  static windowAnimationRunner(tick: {(time: number): void;}, terminate: {(time: number): boolean;}, setUp: {(time: number): boolean;}, tearDown, window): WindowAnimationRunner;
  static webGLContextMonitor(canvas: Canvas, contextLoss: {(): void;}, contextGain: {(context: WebGLContext): void;}): WebGLContextMonitor;
}