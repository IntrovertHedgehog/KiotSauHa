const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");
const btoa = require("btoa");
app.use(bodyParser.json());
const { getConfigHome } = require("platform-folders");
const { join } = require("upath");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { times } = require("async");

const dataHome = getConfigHome();
module.exports = app;

let usersDB = new Datastore({
  filename: join(dataHome, "/POS/server/databases/users.db"),
  autoload: true,
});

usersDB.ensureIndex({ fieldName: "_id", unique: true });

app.get("/", function(req, res) {
  res.send("Users API");
});

app.get("/user/:userId", function(req, res) {
  if (!req.params.userId) {
    res.status(500).send("ID field is required.");
  } else {
    usersDB.findOne(
      {
        _id: parseInt(req.params.userId),
      },
      function(err, docs) {
        res.send(docs);
      },
    );
  }
});

app.get("/logout/:userId", function(req, res) {
  if (!req.params.userId) {
    res.status(500).send("ID field is required.");
  } else {
    usersDB.update(
      {
        _id: parseInt(req.params.userId),
      },
      {
        $set: {
          status: "Logged Out_" + new Date(),
        },
      },
      {},
    );

    res.sendStatus(200);
  }
});

app.post("/login", function(req, res) {
  if (
    !req.body.username ||
    !req.body.password ||
    typeof req.body.username != "string" ||
    typeof req.body.password != "string"
  ) {
    res.status(400).send("invalid username and password")
    return;
  }

  usersDB.findOne(
    {
      username: req.body.username,
    },
    function(err, docs) {
      if (docs) {
        bcrypt.compare(req.body.password, docs.password, (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).send("Lỗi máy chủ, lên hệ Minh để giải quyết");
            return;
          }

          if (result) {
            const hour = 60 * 60; // in ms
            const exp = hour * (Math.floor(Date.now() / (1000 * 24 * hour)) * 24 + 20 + 30 * 24); // to 3am VNT in 30 days
            const token = jwt.sign(
              { exp, user_id: docs._id, username: docs.username },
              process.env.SECRET_TOKEN,
            );

            usersDB.update(
              {
                _id: docs._id,
              },
              {
                $set: {
                  status: "Logged In_" + new Date(),
                },
              },
              {},
            );
            delete docs.password;
            docs.token = token;
            res.send(docs);
          } else {
            res.status(401).send("Sai mật khẩu");
          }
        });
      } else {
        res.status(404).send("Sai tên đăng nhập");
      }
    },
  );
});

app.get("/all", function(req, res) {
  usersDB.find({}, function(err, docs) {
    res.send(docs);
  });
});

app.delete("/user/:userId", function(req, res) {
  usersDB.remove(
    {
      _id: parseInt(req.params.userId),
    },
    function(err, numRemoved) {
      if (err) res.status(500).send(err);
      else res.sendStatus(200);
    },
  );
});

app.post("/post", function(req, res) {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      console.error(err);
      res.status(500).send("Lỗi máy chủ, lên hệ Minh để giải quyết");
      return;
    }
    bcrypt.hash(req.body.password, salt, (err, hashedPassword) => {
      if (err) {
        console.error(err);
        res.status(500).send("Lỗi máy chủ, lên hệ Minh để giải quyết");
        return;
      }

      let User = {
        username: req.body.username,
        password: hashedPassword,
        fullname: req.body.fullname,
        perm_products: req.body.perm_products == "on" ? 1 : 0,
        perm_categories: req.body.perm_categories == "on" ? 1 : 0,
        perm_transactions: req.body.perm_transactions == "on" ? 1 : 0,
        perm_users: req.body.perm_users == "on" ? 1 : 0,
        perm_settings: req.body.perm_settings == "on" ? 1 : 0,
        status: "",
      };

      if (req.body.id == "") {
        User._id = Math.floor(Date.now() / 1000);
        usersDB.insert(User, function(err, user) {
          if (err) res.status(500).send(req);
          else res.send(user);
        });
      } else {
        usersDB.update(
          {
            _id: parseInt(req.body.id),
          },
          {
            $set: User,
          },
          {},
          function(err, numReplaced, user) {
            if (err) res.status(500).send(err);
            else res.sendStatus(200);
          },
        );
      }
    });
  });
});

app.get("/check", function(req, res) {
  usersDB.findOne(
    {
      _id: 1,
    },
    function(err, docs) {
      if (!docs) {
        let User = {
          _id: 1,
          username: "admin",
          password:
            "$2b$10$fSkagYu7MM77enA7RBvjUuUkAEuIZpLTFVlSEzO2f1QA1H2DEPyCm",
          fullname: "Quản trị viên",
          perm_products: 1,
          perm_categories: 1,
          perm_transactions: 1,
          perm_users: 1,
          perm_settings: 1,
          status: "",
        };
        usersDB.insert(User, function(err, user) { });
      }
    },
  );
});

app.get("/verify-token", function(req, res) {
  const token = req.header("authorization");
  if (!token) {
    res.status(401).send("please log in");
  } else {
    try {
      jwt.verify(token, process.env.SECRET_TOKEN);
      res.send("Đăng nhập thành công")
    } catch (err) {
      console.error(err)
      res.status(401).send("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại")
    }
  }
});
