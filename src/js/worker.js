/*
Created by Freshek on 07.10.2017
*/
window.globalSettings = new GlobalSettings();
var api;

class BotWorker  {

  constructor() {
    api = new Api();

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

    var userIdPttrn = /userID=([0-9]+)/g;
    var flashVars = document.querySelectorAll('[name="flashvars"]')[0].getAttribute("value");
    window.userId = userIdPttrn.exec(flashVars)[1];

    window.settings = new Settings();
    this.initialized = false;

    window.movementDone = true;

    var hm = new HandlersManager(api);

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
      'minimap': {class: Minimap, args: api},
      'attackWindow': {class: AttackWindow, args: {}},
      'collectingWindow': {class: CollectingWindow, args: {}},
      'autolockWindow': {class: AutolockWindow, args: {}},
      'npcSettingsWindow': {class: NpcSettingsWindow, args: {}},
      'statisticWindow': {class: StatisticWindow, args: {}},
    };

    Object.keys(windowsObjects).forEach((item)=>{
      let CLassName = windowsObjects[item].class;
      window[item] = new CLassName(windowsObjects[item].args);
      window[item].createWindow();
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
    if (api.heroDied)
      return;

    window.minimap.draw();

    if (api.targetBoxHash == null && api.targetShip == null) {
      var box = api.findNearestBox();
      var ship = api.findNearestShip();

      if ((!ship || ship.distance > 1000 || !ship.ship) && (box && box.box)) {
        api.collectBox(box.box);
        api.targetBoxHash = box.box.hash;
        return;
      } else if (ship.ship && ship && ship.distance < 1000 && window.settings.killNpcs) {
        api.lockShip(ship.ship);
        api.triedToLock = true;
        api.targetShip = ship.ship;
        return;
      } else if (ship.ship && ship && window.settings.killNpcs) {
        ship.ship.update();
        api.move(ship.ship.position.x - MathUtils.random(-50, 50), ship.ship.position.y - MathUtils.random(-50, 50));
        api.targetShip = ship.ship;
        return;
      }
    }

    if (api.targetShip && window.settings.killNpcs) {
      if (!api.triedToLock && (api.lockedShip == null || api.lockedShip.id != api.targetShip.id)) {
        api.targetShip.update();
        var dist = api.targetShip.distanceTo(window.hero.position);
        if (dist < 1000) {
          api.lockShip(api.targetShip);
          api.triedToLock = true;
          return;
        }
      }

      if (!api.attacking && api.lockedShip) {
        api.startLaserAttack();
        api.attacking = true;
        return;
      }
    }

    if (api.targetBoxHash && $.now() - api.collectTime > 5000) {
      delete api.boxes[api.targetBoxHash];
      api.blackListHash(api.targetBoxHash);
      api.targetBoxHash = null;
    }

    //HACK: npc stucks fallback
    if (api.targetShip && $.now() - api.lockTime > 5000 && !api.attacking) {
      api.targetShip = null;
      api.attacking = false;
      api.triedToLock = false;
      api.lockedShip = null;
    }

    var x;
    var y;

    if (api.targetBoxHash == null && api.targetShip == null && window.movementDone && window.settings.moveRandomly) {
      x = MathUtils.random(100, 20732);
      y = MathUtils.random(58, 12830);
    }

    if (api.targetShip) {
      api.targetShip.update();
      var dist = api.targetShip.distanceTo(window.hero.position);

      if (dist > 1000 && (api.lockedShip == null || api.lockedShip.id != api.targetShip.id) && $.now() - api.lastMovement > 1000) {
        x = api.targetShip.position.x - MathUtils.random(-50, 50);
        y = api.targetShip.position.y - MathUtils.random(-50, 50);
        api.lastMovement = $.now();
      } else if (dist > 300 && api.lockedShip && api.lockedShip.id == api.targetShip.id) {
        x = api.targetShip.position.x + MathUtils.random(-200, 200);
        y = api.targetShip.position.y + MathUtils.random(-200, 200);
      }
    }

    if (x && y) {
      api.move(x, y);
      window.movementDone = false;
    }
  }

}

$(document).ready(function() {
  window.BotWorkerInstance = new BotWorker();
});
