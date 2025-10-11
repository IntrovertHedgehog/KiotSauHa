const jwt = require("jsonwebtoken")

module.exports.verify_token = function(req, res) {
  const token = req.header("authorization");
  if (!token) {
    res.status(401).send("please log in");
  } else {
    try {
      jwt.verify(token, process.env.SECRET_TOKEN);
      return true;
    } catch (err) {
      res.status(401).send("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại")
    }
  }
}
