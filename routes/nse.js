var express = require('express');
var router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const https = require('https');
const unzip = require('unzip');
const paths = require('../config/paths.js');
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
  baseURL: 'https://www.nseindia.com'
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  axios.get('http://localhost:3000/nse/eq/20-03-2017')
    .then(function (resp) {
      // console.log(resp.data);
      var options = {
        hostname: 'www.nseindia.com',
        path: '/content/historical/EQUITIES/2017/MAR/cm20MAR2017bhav.csv.zip',
        method: 'GET',
        headers: {
          "cache-control": "no-cache",
          "Connection": "keep-alive",
          "accept": '*/*',
          // "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
          "Accept-Encoding": "gzip, deflate, sdch, br"

        }
      };
    // var syncFlush = constants.Z_SYNC_FLUSH;
    var requestSent =   https.request(options,function (data) {

      var contentType = data.headers['content-type'];
      // console.log(contentType);
      if(data.headers['content-type'].includes('zip')){
        // console.log("unzipping; i'm tripping");
        data.pipe(unzip.Parse())
          .on('entry', function (entry) {
            var fileName = entry.path;
            var type = entry.type; // 'Directory' or 'File'
            var size = entry.size;
            entry.pipe(fs.createWriteStream(entry.path));
          });
          // data.pipe(fs.createWriteStream('file.zip'));
        }
      });
      requestSent.end();
    })
    .catch(function (err) {
      console.error(err);
    })
    res.send("done");
});

// Equity reports
router.get('/:section/:date', function(req, res, next) {
  var section = req.params.section;
  var date = req.params.date;
  var path = paths.nse[section];
  var url =  `/ArchieveSearch?h_filetype=${urlParams.types[section]}&date=${date}&section=${urlParams.sections[section]}`;



  nseAxios.get(url)
    .then(function (response) {
      var htmlData = response.data;
      $ = cheerio.load(htmlData);
      var downloadRelativeLink = $('a').attr('href');
      var fileName = $('a').text();
      // var absoluteLink = `https://www.nseindia.com${downloadRelativeLink}`;
      // res.send(absoluteLink);
      var options = {
        hostname: 'www.nseindia.com',
        path: downloadRelativeLink,
        method: 'GET',
        headers: {
          "cache-control": "no-cache",
          "Connection": "keep-alive",
          "accept": '*/*',
          // "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
          "Accept-Encoding": "gzip, deflate, sdch, br"

        }
      };

      var requestSent =   https.request(options,function (data) {

        if (!fs.existsSync(path)){
          fs.mkdirSync(path);
        }

        if(data.headers['content-type'].includes('zip')){
          // console.log("unzipping; i'm tripping");
          data.pipe(unzip.Parse())
            .on('entry', function (entry) {
              var fileName = entry.path;
              var type = entry.type; // 'Directory' or 'File'
              var size = entry.size;
              entry.pipe(fs.createWriteStream(path+entry.path));
            });
          }else{
            data.pipe(fs.createWriteStream(path+fileName));
          }
        });
        // data.pipe(fs.createWriteStream(fileName));
      // })
      requestSent.end();

    })
    .catch(function (error) {
      console.error("ERROR@nse.js:router.get(/:section/:date) - "+error);
    });
    res.send("File Downloaded");
});

module.exports = router;
