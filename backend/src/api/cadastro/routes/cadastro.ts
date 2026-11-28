export default {
  routes: [
    {
      method: 'POST',
      path: '/cadastro',
      handler: 'cadastro.registrar',
      config: {
        // Rota pública: é por aqui que o visitante cria a conta.
        auth: false,
      },
    },
  ],
};
