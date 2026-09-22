document.addEventListener("DOMContentLoaded", function() {

    // 1. Controle da Sanfona do Menu Lateral
    const menuToggles = document.querySelectorAll('.menu-toggle');
    menuToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const submenu = this.nextElementSibling;
            document.querySelectorAll('.submenu').forEach(outroMenu => {
                if (outroMenu !== submenu) {
                    outroMenu.classList.remove('show');
                }
            });
            if (submenu) {
                submenu.classList.toggle('show');
            }
        });
    });

    // 2. Troca de Telas na Área Direita
    const subMenuItems = document.querySelectorAll('.submenu li');
    const views = document.querySelectorAll('.main-content > div');

    subMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            subMenuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            views.forEach(v => v.classList.remove('active'));

            const targetId = this.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.add('active');
            }
        });
    });

    // 3. Botão de Mostrar/Esconder Senha
    const btnToggle = document.getElementById("toggleSenha");
    const inputSenha = document.getElementById("senha");
    
    if (btnToggle && inputSenha) {
        btnToggle.addEventListener("click", function() {
            if (inputSenha.type === "password") {
                inputSenha.type = "text";
                btnToggle.innerHTML = '<i class="ph ph-eye"></i>';
            } else {
                inputSenha.type = "password";
                btnToggle.innerHTML = '<i class="ph ph-eye-slash"></i>';
            }
        });
    }

    // Validação da senha
    function validarSenha(senha) { 
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/; 
        return regex.test(senha); 
    } 

/* =====================================================
   FILTRO DE DOCUMENTOS
===================================================== */

const tipoBusca = document.getElementById("tipoBusca");
const inputBusca = document.getElementById("inputBusca");

if (tipoBusca && inputBusca) {

    tipoBusca.addEventListener("change", function () {

        const tipo = this.value;

        // Limpa o campo
        inputBusca.value = "";

        // Configura o campo conforme o tipo
        switch (tipo) {

            case "cpf":

                inputBusca.placeholder = "Digite o CPF...";
                inputBusca.inputMode = "numeric";
                inputBusca.maxLength = 14;

                break;


            case "rg":

                inputBusca.placeholder = "Digite o RG...";
                inputBusca.inputMode = "numeric";
                inputBusca.maxLength = 20;

                break;


            case "nome_arquivo":

                inputBusca.placeholder = "Digite o nome do arquivo...";
                inputBusca.inputMode = "text";
                inputBusca.removeAttribute("maxlength");

                break;


            case "tipo_documento":

                inputBusca.placeholder = "Digite o tipo do documento...";
                inputBusca.inputMode = "text";
                inputBusca.removeAttribute("maxlength");

                break;
        }

    });

}

let timeoutBusca = null;

if (tipoBusca) {
    tipoBusca.addEventListener('change', () => {
        const tipoSelecionado = tipoBusca.value;
        inputBusca.placeholder = placeholders[tipoSelecionado] || 'Digite para buscar...';
        buscarDocumentos(); // Refaz a busca ao alterar o select
    });
}

// 2. Evento para buscar enquanto o usuário digita (com efeito Debounce)
if (inputBusca) {
    inputBusca.addEventListener('input', () => {
        clearTimeout(timeoutBusca);
        // Aguarda 300ms após o usuário parar de digitar para enviar a requisição
        timeoutBusca = setTimeout(() => {
            buscarDocumentos();
        }, 300);
    });
}

