const { response } = require('express');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: '123',
    database: 'app_farmacia',
    port: 5432
})

const getFarmacias = async (req, res) => {
    var cidade = req.body.cidade
    var estado = req.body.estado

    const response = await pool.query('SELECT * FROM farmacia where cidade = $1 AND estado = $2 ORDER BY id_farmacia', [cidade, estado]);
    if ((response.rowCount > 0)) {
        res.status(200).json(response.rows);
    } else {
        res.status(404).send();
    }
}

const getUserLogin = async (req, res) => {
    //Pega os parametros via HTTP
    var userEmail = req.headers.email
    var userPwd = req.headers.senha

    //Consulta na tabela de usuario senha e e-mail
    const response = await pool.query('SELECT id_usuario, nome FROM usuario WHERE email = $1 AND senha = $2', [userEmail, userPwd]);
    if (response.rowCount == 1) {
        res.status(200).json(response.rows);
    } else {
        res.status(404).send();
    }    
    
}
const getFarmaciaLogin = async (req, res) => {
    //Pega os parametros via HTTP
    var userEmail = req.headers.email
    var userPwd = req.headers.senha

    //Consulta na tabela de usuario senha e e-mail
    const response = await pool.query('SELECT id_farmacia, nome_fantasia FROM farmacia WHERE email = $1 AND senha = $2', [userEmail, userPwd]);
    if (response.rowCount == 1) {
        res.status(200).json(response.rows);
    } else {
        res.status(404).send();
    }    
    
}
const getListaProdutos = async (req, res) => {
    var id_farmacia = req.body.id_farmacia
    const response = await pool.query('SELECT f.id_farmacia,p.id_produto,p.nome,p.descricao,p.preco_unid,p.imagem FROM produto p INNER JOIN farmacia f ON p.id_farmacia = f.id_farmacia WHERE p.id_farmacia = $1 AND p.disponivel = true', [id_farmacia]);
    if (response.rowCount > 0) {
        res.status(200).json(response.rows);
    } else {
        res.status(404).send();
    } 
}

const getFarmaceutico = async (req, res) => {
    var id_farmacia = req.body.id_farmacia
    const response = await pool.query('SELECT * FROM farmaceutico WHERE id_farmacia = $1',[id_farmacia]);
    if (response.rowCount > 0) {
        res.status(200).json(response.rows);
    } else {
        res.status(404).send();
    } 
}

const getPedidoSequencia = async (req, res) => {
    const response = await pool.query('SELECT nextval(\'seqIdOrdemPedido\') as valor');
    if (response.rowCount > 0) {
        res.status(200).json(response.rows);
    } else {
        res.status(404).send();
    } 
}

const postPedidoOrdem = async (req, res) => {
    var id_ordempedido = req.body.id_ordempedido  
    var totalpedido = req.body.totalpedido
    var enderecoentrega = req.body.enderecoentrega
    var frete = req.body.frete
    var id_usuario = req.body.id_usuario
    var id_farmacia = req.body.id_farmacia
    var dataentrega = req.body.dataentrega
    var troco = req.body.troco
    var metodopagamento = req.body.metodopagamento
    const response = await pool.query('INSERT INTO pedido_ordem(id_ordempedido, totalpedido, enderecoentrega, frete, id_usuario, id_farmacia, dataentrega, datapedido, troco, metodopagamento, status) VALUES($1,$2,$3,$4,$5,$6,$7,now(),$8,$9,\'Recebido\')', [id_ordempedido, totalpedido, enderecoentrega, frete, id_usuario, id_farmacia, dataentrega, troco, metodopagamento]);

    res.status(200).send(response);
    
}

const postPedidoProduto = async (req, res) => {
    var id_ordempedido = req.body.id_ordempedido
    var id_produto = req.body.id_produto
    var nome_produto = req.body.nome_produto
    var quantidade = req.body.quantidade
    var total = req.body.total
    const response = await pool.query('INSERT INTO pedido_produto(id_ordempedido,id_produto,nome_produto,quantidade,total) VALUES($1,$2,$3,$4,$5)', [id_ordempedido,id_produto,nome_produto,quantidade,total])

    res.status(200).send(response);
}

const getListaOrdemPedidosUsuario = async(req, res) => {
    var idUser = req.body.iduser
    const response = await pool.query('SELECT p.*, f.nome_fantasia, f.foto FROM pedido_ordem p INNER JOIN farmacia f ON p.id_farmacia = f.id_farmacia WHERE p.id_usuario = $1 ORDER BY p.dataentrega DESC', [idUser])
    if(response.rowCount > 0) 
        res.status(200).send(response.rows)
    else
        res.status(404).send()
}

