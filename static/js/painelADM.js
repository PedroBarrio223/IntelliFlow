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