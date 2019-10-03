const express = require("express");
const FredRouter = express.Router();

var response = {
  version: "1.0",
  response: {
    outputSpeech: {
      type: "PlainText",
      text: "Let's rock!",
      playBehavior: "REPLACE_ENQUEUED"
    },
    shouldEndSession: true
  }
};

FredRouter.route("/activate").post(function(req, res) {
  const songDefinition = req.body;
  console.log(req.body);
  console.log(JSON.stringify(req.body.request));
  res.json(JSON.stringify(response));
});

module.exports = FredRouter;
