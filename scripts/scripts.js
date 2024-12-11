// List of default PDFs for each actor type
const defaultPDFs = {
  "character": "modules/superherottrpg-enhancements/assets/character.pdf",
  "nemesis": "modules/superherottrpg-enhancements/assets/nemesis.pdf",
  "team": "modules/superherottrpg-enhancements/assets/team.pdf",
  "hq": "modules/superherottrpg-enhancements/assets/hq.pdf",
  "vehicle": "modules/superherottrpg-enhancements/assets/vehicle.pdf"
};

// Hook to auto-assign PDFs when creating new actors
Hooks.on("preCreateActor", (actorData) => {
  const actorType = actorData.type;
  if (defaultPDFs[actorType]) {
    actorData.updateSource({
      "flags.pdfoundry.pdf": defaultPDFs[actorType]
    });
  }
});

// Function to roll dice based on filled bubbles
async function rollDice(bubbles) {
  if (bubbles === 0) {
    const roll1 = await new Roll("1d6").evaluate({ async: true });
    const roll2 = await new Roll("1d6").evaluate({ async: true });
    await game.dice3d.showForRoll(roll1);
    await game.dice3d.showForRoll(roll2);
    return { total: Math.min(roll1.total, roll2.total), formula: "2d6 (lower)" };
  }
  const roll = await new Roll(`${bubbles}d6`).evaluate({ async: true });
  await game.dice3d.showForRoll(roll);
  return { total: roll.total, formula: `${bubbles}d6` };
}

// Helper function to calculate enhancement bonuses
function calculateEnhancements(enhancements) {
  return enhancements.reduce((total, value) => total + (value || 0), 0);
}

// Function to perform rolls with enhancements
async function rollAttributeWithEnhancements(actor, attribute) {
  const bubbles = actor.system.attributes[attribute]?.bubbles || 0;
  const enhancements = actor.system.enhancements[attribute] || [];
  const diceResult = await rollDice(bubbles);
  const enhancementBonus = calculateEnhancements(enhancements);
  const totalResult = diceResult.total + enhancementBonus;

  ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <h2>${attribute.toUpperCase()} Roll</h2>
      <p><strong>Dice Roll:</strong> ${diceResult.total} (${diceResult.formula})</p>
      <p><strong>Enhancements:</strong> +${enhancementBonus}</p>
      <p><strong>Total Result:</strong> ${totalResult}</p>
    `
  });
}

// Make dice rolling globally accessible
Hooks.on("ready", () => {
  game.superheroTTRPG = {
    rollAttribute: async (actorId, attribute) => {
      const actor = game.actors.get(actorId);
      if (!actor) {
        ui.notifications.warn("Actor not found.");
        return;
      }
      await rollAttributeWithEnhancements(actor, attribute);
    }
  };
});
