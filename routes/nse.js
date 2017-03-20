var express = require('express');
var router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const urlParams = {
  types : {
    eq  : "eqbhav",
    fo  : "fobhav",
    ind : "indclose"
  },
  sections : {
    eq  : "EQ",
    fo  : "FO",
    ind : "IND"
  }

}

var nseAxios = axios.create({
  baseURL: 'https://www.nseindia.com',
  timeout: 1000,
  headers: {'X-Custom-Header': 'foobar'}
});
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Equity reports
router.get('/:section/:date', function(req, res, next) {
  var section = req.params.section;
  var date = req.params.date;
  var url =  `/ArchieveSearch?h_filetype=${urlParams.types[section]}&date=${date}&section=${urlParams.sections[section]}`;

  nseAxios.get(url)
    .then(function (response) {
      var htmlData = response.data;
      $ = cheerio.load(htmlData);
      var downloadRelativeLink = $('a').attr('href');
      var absoluteLink = `https://www.nseindia.com${downloadRelativeLink}`;
      res.send(absoluteLink);
    })
    .catch(function (error) {
      console.error("ERROR@nse.js:router.get(/:section/:date) - "+error);
    });
});

module.exports = router;