const getListaOrdemProdutoUsuario = async(req, res) => {
    var idOrdem = req.body.idOrdemPedido
    const response = await pool.query('SELECT * FROM pedido_produto WHERE id_ordempedido = $1', [idOrdem])
    if(response.rowCount > 0) 
        res.status(200).send(response.rows)
    else
        res.status(404).send()
}

const confirmaEntrega = async(req, res) => {
    var idOrdem = req.body.idOrdemPedido
    try {
        const response = await pool.query('UPDATE pedido_ordem SET dataentrega = now(), status = \'Entregue\' WHERE id_ordempedido = $1', [idOrdem])
        res.status(200).send(response);
    } catch {
        res.status(500).send();
    }
}

const pedidoDisponivel = async(req, res) => {
    var idFarmacia = req.body.idFarmacia
    const response = await pool.query('SELECT p.*, u.nome, u.celular from pedido_ordem p INNER JOIN usuario u ON p.id_usuario = u.id_usuario WHERE id_farmacia = $1 AND status <> \'Entregue\' AND status <> \'Cancelado\'', [idFarmacia])
    if(response.rowCount > 0) 
        res.status(200).send(response.rows)
    else
        res.status(404).send()
}

const alterarStatus = async(req, res) => {
    var idOrdem = req.body.idOrdemPedido
    var status = req.body.status
    const response = await pool.query('UPDATE pedido_ordem SET status = $1 WHERE id_ordempedido = $2', [status,idOrdem])
    res.status(200).send(response);
}

const cancelarMotivo = async(req, res) => {
    var idOrdem = req.body.idOrdemPedido
    var motivo = req.body.motivo
    try {
        const response = await pool.query('UPDATE pedido_ordem SET motivo = $1 WHERE id_ordempedido = $2', [motivo,idOrdem])
        res.status(200).send(response);
    } catch {
        res.status(500).send();
    }
}

const alterarProduto = async(req, res) => {
    var idProduto = req.body.id_produto
    var nome = req.body.nome
    var descricao = req.body.descricao
    var preco = req.body.preco_unid
    var imagem = req.body.imagem
    try {
        const response = await pool.query('UPDATE produto SET nome = $1, descricao = $2, preco_unid = $3, imagem = $4 WHERE id_produto = $5', [nome, descricao, preco, imagem, idProduto])
        res.status(200).send(response);
    } catch {
        res.status(500).send();
    }
}

const excluirProduto = async(req, res) => {
    var idProduto = req.body.id_produto
    try {
        const response = await pool.query('UPDATE produto SET disponivel = false WHERE id_produto = $1', [idProduto])
        res.status(200).send(response);
    } catch {
        res.status(500).send();
    }
}

const cadastrarProduto = async(req, res) => {
    var nome = req.body.nome
    var descricao = req.body.descricao
    var preco = req.body.preco_unid
    var imagem = req.body.imagem
    var idFarmacia = req.body.id_farmacia
    try {
        const response = await pool.query('INSERT INTO produto(nome,id_farmacia,descricao,imagem,preco_unid,disponivel) VALUES($1,$2,$3,$4,$5,true)', [nome, idFarmacia, descricao, imagem, preco])
        res.status(200).send(response);
    } catch {
        res.status(500).send();
    }
}

const getPedidoOrdem = async(req, res) => {
    var idFarmacia = req.body.idFarmacia
    const response = await pool.query('SELECT p.*, u.nome, u.celular from pedido_ordem p INNER JOIN usuario u ON p.id_usuario = u.id_usuario WHERE p.id_farmacia = $1', [idFarmacia])
    if(response.rowCount > 0) 
        res.status(200).send(response.rows)
    else
        res.status(404).send()
}

const cadastrarUsuario = async(req, res) => {
    var nome = req.body.nome
    var email = req.body.email
    var senha = req.body.senha
    var cpf = req.body.cpf
    var nascimento = req.body.nascimento
    var celular = req.body.celular
    try
    {
        const reponse = await pool.query('INSERT INTO usuario(nome,email,senha,cpf,nascimento,celular) VALUES($1,$2,md5($3),$4,$5,$6)', [nome,email,senha,cpf,nascimento,celular])
        res.status(200).send()
    }
    catch {
        res.status(406).send()
    }
}

const getUser = async(req, res) => {
    var idUser = req.body.id_usuario
    const response = await pool.query('SELECT nome,email,cpf,nascimento,celular FROM usuario WHERE id_usuario = $1', [idUser])
    if(response.rowCount > 0)
        res.status(200).send(response.rows);
    else
        res.status(404).send();
}

const atualizarUser = async(req, res) => {
    var idUser = req.body.id_usuario
    var nome = req.body.nome
    var cpf = req.body.cpf
    var celular = req.body.celular
    try {
        const reponse = await pool.query('UPDATE usuario SET nome = $1, cpf = $2, celular = $3 WHERE id_usuario = $4', [nome,cpf,celular,idUser])
        res.status(200).send()
    } catch {
        res.status(500).send()
    }
}

