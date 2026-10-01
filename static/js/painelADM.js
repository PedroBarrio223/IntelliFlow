document.addEventListener("DOMContentLoaded",function(){
    /* 1. CONTROLE DO MENU LATERAL */
    const menuToggles=document.querySelectorAll(".menu-toggle");

    menuToggles.forEach(toggle=>{
        toggle.addEventListener("click",function(){
            const submenu=this.nextElementSibling;

            document.querySelectorAll(".submenu").forEach(outroMenu=>{
                if(outroMenu!==submenu){
                    outroMenu.classList.remove("show");
                }
            });

            if(submenu){
                submenu.classList.toggle("show");
            }
        });
    });

    /* 2. TROCA DE TELAS */
    const subMenuItems=document.querySelectorAll(".submenu li");

    function trocarTela(targetId){
        if(!targetId)return;

        const views=document.querySelectorAll(".main-content > div");

        views.forEach(view=>{
            view.classList.remove("active");
        });

        const targetView=document.getElementById(targetId);

        if(!targetView){
            console.warn("View não encontrada:",targetId);
            return;
        }

        targetView.classList.add("active");

        const idsTelaGraficos=[
            "graficos",
            "dashboard",
            "dashboardDocumentos",
            "viewGraficos"
        ];

        if(idsTelaGraficos.includes(targetId)){
            carregarDashboardDocumentos();
        }
    }

    subMenuItems.forEach(item=>{
        item.addEventListener("click",function(){
            subMenuItems.forEach(i=>{
                i.classList.remove("active");
            });

            this.classList.add("active");

            const targetId=this.getAttribute("data-target");
            trocarTela(targetId);
        });
    });

    /* 3. MOSTRAR / ESCONDER SENHA */
    const btnToggle=document.getElementById("toggleSenha");
    const inputSenha=document.getElementById("senha");

    if(btnToggle&&inputSenha){
        btnToggle.addEventListener("click",function(){
            if(inputSenha.type==="password"){
                inputSenha.type="text";
                btnToggle.innerHTML='<i class="ph ph-eye"></i>';
            }else{
                inputSenha.type="password";
                btnToggle.innerHTML='<i class="ph ph-eye-slash"></i>';
            }
        });
    }

    /* 4. VALIDAÇÃO DA SENHA */
    function validarSenha(senha){
        const regex=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        return regex.test(senha);
    }

    /* 5. DASHBOARD - DOCUMENTOS */
    async function carregarDashboardDocumentos(){
        try{
            const resposta=await fetch("/estatisticas-documentos");

            if(!resposta.ok){
                throw new Error(`Erro HTTP ${resposta.status}`);
            }

            const dados=await resposta.json();

            console.log("Dados do dashboard:",dados);

            const tipos=Array.isArray(dados.tipos)?dados.tipos:[];
            const quantidades=Array.isArray(dados.quantidades)?dados.quantidades:[];

            const totalDocumentos=quantidades.reduce((total,quantidade)=>{
                return total+Number(quantidade||0);
            },0);

            const totalTipos=tipos.length;

            const totalTitulares=Number(
                dados.total_titulares||
                dados.titulares||
                0
            );

            const elementoTotalDocumentos=document.getElementById("totalDocumentos");
            const elementoTotalTipos=document.getElementById("totalTipos");
            const elementoTotalTitulares=document.getElementById("totalTitulares");

            if(elementoTotalDocumentos){
                elementoTotalDocumentos.textContent=totalDocumentos.toLocaleString("pt-BR");
            }

            if(elementoTotalTipos){
                elementoTotalTipos.textContent=totalTipos.toLocaleString("pt-BR");
            }

            if(elementoTotalTitulares){
                elementoTotalTitulares.textContent=totalTitulares.toLocaleString("pt-BR");
            }

            renderizarGraficoTipos(tipos,quantidades);
            renderizarTiposDisponiveis(tipos,quantidades);
            carregarUltimosDocumentos();
        }catch(erro){
            console.error("Erro ao carregar dashboard:",erro);
            mostrarErroDashboard();
        }
    }

    /* 6. BARRAS DE DOCUMENTOS POR TIPO */
    function renderizarGraficoTipos(tipos,quantidades){
        const container=document.getElementById("graficoDocumentosLista");

        if(!container){
            console.warn("Container graficoDocumentosLista não encontrado.");
            return;
        }

        if(!tipos.length||!quantidades.length){
            container.innerHTML=`
                <div class="dashboard-vazio">
                    Nenhum documento encontrado.
                </div>
            `;
            return;
        }

        const maiorQuantidade=Math.max(
            ...quantidades.map(quantidade=>Number(quantidade||0))
        );

        container.innerHTML=tipos.map((tipo,indice)=>{
            const quantidade=Number(quantidades[indice]||0);

            const percentual=maiorQuantidade>0
                ?(quantidade/maiorQuantidade)*100
                :0;

            return`
                <div class="grafico-documento-item">
                    <div class="grafico-documento-nome">
                        ${escaparHTML(tipo)}
                    </div>
                    <div class="grafico-documento-barra">
                        <div class="grafico-documento-barra-preenchida" style="width:${percentual}%;"></div>
                    </div>
                    <div class="grafico-documento-quantidade">
                        ${quantidade.toLocaleString("pt-BR")}
                    </div>
                </div>
            `;
        }).join("");
    }

    /* 7. TIPOS DISPONÍVEIS */
    function renderizarTiposDisponiveis(tipos,quantidades){
        const container=document.getElementById("tiposDisponiveis");

        if(!container)return;

        if(!tipos.length){
            container.innerHTML=`
                <div class="dashboard-vazio">
                    Nenhum tipo disponível.
                </div>
            `;
            return;
        }

        const quantidadeTipos=Math.min(tipos.length,6);
        let html="";

        for(let i=0;i<quantidadeTipos;i++){
            const tipo=tipos[i];
            const quantidade=Number(quantidades[i]||0);

            html+=`
                <div class="tipo-disponivel">
                    <span class="tipo-disponivel-nome">
                        ${escaparHTML(tipo)}
                    </span>
                    <span class="tipo-disponivel-quantidade">
                        ${quantidade.toLocaleString("pt-BR")}
                    </span>
                </div>
            `;
        }

        container.innerHTML=html;
    }

    /* 8. ÚLTIMOS DOCUMENTOS */
    async function carregarUltimosDocumentos(){
        const container=document.getElementById("ultimosDocumentos");

        if(!container)return;

        try{
            const resposta=await fetch("/documentos?termo=&tipo=nome_arquivo");

            if(!resposta.ok){
                throw new Error("Erro ao buscar documentos.");
            }

            const documentos=await resposta.json();

            if(!Array.isArray(documentos)||documentos.length===0){
                container.innerHTML=`
                    <div class="dashboard-vazio">
                        Nenhum documento encontrado.
                    </div>
                `;
                return;
            }

            const ultimos=documentos.slice(0,5);

            container.innerHTML=ultimos.map(documento=>{
                const tipo=documento.tipo||"-";
                const nome=documento.nome_arquivo||"Documento";
                let identificacao=documento.titular||"";

                if(identificacao){
                    identificacao=String(identificacao);

                    if(identificacao.length>5){
                        identificacao="•••••"+identificacao.slice(-4);
                    }
                }

                return`
                    <div class="ultimo-documento">
                        <div class="ultimo-documento-info">
                            <span class="ultimo-documento-tipo">
                                ${escaparHTML(tipo)}
                            </span>
                            <span class="ultimo-documento-nome" title="${escaparHTML(nome)}">
                                ${identificacao?escaparHTML(identificacao):escaparHTML(nome)}
                            </span>
                        </div>
                    </div>
                `;
            }).join("");
        }catch(erro){
            console.error("Erro ao carregar últimos documentos:",erro);

            container.innerHTML=`
                <div class="dashboard-vazio">
                    Não foi possível carregar os documentos.
                </div>
            `;
        }
    }

    /* 9. ERRO DO DASHBOARD */
    function mostrarErroDashboard(){
        const containers=[
            "graficoDocumentosLista",
            "ultimosDocumentos",
            "tiposDisponiveis"
        ];

        containers.forEach(id=>{
            const elemento=document.getElementById(id);

            if(elemento){
                elemento.innerHTML=`
                    <div class="dashboard-vazio">
                        Não foi possível carregar os dados.
                    </div>
                `;
            }
        });
    }

    /* 10. BOTÃO "VER TODOS" */
    const btnVerTodosDocumentos=document.getElementById("btnVerTodosDocumentos");

    if(btnVerTodosDocumentos){
        btnVerTodosDocumentos.addEventListener("click",function(){
            const itemLista=document.querySelector(
                '.submenu li[data-target="documentos"]'
            );

            if(itemLista){
                itemLista.click();
                return;
            }

            const viewLista=document.querySelector(".content-view-documentos");

            if(viewLista){
                trocarTela(viewLista.id);
            }
        });
    }

    /* 11. FILTRO */
    const tipoBusca=document.getElementById("tipoBusca");
    const inputBusca=document.getElementById("inputBusca");

    const placeholders={
        cpf:"Digite o CPF...",
        rg:"Digite o RG...",
        nome_arquivo:"Digite o nome do arquivo...",
        tipo_documento:"Digite o tipo do documento..."
    };

    function atualizarPlaceholder(){
        if(!tipoBusca||!inputBusca)return;

        const tipo=tipoBusca.value;

        inputBusca.value="";
        inputBusca.placeholder=placeholders[tipo]||"Digite para buscar...";

        switch(tipo){
            case"cpf":
                inputBusca.inputMode="numeric";
                inputBusca.maxLength=14;
                break;

            case"rg":
                inputBusca.inputMode="numeric";
                inputBusca.maxLength=20;
                break;

            case"nome_arquivo":
            case"tipo_documento":
                inputBusca.inputMode="text";
                inputBusca.removeAttribute("maxlength");
                break;
        }
    }

    if(tipoBusca){
        tipoBusca.addEventListener("change",function(){
            atualizarPlaceholder();
            buscarDocumentos();
        });
    }

    /* 12. DEBOUNCE */
    let timeoutBusca=null;

    if(inputBusca){
        inputBusca.addEventListener("input",function(){
            clearTimeout(timeoutBusca);

            timeoutBusca=setTimeout(function(){
                buscarDocumentos();
            },300);
        });
    }

    /* 13. BUSCAR DOCUMENTOS */
    async function buscarDocumentos(){
        const termo=inputBusca?inputBusca.value.trim():"";
        const tipo=tipoBusca?tipoBusca.value:"nome_arquivo";

        try{
            const url=`/documentos?termo=${encodeURIComponent(termo)}&tipo=${encodeURIComponent(tipo)}`;
            const response=await fetch(url);

            if(!response.ok){
                throw new Error("Erro ao buscar documentos.");
            }

            const documentos=await response.json();
            renderizarDocumentos(documentos);
        }catch(erro){
            console.error("Erro na filtragem:",erro);
        }
    }

    /* 14. ESCAPAR HTML */
    function escaparHTML(valor){
        if(valor===null||valor===undefined){
            return"";
        }

        return String(valor)
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;")
            .replace(/'/g,"&#039;");
    }

    /* 15. RENDERIZAR DOCUMENTOS */
    function renderizarDocumentos(documentos){
        const tbody=document.getElementById("listaDocumentos");

        if(!tbody)return;

        if(!Array.isArray(documentos)||documentos.length===0){
            tbody.innerHTML=`
                <tr>
                    <td colspan="4" class="sem-resultados">
                        Nenhum documento encontrado.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML=documentos.map(doc=>{
            const id=escaparHTML(doc.id);
            const nome=escaparHTML(doc.nome_arquivo||"Documento");
            const tipo=escaparHTML(doc.tipo||"-");
            const titular=escaparHTML(doc.titular||"-");
            const extensao=escaparHTML(doc.extensao||"");

            return`
                <tr>
                    <td>${nome}</td>
                    <td>${tipo}</td>
                    <td>${titular}</td>
                    <td>
                        <a href="#" class="btn-visualizar-documento" data-id="${id}" data-nome="${nome}" data-tipo="${tipo}" data-extensao="${extensao}">
                            Visualizar
                        </a>
                    </td>
                </tr>
            `;
        }).join("");
    }

    /* 16. MODAL VISUALIZAÇÃO */
    const modalVisualizarDocumento = document.getElementById("modalVisualizarDocumento");
    const btnFecharVisualizar = document.getElementById("btnFecharVisualizar");
    const imagemDocumentoVisualizar = document.getElementById("imagemDocumentoVisualizar");
    const pdfDocumentoVisualizar = document.getElementById("pdfDocumentoVisualizar");
    const nomeDocumentoVisualizar = document.getElementById("nomeDocumentoVisualizar");
    const listaDocumentos = document.getElementById("listaDocumentos");

    /* 17. ABRIR DOCUMENTO */
    if (listaDocumentos) {
        listaDocumentos.addEventListener("click", function (event) {
            const link = event.target.closest(".btn-visualizar-documento");

            if (!link) return;

            event.preventDefault();

            const id = link.dataset.id;
            const nome = link.dataset.nome || "Documento";
            const extensao = (link.dataset.extensao || "").toLowerCase();

            console.log("Documento selecionado:", id);

            if (!id) {
                alert("ID do documento não encontrado.");
                return;
            }

            if (nomeDocumentoVisualizar) {
                nomeDocumentoVisualizar.textContent = nome;
            }

            if (imagemDocumentoVisualizar) {
                imagemDocumentoVisualizar.style.display = "none";
                imagemDocumentoVisualizar.src = "";
            }

            if (pdfDocumentoVisualizar) {
                pdfDocumentoVisualizar.style.display = "none";
                pdfDocumentoVisualizar.src = "";
            }

            const urlDocumento = `/documento/${id}/visualizar`;

            console.log("URL:", urlDocumento);

            if (extensao === ".pdf" || extensao === "pdf") {
                if (pdfDocumentoVisualizar) {
                    pdfDocumentoVisualizar.src = urlDocumento;
                    pdfDocumentoVisualizar.style.display = "block";
                }
            } else {
                if (imagemDocumentoVisualizar) {
                    imagemDocumentoVisualizar.src = urlDocumento;
                    imagemDocumentoVisualizar.alt = nome;
                    imagemDocumentoVisualizar.style.display = "block";

                }
            }

            if (modalVisualizarDocumento) {
                modalVisualizarDocumento.classList.add("ativo");
            }
        });
    }

    /* 18. FECHAR MODAL VISUALIZAÇÃO */
    function fecharModalVisualizar() {
        if (!modalVisualizarDocumento) return;

        modalVisualizarDocumento.classList.remove("ativo");

        if (imagemDocumentoVisualizar) {
            imagemDocumentoVisualizar.src = "";
            imagemDocumentoVisualizar.style.display = "none";
        }

        if (pdfDocumentoVisualizar) {
            pdfDocumentoVisualizar.src = "";
            pdfDocumentoVisualizar.style.display = "none";
        }

        if (nomeDocumentoVisualizar) {
            nomeDocumentoVisualizar.textContent = "Documento";
        }
    }

    /* 19. BOTÃO X */
    if (btnFecharVisualizar) {
        btnFecharVisualizar.addEventListener("click", fecharModalVisualizar);
    }

    /* 20. CLICAR FORA */
    if (modalVisualizarDocumento) {
        modalVisualizarDocumento.addEventListener("click", function (event) {
            if (event.target === modalVisualizarDocumento) {
                fecharModalVisualizar();
            }
        });
    }

    /* 21. ESC */
    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            modalVisualizarDocumento &&
            modalVisualizarDocumento.classList.contains("ativo")
        ) {
            fecharModalVisualizar();
        }
    });

    /* 22. BUSCA INICIAL */
    atualizarPlaceholder();
    buscarDocumentos();

    /* 23. UPLOAD */
    const btnAbrirUpload=document.getElementById("btnAbrirUpload");
    const btnFecharUpload=document.getElementById("btnFecharUpload");
    const modalUpload=document.getElementById("modalUpload");
    const dropzoneUpload=document.getElementById("dropzoneUpload");
    const fileInputUpload=document.getElementById("fileInputUpload");
    const fileInfoUpload=document.getElementById("fileInfoUpload");
    const btnEnviarUpload=document.getElementById("btnEnviarUpload");
    const statusUpload=document.getElementById("statusUpload");

    let arquivoSelecionadoUpload=null;

    /* 24. ABRIR UPLOAD */
    if(btnAbrirUpload&&modalUpload){
        btnAbrirUpload.addEventListener("click",function(){
            modalUpload.classList.add("ativo");
        });
    }

    /* 25. FECHAR UPLOAD */
    function fecharModalUpload(){
        if(modalUpload){
            modalUpload.classList.remove("ativo");
        }
    }

    if(btnFecharUpload){
        btnFecharUpload.addEventListener("click",fecharModalUpload);
    }

    if(modalUpload){
        modalUpload.addEventListener("click",function(event){
            if(event.target===modalUpload){
                fecharModalUpload();
            }
        });
    }

    /* 26. ESC UPLOAD */
    document.addEventListener("keydown",function(event){
        if(event.key==="Escape"){
            fecharModalUpload();
        }
    });

    /* 27. DROPZONE */
    if(dropzoneUpload&&fileInputUpload){
        dropzoneUpload.addEventListener("click",function(){
            fileInputUpload.click();
        });

        dropzoneUpload.addEventListener("dragover",function(event){
            event.preventDefault();
            dropzoneUpload.classList.add("dragover");
        });

        dropzoneUpload.addEventListener("dragleave",function(){
            dropzoneUpload.classList.remove("dragover");
        });

        dropzoneUpload.addEventListener("drop",function(event){
            event.preventDefault();
            dropzoneUpload.classList.remove("dragover");

            if(event.dataTransfer.files.length>0){
                tratarArquivoUpload(event.dataTransfer.files[0]);
            }
        });

        fileInputUpload.addEventListener("change",function(event){
            if(event.target.files.length>0){
                tratarArquivoUpload(event.target.files[0]);
            }
        });
    }

    /* 28. TRATAR ARQUIVO */
    function tratarArquivoUpload(file){
        arquivoSelecionadoUpload=file;

        const tamanhoKB=(file.size/1024).toFixed(1);

        if(fileInfoUpload){
            fileInfoUpload.textContent=`Arquivo selecionado: ${file.name} (${tamanhoKB} KB)`;
            fileInfoUpload.classList.add("ativo");
        }

        if(btnEnviarUpload){
            btnEnviarUpload.disabled=false;
        }

        limparStatusUpload();
    }

    /* 29. LIMPAR STATUS */
    function limparStatusUpload(){
        if(!statusUpload)return;

        statusUpload.className="status-upload";
        statusUpload.innerHTML="";
    }

    /* 30. ENVIAR DOCUMENTO */
    if(btnEnviarUpload){
        btnEnviarUpload.addEventListener("click",async function(){
            if(!arquivoSelecionadoUpload)return;

            const inputNomeArquivo=document.getElementById("nomeArquivoUpload");

            const nomeArquivo=inputNomeArquivo
                ?inputNomeArquivo.value.trim()
                :"";

            if(!nomeArquivo){
                alert("Por favor, informe um nome para o arquivo.");
                return;
            }

            btnEnviarUpload.disabled=true;

            if(statusUpload){
                statusUpload.className="status-upload loading";

                statusUpload.innerHTML=`
                    <div class="spinner-upload"></div>
                    Processando e identificando documento com IA...
                `;
            }

            const formData=new FormData();

            formData.append("imagem",arquivoSelecionadoUpload);
            formData.append("nome_arquivo",nomeArquivo);

            try{
                const response=await fetch(
                    "http://127.0.0.1:5001/upload",
                    {
                        method:"POST",
                        body:formData
                    }
                );

                const data=await response.json();

                if(response.ok&&data.sucesso){
                    statusUpload.className="status-upload sucesso";

                    statusUpload.innerHTML=`
                        <strong>Documento processado com sucesso!</strong>
                        <div class="resultado-upload">
                            <strong>Nome Personalizado:</strong>
                            ${escaparHTML(data.nome_arquivo||"-")}
                        </div>
                        <div class="resultado-upload">
                            <strong>Tipo:</strong>
                            ${escaparHTML(data.tipo||"-")}
                        </div>
                        <div class="resultado-upload">
                            <strong>Número Extraído:</strong>
                            ${escaparHTML(data.titular||"-")}
                        </div>
                        <div class="resultado-upload">
                            <strong>Caminho Salvo:</strong>
                            <small>${escaparHTML(data.caminho||"-")}</small>
                        </div>
                    `;

                    buscarDocumentos();
                    carregarDashboardDocumentos();
                }else{
                    throw new Error(
                        data.erro||
                        "Erro ao processar o arquivo."
                    );
                }
            }catch(erro){
                if(statusUpload){
                    statusUpload.className="status-upload erro";

                    statusUpload.innerHTML=`
                        <strong>Erro:</strong>
                        ${escaparHTML(erro.message)}
                    `;
                }
            }finally{
                btnEnviarUpload.disabled=false;
            }
        });
    }

    /* 31. CADASTRO DE USUÁRIO */
    const formCadastro=document.getElementById("formCadastro");

    if(formCadastro){
        formCadastro.addEventListener("submit",function(event){
            event.preventDefault();

            const inputNome=document.getElementById("nome");
            const inputEmail=document.getElementById("email");
            const inputSenhaCadastro=document.getElementById("senha");
            const inputSenhaConfirmacao=document.getElementById("senhaConfirmacao");
            const inputCargo=document.getElementById("cargo");

            const senhaDigitada=inputSenhaCadastro.value;
            const senhaConfirmadaDigitada=inputSenhaConfirmacao.value;

            if(!validarSenha(senhaDigitada)){
                alert(
                    "A senha não cumpre os requisitos!\n\n"+
                    "A senha deve conter:\n"+
                    "- No mínimo 8 caracteres\n"+
                    "- 1 letra maiúscula\n"+
                    "- 1 letra minúscula\n"+
                    "- 1 número\n"+
                    "- 1 caractere especial"
                );
                return;
            }

            if(senhaDigitada!==senhaConfirmadaDigitada){
                alert("A senha precisa ser igual em ambos os campos.");
                return;
            }

            const meusDados={
                nome:inputNome.value,
                email:inputEmail.value,
                senha:senhaDigitada,
                cargo:inputCargo.value
            };

            fetch(
                "http://127.0.0.1:5000/receber-dados",
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify(meusDados)
                }
            )
            .then(response=>{
                if(!response.ok){
                    throw new Error("Erro ao cadastrar usuário.");
                }

                return response.json();
            })
            .then(data=>{
                alert(
                    data.mensagem||
                    "Usuário cadastrado com sucesso."
                );

                formCadastro.reset();
            })
            .catch(error=>{
                console.error("Erro ao enviar dados:",error);
                alert("Erro ao cadastrar usuário.");
            });
        });
    }

    /* 32. MODAL ALTERAR CARGO */
    window.abrirModalCargo=function(botao){
        const modal=document.getElementById("modalCargo");

        if(!modal)return;

        const idUsuario=botao.dataset.id;
        const nomeUsuario=botao.dataset.nome;
        const cargoAtual=botao.dataset.cargo;

        const campoId=document.getElementById("idUsuarioCargo");
        const campoNome=document.getElementById("nomeUsuarioCargo");
        const campoCargo=document.getElementById("novoCargo");

        if(campoId){
            campoId.value=idUsuario;
        }

        if(campoNome){
            campoNome.textContent="Usuário: "+nomeUsuario;
        }

        if(campoCargo){
            campoCargo.value=cargoAtual;
        }

        modal.classList.add("ativo");
    };

    /* 33. FECHAR MODAL CARGO */
    window.fecharModalCargo=function(){
        const modal=document.getElementById("modalCargo");

        if(modal){
            modal.classList.remove("ativo");
        }
    };

    /* 34. CLICAR FORA DO MODAL CARGO */
    const modalCargo=document.getElementById("modalCargo");

    if(modalCargo){
        modalCargo.addEventListener("click",function(event){
            if(event.target===modalCargo){
                window.fecharModalCargo();
            }
        });
    }

    /* 35. ALTERAR CARGO */
    const formAlterarCargo=document.getElementById("formAlterarCargo");

    if(formAlterarCargo){
        formAlterarCargo.addEventListener("submit",async function(event){
            event.preventDefault();

            const idUsuario=document.getElementById("idUsuarioCargo").value;
            const novoCargo=document.getElementById("novoCargo").value;

            if(!novoCargo){
                alert("Selecione um cargo.");
                return;
            }

            try{
                const resposta=await fetch(
                    "/alterar-cargo",
                    {
                        method:"POST",
                        headers:{
                            "Content-Type":"application/json"
                        },
                        body:JSON.stringify({
                            id_usuario:idUsuario,
                            cargo:novoCargo
                        })
                    }
                );

                if(!resposta.ok){
                    throw new Error(
                        "Erro HTTP "+resposta.status
                    );
                }

                const dados=await resposta.json();

                if(dados.status==="sucesso"){
                    alert(dados.mensagem);
                    window.fecharModalCargo();
                    window.location.reload();
                }else{
                    alert(
                        dados.mensagem||
                        "Não foi possível alterar o cargo."
                    );
                }
            }catch(erro){
                console.error("Erro ao alterar cargo:",erro);
                alert("Erro ao alterar o cargo.");
            }
        });
    }

    /* 36. INICIALIZAÇÃO DO DASHBOARD */
    carregarDashboardDocumentos();
});
