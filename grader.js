#!/usr/bin/env node

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var cheerioHtmlFile = function(htmlfile, url) {
    return cheerio.load(fs.readFileSync(htmlfile));
};


var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {

    console.log('Inside checkHtmlFile');

    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }

    var checkJson = out;
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
    return out;
};

var checkUrl = function(url, checksfile) {
    rest.get(url).on('complete', function(result) {
        if (result instanceof Error) {
            console.log('Error: ' + result.message);
            this.retry(5000);
        } else {
            $ = cheerio.load(result);
            var checks = loadChecks(checksfile).sort();
            var out = {};
            for(var ii in checks) {
                var present = $(checks[ii]).length > 0;
                out[checks[ii]] = present;
            }
            var checkJson = out;
            var outJson = JSON.stringify(checkJson, null, 4);
            console.log(outJson);
            return out;
        }
    });

};


if(require.main == module) {

    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <URL>', 'Url of the page to check')
        .parse(process.argv);

    var checkJson = {}
    if (null == program.url) {
        checkJson = checkHtmlFile(program.file, program.checks);
    }
    else {
        checkJson = checkUrl(program.url, program.checks);
    }
    /*
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
    */

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
