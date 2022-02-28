import {
  ArcRotateCamera,
  Color3,
  Engine,
  FilesInput,
  FramingBehavior,
  Observable,
  Scene,
  StandardMaterial,
  Tools,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export class FilePreviewer {
  private filesInput: FilesInput;
  private engine: Engine;
  private scene: Scene;
  private onFileLoadedObserver = new Observable<File>();
  private isRendered = false;
  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, false, {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
    });

    this.scene = new Scene(this.engine);
    this.scene.createDefaultCameraOrLight();
    this.scene.render();

    let filesInput = new FilesInput(
      this.engine,
      null,
      (sceneFile, scene) => {
        this.scene = scene;
        const isGLTF =
          sceneFile.name.endsWith(".glb") || sceneFile.name.endsWith(".gltf");
        this.prepareCamera(isGLTF);
        (scene.materials as StandardMaterial[]).forEach((m) => {
          m.diffuseColor = Color3.White();
          m.backFaceCulling = false;
          m.emissiveColor = Color3.Black();
        });
        this.onFileLoadedObserver.notifyObservers(sceneFile);
      },
      (e) => {},
      () => {
        this.isRendered = true;
      },
      (r) => {},
      () => {},
      null,
      () => {}
    );

    this.filesInput = filesInput;
  }
  prepareCamera(isGLTF = false) {
    this.scene.createDefaultCameraOrLight(true, true);
    const camera = this.scene.activeCamera as ArcRotateCamera;

    if (isGLTF) camera.alpha += Math.PI;

    camera.useFramingBehavior = true;

    const framingBehavior = camera.getBehaviorByName(
      "Framing"
    ) as FramingBehavior;
    framingBehavior.framingTime = 0;
    framingBehavior.elevationReturnTime = -1;

    if (this.scene.meshes.length) {
      camera.lowerRadiusLimit = null;

      const worldExtends = this.scene.getWorldExtends(function (mesh) {
        return mesh.isVisible && mesh.isEnabled();
      });
      framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
    }

    camera.pinchPrecision = 200 / camera.radius;
    camera.upperRadiusLimit = 5 * camera.radius;

    camera.wheelDeltaPercentage = 0.01;
    camera.pinchDeltaPercentage = 0.01;

    camera.attachControl();
  }
  loadLocalFile(evt: any) {
    this.isRendered = false;
    this.filesInput.loadFiles(evt);
  }
  async getPreviewUrl(): Promise<string> {
    await this.waitRendered();

    return new Promise((res) => {
      Tools.CreateScreenshot(
        this.engine,
        this.scene.activeCamera!,
        400,
        (data) => {
          res(data);
        }
      );
    });
  }
  async waitRendered() {
    return new Promise((res) => {
      setInterval(() => {
        if (this.isRendered) res(null);
      }, 100);
    });
  }
  destory() {
    this.filesInput.dispose();
    this.onFileLoadedObserver.clear();
    this.engine.dispose();
  }
}
