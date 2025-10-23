const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");
const async = require("async");
const fileUpload = require("express-fileupload");
const multer = require("multer");
const fs = require("fs");
const { getConfigHome } = require("platform-folders");
const { join } = require("upath");
const { verify_token } = require("../server_util");
const moment = require("moment");

const dataHome = getConfigHome();

const storage = multer.diskStorage({
  destination: join(dataHome, "/KiotSauHa/uploads"),
  filename: function(req, file, callback) {
    callback(null, Date.now() + ".jpg"); //
  },
});

let upload = multer({ storage: storage });

app.use(bodyParser.json());

module.exports = app;

let inventoryDB = new Datastore({
  filename: join(dataHome, "/KiotSauHa/server/databases/inventory.db"),
  autoload: true,
});

inventoryDB.ensureIndex({ fieldName: "_id", unique: true });

app.get("/", function(req, res) {
  res.send("Inventory API");
});

app.get("/product/:productId", function(req, res) {
  verify_token(req, res);
  if (!req.params.productId) {
    res.status(500).send("ID field is required.");
  } else {
    inventoryDB.findOne(
      {
        _id: parseInt(req.params.productId),
      },
      function(err, product) {
        res.send(product);
      },
    );
  }
});

app.get("/products", function(req, res) {
  verify_token(req, res);
  inventoryDB.find({}, function(err, docs) {
    res.send(docs);
  });
});

app.post("/product", upload.single("imagename"), function(req, res) {
  verify_token(req, res);

  let image = "";

  if (req.body.img != "") {
    image = req.body.img;
  }

  if (req.file) {
    image = req.file.filename;
  }

  if (req.body.remove == 1) {
    const path = "./resources/app/public/uploads/product_image/" + req.body.img;
    try {
      fs.unlinkSync(path);
    } catch (err) {
      console.error(err);
    }

    if (!req.file) {
      image = "";
    }
  }

  let bestBefore = new Map();

  if (req.body.hasBestBefore) {
    for (let i = 0; i < req.body.bestBefore.length; ++i) {
      if (req.body.bestBeforeQuant[i] >= 0) {
        const key = moment(req.body.bestBefore[i], "DD/MM/YYYY").toJSON();
        if (!bestBefore.has(key)) bestBefore.set(key, 0);
        bestBefore.set(
          key,
          bestBefore.get(key) + parseInt(req.body.bestBeforeQuant[i]),
        );
      }
    }
  }

  let bestBeforeDates = []
  let bestBeforeQuant = []

  for (let [k, v] of bestBefore) {
    bestBeforeDates.push(k)
    bestBeforeQuant.push(v)
  }

  let Product = {
    _id: parseInt(req.body.id),
    price: parseInt(req.body.price),
    category: req.body.category,
    quantity: req.body.quantity == "" ? 0 : parseInt(req.body.quantity),
    name: req.body.name,
    skuCode: req.body.skuCode.trim(),
    stock: req.body.stock == "on" ? 0 : 1,
    hasBestBefore: req.body.hasBestBefore == "on" ? 1 : 0,
    bestBefore: bestBeforeDates,
    bestBeforeQuant: bestBeforeQuant,
    hasQuantityDiscount: req.body.hasQuantityDiscount == "on" ? 1 : 0,
    quantityDiscountQuant: parseInt(req.body.quantityDiscountQuant),
    quantityDiscountAmt: parseInt(req.body.quantityDiscountAmt),
    img: image,
  };

  // fake
  // for (let i = 0; i < 100; ++i) {
  //   let p = JSON.parse(JSON.stringify(Product))
  //   p._id = Math.floor(Math.random() * 1000000000);
  //   inventoryDB.insert(p, function(err, product) {
  //     console.error(err)
  //   });
  // }

  if (req.body.id == "") {
    Product._id = Math.floor(Date.now() / 1000);
    inventoryDB.insert(Product, function(err, product) {
      if (err) res.status(500).send(err);
      else res.send(product);
    });
  } else {
    inventoryDB.update(
      {
        _id: parseInt(req.body.id),
      },
      Product,
      {},
      function(err, numReplaced, product) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
      },
    );
  }
});

app.delete("/product/:productId", function(req, res) {
  verify_token(req, res);
  inventoryDB.remove(
    {
      _id: parseInt(req.params.productId),
    },
    function(err, numRemoved) {
      if (err) res.status(500).send(err);
      else res.sendStatus(200);
    },
  );
});

app.post("/product/sku", function(req, res) {
  verify_token(req, res);
  var request = req.body;
  inventoryDB.find(
    {
      skuCode: request.skuCode.trim(),
    },
    function(err, product) {
      res.send(product);
    },
  );
});

app.decrementInventory = function(products) {
  async.eachSeries(products, function(transactionProduct, callback) {
    inventoryDB.findOne(
      {
        _id: parseInt(transactionProduct.id),
      },
      function(err, product) {
        if (!product || !product.quantity) {
          callback();
        } else {
          let updatedQuantity =
            parseInt(product.quantity) - parseInt(transactionProduct.quantity);

          inventoryDB.update(
            {
              _id: parseInt(product._id),
            },
            {
              $set: {
                quantity: updatedQuantity,
              },
            },
            {},
            callback,
          );
        }
      },
    );
  });
};
