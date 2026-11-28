import { api, ErroApi } from '../../lib/api';
import { carregarPerfil } from '../../lib/auth';
import {
  definirCarregando,
  elemento,
  lerFormulario,
  limparAlerta,
  mostrarAlerta,
  preencherFormulario,
  validarFormulario,
} from '../../lib/dom';
import { html, renderizar } from '../../lib/html';
import { iniciarAreaRestrita } from '../../lib/pagina';
import { formatarCnpj, selo, SITUACAO_EMPRESA } from '../../lib/rotulos';
import type { Empresa, RespostaItem } from '../../lib/tipos';
import { CIDADES_RMF, configurarCampo, mascaraTelefone, telefoneValido } from '../../lib/validacao';

const perfil = await iniciarAreaRestrita(['empresa']);
const form = elemento<HTMLFormElement>('#form-empresa');
const botao = elemento<HTMLButtonElement>('#botao-salvar');
const mensagem = elemento('#mensagem');

renderizar(elemento('#cidades'), html`${CIDADES_RMF.map((c) => html`<option value="${c}"></option>`)}`);

function mostrar(empresa: Empresa): void {
  preencherFormulario(form, { nome: empresa.nome, cidade: empresa.cidade, telefone: empresa.telefone, descricao: empresa.descricao });
  elemento<HTMLInputElement>('#cnpj').value = formatarCnpj(empresa.cnpj);
  renderizar(elemento('#selo-situacao'), selo(SITUACAO_EMPRESA[empresa.situacao]));
}

const empresa = perfil.empresa;
if (!empresa) {
  mostrarAlerta(mensagem, 'Não encontramos uma empresa ligada à sua conta.');
  form.hidden = true;
} else {
  mostrar(empresa);
  configurarCampo(elemento<HTMLInputElement>('#telefone'), mascaraTelefone, telefoneValido);
  if (empresa.situacao === 'recusada') {
    mostrarAlerta(mensagem, 'O cadastro foi recusado. Corrija os dados e salve para que ele volte para análise.', 'warning');
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    limparAlerta(mensagem);
    if (!validarFormulario(form)) {
      mostrarAlerta(mensagem, 'Confira os campos destacados.', 'warning');
      return;
    }
    const { nome, cidade, telefone, descricao } = lerFormulario(form);
    definirCarregando(botao, true);
    try {
      const { data } = await api.put<RespostaItem<Empresa>>(`/empresas/${empresa.documentId}`, {
        data: { nome, cidade, telefone, descricao },
      });
      mostrar(data);
      await carregarPerfil(true);
      mostrarAlerta(
        mensagem,
        empresa.situacao === 'recusada' && data.situacao === 'pendente'
          ? 'Dados salvos. O cadastro voltou para análise do administrador.'
          : 'Dados salvos.',
        'success'
      );
    } catch (erro) {
      mostrarAlerta(mensagem, erro instanceof ErroApi ? erro.message : 'Não foi possível salvar.');
    } finally {
      definirCarregando(botao, false);
    }
  });
}
