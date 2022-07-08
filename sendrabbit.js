const axios = require('axios');
var dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
var fs = require('fs');
dayjs.extend(utc)
var amqplib = require('amqplib');
const log4js = require("log4js");





function send(){

    log4js.configure({
        appenders: { cheese: { type: "file", filename: "./Logs/Main/main.log",maxLogSize: 10485760, backups: 3, compress: true } },
        categories: { default: { appenders: ["cheese"], level: "trace" } }
    });
    
    const logger = log4js.getLogger("cheese");
  
    
    var FuncStartingTime = dayjs().utc().format() 
    var FuncMustEndIn10Min =  dayjs().subtract(10, 'minute').utc().format() 


    var FuncStartingTimeString = dayjs(FuncStartingTime).format('YYYY-MM-DDTHH_mm_ss') 
    var FuncMustEndIn10MinString = dayjs(FuncMustEndIn10Min).format('YYYY-MM-DDTHH_mm_ss') 

        
    var date_now = new Date().getTime()
    var date_convert_now = new Date(date_now) 
    var datedfolder = ("0" + date_convert_now.getDate()).slice(-2) + '.' + ("0" + (date_convert_now.getMonth() + 1)).slice(-2) + '.' + date_convert_now.getFullYear();



    fs.readFile('./AA/' + datedfolder +'picture'+'.json', (err, data) => {
        if (err) throw logger.error(err);
        let allData = JSON.parse(data);

        allData.forEach(element => {

       
            const queueName = "task";
            const msg = JSON.stringify(element);

            const sendTask = async () => {
                const connection = await amqplib.connect('amqp://localhost');
                const channel = await connection.createChannel();
                await channel.assertQueue(queueName, {durable:true})
                channel.sendToQueue(queueName, Buffer.from(msg),{persistent:true})
                logger.trace("--------------------------------------------------");
                logger.trace('SendRabbit.js Task - Send - Time: ' + (new Date()));
                logger.trace('Sent: ', msg);
                logger.trace("--------------------------------------------------");
                
                console.log("--------------------------------------------------");
                console.log('SendRabbit.js Task - Send - Time: ' + (new Date()));
                console.log('Sent: ', msg);
                console.log("--------------------------------------------------");
        
                setTimeout(() => {
            
                    connection.close();
                }, 500);
            }

            sendTask();

        });
     
    })



}

    

module.exports = {
    send
}