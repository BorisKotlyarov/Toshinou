/*
Created by Freshek on 11.11.2017
*/

class NpcSettingsWindow {
  createWindow() {
    this.npcSettingsWindow = WindowFactory.createWindow({ width: 300, maxHeight: 100, text: "NPC Killer Settings" });

    let controls = [];

    this.knownNpcList.forEach((n, i) => {

      controls.push({
        name: `npc${i}`,
        labelText: n,
        appendTo: this.npcSettingsWindow,
        event: function () {
          window.settings.setNpc(n, this.checked);
        }
      });

    });


    controls.forEach((control)=>{
      this[control.name] = ControlFactory.createControl(control);
    });
  }

  get knownNpcList() {
    return [
      "-=[ Streuner ]=-",
      "-=[ Aider Streuner ]=-",
      "-=[ Recruit Streuner ]=-",
      "-=[ Lordakia ]=-",
      "-=[ Devolarium ]=-",
      "-=[ Mordon ]=-",
      "-=[ Sibelon ]=-",
      "-=[ Saimon ]=-",
      "-=[ Lordakium ]=-",
      "-=[ Sibelonit ]=-",
      "-=[ Kristallin ]=-",
      "-=[ Kristallon ]=-",
      "-=[ StreuneR ]=-",
      "-=[ Protegit ]=-",
      "-=[ Cubikon ]=-",
      "..::{ Boss Streuner }::..",
      "..::{ Boss Lordakia }::..",
      "..::{ Boss Mordon }::..",
      "..::{ Boss Saimon }::..",
      "..::{ Boss Devolarium }::..",
      "..::{ Boss Sibelonit }::..",
      "..::{ Boss Sibelon }::..",
      "..::{ Boss Lordakium }::...",
      "..::{ Boss Kristallin }::..",
      "..::{ Boss Kristallon }::..",
      "..::{ Boss StreuneR }::..",
      "( UberStreuner )",
      "( UberLordakia )",
      "( UberMordon )",
      "( UberSaimon )",
      "( UberDevolarium )",
      "( UberSibelonit )",
      "( UberSibelon )",
      "( UberLordakium )",
      "( UberKristallin )",
      "( UberKristallon )",
      "( UberStreuneR )",
      "-=[ Blighted Kristallon ]=-",
      "-=[ Plagued Kristallin ]=-",
      "-=[ Plague Rocket ]=-"
    ];
  }
}
