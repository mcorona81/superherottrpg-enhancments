// Hook: Assign default PDFs when creating actors
Hooks.on("preCreateActor", async (actor, options, userId) => {
    const defaultPDFs = {
        character: "journals/character.pdf",
        npc: "journals/npc.pdf",
        nemesis: "journals/nemesis.pdf",
        vehicle: "journals/vehicle.pdf",
        teamProgress: "journals/team-progress.pdf",
        hq: "journals/hq.pdf"
    };

    const type = actor.type;
    const pdfPath = defaultPDFs[type];

    if (pdfPath) {
        actor.updateSource({ "flags.pdf-character-sheet.filePath": pdfPath });
    }
});

// Function: Roll dice based on attributes
async function rollDice(bubbles) {
    const rollFormula = bubbles > 0 ? `${bubbles}d6` : "2d6";
    const roll = new Roll(rollFormula).evaluate({ async: true });

    await game.dice3d?.showForRoll(roll);

    return {
        total: roll.total,
        formula: rollFormula
    };
}

// Helper: Calculate enhancement bonuses
function calculateEnhancements(enhancements = []) {
    return enhancements.reduce((sum, value) => sum + (value || 0), 0);
}

// Main: Roll attribute with enhancements
async function rollAttributeWithEnhancements(actor, attribute) {
    const bubbles = actor.getFlag("superheroTTRPG", `attributes.${attribute}.bubbles`) || 0;
    const enhancements = actor.getFlag("superheroTTRPG", `enhancements.${attribute}`) || [];

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

// Hook: Add roll functionality to the game
Hooks.on("ready", () => {
    game.superheroTTRPG = {
        rollAttribute: rollAttributeWithEnhancements
    };
});

// Create Dialog for New Actor Type
Hooks.on("renderActorDirectory", (app, html, data) => {
    const button = $(`<button class="create-actor-btn"><i class="fas fa-user-plus"></i> Create Custom Actor</button>`);
    html.find(".header-actions").append(button);

    button.click(() => {
        new Dialog({
            title: "Create New Actor",
            content: "<p>Select the type of actor to create:</p>",
            buttons: {
                character: {
                    label: "Character",
                    callback: () => createCustomActor("Character", "journals/character.pdf")
                },
                nemesis: {
                    label: "Nemesis",
                    callback: () => createCustomActor("Nemesis", "journals/nemesis.pdf")
                },
                hq: {
                    label: "HQ",
                    callback: () => createCustomActor("HQ", "journals/hq.pdf")
                },
                team: {
                    label: "Team",
                    callback: () => createCustomActor("Team", "journals/team-progress.pdf")
                },
                vehicle: {
                    label: "Vehicle",
                    callback: () => createCustomActor("Vehicle", "journals/vehicle.pdf")
                },
                npc: {
                    label: "NPC",
                    callback: () => createCustomActor("NPC", "journals/npc.pdf")
                }
            },
            default: "character"
        }).render(true);
    });
});

// Function to create custom actor and assign the correct PDF sheet
async function createCustomActor(name, pdfPath) {
    const actorType = name.toLowerCase();
    const newActor = await Actor.create({
        name: `New ${name}`,
        type: actorType
    });

    await newActor.update({
        "flags.pdf-character-sheet.filePath": pdfPath
    });

    ui.notifications.info(`${name} actor created with ${name} sheet.`);
}