const cadastrarFarmacia = async(req, res) => {
    var nome = req.body.nome_fantasia
    var cnpj = req.body.cnpj
    var email = req.body.email
    var senha = req.body.senha
    var telefone = req.body.telefone
    var endereco = req.body.endereco
    var numero = req.body.numero
    var bairro = req.body.bairro
    var cidade = req.body.cidade
    var estado = req.body.estado
    var lat = req.body.lat
    var long = req.body.long
    var foto = req.body.foto
    var tempo = req.body.tempo
    var frete = req.body.frete
    try {
        const reponse = await pool.query('INSERT INTO farmacia(nome_fantasia,cnpj,telefone,email,senha,endereco,numero,data_cad,cidade,estado,bairro,foto,lat,long,aberto,tempo,frete) VALUES($1,$2,$3,$4,md5($5),$6,$7,now(),$8,$9,$10,$11,$12,$13,false,$14,$15)', [nome,cnpj,telefone,email,senha,endereco,numero,cidade,estado,bairro,foto,lat,long,tempo,frete])
        res.status(200).send()
    } catch {
        res.status(500).send()
    }
}

const getFarmacia = async(req, res) => {
    var idFarmacia = req.body.id_farmacia
    const response = await pool.query('SELECT nome_fantasia,cnpj,telefone,email,endereco,numero,bairro,foto,lat,long,aberto,tempo,frete FROM farmacia WHERE id_farmacia = $1', [idFarmacia])
    if(response.rowCount > 0) {
        res.status(200).send(response.rows)
    }  else {
        res.status(404).send()
    }
}

const atualizarFarmacia = async(req, res) => {
    var idFarmacia = req.body.id_farmacia
    var nome = req.body.nome_fantasia
    var telefone = req.body.telefone
    var frete = req.body.frete
    var tempo = req.body.tempo
    var foto = req.body.foto
    try {
        const response = await pool.query('UPDATE farmacia SET nome_fantasia = $1, telefone = $2, frete = $3, tempo = $4, foto = $5 WHERE id_farmacia = $6', [nome, telefone, frete, tempo, foto, idFarmacia])
        res.status(200).send()
    } catch {
        res.status(404).send()
    }
}

const atualizarFarmaceutico = async(req, res) => {
    var idFarmaceutico = req.body.id_farmaceutico
    var nome = req.body.nome
    var crf = req.body.crf
    var telefone = req.body.telefone
    var genero = req.body.genero
    try {
        const response = await pool.query('UPDATE farmaceutico SET nome = $1, telefone = $2, crf = $3, genero = $4 WHERE id_farmaceutico = $5', [nome, telefone, crf, genero, idFarmaceutico])
        res.status(200).send()
    } catch {
        res.status(404).send()
    }
}

const cadastrarFarmaceutico = async(req, res) => {
    var idFarmacia = req.body.id_farmacia
    var nome = req.body.nome
    var crf = req.body.crf
    var telefone = req.body.telefone
    var genero = req.body.genero
    try {
        const response = await pool.query('INSERT INTO farmaceutico(id_farmacia,nome,crf,telefone,genero) VALUES($1,$2,$3,$4,$5)', [idFarmacia,nome,crf,telefone,genero])
        res.status(200).send()
    } catch {
        res.status(404).send()
    }
}

const excluirFarmaceutico = async(req, res) => {
    var idFarmaceutico = req.body.id_farmaceutico
    try {
        const response = await pool.query('DELETE FROM farmaceutico WHERE id_farmaceutico = $1', [idFarmaceutico])
        res.status(200).send()
    } catch {
        res.status(404).send()
    }
}

const statusFarmacia = async(req, res) => {
    var idFarmacia = req.body.id_farmacia
    var status = req.body.status
    try {
        const response = await pool.query('UPDATE farmacia SET aberto = $1 WHERE id_farmacia = $2', [status, idFarmacia])
        res.status(200).send()
    } catch {
        res.status(404).send()
    }
}

module.exports = {
    getFarmacias,
    getUserLogin,
    getListaProdutos,
    getFarmaceutico,
    getFarmaciaLogin,
    getPedidoSequencia,
    postPedidoOrdem,
    postPedidoProduto,
    getListaOrdemPedidosUsuario,
    getListaOrdemProdutoUsuario,
    confirmaEntrega,
    pedidoDisponivel,
    alterarStatus,
    cancelarMotivo,
    alterarProduto,
    excluirProduto,
    cadastrarProduto,
    getPedidoOrdem,
    cadastrarUsuario,
    getUser,
    atualizarUser,
    cadastrarFarmacia,
    getFarmacia,
    atualizarFarmacia,
    atualizarFarmaceutico,
    cadastrarFarmaceutico,
    excluirFarmaceutico,
    statusFarmacia
}