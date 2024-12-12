// Map actor types to their PDFs
const pdfMappings = {
  "character": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom%20sheets/Sheets/AOH%20Character%20sheet%202.1%20Fillable.pdf",
  "nemesis": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom%20sheets/Sheets/AOH%20Nemesis%20sheet%201.pdf",
  "hq": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom%20sheets/Sheets/AOH%20Team%20HQ%20Sheet.pdf",
  "team": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom%20sheets/Sheets/AOH%20Team%20sheet%20.pdf",
  "vehicle": "https://assets.forge-vtt.com/653575f9f36a321e31c74aba/Custom%20sheets/Sheets/AOH%20Vehicle%20sheet.pdf"
};

// Assign PDFs during actor creation
Hooks.on("preCreateActor", async (actor) => {
  const pdfPath = pdfMappings[actor.type];
  if (pdfPath) {
    actor.updateSource({ "flags.pdf-character-sheet.filePath": pdfPath });
  }
});

// Dice rolling logic using Dice So Nice
async function rollDice(bubbles) {
  const formula = bubbles > 0 ? `${bubbles}d6` : "2d6";
  const roll = new Roll(formula).evaluate({ async: true });
  await game.dice3d?.showForRoll(roll);
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

  const name = `NPC - ${role}`;
  const description = descriptions[role] || "A mysterious individual.";

  Actor.create({
    name,
    type: "npc",
    data: { description }
  });

  ui.notifications.info(`Created NPC: ${name}`);
}
