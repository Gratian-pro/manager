# Manager Bot – Instalação e Configuração

## Requisitos
- Node.js 18+ (recomendado LTS)
- Token do bot no Discord (Developer Portal)
- API Key do G-Panel (Gratian) e URL base da API

## Passo a passo
- Instalar dependências:
  - `npm install`
- Configurar o token do Manager:
  - Edite `config.json` na raiz e defina:
    - `token`: o token do seu bot Manager
    - `owner`: o seu ID de usuário no Discord
- Configurar a API do G-Panel:
  - Edite `databases/apis.json` e defina:
    ![apis.json]([https://url-da-imagem.com/imagem.png](https://i.postimg.cc/FRG2vtFq/configurarapikey.png))
    - `gpanel`: sua API Key do G-Panel
- Iniciar o Manager:
  - `node index.js`

## Observações de uso
- Comandos de gerenciamento são registrados ao iniciar; use `/botconfig` para acessar o painel de configurações.
- Na criação de uma aplicação, o Manager injeta um `.env` com `TOKEN` e `OWNER` ou atualiza `config.json`/`token.json` conforme o template do bot.
- O painel `/apps` exibe métricas da API de status, incluindo `totalStorage` e `totalRam` quando disponíveis.

## Boas práticas
- Nunca versionar tokens/API Keys.
- Conceder ao bot permissões adequadas ao convidar para o servidor.
- Validar a API Key e a base da API em `/botconfig` antes de criar apps.

## Troubleshooting
- Erro de conexão com o G-Panel: verifique `gpanel` e `gpanelBase` em `databases/apis.json`.
- Status/recursos não aparecem: confirme que a API de status está retornando `metrics` com os campos esperados.
- Página do painel: utilize a URL correta do seu painel; se encontrar páginas inexistentes, retorne ao painel principal e recupere o endereço certo.
