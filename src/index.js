const { response } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

/**
 * A middleware for verifying the if CPF exists
 * 
 * 
 * @param {*} request 
 * @param {*} response 
 * @param {*} next 
 * @returns 404 http code error if cpf doesn't exists 
 * @returns next() function if cpf exists
 */
function verifyCPFExistence(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer)
    return response.status(404).json({ error: "Customer not found" });

  request.customer = customer;
  
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

/**
 * cpf - string
 * name -string
 * id - uuid
 * statement - array
 */
app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const cpfAlreadyInUse = customers.some(
    (customer) => customer.cpf === cpf
  )

  if (cpfAlreadyInUse)
    return response.status(409).send({ error: "Customer already exists(cpf already in use)" })

  const id = uuidv4();

  customers.push({
    cpf,
    name,
    id,
    statement: []
  });

  return response.status(201).send();
})

app.get("/statement", verifyCPFExistence, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
})

app.post("/deposit",  verifyCPFExistence, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = { 
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();
})

app.post("/withdraw", verifyCPFExistence, (request, response) => {
  const { amount, description } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount )
    return response.status(400).send({error: "Insufficient funds!"});

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();
})

app.get("/statement/date", verifyCPFExistence, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(statement => 
    statement.created_at.toDateString() === new Date(dateFormat).toDateString());

  return response.json(statement);
})


app.put("/account", verifyCPFExistence, (request, response) => {
  const { name } = request.body
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
})

app.listen(3333);