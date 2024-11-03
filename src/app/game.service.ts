import { Injectable } from '@angular/core';
import { Client, Room } from 'colyseus.js';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private client: Client;
  private room!: Room;

  constructor() {
    this.client = new Client('ws://localhost:3000');
  }

  async connectToGame() {
    this.room = await this.client.joinOrCreate('game_room');
    this.room.onMessage('update_players', (players) => {
      console.log(players);
    });
  }

  createShape(shapeData: any) {
    this.room.send('create_shape', shapeData);
  }

  moveShape(movementData: any) {
    this.room.send('move_shape', movementData);
  }

}
