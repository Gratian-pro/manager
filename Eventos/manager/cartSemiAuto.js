const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ChannelType, EmbedBuilder, ModalBuilder, TextInputBuilder, AttachmentBuilder } = require("discord.js");
const { api, db2, auto, db1, logs, perms, db } = require("../../databases/index");
const mercadopago = require("mercadopago");
const axios = require("axios");
const fs = require("fs");
let mp = api.get("mp");

module.exports = {
    name: `interactionCreate`,

    run: async (interaction, client) => {
        try {
            const { customId } = interaction;
            if (!customId) return;

            let id = interaction.customId.split("_")[0];

            if (customId === "copyPix") {
                const codigo = logs.get("semi.chave");

                if (!codigo) {
                    return interaction.reply({
                        content: "❌ Chave PIX não configurada!",
                        ephemeral: true
                    });
                }

                interaction.reply({
                    content: codigo,
                    ephemeral: true
                });
                return;
            }

            if (customId === "aproveCarrin") {
                if (!logs.get("semi.roleAprove")) {
                    return interaction.reply({ content: `\`🔎\` Cargo de aprovador não setado!`, ephemeral: true });
                }

                if (!interaction.member.roles.cache.has(logs.get("semi.roleAprove"))) {
                    return interaction.reply({ content: `\`❌\` Você não tem permissão para fazer isso!`, ephemeral: true });
                }

                const currentStatus = await db1.get(`${interaction.channel.id}.status`);
                if (currentStatus === "aprovado") {
                    return interaction.reply({ content: `\`⚠️\` O aluguel já foi aprovado.`, ephemeral: true });
                }

                await db1.set(`${interaction.channel.id}.status`, "aprovado");
                interaction.reply({ content: `\`✅\` Carrinho aprovado com êxito.`, ephemeral: true });
                return;
            }

            if (customId.endsWith("_semiAutoPay")) {
                const aluguel = await db1.get(`${interaction.channel.id}`);
                
                if (!aluguel) {
                    return interaction.reply({ content: `\`❌\` Dados do aluguel não encontrados!`, ephemeral: true });
                }

                const plano = db1.get(`${interaction.channel.id}.plano`);
                
                if (!plano) {
                    return interaction.reply({ content: `\`❌\` Plano não encontrado!`, ephemeral: true });
                }

                const precoItem = db.get(`${id}.preco.${plano.toLowerCase()}.preco`);
                if (!precoItem) {
                    return interaction.reply({ content: `\`❌\` Preço não encontrado para este plano!`, ephemeral: true });
                }

                const valor = parseFloat(precoItem * aluguel.quantia).toFixed(2);

                if (!logs.get("semi.tipo") || !logs.get("semi.chave")) {
                    return interaction.reply({ content: `\`❌\` A forma de pagamento não foi configurada ainda!`, ephemeral: true });
                }

                // Validar dados obrigatórios
                if (!logs.get("semi.tempoPay")) {
                    return interaction.reply({ content: `\`❌\` Tempo de pagamento não configurado!`, ephemeral: true });
                }

                const timer = setTimeout(async () => {
                    try {
                        await interaction.followUp({ 
                            content: `\`⏰\` Olá ${interaction.user}, o tempo para realizar o pagamento se esgotou, tente novamente abrindo outro carrinho.`, 
                            components: [] 
                        }).catch(console.error);

                        if (logs.get("channel_logs")) {
                            const channel = interaction.guild.channels.cache.get(logs.get("channel_logs"));
                            if (channel) {
                                channel.send({
                                    content: ``,
                                    embeds: [
                                        new EmbedBuilder()
                                            .setAuthor({ name: `${interaction.user.username} - Pendência Encerrada`, iconURL: interaction.user.displayAvatarURL() })
                                            .setDescription(`-# \`⏰\` Pendência cancelada por inatividade.`)
                                            .addFields(
                                                { name: `Aluguel`, value: `\`${id} | R$${Number(db.get(`${id}.preco.${plano.toLowerCase()}.preco`) * Number(db1.get(`${interaction.channel.id}.quantia`))).toFixed(2)}\``, inline: true },
                                                { name: `Plano`, value: `\`x${Number(db1.get(`${interaction.channel.id}.quantia`))} | ${plano}/${Number(db1.get(`${interaction.channel.id}.dias`))}d\``, inline: true },
                                                { name: `User`, value: `${interaction.user}` }
                                            )
                                            .setColor(`#FF0000`)
                                            .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                                            .setTimestamp()
                                    ],
                                    components: [
                                        new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder().setCustomId(`botN`).setLabel(`Mensagem do Sistema`).setStyle(2).setDisabled(true)
                                            )
                                    ]
                                }).catch(console.error);
                            }
                        }

                        db1.delete(interaction.channel.id);

                        setTimeout(() => {
                            try {
                                interaction.channel.delete();
                            } catch (error) {
                                console.error('Erro ao deletar canal:', error);
                            }
                        }, 15000);
                    } catch (error) {
                        console.error('Erro no timer de pagamento:', error);
                    }
                }, logs.get("semi.tempoPay") * 60 * 1000);

                try {
                    const { QrCodePix } = require('qrcode-pix');
                    
                    // Tentar usar a biblioteca QrCode nativa do Node.js se disponível
                    let QRCode;
                    try {
                        QRCode = require('qrcode');
                    } catch (e) {
                        console.log('QRCode library não encontrada, tentando usar qrGenerator');
                    }

                    const valor2 = Number(valor);
                    
                    // Validar valor
                    if (isNaN(valor2) || valor2 <= 0) {
                        throw new Error('Valor inválido para pagamento');
                    }
                    
                    // Generate PIX code with error handling
                    const qrCodePix = QrCodePix({
                        version: '01',
                        key: logs.get("semi.chave"),
                        name: logs.get("semi.chave"),
                        city: 'BRASILIA',
                        cep: '28360000',
                        value: valor2
                    });

                    const chavealeatorio = qrCodePix.payload();

                    if (!chavealeatorio) {
                        throw new Error('Falha ao gerar payload PIX');
                    }

                    let buffer;
                    let attachment;

                    // Tentar usar QRCode nativo primeiro
                    if (QRCode) {
                        try {
                            const qrDataURL = await QRCode.toDataURL(chavealeatorio, {
                                errorCorrectionLevel: 'M',
                                type: 'image/png',
                                quality: 0.92,
                                margin: 1,
                                color: {
                                    dark: '#000000',
                                    light: '#FFFFFF'
                                },
                                width: 300
                            });
                            
                            // Extrair base64 do data URL
                            const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, '');
                            buffer = Buffer.from(base64Data, 'base64');
                            attachment = new AttachmentBuilder(buffer, { name: "payment.png" });
                        } catch (qrNativeError) {
                            console.error('Erro com QRCode nativo:', qrNativeError);
                            throw new Error('Falha ao gerar QR code com biblioteca nativa');
                        }
                    } else {
                        // Fallback para qrGenerator sem imagem de overlay
                        const { qrGenerator } = require('../../Lib/QRCodeLib.js');
                        
                        // Tentar criar qrGenerator sem imagem primeiro
                        let qr;
                        try {
                            qr = new qrGenerator(); // Sem imagePath
                        } catch (e) {
                            // Se falhar, tentar criar uma imagem placeholder pequena
                            const path = require('path');
                            const imagePath = path.join(__dirname, '../../Lib/placeholder.png');
                            
                            // Verificar se arquivo existe, se não criar um placeholder
                            if (!fs.existsSync(imagePath)) {
                                // Criar um buffer de imagem PNG 1x1 pixel transparente
                                const smallPngBuffer = Buffer.from([
                                    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                                    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                                    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                                    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
                                    0x89, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41,
                                    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
                                    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
                                    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
                                    0x42, 0x60, 0x82
                                ]);
                                
                                try {
                                    fs.writeFileSync(imagePath, smallPngBuffer);
                                } catch (writeError) {
                                    console.error('Erro ao criar placeholder:', writeError);
                                }
                            }
                            
                            qr = new qrGenerator({ imagePath: imagePath });
                        }

                        // Generate QR code with error handling
                        const qrcode = await qr.generate(chavealeatorio);
                        
                        // Validate QR code response
                        if (!qrcode || !qrcode.response || typeof qrcode.response !== 'string') {
                            throw new Error('Resposta inválida do gerador de QR code');
                        }

                        buffer = Buffer.from(qrcode.response, "base64");
                        attachment = new AttachmentBuilder(buffer, { name: "payment.png" });
                    }

                    let agora = new Date();
                    agora.setMinutes(agora.getMinutes() + Number(logs.get("semi.tempoPay")));
                    const time = Math.floor(agora.getTime() / 1000);

                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `${interaction.user.username} - Pendência Aluguel Realizada`, iconURL: interaction.user.displayAvatarURL() })
                        .setDescription(`-# \`✅\` Pendência para realizar pagamento de plano realizada.\n-# \`❓\` Entrega manual após pagamento.\n\n**Chave Pix:**\n\`\`\`${logs.get("semi.chave")} | ${logs.get("semi.tipo")}\`\`\``)
                        .addFields(
                            { name: `Aluguel`, value: `\`${id} | R$${Number(db.get(`${id}.preco.${plano.toLowerCase()}.preco`) * Number(db1.get(`${interaction.channel.id}.quantia`))).toFixed(2)}\``, inline: false },
                            { name: `Plano`, value: `\`x${Number(db1.get(`${interaction.channel.id}.quantia`))} | ${plano}/${Number(db1.get(`${interaction.channel.id}.dias`))}d\``, inline: true },
                            { name: `Tempo Encerrar`, value: `<t:${time}:R>`, inline: true }
                        )
                        .setColor(`#00FFFF`)
                        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp();

                    embed.setImage(`attachment://payment.png`);

                    await interaction.update({
                        content: `<@${aluguel.userid}>`,
                        embeds: [embed],
                        components: [
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder().setCustomId(`copyPix`).setLabel(`MobileService`).setEmoji(`1218967168960434187`).setStyle(1),
                                    new ButtonBuilder().setCustomId(`aproveCarrin`).setLabel(`Aprovar Aluguel`).setEmoji(`1246952363143729265`).setStyle(3),
                                    new ButtonBuilder().setCustomId(`${id}_${db1.get(`${interaction.channel.id}.plano`)}_cancel`).setEmoji(`1302020774709952572`).setStyle(2)
                                )
                        ],
                        files: [attachment]
                    });

                    // Monitoramento do status do pagamento
                    const checkPaymentStatus = setInterval(async () => {
                        try {
                            const aluguel = await db1.get(`${interaction.channel.id}`);

                            if (!aluguel) {
                                clearInterval(checkPaymentStatus);
                                return;
                            }

                            if (aluguel.status === "aprovado") {
                                clearInterval(checkPaymentStatus);
                                clearTimeout(timer);

                                const plano = db1.get(`${interaction.channel.id}.plano`);
                                const user = client.users.cache.get(`${aluguel.userid}`);
                                const member = interaction.guild.members.cache.get(`${aluguel.userid}`);

                                if (user && member) {
                                    const role = await interaction.guild.roles.cache.get(logs.get(`cargo_client`));
                                    if (role && !member.roles.cache.has(role.id)) {
                                        member.roles.add(role.id).catch(console.error);
                                    }
                                }

                                // Atualizar mensagem de pagamento aprovado
                                await interaction.editReply({
                                    content: `${interaction.user}`,
                                    embeds: [
                                        new EmbedBuilder()
                                            .setAuthor({ name: `${interaction.user.username} - Aluguel Pago`, iconURL: interaction.user.displayAvatarURL() })
                                            .setDescription(`-# \`✅\` Aluguel plano \`${aluguel.plano}\` pago com êxito!\n-# \`🔎\` Veja algumas informações abaixo:`)
                                            .addFields(
                                                { name: `Aluguel`, value: `\`${id} | R$${Number(db.get(`${id}.preco.${plano.toLowerCase()}.preco`) * Number(db1.get(`${interaction.channel.id}.quantia`))).toFixed(2)}\``, inline: true },
                                                { name: `Plano`, value: `\`x${Number(db1.get(`${interaction.channel.id}.quantia`))} | ${plano}/${Number(db1.get(`${interaction.channel.id}.dias`))}d\``, inline: true },
                                                { name: `Banco`, value: `\`⚡ Aprovado Manualmente\`` }
                                            )
                                            .setColor(`#00FF00`)
                                            .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                                            .setTimestamp()
                                    ],
                                    components: [
                                        new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder().setCustomId(`${aluguel.dias}_${id}_uparbot`).setLabel(`Logar Sistema`).setEmoji(`1302019443916017714`).setStyle(3),
                                                new ButtonBuilder().setURL(`https://discord.com/developers/applications`).setLabel(`Discord Dev`).setEmoji(`1302021603915337879`).setStyle(5)
                                            )
                                    ],
                                    files: []
                                }).catch(console.error);

                                // Log do pagamento aprovado
                                if (logs.get("channel_logs")) {
                                    const channel = interaction.guild.channels.cache.get(logs.get("channel_logs"));
                                    if (channel) {
                                        channel.send({
                                            content: ``,
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setAuthor({ name: `${interaction.user.username} - Aluguel Pago`, iconURL: interaction.user.displayAvatarURL() })
                                                    .setDescription(`-# \`✅\` Aluguel plano \`${aluguel.plano}\` pago com êxito!\n-# \`🔎\` Veja algumas informações abaixo:`)
                                                    .addFields(
                                                        { name: `Aluguel`, value: `\`${id} | R$${Number(db.get(`${id}.preco.${plano.toLowerCase()}.preco`) * Number(db1.get(`${interaction.channel.id}.quantia`))).toFixed(2)}\``, inline: true },
                                                        { name: `Plano`, value: `\`x${Number(db1.get(`${interaction.channel.id}.quantia`))} | ${plano}/${Number(db1.get(`${interaction.channel.id}.dias`))}d\``, inline: true },
                                                        { name: `Banco`, value: `\`⚡ Aprovado Manualmente\`` }
                                                    )
                                                    .setColor(`#00FF00`)
                                                    .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                                                    .setTimestamp()
                                            ],
                                            components: [
                                                new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder().setCustomId(`${id}_reembolAluguel`).setLabel(`Realizar Reembolso`).setEmoji(`1246953228655132772`).setStyle(2).setDisabled(true)
                                                    )
                                            ]
                                        }).catch(console.error);
                                    }
                                }

                                // Canal de vendas
                                if (logs.get("vendas")) {
                                    const channel = interaction.guild.channels.cache.get(logs.get("vendas"));
                                    if (channel) {
                                        channel.send({
                                            content: ``,
                                            embeds: [
                                                new EmbedBuilder()
                                                    .setAuthor({ name: `${interaction.user.username} - Pedido Entregue`, iconURL: interaction.user.displayAvatarURL() })
                                                    .setDescription(`Um pedido foi realizado e entregue com êxito.`)
                                                    .addFields(
                                                        { name: `Aluguel`, value: `\`${id} | R$${Number(db.get(`${id}.preco.${plano.toLowerCase()}.preco`) * Number(db1.get(`${interaction.channel.id}.quantia`))).toFixed(2)}\``, inline: true },
                                                        { name: `Plano`, value: `\`x${Number(db1.get(`${interaction.channel.id}.quantia`))} | ${plano}/${Number(db1.get(`${interaction.channel.id}.dias`))}d\``, inline: true }
                                                    )
                                                    .setColor(`#00FF00`)
                                                    .setFooter({ text: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL() })
                                                    .setTimestamp()
                                            ],
                                            components: [
                                                new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder().setURL(`https://discord.com/channels/${db1.get(`${interaction.channel.id}.msg.guild`)}/${db1.get(`${interaction.channel.id}.msg.channel`)}/${db1.get(`${interaction.channel.id}.msg.id`)}`).setLabel(`Alugar também`).setEmoji(`1302020274681675896`).setStyle(5)
                                                    )
                                            ]
                                        }).catch(console.error);
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('Erro ao verificar status do pagamento:', error);
                        }
                    }, 2000);

                } catch (qrError) {
                    console.error('Erro ao gerar código de pagamento:', qrError);
                    
                    // Limpar timer para evitar vazamentos de memória
                    clearTimeout(timer);
                    
                    return interaction.reply({ 
                        content: `\`❌\` Erro ao gerar código de pagamento: ${qrError.message}. Verifique as configurações e tente novamente.`, 
                        ephemeral: true 
                    });
                }
            }

        } catch (error) {
            console.error('Erro geral no cartSemiAuto:', error);
            
            // Tentar responder ao usuário se ainda não respondeu
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: `\`❌\` Ocorreu um erro interno. Tente novamente.`, 
                        ephemeral: true 
                    });
                }
            } catch (replyError) {
                console.error('Erro ao enviar mensagem de erro:', replyError);
            }
        }
    }
}