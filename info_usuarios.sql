SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Cria o banco de dados (caso ele não exista) e o seleciona para uso
CREATE DATABASE IF NOT EXISTS `info.usuarios` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `info.usuarios`;

-- Criação da tabela chavesapi
CREATE TABLE `chavesapi` (
  `id` int(11) NOT NULL,
  `chave` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Criação da tabela clientes
CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL,
  `nome_cliente` varchar(255) DEFAULT NULL,
  `rg_cliente` varchar(50) DEFAULT 'Não informado',
  `cnh_cliente` varchar(30) DEFAULT 'Não informado',
  `cin_cliente` varchar(50) DEFAULT 'Não informado',
  `cnpj_cliente` varchar(50) DEFAULT 'Não informado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Criação da tabela documentos
CREATE TABLE `documentos` (
  `id` int(11) NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `caminho` text DEFAULT NULL,
  `titular` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Criação da tabela usuarios
CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nome_usuario` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `senha` varchar(70) DEFAULT NULL,
  `cargo` varchar(75) DEFAULT 'leitor'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Inserção dos dados genéricos para a tabela chavesapi (evita bloqueio no Git)
INSERT INTO `chavesapi` (`id`, `chave`) VALUES
(1, 'SUA_CHAVE_API_AQUI_1'),
(2, 'SUA_CHAVE_API_AQUI_2');

-- Inserção dos dados iniciais de documentos
INSERT INTO `documentos` (`id`, `tipo`, `caminho`, `titular`) VALUES
(1, 'CPF', 'documentos_processados\\CPF\\CPF_20260921_145117_07f6b044.png', '25895868755');

-- Inserção dos dados iniciais de usuários
INSERT INTO `usuarios` (`id_usuario`, `nome_usuario`, `email`, `senha`, `cargo`) VALUES
(1, 'pietro', 'pietro@gmail.com', '123', 'leitor'),
(2, 'bebel', 'bebel@gmail.com', '123', 'editor'),
(3, 'melisaSA', 'melissa@gmail.com', '123', 'administrador');

-- Definição de chaves primárias
ALTER TABLE `chavesapi`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id_cliente`);

ALTER TABLE `documentos`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`);

-- Configuração de Auto Incremento
ALTER TABLE `chavesapi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `documentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

COMMIT;