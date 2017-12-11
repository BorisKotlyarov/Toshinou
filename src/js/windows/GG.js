class GGWindow {

  constructor(options){
    this._parent = options.parent;
  }

  createWindow() {
    this.ggWindow = WindowFactory.createWindow({width: 300, text: "GG Helper"});

    let controls = [
      {
        name: 'ggAlgorithm',
        labelText: 'GG algorithm',
        appendTo: this.ggWindow,
        event: function () {
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

/*    this._parent.logics.push({ priority: 0, action: this.ggLogicBefore });
    this._parent.logics.push({ priority: 60, action: this.ggLogic });*/

  }

  ggLogicBefore(){
    if(this.enemyAngle===undefined){
      this.enemyAngle = 0;
    }
  }

  searchNpcsLogic(){
    if (this.api.targetShip && window.settings.killNpcs) {
      if (!this.api.triedToLock && (this.api.lockedShip == null || this.api.lockedShip.id != this.api.targetShip.id)) {
        this.api.targetShip.update();
        
        var dist = this.api.targetShip.distanceTo(window.hero.position);
        
        this.api.lockShip(this.api.targetShip);
        this.api.triedToLock = true;
        return;
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
