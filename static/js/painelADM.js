document.addEventListener("DOMContentLoaded", function () {

    /* =========================================================
       1. CONTROLE DA SANFONA DO MENU LATERAL
    ========================================================= */

    const menuToggles = document.querySelectorAll(".menu-toggle");

    menuToggles.forEach(toggle => {

        toggle.addEventListener("click", function () {

            const submenu = this.nextElementSibling;

            document.querySelectorAll(".submenu").forEach(outroMenu => {

                if (outroMenu !== submenu) {
                    outroMenu.classList.remove("show");
                }

            });

            if (submenu) {
                submenu.classList.toggle("show");
            }

        });

    });


    /* =========================================================
       2. TROCA DE TELAS
    ========================================================= */

    const subMenuItems = document.querySelectorAll(".submenu li");
    const views = document.querySelectorAll(".main-content > div");

    subMenuItems.forEach(item => {

        item.addEventListener("click", function () {

            subMenuItems.forEach(i => {
                i.classList.remove("active");
            });

            this.classList.add("active");

            views.forEach(v => {
                v.classList.remove("active");
            });

            const targetId = this.getAttribute("data-target");
            const targetView = document.getElementById(targetId);

            if (targetView) {
                targetView.classList.add("active");
            }

        });

    });


    /* =========================================================
       3. MOSTRAR / ESCONDER SENHA
    ========================================================= */

    const btnToggle = document.getElementById("toggleSenha");
    const inputSenha = document.getElementById("senha");

    if (btnToggle && inputSenha) {

        btnToggle.addEventListener("click", function () {

            if (inputSenha.type === "password") {

                inputSenha.type = "text";

                btnToggle.innerHTML =
                    '<i class="ph ph-eye"></i>';

            } else {

                inputSenha.type = "password";

                btnToggle.innerHTML =
                    '<i class="ph ph-eye-slash"></i>';

            }

        });

    }


    /* =========================================================
       4. VALIDAÇÃO DA SENHA
    ========================================================= */

    function validarSenha(senha) {

        const regex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

        return regex.test(senha);

    }


    /* =========================================================
       5. GRÁFICO DE DOCUMENTOS
    ========================================================= */

    let graficoDocumentos = null;

    async function carregarGraficoDocumentos() {

        try {

            const canvas =
                document.getElementById("graficoDocumentos");

            if (!canvas) {
                console.warn("Canvas graficoDocumentos não encontrado.");
                return;
            }

            const resposta =
                await fetch("/estatisticas-documentos");

            if (!resposta.ok) {

                throw new Error(
                    `Erro HTTP ${resposta.status} ao buscar estatísticas.`
                );

            }

            const dados =
                await resposta.json();

            console.log("Dados do gráfico:", dados);


            if (!dados.tipos || !dados.quantidades) {

                throw new Error(
                    "A API não retornou 'tipos' e 'quantidades'."
                );

            }


            /* Destrói gráfico anterior */

            if (graficoDocumentos) {
                graficoDocumentos.destroy();
            }


            /* Cria gráfico */

            graficoDocumentos = new Chart(canvas, {

                type: "bar",

                data: {

                    labels: dados.tipos,

                    datasets: [
                        {
                            label: "Quantidade",

                            data: dados.quantidades,

                            backgroundColor: [
                                "#142b50",
                                "#d7b54a",
                                "#0066ff",
                                "#16a34a",
                                "#9333ea",
                                "#dc2626"
                            ],

                            borderRadius: 8,

                            borderSkipped: false
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label: function (context) {

                                    return (
                                        " " +
                                        context.raw +
                                        " documento(s)"
                                    );

                                }

                            }

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {
                                precision: 0
                            },

                            title: {

                                display: true,

                                text:
                                    "Quantidade de documentos"

                            }

                        },

                        x: {

                            title: {

                                display: true,

                                text:
                                    "Tipo de documento"

                            }

                        }

                    }

                }

            });

        } catch (erro) {

            console.error(
                "Erro ao carregar gráfico:",
                erro
            );

        }

    }


    /* Chama o gráfico */

    carregarGraficoDocumentos();


    /* =========================================================
       6. FILTRO DE DOCUMENTOS
    ========================================================= */

    const tipoBusca =
        document.getElementById("tipoBusca");

    const inputBusca =
        document.getElementById("inputBusca");


    const placeholders = {

        cpf: "Digite o CPF...",

        rg: "Digite o RG...",

        nome_arquivo:
            "Digite o nome do arquivo...",

        tipo_documento:
            "Digite o tipo do documento..."

    };


    function atualizarPlaceholder() {

        if (!tipoBusca || !inputBusca) {
            return;
        }

        const tipo =
            tipoBusca.value;

        inputBusca.value = "";

        inputBusca.placeholder =
            placeholders[tipo] ||
            "Digite para buscar...";


        switch (tipo) {

            case "cpf":

                inputBusca.inputMode = "numeric";
                inputBusca.maxLength = 14;

                break;


            case "rg":

                inputBusca.inputMode = "numeric";
                inputBusca.maxLength = 20;

                break;


            case "nome_arquivo":

                inputBusca.inputMode = "text";
                inputBusca.removeAttribute("maxlength");

                break;


            case "tipo_documento":

                inputBusca.inputMode = "text";
                inputBusca.removeAttribute("maxlength");

                break;

        }

    }


    if (tipoBusca) {

        tipoBusca.addEventListener(
            "change",
            function () {

                atualizarPlaceholder();

                buscarDocumentos();

            }
        );

    }


    /* =========================================================
       7. BUSCA COM DEBOUNCE
    ========================================================= */

    let timeoutBusca = null;


    if (inputBusca) {

        inputBusca.addEventListener(
            "input",
            function () {

                clearTimeout(timeoutBusca);

                timeoutBusca =
                    setTimeout(
                        function () {
                            buscarDocumentos();
                        },
                        300
                    );

            }
        );

    }


    /* =========================================================
       8. BUSCAR DOCUMENTOS
    ========================================================= */

    async function buscarDocumentos() {

        const termo =
            inputBusca
                ? inputBusca.value.trim()
                : "";

        const tipo =
            tipoBusca
                ? tipoBusca.value
                : "nome_arquivo";


        try {

            const url =
                `/documentos?termo=${encodeURIComponent(termo)}&tipo=${encodeURIComponent(tipo)}`;


            const response =
                await fetch(url);


            if (!response.ok) {

                throw new Error(
                    "Erro ao buscar documentos."
                );

            }


            const documentos =
                await response.json();


            renderizarDocumentos(documentos);


        } catch (erro) {

            console.error(
                "Erro na filtragem:",
                erro
            );

        }

    }


    /* =========================================================
       9. RENDERIZAR DOCUMENTOS
    ========================================================= */

    function renderizarDocumentos(documentos) {

        const tbody =
            document.getElementById(
                "listaDocumentos"
            );


        if (!tbody) {
            return;
        }


        if (
            !Array.isArray(documentos) ||
            documentos.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="sem-resultados">
                        Nenhum documento encontrado.
                    </td>
                </tr>
            `;

            return;

        }


        tbody.innerHTML =
            documentos.map(doc => `

                <tr>

                    <td>
                        ${doc.nome_arquivo || "Sem nome"}
                    </td>

                    <td>
                        ${doc.tipo || "-"}
                    </td>

                    <td>
                        ${doc.titular || "-"}
                    </td>

                    <td>

                        <a
                            href="#"
                            class="btn-visualizar-documento"
                            data-caminho="${doc.caminho || ""}"
                            data-nome="${doc.nome_arquivo || "Documento"}"
                        >
                            Visualizar
                        </a>

                    </td>

                </tr>

            `).join("");

    }


    /* =========================================================
       9.1 MODAL DE VISUALIZAÇÃO DO DOCUMENTO
    ========================================================= */

    const modalVisualizarDocumento =
        document.getElementById(
            "modalVisualizarDocumento"
        );

    const btnFecharVisualizar =
        document.getElementById(
            "btnFecharVisualizar"
        );

    const imagemDocumentoVisualizar =
        document.getElementById(
            "imagemDocumentoVisualizar"
        );

    const nomeDocumentoVisualizar =
        document.getElementById(
            "nomeDocumentoVisualizar"
        );

    const listaDocumentos =
        document.getElementById(
            "listaDocumentos"
        );


    /* =========================================================
       ABRIR MODAL AO CLICAR EM "VISUALIZAR"
    ========================================================= */

    if (listaDocumentos) {

        listaDocumentos.addEventListener(
            "click",
            function (event) {

                const link =
                    event.target.closest(
                        ".btn-visualizar-documento"
                    );


                /* Se não clicou no botão Visualizar,
                   não faz nada */

                if (!link) {
                    return;
                }


                /* Impede o href="#" de alterar a página */

                event.preventDefault();


                /* Pega os dados do <a> */

                const caminho =
                    link.dataset.caminho;

                const nome =
                    link.dataset.nome ||
                    "Documento";


                console.log(
                    "Documento selecionado:",
                    caminho
                );


                /* Verifica se existe caminho */

                if (!caminho) {

                    alert(
                        "O caminho do documento não foi encontrado."
                    );

                    return;

                }


                /* Coloca o nome no modal */

                if (nomeDocumentoVisualizar) {

                    nomeDocumentoVisualizar.textContent =
                        nome;

                }


                /* Coloca o caminho da imagem */

                if (imagemDocumentoVisualizar) {

                    imagemDocumentoVisualizar.src =
                        caminho;

                    imagemDocumentoVisualizar.alt =
                        nome;

                }


                /* Abre o modal */

                if (modalVisualizarDocumento) {

                    modalVisualizarDocumento.classList.add(
                        "ativo"
                    );

                }

            }
        );

    }


    /* =========================================================
       FECHAR MODAL DE VISUALIZAÇÃO
    ========================================================= */

    function fecharModalVisualizar() {

        if (!modalVisualizarDocumento) {
            return;
        }


        modalVisualizarDocumento.classList.remove(
            "ativo"
        );


        /* Limpa a imagem */

        if (imagemDocumentoVisualizar) {

            imagemDocumentoVisualizar.src = "";

        }


        /* Limpa o nome */

        if (nomeDocumentoVisualizar) {

            nomeDocumentoVisualizar.textContent =
                "Documento";

        }

    }


    /* =========================================================
       BOTÃO X DO MODAL
    ========================================================= */

    if (btnFecharVisualizar) {

        btnFecharVisualizar.addEventListener(
            "click",
            fecharModalVisualizar
        );

    }


    /* =========================================================
       CLICAR FORA DO MODAL
    ========================================================= */

    if (modalVisualizarDocumento) {

        modalVisualizarDocumento.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    modalVisualizarDocumento
                ) {

                    fecharModalVisualizar();

                }

            }
        );

    }


    /* =========================================================
       TECLA ESC
    ========================================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                modalVisualizarDocumento &&
                modalVisualizarDocumento.classList.contains("ativo")
            ) {

                fecharModalVisualizar();

            }

        }
    );


    /* =========================================================
       BUSCA INICIAL
    ========================================================= */

    buscarDocumentos();


    /* =========================================================
       10. UPLOAD / RECONHECIMENTO
    ========================================================= */

    const btnAbrirUpload =
        document.getElementById("btnAbrirUpload");

    const btnFecharUpload =
        document.getElementById("btnFecharUpload");

    const modalUpload =
        document.getElementById("modalUpload");

    const dropzoneUpload =
        document.getElementById("dropzoneUpload");

    const fileInputUpload =
        document.getElementById("fileInputUpload");

    const fileInfoUpload =
        document.getElementById("fileInfoUpload");

    const btnEnviarUpload =
        document.getElementById("btnEnviarUpload");

    const statusUpload =
        document.getElementById("statusUpload");


    let arquivoSelecionadoUpload = null;


    /* =========================================================
       ABRIR MODAL UPLOAD
    ========================================================= */

    if (btnAbrirUpload && modalUpload) {

        btnAbrirUpload.addEventListener(
            "click",
            function () {

                modalUpload.classList.add("ativo");

            }
        );

    }


    /* =========================================================
       FECHAR MODAL UPLOAD
    ========================================================= */

    function fecharModalUpload() {

        if (modalUpload) {

            modalUpload.classList.remove("ativo");

        }

    }


    if (btnFecharUpload) {

        btnFecharUpload.addEventListener(
            "click",
            fecharModalUpload
        );

    }


    if (modalUpload) {

        modalUpload.addEventListener(
            "click",
            function (event) {

                if (event.target === modalUpload) {

                    fecharModalUpload();

                }

            }
        );

    }


    /* =========================================================
       ESC PARA FECHAR MODAL UPLOAD
    ========================================================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                fecharModalUpload();

            }

        }
    );


    /* =========================================================
       DROPZONE
    ========================================================= */

    if (dropzoneUpload && fileInputUpload) {

        dropzoneUpload.addEventListener(
            "click",
            function () {

                fileInputUpload.click();

            }
        );


        dropzoneUpload.addEventListener(
            "dragover",
            function (event) {

                event.preventDefault();

                dropzoneUpload.classList.add(
                    "dragover"
                );

            }
        );


        dropzoneUpload.addEventListener(
            "dragleave",
            function () {

                dropzoneUpload.classList.remove(
                    "dragover"
                );

            }
        );


        dropzoneUpload.addEventListener(
            "drop",
            function (event) {

                event.preventDefault();

                dropzoneUpload.classList.remove(
                    "dragover"
                );


                if (
                    event.dataTransfer.files.length > 0
                ) {

                    tratarArquivoUpload(
                        event.dataTransfer.files[0]
                    );

                }

            }
        );


        fileInputUpload.addEventListener(
            "change",
            function (event) {

                if (
                    event.target.files.length > 0
                ) {

                    tratarArquivoUpload(
                        event.target.files[0]
                    );

                }

            }
        );

    }


    /* =========================================================
       TRATAR ARQUIVO
    ========================================================= */

    function tratarArquivoUpload(file) {

        arquivoSelecionadoUpload = file;


        const tamanhoKB =
            (file.size / 1024).toFixed(1);


        if (fileInfoUpload) {

            fileInfoUpload.textContent =
                `Arquivo selecionado: ${file.name} (${tamanhoKB} KB)`;

            fileInfoUpload.classList.add("ativo");

        }


        if (btnEnviarUpload) {

            btnEnviarUpload.disabled = false;

        }


        limparStatusUpload();

    }


    /* =========================================================
       LIMPAR STATUS
    ========================================================= */

    function limparStatusUpload() {

        if (!statusUpload) {
            return;
        }

        statusUpload.className =
            "status-upload";

        statusUpload.innerHTML = "";

    }


    /* =========================================================
       ENVIAR DOCUMENTO
    ========================================================= */

    if (btnEnviarUpload) {

        btnEnviarUpload.addEventListener(
            "click",
            async function () {

                if (!arquivoSelecionadoUpload) {
                    return;
                }


                const inputNomeArquivo =
                    document.getElementById(
                        "nomeArquivoUpload"
                    );


                const nomeArquivo =
                    inputNomeArquivo
                        ? inputNomeArquivo.value.trim()
                        : "";


                if (!nomeArquivo) {

                    alert(
                        "Por favor, informe um nome para o arquivo."
                    );

                    return;

                }


                btnEnviarUpload.disabled = true;


                if (statusUpload) {

                    statusUpload.className =
                        "status-upload loading";

                    statusUpload.innerHTML = `
                        <div class="spinner-upload"></div>
                        Processando e identificando documento com IA...
                    `;

                }


                const formData =
                    new FormData();


                formData.append(
                    "imagem",
                    arquivoSelecionadoUpload
                );


                formData.append(
                    "nome_arquivo",
                    nomeArquivo
                );


                try {

                    const response =
                        await fetch(
                            "http://127.0.0.1:5001/upload",
                            {
                                method: "POST",
                                body: formData
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        response.ok &&
                        data.sucesso
                    ) {

                        statusUpload.className =
                            "status-upload sucesso";


                        statusUpload.innerHTML = `

                            <strong>
                                Documento processado com sucesso!
                            </strong>

                            <div class="resultado-upload">
                                <strong>
                                    Nome Personalizado:
                                </strong>
                                ${data.nome_arquivo || "-"}
                            </div>

                            <div class="resultado-upload">
                                <strong>
                                    Tipo:
                                </strong>
                                ${data.tipo || "-"}
                            </div>

                            <div class="resultado-upload">
                                <strong>
                                    Número Extraído:
                                </strong>
                                ${data.titular || "-"}
                            </div>

                            <div class="resultado-upload">
                                <strong>
                                    Caminho Salvo:
                                </strong>
                                <small>
                                    ${data.caminho || "-"}
                                </small>
                            </div>

                        `;


                        /* Atualiza tabela */

                        buscarDocumentos();

                    } else {

                        throw new Error(
                            data.erro ||
                            "Erro ao processar o arquivo."
                        );

                    }


                } catch (erro) {

                    if (statusUpload) {

                        statusUpload.className =
                            "status-upload erro";

                        statusUpload.innerHTML = `
                            <strong>Erro:</strong>
                            ${erro.message}
                        `;

                    }

                } finally {

                    btnEnviarUpload.disabled = false;

                }

            }
        );

    }


    /* =========================================================
       11. CADASTRO DE USUÁRIO
    ========================================================= */

    const formCadastro =
        document.getElementById(
            "formCadastro"
        );


    if (formCadastro) {

        formCadastro.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const inputNome =
                    document.getElementById("nome");

                const inputEmail =
                    document.getElementById("email");

                const inputSenhaCadastro =
                    document.getElementById("senha");

                const inputSenhaConfirmacao =
                    document.getElementById(
                        "senhaConfirmacao"
                    );

                const inputCargo =
                    document.getElementById("cargo");


                const senhaDigitada =
                    inputSenhaCadastro.value;


                const senhaConfirmadaDigitada =
                    inputSenhaConfirmacao.value;


                if (
                    !validarSenha(
                        senhaDigitada
                    )
                ) {

                    alert(
                        "A senha não cumpre os requisitos!\n\n" +
                        "A senha deve conter:\n" +
                        "- No mínimo 8 caracteres\n" +
                        "- 1 letra maiúscula\n" +
                        "- 1 letra minúscula\n" +
                        "- 1 número\n" +
                        "- 1 caractere especial"
                    );

                    return;

                }


                if (
                    senhaDigitada !==
                    senhaConfirmadaDigitada
                ) {

                    alert(
                        "A senha precisa ser igual em ambos os campos."
                    );

                    return;

                }


                const meusDados = {

                    nome:
                        inputNome.value,

                    email:
                        inputEmail.value,

                    senha:
                        senhaDigitada,

                    cargo:
                        inputCargo.value

                };


                fetch(
                    "http://127.0.0.1:5000/receber-dados",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                meusDados
                            )

                    }
                )

                .then(response => {

                    if (!response.ok) {

                        throw new Error(
                            "Erro ao cadastrar usuário."
                        );

                    }

                    return response.json();

                })

                .then(data => {

                    console.log(
                        "Resposta do Python:",
                        data
                    );

                    alert(
                        data.mensagem ||
                        "Usuário cadastrado com sucesso."
                    );

                    formCadastro.reset();

                })

                .catch(error => {

                    console.error(
                        "Erro ao enviar dados:",
                        error
                    );

                    alert(
                        "Erro ao cadastrar usuário."
                    );

                });

            }
        );

    }


    /* =========================================================
       12. MODAL ALTERAR CARGO
    ========================================================= */

    window.abrirModalCargo =
        function (botao) {

            const modal =
                document.getElementById(
                    "modalCargo"
                );


            if (!modal) {
                return;
            }


            const idUsuario =
                botao.dataset.id;

            const nomeUsuario =
                botao.dataset.nome;

            const cargoAtual =
                botao.dataset.cargo;


            const campoId =
                document.getElementById(
                    "idUsuarioCargo"
                );

            const campoNome =
                document.getElementById(
                    "nomeUsuarioCargo"
                );

            const campoCargo =
                document.getElementById(
                    "novoCargo"
                );


            if (campoId) {
                campoId.value =
                    idUsuario;
            }


            if (campoNome) {

                campoNome.textContent =
                    "Usuário: " +
                    nomeUsuario;

            }


            if (campoCargo) {

                campoCargo.value =
                    cargoAtual;

            }


            modal.classList.add(
                "ativo"
            );

        };


    /* =========================================================
       FECHAR MODAL CARGO
    ========================================================= */

    window.fecharModalCargo =
        function () {

            const modal =
                document.getElementById(
                    "modalCargo"
                );


            if (modal) {

                modal.classList.remove(
                    "ativo"
                );

            }

        };


    /* =========================================================
       FECHAR CLICANDO FORA
    ========================================================= */

    const modalCargo =
        document.getElementById(
            "modalCargo"
        );


    if (modalCargo) {

        modalCargo.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    modalCargo
                ) {

                    window.fecharModalCargo();

                }

            }
        );

    }


    /* =========================================================
       FORM ALTERAR CARGO
    ========================================================= */

    const formAlterarCargo =
        document.getElementById(
            "formAlterarCargo"
        );


    if (formAlterarCargo) {

        formAlterarCargo.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const idUsuario =
                    document.getElementById(
                        "idUsuarioCargo"
                    ).value;


                const novoCargo =
                    document.getElementById(
                        "novoCargo"
                    ).value;


                if (!novoCargo) {

                    alert(
                        "Selecione um cargo."
                    );

                    return;

                }


                try {

                    const resposta =
                        await fetch(
                            "/alterar-cargo",
                            {

                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        id_usuario:
                                            idUsuario,

                                        cargo:
                                            novoCargo

                                    })

                            }
                        );


                    if (!resposta.ok) {

                        throw new Error(
                            "Erro HTTP " +
                            resposta.status
                        );

                    }


                    const dados =
                        await resposta.json();


                    if (
                        dados.status ===
                        "sucesso"
                    ) {

                        alert(
                            dados.mensagem
                        );


                        window.fecharModalCargo();


                        window.location.reload();

                    } else {

                        alert(
                            dados.mensagem ||
                            "Não foi possível alterar o cargo."
                        );

                    }


                } catch (erro) {

                    console.error(
                        "Erro ao alterar cargo:",
                        erro
                    );

                    alert(
                        "Erro ao alterar o cargo."
                    );

                }

            }
        );

    }

});
