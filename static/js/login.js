btnToggle.addEventListener("click", function() {
        if (inputSenha.type === "password") {
            inputSenha.type = "text";
            btnToggle.innerHTML = '<i class="ph ph-eye"></i>';
        } else {
            inputSenha.type = "password";
            btnToggle.innerHTML = '<i class="ph ph-eye-slash"></i>';
        }
    });