import { api, ErroApi } from '../../lib/api';
import { carregarPerfil, destinoSeguro } from '../../lib/auth';
import { definirAviso, exibirAvisoPendente } from '../../lib/aviso';
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
import type { Curriculo, RespostaItem } from '../../lib/tipos';
import { CIDADES_RMF, configurarCampo, mascaraTelefone, telefoneValido } from '../../lib/validacao';

const perfil = await iniciarAreaRestrita(['candidato']);
let curriculo = perfil.curriculo;
const voltar = destinoSeguro(new URLSearchParams(window.location.search).get('voltar'));

const form = elemento<HTMLFormElement>('#form-curriculo');
const botao = elemento<HTMLButtonElement>('#botao-salvar');
const mensagem = elemento('#mensagem');

exibirAvisoPendente(elemento('#aviso'));
renderizar(elemento('#cidades'), html`${CIDADES_RMF.map((c) => html`<option value="${c}"></option>`)}`);

if (curriculo) {
  preencherFormulario(form, { ...curriculo });
} else {
  elemento('#titulo-pagina').textContent = 'Criar currículo';
  mostrarAlerta(mensagem, 'Você ainda não tem currículo. Preencha para poder se candidatar às vagas.', 'info');
}
configurarCampo(elemento<HTMLInputElement>('#telefone'), mascaraTelefone, telefoneValido);

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limparAlerta(mensagem);
  if (!validarFormulario(form)) {
    mostrarAlerta(mensagem, 'Confira os campos destacados.', 'warning');
    return;
  }
  const d = lerFormulario(form);
  const dados = { ...d, anosExperiencia: Number(d.anosExperiencia) };

  definirCarregando(botao, true);
  try {
    if (curriculo) {
      const resposta = await api.put<RespostaItem<Curriculo>>(`/curriculos/${curriculo.documentId}`, { data: dados });
      curriculo = resposta.data;
    } else {
      const resposta = await api.post<RespostaItem<Curriculo>>('/curriculos', { data: dados });
      curriculo = resposta.data;
    }
    await carregarPerfil(true);
    if (voltar) {
      definirAviso('Currículo salvo! Agora você já pode se candidatar.');
      window.location.href = voltar;
      return;
    }
    elemento('#titulo-pagina').textContent = 'Meu currículo';
    mostrarAlerta(mensagem, 'Currículo salvo.', 'success');
  } catch (erro) {
    mostrarAlerta(mensagem, erro instanceof ErroApi ? erro.message : 'Não foi possível salvar o currículo.');
  } finally {
    definirCarregando(botao, false);
  }
});
