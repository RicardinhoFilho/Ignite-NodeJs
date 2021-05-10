const express = require("express");
const { v4: uuid } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

//Middleware
function verifyIfExistAccountCPF(request, response, next){

    const {cpf} = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);
    console.log(customer)
    if(!customer){
        return response.status(400).json({error: "Customer not found"})
    }

    request.customer = customer;
    return next();
}


function getBalance(statement){
 const balance =    statement.reduce((acc, operation)=>{
        if(operation.type == "credit"){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}
/**
 * cpf - string
 * name - string
 * id - uuid
 * statement - []
 */

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customersAlreadyExists = customers.some(
      (customer) => customer.cpf === cpf
  );
 
  if(customersAlreadyExists){
      return response.status(400).json({error : "Customer already exists!"})
  }

  const id = uuid();

  customers.push({
      cpf: cpf, name:name, id:id, statement:[],
  });

  return response.status(201).json(customers)
});

app.get("/statement/", verifyIfExistAccountCPF, (request, response)=>{
    return response.json(request.customer);
})

app.post("/deposit", verifyIfExistAccountCPF, (request,response)=>{
    
    const {description,amount} = request.body;
    const  {customer}  = request;
     const statementOperation = {
         description, amount, created_at: new Date(), type:"credit"
     };
     customer.statement.push(statementOperation);
     return response.status(201).json(statementOperation);
 })

 app.post("/withdraw", verifyIfExistAccountCPF, (request,response)=>{
     const {amount} = request.body;
     const {customer} = request;
     
     const balance = getBalance(customer.statement);

     console.log(balance)

     if(balance < amount){
         return response.status(400).json({error: "Insufficient funds!"});
     }

     const statementOperation = {
         amount, created_at: new Date(), type: "debit",
     };

     customer.statement.push(statementOperation);

     return response.status(201).json(customer);
 })


 app.get("/statement/date", verifyIfExistAccountCPF, (request,response)=>{

    const {customer} = request;
    const {date} = request.query;

    console.log(date)
    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

    response.json(statement);
 })

 app.get("/statement/balance", verifyIfExistAccountCPF, (request,response)=>{

    const {customer} = request;
    

   
    const balance = getBalance(customer.statement);
    console.log(balance)

    response.json({balance});
 })

 app.put("/account", verifyIfExistAccountCPF, (request,response)=>{
     const {name} = request.body;
     const {customer} = request;

     customer.name = name;

     return response.status(201).json(customer);
 })

 app.delete("/account", verifyIfExistAccountCPF, (request,response)=>{
    
    const {customer} = request;

    customers.splice(customer, 1);

    return response.status(204).json(customers);
})

app.listen(8000);
