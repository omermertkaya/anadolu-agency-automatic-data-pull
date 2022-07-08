const axios = require('axios');
var dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
var fs = require('fs');
dayjs.extend(utc)
var sendrabbit = require('./sendrabbit')
var cron = require('node-cron');
const log4js = require("log4js");
var aauser = require('./aauser.js')



cron.schedule('* * * * *', () => {
    
    log4js.configure({
        appenders: { cheese: { type: "file", filename: "./Logs/Main/main.log", maxLogSize: 10485760, backups: 3, compress: true } },
        categories: { default: { appenders: ["cheese"], level: "trace" } }
    });
    
    const logger = log4js.getLogger("cheese");
    var now =  dayjs().utc().format() 
    var twominago = dayjs().subtract(30, 'minute').subtract(2, 'second').utc().format() 
    var nowstring = dayjs(now).format('YYYY-MM-DDTHH_mm_ss') 
    var twominagostring = dayjs(twominago).format('YYYY-MM-DDTHH_mm_ss') 
    var date_now = new Date().getTime()  
    var date_convert_now = new Date(date_now)  
    var datedfolder = ("0" + date_convert_now.getDate()).slice(-2) + '.' + ("0" + (date_convert_now.getMonth() + 1)).slice(-2) + '.' + date_convert_now.getFullYear();
    const queryvalue = 'filter_category=2&start_date='+ twominago +'&end_date="NOW"'
    logger.trace(queryvalue);
    console.log(queryvalue)

    axios({
        method: "post",
        url: "https://api.aa.com.tr/abone/search/",
        auth: {
            username: aauser.aaUserName,
            password: aauser.aaPassword
        },
        data: queryvalue,
    })
    .then(function cagir(response) {

        try {        
            let data = JSON.stringify(response.data.data.result);
            fs.writeFileSync('./AA/' + datedfolder + 'picture' +'.json', data);
            fs.writeFileSync('./JSON/' + twominagostring + '__' + nowstring + 'picture' + '.json', data);
            sendrabbit.send()
            
        } catch (error) {
            logger.error(error);
            console.log(error)
        }




    })
    .catch(function (response) {
        logger.error(response);
        console.log(response)
    });

    
    logger.trace("--------------------------------------------------");
    logger.trace('Cron Task - READ - Time: ' + (new Date()));
    logger.trace("--------------------------------------------------");

    console.log("--------------------------------------------------");
    console.log('Cron Task - READ - Time: ' + (new Date()));
    console.log("--------------------------------------------------");
   



  
  });

