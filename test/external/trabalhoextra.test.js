const request = require('supertest')
const { expect } = require('chai')

let token
const link = 'http://localhost:4000/graphql'

const origem = {
  username: "julio",
  password: "123456"
}

const destino = {
  from: "julio",
  to: "priscila",
  value: 100
}

// Login antes dos testes
before(async () => {
  const respostaLogin = await request(link)
    .post('')
    .send({
      query: `
        mutation LoginUser($username: String!, $password: String!) {
          loginUser(username: $username, password: $password) {
            token
          }
        }
      `,
      variables: origem
    })

  token = respostaLogin.body.data.loginUser.token
})

// Cenário 1: Sucesso na transferência
it('Informar todos os dados para que a tranferência seja com sucesso', async () => {
  const resposta = await request(link)
    .post('')
    .set('Authorization', `Bearer ${token}`)
    .send({
      query: `
        mutation criando_transferencia($from: String!, $to: String!, $value: Float!) {
          createTransfer(from: $from, to: $to, value: $value) {
            from
            to
            value
            date
          }
        }
      `,
      variables: destino
    })

  expect(resposta.status).to.equal(200)

  // Remove o campo "date" antes de comparar
  const { date, ...transferSemDate } = resposta.body.data.createTransfer
  expect(transferSemDate).to.deep.equal(destino)
})

// Cenário 2: Saldo insuficiente
it('Saldo a ser transferido é maior que saldo na conta', async () => {
  const destinoInvalido = { ...destino, value: 50000 }

  const resposta = await request(link)
    .post('')
    .set('Authorization', `Bearer ${token}`)
    .send({
      query: `
        mutation criando_transferencia($from: String!, $to: String!, $value: Float!) {
          createTransfer(from: $from, to: $to, value: $value) {
            from
            to
            value
            date
          }
        }
      `,
      variables: destinoInvalido
    })

  expect(resposta.status).to.equal(200)
  expect(resposta.body).to.have.nested.property('errors[0].message', 'Saldo insuficiente')
})

// Cenário 3: Sem autenticação
it('Erro ao tentar fazer transferência sem o token', async () => {
  const resposta = await request(link)
    .post('')
    .send({
      query: `
        mutation criando_transferencia($from: String!, $to: String!, $value: Float!) {
          createTransfer(from: $from, to: $to, value: $value) {
            from
            to
            value
            date
          }
        }
      `,
      variables: destino
    })

  expect(resposta.status).to.equal(200)
  expect(resposta.body).to.have.nested.property('errors[0].message', 'Autenticação obrigatória')
})
