import { ErroApi } from '../lib/api';
import { destinoSeguro, entrar, paginaInicialDoPapel } from '../lib/auth';
import { definirCarregando, elemento, lerFormulario, limparAlerta, mostrarAlerta, validarFormulario } from '../lib/dom';
import { iniciarPagina } from '../lib/pagina';

const perfil = await iniciarPagina();
const voltar = destinoSeguro(new URLSearchParams(window.location.search).get('voltar'));

// Quem já está logado não precisa ver o login.
if (perfil) window.location.replace(voltar ?? paginaInicialDoPapel(perfil.papel));

const form = elemento<HTMLFormElement>('#form-login');
const botao = elemento<HTMLButtonElement>('#botao-entrar');
const mensagem = elemento('#mensagem');
const campoSenha = elemento<HTMLInputElement>('#senha');
const botaoMostrar = elemento<HTMLButtonElement>('#mostrar-senha');

if (voltar) mostrarAlerta(mensagem, 'Entre na sua conta para continuar.', 'info');

botaoMostrar.addEventListener('click', () => {
  const mostrando = campoSenha.type === 'text';
  campoSenha.type = mostrando ? 'password' : 'text';
  botaoMostrar.setAttribute('aria-pressed', String(!mostrando));
  botaoMostrar.setAttribute('aria-label', mostrando ? 'Mostrar senha' : 'Esconder senha');
  elemento('i', botaoMostrar).className = `bi ${mostrando ? 'bi-eye' : 'bi-eye-slash'}`;
});

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limparAlerta(mensagem);
  if (!validarFormulario(form)) return;

  const { identificador, senha } = lerFormulario(form);
  definirCarregando(botao, true);
  try {
    const logado = await entrar(identificador, senha);
    window.location.href = voltar ?? paginaInicialDoPapel(logado.papel);
  } catch (erro) {
    mostrarAlerta(mensagem, erro instanceof ErroApi ? erro.message : 'Não foi possível entrar.');
    definirCarregando(botao, false);
  }
});
