const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

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

app.get("/statement/:cpf", (request, response) => {
  const { cpf } = request.params;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer)
    return response.status(404).json({ error: "Customer not found" });

  return response.json(customer.statement);
})

app.listen(3333);