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

    btnEnviarUpload.addEventListener(
        'click',
        async () => {

            if (!arquivoSelecionadoUpload) {

                return;

            }


            /* Desabilita botão */

            btnEnviarUpload.disabled = true;


            /* Mostra carregamento */

            statusUpload.className =
                'status-upload loading';

            statusUpload.innerHTML = `
                <div class="spinner-upload"></div>
                Processando e identificando documento com IA...
            `;


            /* Cria FormData */

            const formData = new FormData();

            formData.append(
                'imagem',
                arquivoSelecionadoUpload
            );


            try {

                const response = await fetch(
                    'http://127.0.0.1:5001/upload',
                    {
                        method: 'POST',
                        body: formData
                    }
                );


                const data = await response.json();


                /* =================================================
                   SUCESSO
                ================================================== */

                if (
                    response.ok &&
                    data.sucesso
                ) {

                    statusUpload.className =
                        'status-upload sucesso';

                    statusUpload.innerHTML = `

                        <strong>
                            Documento processado com sucesso!
                        </strong>

                        <div class="resultado-upload">
                            <strong>Tipo:</strong>
                            ${data.tipo}
                        </div>

                        <div class="resultado-upload">
                            <strong>Número Extraído:</strong>
                            ${data.titular}
                        </div>

                        <div class="resultado-upload">
                            <strong>Caminho Salvo:</strong>
                            <small>
                                ${data.caminho}
                            </small>
                        </div>

                    `;

                } else {

                    throw new Error(
                        data.erro ||
                        'Erro ao processar o arquivo.'
                    );

                }

            } catch (erro) {

                /* =================================================
                   ERRO
                ================================================== */

                statusUpload.className =
                    'status-upload erro';

                statusUpload.innerHTML = `

                    <strong>
                        Erro:
                    </strong>

                    ${erro.message}

                `;

            } finally {

                btnEnviarUpload.disabled = false;

            }

        }
    );

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