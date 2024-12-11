// Main script for the Superhero TTRPG Enhancements module

// Helper function to roll dice
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

// Function to handle attribute rolls
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

// Hook to register custom actor types and assign PDFs
Hooks.on("init", () => {
    CONFIG.Actor.documentClass = class extends CONFIG.Actor.documentClass {
        prepareData() {
            super.prepareData();
            this.assignDefaultPDF();
        }

        assignDefaultPDF() {
            const type = this.type;
            const pdfMap = {
                "character": "path/to/character.pdf",
                "nemesis": "path/to/nemesis.pdf",
                "team": "path/to/team.pdf",
                "hq": "path/to/hq.pdf",
                "vehicle": "path/to/vehicle.pdf"
            };
            this.data.update({ "system.pdfPath": pdfMap[type] || null });
        }
    };
});

// Add a global API for external use
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

    console.log("Superhero TTRPG Enhancements module loaded.");
});