// 3. Função principal que faz a requisição para o Flask
async function buscarDocumentos() {
    const termo = inputBusca ? inputBusca.value.trim() : '';
    const tipo = tipoBusca ? tipoBusca.value : 'cpf';

    try {
        const url = `http://127.0.0.1:5000/documentos?termo=${encodeURIComponent(termo)}&tipo=${encodeURIComponent(tipo)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Erro ao buscar documentos');
        }

        const documentos = await response.json();
        renderizarDocumentos(documentos);

    } catch (erro) {
        console.error('Erro na filtragem:', erro);
    }
}

// 4. Função para renderizar os resultados na tela (ajuste a estrutura/IDs conforme seu HTML)
function renderizarDocumentos(documentos) {
    const tbody = document.getElementById('listaDocumentos');
    if (!tbody) return;

    if (documentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="sem-resultados">Nenhum documento encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = documentos.map(doc => `
        <tr>
            <td>${doc.nome_arquivo || 'Sem nome'}</td>
            <td>${doc.tipo}</td>
            <td>${doc.titular}</td>
            <td><a href="${doc.caminho}" target="_blank">Visualizar</a></td>
        </tr>
    `).join('');
}

// Executa uma busca inicial ao carregar a página
document.addEventListener('DOMContentLoaded', buscarDocumentos);


    /* =====================================================
   UPLOAD / RECONHECIMENTO DE DOCUMENTOS
===================================================== */

const btnAbrirUpload = document.getElementById('btnAbrirUpload');
const btnFecharUpload = document.getElementById('btnFecharUpload');

const modalUpload = document.getElementById('modalUpload');

const dropzoneUpload = document.getElementById('dropzoneUpload');
const fileInputUpload = document.getElementById('fileInputUpload');

const fileInfoUpload = document.getElementById('fileInfoUpload');

const btnEnviarUpload = document.getElementById('btnEnviarUpload');

const statusUpload = document.getElementById('statusUpload');

let arquivoSelecionadoUpload = null;


/* =====================================================
   ABRIR MODAL
===================================================== */

if (btnAbrirUpload) {

    btnAbrirUpload.addEventListener('click', () => {

        modalUpload.classList.add('ativo');

    });

}


/* =====================================================
   FECHAR MODAL
===================================================== */

function fecharModalUpload() {

    modalUpload.classList.remove('ativo');

}


if (btnFecharUpload) {

    btnFecharUpload.addEventListener('click', fecharModalUpload);

}


/* =====================================================
   FECHAR CLICANDO FORA DO MODAL
===================================================== */

if (modalUpload) {

    modalUpload.addEventListener('click', (event) => {

        if (event.target === modalUpload) {

            fecharModalUpload();

        }

    });

}


/* =====================================================
   FECHAR COM ESC
===================================================== */

document.addEventListener('keydown', (event) => {

    if (event.key === 'Escape') {

        fecharModalUpload();

    }

});


/* =====================================================
   CLIQUE NA DROPZONE
===================================================== */

if (dropzoneUpload) {

    dropzoneUpload.addEventListener('click', () => {

        fileInputUpload.click();

    });

}


/* =====================================================
   DRAGOVER
===================================================== */

if (dropzoneUpload) {

    dropzoneUpload.addEventListener('dragover', (event) => {

        event.preventDefault();

        dropzoneUpload.classList.add('dragover');

    });

}


/* =====================================================
   DRAGLEAVE
===================================================== */

if (dropzoneUpload) {

    dropzoneUpload.addEventListener('dragleave', () => {

        dropzoneUpload.classList.remove('dragover');

    });

}


/* =====================================================
   DROP
===================================================== */

if (dropzoneUpload) {

    dropzoneUpload.addEventListener('drop', (event) => {

        event.preventDefault();

        dropzoneUpload.classList.remove('dragover');

        if (event.dataTransfer.files.length > 0) {

            tratarArquivoUpload(
                event.dataTransfer.files[0]
            );

        }

    });

}


/* =====================================================
   SELEÇÃO DO ARQUIVO
===================================================== */

if (fileInputUpload) {

    fileInputUpload.addEventListener('change', (event) => {

        if (event.target.files.length > 0) {

            tratarArquivoUpload(
                event.target.files[0]
            );

        }

    });

}


/* =====================================================
   TRATAR ARQUIVO
===================================================== */

function tratarArquivoUpload(file) {

    arquivoSelecionadoUpload = file;

    const tamanhoKB = (
        file.size / 1024
    ).toFixed(1);

    fileInfoUpload.textContent =
        `Arquivo selecionado: ${file.name} (${tamanhoKB} KB)`;

    fileInfoUpload.classList.add('ativo');

    btnEnviarUpload.disabled = false;

    limparStatusUpload();

}


/* =====================================================
   LIMPAR STATUS
===================================================== */

function limparStatusUpload() {

    statusUpload.className = 'status-upload';

    statusUpload.innerHTML = '';

}


/* =====================================================
   ENVIAR DOCUMENTO
===================================================== */
if (btnEnviarUpload) {
    btnEnviarUpload.addEventListener('click', async () => {

        if (!arquivoSelecionadoUpload) {
            return;
        }

        // Captura o nome informado pelo usuário
        const inputNomeArquivo = document.getElementById('nomeArquivoUpload');
        const nomeArquivo = inputNomeArquivo ? inputNomeArquivo.value.trim() : '';

        if (!nomeArquivo) {
            alert('Por favor, informe um nome para o arquivo.');
            return;
        }

        /* Desabilita botão */
        btnEnviarUpload.disabled = true;

        /* Mostra carregamento */
        statusUpload.className = 'status-upload loading';
        statusUpload.innerHTML = `
            <div class="spinner-upload"></div>
            Processando e identificando documento com IA...
        `;

        /* Cria FormData */
        const formData = new FormData();
        formData.append('imagem', arquivoSelecionadoUpload);
        formData.append('nome_arquivo', nomeArquivo); // Envia o nome personalizado

        try {
            const response = await fetch('http://127.0.0.1:5001/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.sucesso) {
                statusUpload.className = 'status-upload sucesso';
                statusUpload.innerHTML = `
                    <strong>Documento processado com sucesso!</strong>
                    
                    <div class="resultado-upload">
                        <strong>Nome Personalizado:</strong> ${data.nome_arquivo}
                    </div>
                    <div class="resultado-upload">
                        <strong>Tipo:</strong> ${data.tipo}
                    </div>
                    <div class="resultado-upload">
                        <strong>Número Extraído:</strong> ${data.titular}
                    </div>
                    <div class="resultado-upload">
                        <strong>Caminho Salvo:</strong>
                        <small>${data.caminho}</small>
                    </div>
                `;
            } else {
                throw new Error(data.erro || 'Erro ao processar o arquivo.');
            }

        } catch (erro) {
            statusUpload.className = 'status-upload erro';
            statusUpload.innerHTML = `
                <strong>Erro:</strong> ${erro.message}
            `;
        } finally {
            btnEnviarUpload.disabled = false;
        }
    });
}


    // 4. Envio do Formulário de Cadastro
    const form = document.getElementById("formCadastro");

    if (form) {
        form.addEventListener("submit", function(event) {
            event.preventDefault();

            const inputNome = document.getElementById("nome");
            const inputEmail = document.getElementById("email");
            const inputSenha = document.getElementById("senha");
            const inputSenha_Confir = document.getElementById("senhaConfirmacao");
            const inputCargo = document.getElementById("cargo");

            const senhaDigitada = inputSenha.value; 
            const senhaConfirmadaDigitada = inputSenha_Confir.value;

            if (!validarSenha(senhaDigitada)) { 
                alert("A senha não cumpre os requisitos!\n\nA senha deve conter:\n- No mínimo 8 caracteres\n- 1 letra maiúscula\n- 1 letra minúscula\n- 1 número\n- 1 caractere especial (!@#$%^&*...)"); 
            } else {
                if (senhaDigitada === senhaConfirmadaDigitada) {
                    const meusDados = {
                        nome: inputNome.value,
                        email: inputEmail.value,
                        senha: senhaDigitada,
                        cargo: inputCargo.value
                    };

                    // Fazendo a requisição para o Flask
                    fetch('http://127.0.0.1:5000/receber-dados', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(meusDados)
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Resposta do Python:', data);
                        alert(data.mensagem);
                        form.reset(); // Limpa o formulário após o sucesso
                    })
                    .catch(error => {
                        console.error('Erro ao enviar dados:', error);
                    }); 
                } else {
                    alert('A senha precisa ser igual em ambos os campos');
                }
            } 
        });
    }
});

/* =========================================================
   MODAL ALTERAR CARGO
========================================================= */

function abrirModalCargo(botao) {

    const modal = document.getElementById("modalCargo");

    const idUsuario = botao.dataset.id;
    const nomeUsuario = botao.dataset.nome;
    const cargoAtual = botao.dataset.cargo;

    document.getElementById("idUsuarioCargo").value = idUsuario;

    document.getElementById("nomeUsuarioCargo").textContent =
        "Usuário: " + nomeUsuario;

    document.getElementById("novoCargo").value = cargoAtual;

    modal.classList.add("ativo");
}


/* =========================================================
   FECHAR MODAL
========================================================= */

function fecharModalCargo() {

    const modal = document.getElementById("modalCargo");

    modal.classList.remove("ativo");
}


/* =========================================================
   FECHAR CLICANDO FORA DO MODAL
========================================================= */

document.addEventListener("click", function(event) {

    const modal = document.getElementById("modalCargo");

    if (
        event.target === modal
    ) {
        fecharModalCargo();
    }

});


/* =========================================================
   FORMULÁRIO ALTERAR CARGO
========================================================= */

document.addEventListener("DOMContentLoaded", function() {

    const form = document.getElementById("formAlterarCargo");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async function(event) {

        event.preventDefault();

        const idUsuario =
            document.getElementById("idUsuarioCargo").value;

        const novoCargo =
            document.getElementById("novoCargo").value;


        if (!novoCargo) {

            alert("Selecione um cargo.");

            return;
        }


        try {

            const resposta = await fetch("/alterar-cargo", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    id_usuario: idUsuario,

                    cargo: novoCargo

                })

            });


            const dados = await resposta.json();


            if (dados.status === "sucesso") {

                alert(dados.mensagem);

                fecharModalCargo();

                // Atualiza a página para mostrar o novo cargo
                window.location.reload();

            } else {

                alert(dados.mensagem);

            }


        } catch (erro) {

            console.error(erro);

            alert("Erro ao alterar o cargo.");

        }

    });

});