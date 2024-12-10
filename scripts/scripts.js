// Function to roll dice with Dice So Nice
async function rollDice(bubbles) {
    if (bubbles === 0) {
        const roll1 = await new Roll("1d6").evaluate({ async: true });
        const roll2 = await new Roll("1d6").evaluate({ async: true });
        await game.dice3d.showForRoll(roll1);
        await game.dice3d.showForRoll(roll2);
        return { total: Math.min(roll1.total, roll2.total), formula: "2d6 (lower)" };
    }
    const roll = await new Roll(`${bubbles}d6`).evaluate({ async: true });
    await game.dice3d.showForRoll(roll); // Dice So Nice visual roll
    return { total: roll.total, formula: `${bubbles}d6` };
}

// Helper function to calculate enhancement bonuses
function calculateEnhancements(enhancements) {
    return enhancements.reduce((total, value) => total + (value || 0), 0);
}

// Main function to perform the roll
async function rollAttributeWithEnhancements(actor, attribute) {
    const bubbles = actor.system.attributes[attribute]?.bubbles || 0; // Retrieve bubbles
    const enhancements = actor.system.enhancements[attribute] || []; // Retrieve enhancements

    // Roll the dice
    const diceResult = await rollDice(bubbles);

    // Calculate the enhancement bonus
    const enhancementBonus = calculateEnhancements(enhancements);

    // Total result
    const totalResult = diceResult.total + enhancementBonus;

    // Display result in chat
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

// Add Dice Tray buttons for attributes (if Dice Tray is installed)
Hooks.on("renderDiceTray", (app, html) => {
    const attributes = ["agility", "strength", "charisma", "observation"];
    const buttons = attributes.map(attr => {
        return `<button class="superhero-roll" data-attribute="${attr}">${attr.toUpperCase()}</button>`;
    }).join("");

    html.find(".dice-tray-buttons").append(`
        <div class="superhero-buttons">
            <h3>Superhero TTRPG</h3>
            ${buttons}
        </div>
    `);

    html.find(".superhero-roll").click(async event => {
        const attribute = event.currentTarget.dataset.attribute;
        const actor = game.user.character; // Assumes user has a character assigned
        if (!actor) {
            ui.notifications.warn("No character assigned!");
            return;
        }
        await rollAttributeWithEnhancements(actor, attribute);
    });
});

// Make the roll function globally accessible
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
