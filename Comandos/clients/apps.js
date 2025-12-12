const { StringSelectMenuBuilder, EmbedBuilder, ActionRowBuilder, ApplicationCommandType, ApplicationCommandOptionType, ButtonBuilder, ComponentType, ModalBuilder, TextInputBuilder } = require(`discord.js`)
const { api, db2, auto, db1, logs, perms, db, apps } = require("../../databases/index");
const fs = require(`fs`)
const JSZip = require('jszip');
const gpanel = require('../../Lib/gpanelClient');


module.exports = {
    name: `apps`,
    description:`[📅] Veja todas as suas aplicações alugadas.`,
    type: ApplicationCommandType.ChatInput, 
    run: async(client, interaction) => {
        const auto = db2.all().filter(pd => pd.data.owner === interaction.user.id)
        const teste123 = auto;
        
        if(!teste123) {
            return interaction.reply({content:`❌ | Você não tem acesso, compre um bot para podê usar este comando!`, ephemeral:true});
        };

        const select = new StringSelectMenuBuilder().setCustomId(`appsconfig`).setPlaceholder(`📡 Seleção App`);
        auto.map((but) => {
            const buteco = but.data
            select.addOptions(
                {
                    label: `${buteco.nome} - ${buteco.idapp}`,
                    description:`${buteco.produto}`,
                    value:`${buteco.idapp}`
                }
            )
            
        })

        function getGreeting() {
            const now = new Date();
            const brtHours = (now.getUTCHours() - 3 + 24) % 24;
            if (brtHours < 12) {
                return 'Bom dia';
            } else if (brtHours < 18) {
                return 'Boa tarde';
            } else {
                return 'Boa noite';
            }
        }

        const msg = await interaction.reply({
            content: `Qual aplicação você deseja gerenciar aqui?`,
            embeds:[],
            components:[
                new ActionRowBuilder()
                .addComponents(select)
            ],
            ephemeral: true
        }).then(async(msg) => {
            

        const user = interaction.user
        const interação = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
        let ids;
        let produto;
        let nome;
        let vencimento;

        interação.on(`collect`, async (interaction) => {
            if (user.id !== interaction.user.id) {
               interaction.deferUpdate()
              return;
            }
        
        
        })
        }).catch((a) => {
            interaction.reply({
                content: `\`⚠️\` Calma... Você ainda não tem um bot ativo! Compre um antes de usar este comando`,
                ephemeral:true
            })
            return;
        });


    }}
