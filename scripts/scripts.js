// Register custom actor types
Hooks.once('init', async function () {
  CONFIG.Actor.typeLabels = {
    "character": "Character",
    "nemesis": "Nemesis",
    "hq": "HQ",
    "team": "Team",
    "vehicle": "Vehicle"
  };

  console.log("Custom actor types registered:", CONFIG.Actor.typeLabels);
});

// Map actor types to their default PDF sheets
const pdfMappings = {
  "character": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom sheets/Sheets/AOH Character sheet 2.1 Fillable.pdf",
  "nemesis": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom sheets/Sheets/AOH Nemesis sheet 1.pdf",
  "hq": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom sheets/Sheets/AOH Team HQ Sheet.pdf",
  "team": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom sheets/Sheets/AOH Team sheet .pdf",
  "vehicle": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom sheets/Sheets/AOH Vehicle sheet.pdf"
};

// Fallback PDF for unassigned actor types
const defaultPdfPath = "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom sheets/Sheets/Blank Sheet.pdf";

// Assign default PDF during actor creation
Hooks.on("preCreateActor", async (actor, options, userId) => {
  console.log(`Creating actor: ${actor.name} of type: ${actor.type}`);
  const pdfPath = pdfMappings[actor.type] || defaultPdfPath;
  if (pdfPath) {
    console.log(`Assigning PDF: ${pdfPath}`);
    actor.updateSource({ "flags.pdf-character-sheet.filePath": pdfPath });
  } else {
    console.warn(`No PDF mapping found for actor type: ${actor.type}. Assigning default blank PDF.`);
  }
});

// Dice rolling logic using Dice So Nice
async function rollDice(bubbles) {
  if (!game.dice3d) {
    console.error("Dice So Nice is not enabled. Dice rolls will not be visualized.");
    return { total: 0, formula: "0d6" };
  }
  const formula = bubbles > 0 ? `${bubbles}d6` : "2d6";
  const roll = new Roll(formula).evaluate({ async: true });
  await game.dice3d.showForRoll(roll);
  return { total: roll.total, formula };
}

// Calculate enhancements
function calculateEnhancements(enhancements = []) {
  return enhancements.reduce((total, bonus) => total + (bonus || 0), 0);
}

// Roll attribute with enhancements
async function rollAttributeWithEnhancements(actor, attribute) {
  const bubbles = actor.getFlag("superheroTTRPG", `attributes.${attribute}.bubbles`) || 0;
  const enhancements = actor.getFlag("superheroTTRPG", `enhancements.${attribute}`) || [];

  const diceResult = await rollDice(bubbles);
  const totalEnhancement = calculateEnhancements(enhancements);
  const total = diceResult.total + totalEnhancement;

  ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <h2>${attribute.toUpperCase()} Roll</h2>
      <p><strong>Dice Roll:</strong> ${diceResult.total} (${diceResult.formula})</p>
      <p><strong>Enhancements:</strong> +${totalEnhancement}</p>
      <p><strong>Total Result:</strong> ${total}</p>
    `
  });
}

// Default flag initialization for actors
Hooks.on("createActor", (actor) => {
  if (!actor.getFlag("superheroTTRPG", "attributes")) {
    actor.setFlag("superheroTTRPG", "attributes", { strength: { bubbles: 0 } });
  }
  if (!actor.getFlag("superheroTTRPG", "enhancements")) {
    actor.setFlag("superheroTTRPG", "enhancements", {});
  }
});
