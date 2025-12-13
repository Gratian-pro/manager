const { EmbedBuilder, ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ComponentType, StringSelectMenuBuilder } = require("discord.js");
const { api, db2, auto, db1, logs, perms, db } = require("../../databases/index");
const config = require("../../config.json");

module.exports = {
    name: "perms",
    description: "[👷] Gerencie as permissões!",
    type: ApplicationCommandType.ChatInput,
    run: async (client, interaction) => {
        const ownerID = config.owner;

        if (interaction.user.id !== ownerID) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setDescription("❌ | Apenas o Dono do Bot pode usar esta função!").setColor("Red")]
            });
        }

        const list = perms.get("usersPerms") || [];
        let a = ""
        list.map((rs, index) => {

            a += `\n${index + 1}. <@${rs}>`
        })

        const embed = new EmbedBuilder()
            .setTitle(`Permissões`)
            .setThumbnail(`${client.user.displayAvatarURL()}`)
            .setColor("#00FFFF")
            .setFooter({ text: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp()

            if (list.length <= 0) {
                embed.setDescription("- **Adicione pessoas para gerenciar o bot manager**\n\n```Ninguém está com permissão no momento, adicione alguém usando o menu abaixo!```")
            } else if (list.length > 0) {
                embed.setDescription(`- **Adicione pessoas para gerenciar o bot manager**\n${a}`)
            }

        const actionRow = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                .setCustomId(`selectMenuPerms`)
                .setPlaceholder(`Clique aqui para selecionar uma opção`)
                .addOptions(
                    {
                        value: `addPermBot`,
                        label: `Adicionar Usuário`,
                        description: `Adicione um usuário`,
                        emoji: `1246953350067388487`
                    },
                    {
                        value: `remPermBot`,
                        label: `Remover Usuário`,
                        description: `Remova um usuário`,
                        emoji: `1246953362037932043`
                    }
                )
            );

        interaction.reply({ embeds: [embed], components: [actionRow], ephemeral: true });
    }
};
