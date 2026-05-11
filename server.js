const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 3000;

// 1. LOG DE REQUISIÇÃO (Para você ver no terminal se está chegando algo)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 2. PROXY - Mudei para pegar qualquer coisa que venha do Axios
// Se o seu axios chama /chamados ou /v2.0/chamados, esse proxy abaixo resolve
app.use(['api/chamados', '/v2.0'], createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    logLevel: 'debug' 
}));

// 3. ARQUIVOS ESTÁTICOS
// Verifica se a pasta build existe antes de servir
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// 4. SPA FALLBACK
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`FRONTEND SERVER RODANDO NA PORTA ${port}`);
    console.log(`PROXY REDIRECIONANDO PARA PORTA 5028`);
    console.log(`====================================================`);
});