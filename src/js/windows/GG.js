class GGWindow {

  constructor(options){
    this._parent = options.parent;
  }

  createWindow() {
    this.ggWindow = WindowFactory.createWindow({width: 300, text: "GG Helper"});

    let self = this;

    let controls = [
      {
        name: 'ggAlgorithm',
        labelText: 'GG algorithm',
        appendTo: this.ggWindow,
        event: function () {

          self._parent.toggleLogic({
            toggle: this.checked,
            name: 'searchNpcsLogic',
            action: self.searchNpcsLogic,
            priority: 10,
          });

          window.settings.ggAlgorithm = this.checked;
        }
      },
      {
        name: 'ggDistance',
        labelText: ' Distance <span> (500px)</span>',
        type: 'range',
        appendTo: this.ggWindow,
        labelBefore: true,
        attrs: {
          min: 1,
          max: 800,
          step: 1,
          value: 500,
        }
        ,
        event: function (ev) {
          window.settings.ggDistance = this.value;
          $('span:last-child', this.label).text(' (' + this.value + 'px)');
        }
      },
    ];

    controls.forEach((control)=>{
      this[control.name] = ControlFactory.createControl(control);
    });

    window.settings.ggDistance = this.ggDistance.value;

    this._parent.addLogic('ggLogicBefore', this.ggLogicBefore, 1);
    this._parent.addLogic('ggLogic', this.ggLogic, 20);

  }

  ggClearLock(){
    if(this.api.lockedShip && this.api.lockedShip.percentOfHp < 20){
      this.api.targetShip = null;
      this.api.attacking = false;
      this.api.triedToLock = false;
      this.api.lockedShip = null;
    }

    if ((this.api.targetShip && $.now() - this.api.lockTime > 5000 && !this.api.attacking) || $.now() - this.api.lastAttack > 25000) {
      this.api.targetShip = null;
      this.api.attacking = false;
      this.api.triedToLock = false;
      this.api.lockedShip = null;
    }

  }

  ggLogicBefore(){
    if(this.enemyAngle===undefined){
      this.enemyAngle = 0;
    }
  }

  searchNpcsLogic(){

    if (this.api.targetShip == null) {

      var ship = this.api.findNearestShip();

      if (ship.ship && ship.distance < 1000) {

        this.api.lockShip(ship.ship);
        this.api.triedToLock = true;
        this.api.targetShip = ship.ship;
        return;

      } else if (ship.ship) {
        ship.ship.update();
        this.api.move(ship.ship.position.x - MathUtils.random(-50, 50), ship.ship.position.y - MathUtils.random(-50, 50));
        this.api.targetShip = ship.ship;
        return;
      }

    } else {

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

  ggLogic(){

    if(this.api.targetShip && window.settings.ggAlgorithm) {

      let enemy = this.api.targetShip.position;
      let DISTANSE = window.settings.ggDistance;

      let mapCenter = {
        x: this.map.width / 2,
        y: this.map.height / 2,
      };

      let radius = mapCenter.y - 58;

      let speed = this.speed;

      if (window.hero.hp >= window.hero.maxHp) {
        if (this.api.targetShip.distanceTo(window.hero.position) > DISTANSE) {
          speed--;
        } else {
          speed++;
        }
      }

      let coefficient = speed / radius;
      this.enemyAngle += coefficient;

      let f = Math.atan2(mapCenter.y - this.y, mapCenter.x - this.x) + this.enemyAngle;

      this.x = mapCenter.x + radius * Math.sin(f);
      this.y = mapCenter.y + radius * Math.cos(f);

    }

  }

}
