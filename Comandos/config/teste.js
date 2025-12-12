const { EmbedBuilder, ActionRowBuilder, ApplicationCommandType, ApplicationCommandOptionType, ButtonBuilder } = require("discord.js");
const { db, perms } = require("../../databases/index");

module.exports = {
    name: "teste",
    description: "[⭐] Gerenciar o sistema de teste gratuito.",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "free",
            description: "Envia o painel para iniciar um teste gratuito de 12 horas.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "bot",
                    description: "Selecione o bot que será disponibilizado para teste.",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                }
            ]
        }
    ],
    async autocomplete(interaction) {
        const value = interaction.options.getFocused().toLowerCase();
        let choices = db.all().filter(pd => pd.data.nomeproduto);
        const filtered = choices.filter(choice => choice.data.nomeproduto.toLowerCase().includes(value)).slice(0, 25);

        if (!interaction) return;
        if (choices.length === 0) {
            return await interaction.respond([{ name: "Crie um BOT!", value: "no_bots_available" }]);
        }
        await interaction.respond(filtered.map(choice => ({ name: choice.data.nomeproduto, value: choice.data.nomeproduto })));
    },
    run: async (client, interaction) => {
        if (!perms.get("usersPerms").includes(interaction.user.id)) {
            return interaction.reply({ content: "`❌` Você não tem permissão para usar este comando.", ephemeral: true });
        }

        const botId = interaction.options.getString("bot");
        if (botId === "no_bots_available" || !db.has(botId)) {
            return interaction.reply({ content: "`❌` Bot não encontrado ou nenhum bot cadastrado.", ephemeral: true });
        }

        await interaction.reply({ content: "`✅` Painel de teste gratuito enviado com sucesso!", ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle(`🧪 Teste Gratuito Disponível!`)
            .setDescription(`Quer experimentar nosso bot **${botId}**?\n\nClique no botão abaixo para iniciar um teste gratuito de **12 horas**! A oferta é única por usuário.`)
            .setColor("#3498db")
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`${botId}_testefree`)
                    .setLabel("Iniciar Teste Gratuito")
                    .setStyle(2)
                    .setEmoji("🚀")
            );

        await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
};