import { ErroApi } from '../lib/api';
import { cadastrar, paginaInicialDoPapel, type DadosCadastro } from '../lib/auth';
import { definirAviso } from '../lib/aviso';
import { definirCarregando, elemento, lerFormulario, limparAlerta, mostrarAlerta, validarFormulario } from '../lib/dom';
import { html, renderizar } from '../lib/html';
import { iniciarPagina } from '../lib/pagina';
import {
  CIDADES_RMF,
  cnpjValido,
  configurarCampo,
  mascaraCnpj,
  mascaraTelefone,
  somenteDigitos,
  telefoneValido,
} from '../lib/validacao';

const perfil = await iniciarPagina();
if (perfil) window.location.replace(paginaInicialDoPapel(perfil.papel));

const form = elemento<HTMLFormElement>('#form-cadastro');
const botao = elemento<HTMLButtonElement>('#botao-cadastrar');
const mensagem = elemento('#mensagem');
const camposEmpresa = elemento<HTMLFieldSetElement>('#campos-empresa');
const senha = elemento<HTMLInputElement>('#password');
const confirmacao = elemento<HTMLInputElement>('#confirmacao');

renderizar(elemento('#cidades'), html`${CIDADES_RMF.map((c) => html`<option value="${c}"></option>`)}`);
configurarCampo(elemento<HTMLInputElement>('#empresa-cnpj'), mascaraCnpj, cnpjValido);
configurarCampo(elemento<HTMLInputElement>('#empresa-telefone'), mascaraTelefone, telefoneValido);

/**
 * Os campos da empresa ficam num fieldset desabilitado quando "Candidato"
 * está marcado: campos desabilitados não são validados nem enviados.
 */
function atualizarTipo(): void {
  const ehEmpresa = elemento<HTMLInputElement>('#tipo-empresa').checked;
  camposEmpresa.hidden = !ehEmpresa;
  camposEmpresa.disabled = !ehEmpresa;
}

function conferirConfirmacao(): void {
  confirmacao.setCustomValidity(confirmacao.value === senha.value ? '' : 'diferente');
}

// ?tipo=empresa vem dos links "Cadastrar minha empresa"
if (new URLSearchParams(window.location.search).get('tipo') === 'empresa') {
  elemento<HTMLInputElement>('#tipo-empresa').checked = true;
}
atualizarTipo();

form.addEventListener('change', (evento) => {
  if ((evento.target as HTMLInputElement).name === 'tipo') atualizarTipo();
});
senha.addEventListener('input', conferirConfirmacao);
confirmacao.addEventListener('input', conferirConfirmacao);

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limparAlerta(mensagem);
  conferirConfirmacao();
  if (!validarFormulario(form)) {
    mostrarAlerta(mensagem, 'Confira os campos destacados.', 'warning');
    return;
  }

  const d = lerFormulario(form);
  const dados: DadosCadastro = {
    tipo: d.tipo === 'empresa' ? 'empresa' : 'candidato',
    username: d.username,
    email: d.email,
    password: senha.value, // a senha vai como foi digitada (sem trim)
  };
  if (dados.tipo === 'empresa') {
    dados.empresa = {
      nome: d['empresa-nome'],
      cnpj: somenteDigitos(d['empresa-cnpj']),
      cidade: d['empresa-cidade'],
      telefone: d['empresa-telefone'],
      descricao: d['empresa-descricao'],
    };
  }

  definirCarregando(botao, true);
  try {
    const novo = await cadastrar(dados);
    if (novo.papel === 'candidato') {
      definirAviso('Conta criada! Agora preencha o seu currículo para se candidatar às vagas.');
      window.location.href = '/candidato/curriculo.html';
    } else {
      definirAviso('Conta criada! O cadastro da empresa está aguardando a aprovação do administrador.', 'info');
      window.location.href = paginaInicialDoPapel(novo.papel);
    }
  } catch (erro) {
    mostrarAlerta(mensagem, erro instanceof ErroApi ? erro.message : 'Não foi possível criar a conta.');
    definirCarregando(botao, false);
  }
});
