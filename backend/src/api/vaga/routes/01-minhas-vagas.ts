/**
 * Rota extra do painel da empresa. O nome do arquivo começa com "01" para
 * ser carregado antes do router padrão; senão "/vagas/minhas" seria
 * interpretado como "/vagas/:id".
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/vagas/minhas',
      handler: 'vaga.minhas',
    },
  ],
};
