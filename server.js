const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const port = 3000;

// 1. CONFIGURAÇÃO DO PROXY
// Tudo que começar com /v2.0 será redirecionado para a TomTicket
app.use('/v2.0', createProxyMiddleware({
    target: 'https://api.tomticket.com',
    changeOrigin: true,
    // Garante que o caminho /v2.0 continue na URL final
    pathRewrite: {
        '^/v2.0': '/v2.0', 
    },
}));

// 2. Serve os arquivos estáticos da build
app.use(express.static(path.join(__dirname, 'build')));

// 3. Fallback para o React Router (sem usar strings de rota problemáticas)
app.use((req, res, next) => {
    // Se não for uma rota de API, manda o index.html
    if (!req.url.startsWith('/v2.0')) {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
    } else {
        next();
    }
});

app.listen(port, () => {
    console.log(`TicketExpertManager rodando na porta ${port} com Proxy para TomTicket`);
});