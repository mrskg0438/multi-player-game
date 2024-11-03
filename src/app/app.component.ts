import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import * as BABYLON from '@babylonjs/core';
import { Client, Room } from 'colyseus.js'

interface Player {
  id: string;
  mesh: BABYLON.Mesh;
  position: BABYLON.Vector3;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  @ViewChild('renderCanvas', { static: true }) renderCanvas!: ElementRef<HTMLCanvasElement>;
  private engine!: BABYLON.Engine;
  private scene!: BABYLON.Scene;
  private camera!: BABYLON.ArcRotateCamera;
  private ground!: BABYLON.Mesh;
  private shapes: BABYLON.Vector3[] = [];  // Stores 2D points
  private room!: Room;
  private client:Client;
  private players: Map<string, Player> = new Map();

  constructor() {
    this.client = new Client('ws://localhost:2567'); 
  }

  async ngAfterViewInit() {
    this.initializeBabylon();
    await this.initializeColyseus();
    this.connectToRoom();
  }

  private initializeBabylon() {
    // Set up Babylon scene
    this.engine = new BABYLON.Engine(this.renderCanvas.nativeElement, true);
    this.scene = new BABYLON.Scene(this.engine);

    this.camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3.Zero(), this.scene);
    this.camera.attachControl(this.renderCanvas.nativeElement, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this.scene);
    this.ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, this.scene);
    this.ground.isPickable = true;

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }
  private async connectToRoom() {
    this.room = await this.client.joinOrCreate('game_room');

    // Handle player additions
    this.room.state.players.onAdd = (player: any, key: string) => {
      const playerMesh = BABYLON.MeshBuilder.CreateBox(`player_${key}`, { size: 1 }, this.scene);
      playerMesh.position = new BABYLON.Vector3(player.x, player.y, player.z);
      this.players.set(key, { id: key, mesh: playerMesh, position: playerMesh.position });
    };

    // Handle player movements
    this.room.onMessage('player_move', (data: any) => {
      const { playerId, position } = data;
      const player = this.players.get(playerId);
      if (player) {
        player.mesh.position.set(position.x, position.y, position.z);
      }
    });
  }
  private async initializeColyseus() {
    
    this.room = await this.client.joinOrCreate("game_room");

    // Listen for updates from the server
    this.room.onMessage("player_move", (data) => {
      const playerMesh = this.scene.getMeshByName(data.id) as BABYLON.Mesh;
      if (playerMesh) {
        playerMesh.position.fromArray(data.position);
        playerMesh.rotation.fromArray(data.rotation);
      }
    });

    // Listen for other players' shapes and movements
    this.room.state.players.onAdd = (player: any, key: any) => {
      // Handle adding new players and their shapes here
    };
    // this.room.onMessage("player_move", (data) => {
    //   // Update player positions based on received data
    // });
  }

  startDrawing() {
    this.shapes = []; // Reset shapes
    this.scene.onPointerDown = (evt, pickResult) => {
      if (pickResult.hit && pickResult.pickedPoint && pickResult.pickedMesh === this.ground) {
        this.shapes.push(pickResult.pickedPoint.clone());
      }
    };
  }

  finalizeShape() {
    if (this.shapes.length < 2) return;

    // Draw the 2D shape using the collected points
    const line = BABYLON.MeshBuilder.CreateLines("line", { points: this.shapes }, this.scene);
    this.shapes = []; // Reset for the next shape

    // Extrude the shape to 3D
    this.extrudeShapeTo3D(line);
  }

  extrudeShapeTo3D(line: BABYLON.LinesMesh) {
    const verticesData = line.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const shape: BABYLON.Vector3[] = [];

    if (verticesData) {
      for (let i = 0; i < verticesData.length; i += 3) {
        const x = verticesData[i];
        const y = verticesData[i + 1] + 0.1; // Slightly adjust the y-coordinate
        const z = verticesData[i + 2];
        shape.push(new BABYLON.Vector3(x, y, z));
      }
    }

    if (shape) {
      const path = [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 1, 0)]; // Define a simple path for extrusion
      const extruded = BABYLON.MeshBuilder.ExtrudeShape("extrudedShape", { shape, path }, this.scene);
      extruded.position.y = 0.01; // Raise slightly above the ground

      // Broadcast shape position
      this.broadcastPosition(extruded);
    }
  }

  private broadcastPosition(mesh: BABYLON.Mesh) {
    this.room.send("player_move", {
      position: mesh.position.asArray(),
      rotation: mesh.rotation.asArray()
    });
  }
}
