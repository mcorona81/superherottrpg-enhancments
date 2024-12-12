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

// Map actor types to their PDFs
const pdfMappings = {
  "character": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom sheets/Sheets/AOH Character sheet 2.1 Fillable.pdf",
  "nemesis": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom sheets/Sheets/AOH Nemesis sheet 1.pdf",
  "hq": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom sheets/Sheets/AOH Team HQ Sheet.pdf",
  "team": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom sheets/Sheets/AOH Team sheet .pdf",
  "vehicle": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom sheets/Sheets/AOH Vehicle sheet.pdf"
};

// Assign PDFs during actor creation
Hooks.on("preCreateActor", async (actor) => {
  const pdfPath = pdfMappings[actor.type];
  if (pdfPath) {
    actor.updateSource({ "flags.pdf-character-sheet.filePath": pdfPath });
  } else {
    console.warn(`No PDF mapping found for actor type: ${actor.type}`);
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

// NPC generator using your defined roles
Hooks.on("createActor", (actor) => {
  if (actor.type === "npc") {
    new Dialog({
      title: "Generate NPC",
      content: `
        <p>Choose a role:</p>
        <select id="npc-role">
          <option value="Civilian">Civilian</option>
          <option value="Medic">Medic</option>
          <option value="Tech">Tech</option>
          <option value="Mechanic">Mechanic</option>
          <option value="Politician">Politician</option>
          <option value="Goon">Goon</option>
          <option value="Reporter">Reporter</option>
        </select>
      `,
      buttons: {
        create: {
          label: "Create",
          callback: (html) => {
            const role = html.find("#npc-role").val();
            generateRandomNPC(role);
          }
        },
        cancel: {
          label: "Cancel"
        }
      }
    }).render(true);
  }
});

function generateRandomNPC(role) {
  const descriptions = {
    "Civilian": "An ordinary bystander caught in the action.",
    "Medic": "A paramedic rushing to save lives.",
    "Tech": "A brilliant engineer with a secret.",
    "Mechanic": "A rugged mechanic fixing high-tech machines.",
    "Politician": "A scheming politician with hidden agendas.",
    "Goon": "A henchman following orders.",
    "Reporter": "A relentless journalist seeking the truth."
  };

  if (!descriptions[role]) {
    console.error(`Invalid role: ${role}`);
    ui.notifications.error("Failed to create NPC. Invalid role selected.");
    return;
  }

  const name = `NPC - ${role}`;
  const description = descriptions[role];

  Actor.create({
    name,
    type: "npc",
    data: { description }
  });

  ui.notifications.info(`Created NPC: ${name}`);
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
