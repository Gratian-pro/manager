const { StringSelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ApplicationCommandType, ApplicationCommandOptionType, ButtonBuilder, ComponentType, ModalBuilder, TextInputBuilder } = require(`discord.js`)
const { api, db2, auto, db1, logs, perms, db } = require("../../databases/index");
const fs = require(`fs`)
const JSZip = require('jszip');
// G-PanelAPI


module.exports = {
    name: `alugueis`,
    description: `[🤖] Alugueis existentes, edite um bot aluguel.`,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: `alugueis`,
            description: `Veja todos os seus alugueis registrados`,
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true,
        },
    ],
    async autocomplete(interaction) {
        const value = interaction.options.getFocused().toLowerCase();
        let choices = db.all().filter(pd => pd.data.nomeproduto)

        const filtered = choices.filter(choice => choice.data.nomeproduto.toLowerCase().includes(value)).slice(0, 25);

        if (!interaction) return;
        if (choices.length === 0) {
            await interaction.respond([
                { name: `Crie um BOT!`, value: `a29183912asd92384XASDASDSADASDSADASDASD12398212222` }
            ]);
        } else if (filtered.length === 0) {
            await interaction.respond([
                { name: `Não achei nenhum BOT`, value: `a29183912asd92384XASDASDSADASDSADASDASD1239821` }
            ]);
        } else {
            await interaction.respond(
                filtered.map(choice => ({ name: choice.data.nomeproduto, value: choice.data.nomeproduto }))
            );
        };
    },
    run: async (client, interaction) => {
        if (!perms.get(`usersPerms`).includes(interaction.user.id)) {
            return interaction.reply({ content: `\`❌\` Você não tem permissão para usar este comando.`, ephemeral: true })
        };

        const id = interaction.options.getString(`alugueis`);
        if (id === `a29183912asd92384XASDASDSADASDSADASDASD1239821`) {
            interaction.reply({
                content: `\`❌\` Bot aluguel não encontrado.`,
                ephemeral: true
            })
            return;
        };

        if (id === `a29183912asd92384XASDASDSADASDSADASDASD12398212222`) {
            interaction.reply({
                content: `\`❌\` Não existe nenhum bot aluguel ainda.`,
                ephemeral: true
            })
            return;
        };

        if (id !== db.get(`${id}.nomeproduto`)) {
            interaction.reply({
                content: `\`❌\` Bot aluguel não encontrado.`,
                ephemeral: true
            })
            return;
        };

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setAuthor({ name: `${interaction.user.username} - Gerenciando Bots Alugueis Existentes`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`-# \`🔧\` Gerenciamento dos **Bots Alugueis Existentes**.`)
                .addFields(
                    { name: `Bot Aluguel`, value: `\`${id}\``, inline: true }
                )
                .setColor(`#00FFFF`)
                .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp()
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`${id}_altEmbedP`).setLabel(`Comércio`).setEmoji(`1302021583128231946`).setStyle(1),
                        new ButtonBuilder().setCustomId(`${id}_altValoresP`).setLabel(`Valores`).setEmoji(`1302019727471804416`).setStyle(3),
                        new ButtonBuilder().setCustomId(`${id}_commitSourceP`).setLabel(`Commit`).setEmoji(`1302018409701052501`).setStyle(2)
                    )
            ],
            ephemeral: true
        });

    }
}
