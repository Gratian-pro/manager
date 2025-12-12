const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, ButtonBuilder } = require("discord.js")
const { logs, perms, db2 } = require("../../databases/index");
const config = require("../../config.json");

module.exports = {
    name: "botconfig",
    description: "[👷] Começar a configurar o seu bot manager.",
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {

        const allowed = (perms.get(`usersPerms`) || []).includes(interaction.user.id) || interaction.user.id === config.owner;
        if (!allowed) {
            return interaction.reply({ content: "\`❌\` Você não tem permissão para usar este comando.", ephemeral: true })
        };

        const sistema = await logs.get("sistema");

        interaction.reply({
            content: ``,
            embeds: [
                new EmbedBuilder()
                    .setAuthor({ name: `${interaction.user.username} - Gerenciamento Inicial`, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(`-# \`👷‍♂️\` Gerenciamento inicial do **/botconfig**.`)
                    .addFields(
                        { name: `Sistema`, value: `\`${sistema ? "\`🟢 Ligado\`" : "\`🔴 Desligado\`"}\``, inline: true },
                        { name: `Versão`, value: `\`BETA\``, inline: true },
                        { name: `Ping`, value: `\`${client.ws.ping}\``, inline: true }
                    )
                    .setColor(`#00FFFF`)
                    .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp()
            ],
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`sistemaOnOff`).setLabel(sistema ? "Ligado" : "Desligado").setEmoji(sistema ? "1236021048470933575" : "1236021106662707251").setStyle(sistema ? 3 : 4),
                        new ButtonBuilder().setCustomId(`gerenciarApps`).setLabel(`Gerenciar Apps`).setEmoji(`1246953215380160593`).setStyle(1)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId(`channelsRolesEdit`).setLabel(`Canais/Cargos`).setEmoji(`1246953254810816542`).setStyle(1),
                        new ButtonBuilder().setCustomId(`definitions`).setLabel(`Definições`).setEmoji(`1246953268211613747`).setStyle(2)
                    )
            ],
            ephemeral: true
        });

    }
}
