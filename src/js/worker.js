/*
 Created by Freshek on 07.10.2017
 */
window.globalSettings = new GlobalSettings();
var api;

class BotWorker  {

  constructor() {

    this.logics = [];
    this.windows = {};

    this.api = new Api();

    var preloader = $("#preloader").attr("wmode", "opaque");
    $("#preloader").remove();

    var check = SafetyChecker.check();

    if (check !== true) {
      var warning = jQuery("<div>");
      warning.css({top: 0, left: 0, position: "absolute", width: "100%", height: "100%", backgroundColor: "gray", textAlign: "center"});

      jQuery("<h1>").text("The tool detected changes in the game.").appendTo(warning);
      jQuery("<h2>").text("Loading stopped! Your account has to stay safe.").appendTo(warning);
      jQuery("<h3>").text("Reason: " + check).appendTo(warning);

      warning.appendTo("body");
      throw new Error("Safety tests failed!");
    }

    preloader.appendTo($("#container"));

    window.settings = new Settings();
    window.initialized = false;
    window.reviveCount = 0;

    window.movementDone = true;

    var hm = new HandlersManager(this.api);

    let commands = {
      'BoxInitHandler': {class: BoxInitHandler, args: {}},
      'ShipAttackHandler': {class: ShipAttackHandler, args: {}},
      'ShipCreateHandler': {class: ShipCreateHandler, args: {}},
      'ShipMoveHandler': {class: ShipMoveHandler, args: {}},
      'AssetRemovedHandler': {class: AssetRemovedHandler, args: {}},
      'HeroInitHandler': {class: HeroInitHandler, args: {}},
      'ShipDestroyedHandler': {class: ShipDestroyedHandler, args: {}},
      'ShipRemovedHandler': {class: ShipRemovedHandler, args: {}},
      'GateInitHandler': {class: GateInitHandler, args: {}},
      'ShipSelectedHandler': {class: ShipSelectedHandler, args: {}},
      'MessagesHandler': {class: MessagesHandler, args: {}},
      'HeroDiedHandler': {class: HeroDiedHandler, args: {}},
      'HeroUpdateHitpointsHandler': {class: HeroUpdateHitpointsHandler, args: {}},
    };

    Object.keys(commands).forEach((item)=>{
      let CLassName = commands[item].class;
      hm.registerCommand(CLassName.ID, new CLassName(commands[item].args));
    });

    hm.registerEvent("updateHeroPos", new HeroPositionUpdateEventHandler());
    hm.registerEvent("movementDone", new MovementDoneEventHandler());

    hm.listen();

  }

  init(){
    if (this.initialized)
      return;

    let windowsObjects = {
      'minimap': {class: Minimap, args: { api: this.api }},
      'attackWindow': {class: AttackWindow, args: {}},
      'generalSettingsWindow': {class: GeneralSettingsWindow, args: {}},
      'autolockWindow': {class: AutolockWindow, args: {}},
      'npcSettingsWindow': {class: NpcSettingsWindow, args: {}},
      'statisticWindow': {class: StatisticWindow, args: {}},
    };

    Object.keys(windowsObjects).forEach((item)=>{
      let CLassName = windowsObjects[item].class;
      windowsObjects[item].args['parent'] = this;
      this.windows[item] = new CLassName(windowsObjects[item].args);
      this.windows[item].createWindow();
    });

    Injector.injectScriptFromResource("res/injectables/HeroPositionUpdater.js");

    window.setInterval(this.logic.bind(this), window.globalSettings.timerTick);

    $(document).keyup(function(e) {
      var key = e.key;

      if (key == "x" || key == "z") {
        var maxDist = 1000;
        var finDist = 1000000;
        var finalShip;

        for (var property in api.ships) {
          var ship = api.ships[property];
          var dist = ship.distanceTo(window.hero.position);

          if (dist < maxDist && dist < finDist && ((ship.isNpc && window.settings.lockNpc && key == "x") || (ship.isEnemy && window.settings.lockPlayers && key == "z" && !ship.isNpc))) {
            finalShip = ship;
            finDist = dist;
          }
        }

        if (finalShip != null)
          api.lockShip(finalShip);
      }
    });
  }

  logic(){
    if (this.api.isRepairing && window.hero.hp !== window.hero.maxHp) {
      return;
    } else if (this.api.isRepairing && window.hero.hp === window.hero.maxHp) {
      this.api.isRepairing = false;
    }

    if (this.api.heroDied && this.api.isDisconected)
      return;

    this.x = null;
    this.y = null;

    let priorityLogic = this.logics.sort((a, b)=>{
      return a.priority - b.priority;
    });

    priorityLogic.forEach((logic)=>{
      logic.action.call(this);
    });

    var x;
    var y;


    if (this.api.targetShip && window.settings.killNpcs && this.api.targetBoxHash == null) {
      this.api.targetShip.update();
      var dist = this.api.targetShip.distanceTo(window.hero.position);

      if ((dist > 600 && (this.api.lockedShip == null || this.api.lockedShip.id != this.api.targetShip.id) && $.now() - this.api.lastMovement > 1000)) {
        x = this.api.targetShip.position.x - MathUtils.random(-50, 50);
        y = this.api.targetShip.position.y - MathUtils.random(-50, 50);
        this.api.lastMovement = $.now();
      } else if (this.api.lockedShip && this.api.lockedShip.percentOfHp < 15 && this.api.lockedShip.id == this.api.targetShip.id && window.settings.dontCircleWhenHpBelow15Percent) {
        if (dist > 450) {
          x = this.api.targetShip.position.x + MathUtils.random(-30, 30);
          y = this.api.targetShip.position.y + MathUtils.random(-30, 30);
        }
      } else if (dist > 300 && this.api.lockedShip && this.api.lockedShip.id == this.api.targetShip.id & !window.settings.circleNpc) {
        x = this.api.targetShip.position.x + MathUtils.random(-200, 200);
        y = this.api.targetShip.position.y + MathUtils.random(-200, 200);
      } else if (this.api.lockedShip && this.api.lockedShip.id == this.api.targetShip.id) {
        if (window.settings.circleNpc) {
          //I'm not completely sure about this algorithm
          let enemy = this.api.targetShip.position;
          let f = Math.atan2(window.hero.position.x - enemy.x, window.hero.position.y - enemy.y) + 0.5;
          let s = Math.PI / 180;
          f += s;
          x = enemy.x + window.settings.npcCircleRadius * Math.sin(f);
          y = enemy.y + window.settings.npcCircleRadius * Math.cos(f);
        }
      } else { // ??? there must be something wrong with our locked npc
        this.api.targetShip = null;
        this.api.attacking = false;
        this.api.triedToLock = false;
        this.api.lockedShip = null;
      }
    }

    if (this.x && this.y) {
      this.api.move(this.x, this.y);
      window.movementDone = false;
    }

    window.dispatchEvent(new CustomEvent("logicEnd",{ detail: { worker: this } }));
  }

}

$(document).ready(function() {
  window.BotWorkerInstance = new BotWorker();
});
