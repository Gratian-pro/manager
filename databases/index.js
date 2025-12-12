const { JsonDatabase } = require("wio.db");

// SUAS DATABASES EXISTENTES
const api = new JsonDatabase({ databasePath: "./databases/apis.json" });
const db2 = new JsonDatabase({ databasePath: "./databases/applications.json" });
const auto = new JsonDatabase({ databasePath: "./databases/autocomplete.json" });
const db1 = new JsonDatabase({ databasePath: "./databases/carrinhos.json" });
const logs = new JsonDatabase({ databasePath: "./databases/config.json" });
const perms = new JsonDatabase({ databasePath: "./databases/perms.json" });
const db = new JsonDatabase({ databasePath: "./databases/produtos.json" });
const partners = new JsonDatabase({ databasePath: "./databases/partners.json" });
const partnersAuto = new JsonDatabase({ databasePath: "./databases/partnersauto.json" });

// DATABASES PARA O SISTEMA DE TESTE
const db_testes = new JsonDatabase({ databasePath: "./databases/db_testes.json" }); // Guarda os testes ativos (temporário)
const db_ja_testou = new JsonDatabase({ databasePath: "./databases/db_ja_testou.json" }); // Guarda quem já usou teste (permanente)

module.exports = {
    api,
    db2,
    auto,
    db1,
    logs,
    perms,
    db,
    partners,
    partnersAuto,
    db_testes,      // Exporta o novo DB
    db_ja_testou    // Exporta o novo DB
};