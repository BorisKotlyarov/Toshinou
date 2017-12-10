/*
Created by Freshek on 14.10.2017
*/

class GeneralSettingsWindow {

  constructor(options){
    this._parent = options.parent;
  }

  createWindow() {
    this.botSettingsWindow = WindowFactory.createWindow({width: 300, text: "General"});

    let controls = [
      {
        name: 'collectBoxes',
        labelText: 'Collect boxes',
        appendTo: this.botSettingsWindow,
        event: function () {
          window.settings.collectBoxes = this.checked;
        }
      },
      {
        name: 'collectMaterials',
        labelText: 'Collect materials',
        appendTo: this.botSettingsWindow,
        event: function () {
          window.settings.collectMaterials = this.checked;
        }
      },
      {
        name: 'moveRandomly',
        labelText: 'Move randomly',
        appendTo: this.botSettingsWindow,
        event: function () {
          window.settings.moveRandomly = this.checked;
        }
      },
      {
        name: 'npcKiller',
        labelText: 'Kill NPCs',
        appendTo: this.botSettingsWindow,
        event: function () {
          window.settings.killNpcs = this.checked;
        }
      },
      {
        name: 'npcCircle',
        labelText: 'Circle (Beta)',
        appendTo: this.botSettingsWindow,
        event: function () {
          window.settings.circleNpc = this.checked;
        }
      },
      // {
      //   name: 'collectionSensitivity',
      //   labelText: 'Collection sensitivity <span> (100%)</span>',
      //   type: 'range',
      //   appendTo: this.botSettingsWindow,
      //   labelBefore: true,
      //   attrs: {
      //     min: 1,
      //     max: 100,
      //     step: 1,
      //     value: 100,
      //   }
      //   ,
      //   event: function (ev) {
      //     window.settings.collectionSensitivity = this.value;
      //     $('span:last-child', this.label).text(' (' + this.value + '%)');
      //   }
      // },
      {
        name: 'npcCircleRadius',
        labelText: ' Circle radius <span> (500px)</span>',
        type: 'range',
        appendTo: this.botSettingsWindow,
        labelBefore: true,
        attrs: {
          min: 1,
          max: 800,
          step: 1,
          value: 500,
        }
        ,
        event: function (ev) {
          window.settings.npcCircleRadius = this.value;
          $('span:last-child', this.label).text(' (' + this.value + 'px)');
        }
      },
      {
        name: 'dontCircleWhenHpBelow15Percent',
        labelText: "Don't circle when HP < 15%",
        appendTo: this.botSettingsWindow,
        event: function () {
          window.settings.dontCircleWhenHpBelow15Percent = this.checked;
        }
      },
      {
        name: 'repairWhenHpIsLowerThanPercent',
        labelText: ' Repair when HP < <span> (10%)</span>',
        type: 'range',
        appendTo: this.botSettingsWindow,
        labelBefore: true,
        attrs: {
          min: 0,
          max: 100,
          step: 1,
          value: 10
        },
        event: function (ev) {
          window.settings.repairWhenHpIsLowerThanPercent = this.value;
          $('span:last-child', this.label).text(' (' + this.value + '%)');
        }
      },
      {
        name: 'reviveAtGate',
        labelText: 'Revive at the nearest gate',
        appendTo: this.botSettingsWindow,
        event: function () {
          window.settings.reviveAtGate = this.checked;
        }
      },

      {
        name: 'reviveLimit',
        labelText: 'Revive limit <span> (5)</span>',
        type: 'range',
        appendTo: this.botSettingsWindow,
        labelBefore: true,
        attrs: {
          min: 0,
          max: 100,
          step: 1,
          value: 10
        },
        event: function () {
          window.settings.reviveLimit = this.value;
          $('span:last-child', this.label).text(' (' + this.value + ')');
        }
      },
      {
        name: 'noddGate',
        labelText: 'Не добивать',
        appendTo: this.botSettingsWindow,
        event: function () {
          window.settings.noddGate = this.checked;
        }
      },
    ];

    controls.forEach((control)=>{
      this[control.name] = ControlFactory.createControl(control);
    });

    this._parent.logics.push({ priority: 0, action: this.reviveLogic });
    this._parent.logics.push({ priority: 10, action: this.searchNpcsLogic });
    this._parent.logics.push({ priority: 20, action: this.searchBoxes });
    this._parent.logics.push({ priority: 30, action: this.npcStucksFallback });
    this._parent.logics.push({ priority: 40, action: this.randomMove });
    this._parent.logics.push({ priority: 50, action: this.killNpcsLogic });
  }

