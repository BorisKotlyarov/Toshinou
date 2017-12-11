/*
 Created by Freshek on 07.10.2017
 */
window.globalSettings = new GlobalSettings();
var api;

class BotWorker  {

  constructor() {

    this.logics = [];
    this.windows = {};

    this.map = {
      width: 20732,
      heigth: 12830,
    };


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
      'GGWindow': {class: GGWindow, args: {}},
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
      this[logic.name]();
    });

    if (this.x && this.y) {
      this.api.move(this.x, this.y);
      window.movementDone = false;
    }

    window.dispatchEvent(new CustomEvent("logicEnd",{ detail: { worker: this } }));
  }

  /**
   *
   * @param name {string}
   * @param action {function}
   * @param priority {number}
   *
   * @description add an "action" to the work cycle
     */
  addLogic(name, action, priority) {
    this[name] = action;
    this.logics.push({name, priority });
  }

  /**
   *
   * @param name {string}
   *
   * @description remove an "action" from the work cycle
     */
  removeLogic(name) {
    delete this[name];
    let index = this.logics.findIndex(i => i.name === name);
    this.logics.splice(index, 1);
  }

  /**
   *
   * @param toggle {boolean}
   * @param name {string}
   * @param action {function}
   * @param priority {number}
   *
   * @description add or remove an "action" from the work cycle
   *
     */
  toggleLogic({toggle = true, name, action, priority}){
    if(toggle){
      this.addLogic(name, action, priority);
    } else {
      this.removeLogic(name);
    }
  }

}

$(document).ready(function() {
  window.BotWorkerInstance = new BotWorker();
});
