/*
Created by Freshek on 14.10.2017
*/

class GeneralSettingsWindow {
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
      {
        name: 'collectionSensitivity',
        labelText: 'Collection sensitivity <span> (100%)</span>',
        type: 'range',
        appendTo: this.botSettingsWindow,
        labelBefore: true,
        attrs: {
          min: 1,
          max: 100,
          step: 1,
          value: 100,
        }
        ,
        event: function (ev) {
          window.settings.collectionSensitivity = this.value;
          $('span:last-child', this.label).text(' (' + this.value + '%)');
        }
      },
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
    ];

    controls.forEach((control)=>{
      this[control.name] = ControlFactory.createControl(control);
    });
  }
}
