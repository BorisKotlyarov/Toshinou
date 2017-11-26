/*
Created by Freshek on 14.10.2017
*/

class Settings {
  constructor(collectBoxes, collectMaterials, moveRandomly, lockNpc, lockPlayers, killNpcs) {
    this._collectBoxes = collectBoxes === true;
    this._collectMaterials = collectMaterials === true;
    this._moveRandomly = moveRandomly === true;
    this._lockNpc = lockNpc === true;
    this._lockPlayers = lockPlayers === true;
    this._killNpcs = killNpcs === true;
    this._npcs = [];
  }

  get collectBoxes() {
    return this._collectBoxes;
  }

  set collectBoxes(value) {
    this._collectBoxes = value === true;
  }

  get collectMaterials() {
    return this._collectMaterials;
  }

  set collectMaterials(value) {
    this._collectMaterials = value === true;
  }

  get moveRandomly() {
    return this._moveRandomly;
  }

  set moveRandomly(value) {
    this._moveRandomly = value === true;
  }

  get lockNpc() {
    return this._lockNpc;
  }

  set lockNpc(value) {
    this._lockNpc = value === true;
  }

  get lockPlayers() {
    return this._lockPlayers;
  }

  set lockPlayers(value) {
    this._lockPlayers = value === true;
  }

  get killNpcs() {
    return this._killNpcs;
  }

  set killNpcs(value) {
    this._killNpcs = value === true;
  }

  setNpc(name, val) {
    this._npcs[name] = val;
  }

  getNpc(name) {
    return this._npcs.indexOf(name) === -1;
  }
}