  reviveLogic(){

    if (this.api.targetBoxHash == null && this.api.targetShip == null) {
      if (MathUtils.percentFrom(window.hero.hp, window.hero.maxHp) < window.settings.repairWhenHpIsLowerThanPercent) {
        let gate = this.api.findNearestGate();
        if (gate.gate) {
          let x = gate.gate.position.x;
          let y = gate.gate.position.y;
          this.api.isRepairing = true;
          this.api.move(x, y);
          window.movementDone = false;
          return;
        }
      }

      var box = this.api.findNearestBox();
      var ship = this.api.findNearestShip();

      if ((ship.distance > 1000 || !ship.ship) && (box.box)) {
        this.api.collectBox(box.box);
        this.api.targetBoxHash = box.box.hash;
        return;
      } else if (ship.ship && ship.distance < 1000 && window.settings.killNpcs) {
        this.api.lockShip(ship.ship);
        this.api.triedToLock = true;
        this.api.targetShip = ship.ship;
        return;
      } else if (ship.ship && window.settings.killNpcs) {
        ship.ship.update();
        this.api.move(ship.ship.position.x - MathUtils.random(-50, 50), ship.ship.position.y - MathUtils.random(-50, 50));
        this.api.targetShip = ship.ship;
        return;
      }
    }

  }

  searchNpcsLogic(){
    if (this.api.targetShip && window.settings.killNpcs) {
      if (!this.api.triedToLock && (this.api.lockedShip == null || this.api.lockedShip.id != this.api.targetShip.id)) {
        this.api.targetShip.update();
        var dist = this.api.targetShip.distanceTo(window.hero.position);
        if (dist < 600) {
          this.api.lockShip(this.api.targetShip);
          this.api.triedToLock = true;
          return;
        }
      }

      if (!this.api.attacking && this.api.lockedShip) {
        this.api.startLaserAttack();
        this.api.lastAttack = $.now();
        this.api.attacking = true;
        return;
      }
    }
  }

  searchBoxes(){
    if (this.api.targetBoxHash && $.now() - this.api.collectTime > 5000) {
      let box = this.api.boxes[this.api.targetBoxHash];
      if (box && box.distanceTo(window.hero.position) > 1000) {
        this.api.collecTime = $.now();
      } else {
        delete this.api.boxes[this.api.targetBoxHash];
        this.api.blackListHash(this.api.targetBoxHash);
        this.api.targetBoxHash = null;
      }
    }
  }

  npcStucksFallback(){
    //HACK: npc stucks fallback
    if ((this.api.targetShip && $.now() - this.api.lockTime > 5000 && !this.api.attacking) || $.now() - this.api.lastAttack > 25000) {
      this.api.targetShip = null;
      this.api.attacking = false;
      this.api.triedToLock = false;
      this.api.lockedShip = null;
    }
  }

  randomMove(){
    if(this.api.targetBoxHash == null && this.api.targetShip == null && window.movementDone && window.settings.moveRandomly) {
      this.x = MathUtils.random(100, this.map.width);
      this.y = MathUtils.random(58, this.map.heigth);
    }
  }

  killNpcsLogic(){

    if (this.api.targetShip && window.settings.killNpcs && this.api.targetBoxHash == null) {
      this.api.targetShip.update();
      var dist = this.api.targetShip.distanceTo(window.hero.position);

      if ((dist > 600 && (this.api.lockedShip == null || this.api.lockedShip.id != this.api.targetShip.id) && $.now() - this.api.lastMovement > 1000)) {
        this.x = this.api.targetShip.position.x - MathUtils.random(-50, 50);
        this.y = this.api.targetShip.position.y - MathUtils.random(-50, 50);
        this.api.lastMovement = $.now();
      } else if (this.api.lockedShip && this.api.lockedShip.percentOfHp < 15 && this.api.lockedShip.id == this.api.targetShip.id && window.settings.dontCircleWhenHpBelow15Percent) {
        if (dist > 450) {
          this.x = this.api.targetShip.position.x + MathUtils.random(-30, 30);
          this.y = this.api.targetShip.position.y + MathUtils.random(-30, 30);
        }
      } else if (dist > 300 && this.api.lockedShip && this.api.lockedShip.id == this.api.targetShip.id & !window.settings.circleNpc) {
        this.x = this.api.targetShip.position.x + MathUtils.random(-200, 200);
        this.y = this.api.targetShip.position.y + MathUtils.random(-200, 200);
      } else if (this.api.lockedShip && this.api.lockedShip.id == this.api.targetShip.id) {
        if (window.settings.circleNpc) {
          //I'm not completely sure about this algorithm
          let enemy = this.api.targetShip.position;
          let f = Math.atan2(window.hero.position.x - enemy.x, window.hero.position.y - enemy.y) + 0.5;
          let s = Math.PI / 180;
          f += s;
          this.x = enemy.x + window.settings.npcCircleRadius * Math.sin(f);
          this.y = enemy.y + window.settings.npcCircleRadius * Math.cos(f);
        }
      } else { // ??? there must be something wrong with our locked npc
        this.api.targetShip = null;
        this.api.attacking = false;
        this.api.triedToLock = false;
        this.api.lockedShip = null;
      }
    }

    if(window.settings.noddGate && this.api.lockedShip.percentOfHp < 15){
      window.settings.noddGate
    }

  }

}
