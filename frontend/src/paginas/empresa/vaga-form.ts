import { api, ErroApi } from '../../lib/api';
import { definirAviso } from '../../lib/aviso';
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
import type { RespostaItem, Vaga } from '../../lib/tipos';
import { CIDADES_RMF } from '../../lib/validacao';

const perfil = await iniciarAreaRestrita(['empresa']);
const id = new URLSearchParams(window.location.search).get('id');
const editando = Boolean(id);

const form = elemento<HTMLFormElement>('#form-vaga');
const botao = elemento<HTMLButtonElement>('#botao-salvar');
const mensagem = elemento('#mensagem');

renderizar(elemento('#cidades'), html`${CIDADES_RMF.map((c) => html`<option value="${c}"></option>`)}`);

function bloquearFormulario(texto: string): void {
  mostrarAlerta(mensagem, texto, 'warning');
  form.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, select, textarea, button').forEach((c) => (c.disabled = true));
}

if (editando) {
  document.title = document.title.replace(/^Vaga/, 'Editar vaga');
  elemento('#titulo-pagina').textContent = 'Editar vaga';
  elemento('#caminho').textContent = 'Editar vaga';
  elemento('#campo-situacao').hidden = false;
  renderizar(botao, html`<i class="bi bi-check-lg me-1" aria-hidden="true"></i>Salvar alterações`);
  try {
    const { data: vaga } = await api.get<RespostaItem<Vaga>>(`/vagas/${encodeURIComponent(id ?? '')}`);
    preencherFormulario(form, { ...vaga });
  } catch (erro) {
    bloquearFormulario(erro instanceof ErroApi && erro.status === 404 ? 'Vaga não encontrada.' : 'Não foi possível carregar a vaga.');
  }
} else {
  document.title = document.title.replace(/^Vaga/, 'Nova vaga');
  if (perfil.empresa?.situacao !== 'aprovada') {
    bloquearFormulario('Sua empresa ainda não foi aprovada pelo administrador, então ainda não é possível publicar vagas.');
  }
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limparAlerta(mensagem);
  if (!validarFormulario(form)) {
    mostrarAlerta(mensagem, 'Confira os campos destacados.', 'warning');
    return;
  }

  const d = lerFormulario(form);
  const dados: Record<string, unknown> = {
    titulo: d.titulo,
    tipo: d.tipo,
    cidade: d.cidade,
    cnhExigida: d.cnhExigida,
    equipamento: d.equipamento,
    salario: d.salario === '' ? null : Number(d.salario),
    descricao: d.descricao,
  };
  if (editando) dados.situacao = d.situacao;

  definirCarregando(botao, true);
  try {
    if (editando) {
      await api.put(`/vagas/${encodeURIComponent(id ?? '')}`, { data: dados });
      definirAviso(`Vaga "${d.titulo}" atualizada.`);
    } else {
      await api.post('/vagas', { data: dados });
      definirAviso(`Vaga "${d.titulo}" publicada! Ela já aparece na lista pública.`);
    }
    window.location.href = '/empresa/painel.html';
  } catch (erro) {
    mostrarAlerta(mensagem, erro instanceof ErroApi ? erro.message : 'Não foi possível salvar a vaga.');
    definirCarregando(botao, false);
  }
});
