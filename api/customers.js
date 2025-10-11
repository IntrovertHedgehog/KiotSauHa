const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");
const async = require("async");
const { getConfigHome } = require("platform-folders");
const { join } = require("upath");
const { verify_token } = require("../server_util");

const dataHome = getConfigHome();
app.use(bodyParser.json());

module.exports = app;

let customerDB = new Datastore({
  filename: join(dataHome, "/POS/server/databases/customers.db"),
  autoload: true,
});

customerDB.ensureIndex({ fieldName: "_id", unique: true });

app.get("/", function(req, res) {
  res.send("Customer API");
});

app.get("/customer/:customerId", function(req, res) {
  verify_token(req, res);
  if (!req.params.customerId) {
    res.status(500).send("ID field is required.");
  } else {
    customerDB.findOne(
      {
        _id: req.params.customerId,
      },
      function(err, customer) {
        res.send(customer);
      },
    );
  }
});

app.get("/all", function(req, res) {
  verify_token(req, res);
  customerDB.find({}, function(err, docs) {
    res.send(docs);
  });
});

app.post("/customer", function(req, res) {
  verify_token(req, res);
  var newCustomer = req.body;
  customerDB.insert(newCustomer, function(err, customer) {
    if (err) res.status(500).send(err);
    else res.sendStatus(200);
  });
});

app.delete("/customer/:customerId", function(req, res) {
  verify_token(req, res);
  customerDB.remove(
    {
      _id: req.params.customerId,
    },
    function(err, numRemoved) {
      if (err) res.status(500).send(err);
      else res.sendStatus(200);
    },
  );
});

app.put("/customer", function(req, res) {
  verify_token(req, res);
  let customerId = req.body._id;

  customerDB.update(
    {
      _id: customerId,
    },
    req.body,
    {},
    function(err, numReplaced, customer) {
      if (err) res.status(500).send(err);
      else res.sendStatus(200);
    },
  );
});
