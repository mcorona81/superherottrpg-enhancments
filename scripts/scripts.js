// Hook to override the Create Actor behavior
Hooks.on("renderActorDirectory", (app, html, data) => {
    // Add a custom button to the Actor Directory UI
    const button = $(`<button class="create-actor-btn"><i class="fas fa-user-plus"></i> Create Custom Actor</button>`);
    html.find(".header-actions").append(button);

    // Handle button click
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

    // Assign the PDF sheet to the new actor
    await newActor.update({
        "flags.pdf-character-sheet.filePath": pdfPath
    });

    ui.notifications.info(`${name} actor created with ${name} sheet.`);
}
