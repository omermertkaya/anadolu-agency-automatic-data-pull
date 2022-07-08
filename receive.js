var amqplib = require('amqplib');
const axios = require('axios')
const fs = require('fs');
const log4js = require("log4js");
var aauser = require('./aauser.js')






const queueName = "task";

const consumeTask = async () =>{


    try {
        
    const connection = await amqplib.connect('amqp://localhost')
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName,{durable:true});
    channel.prefetch(1);
    console.log('Waiting for messages in queue' + queueName);
    channel.consume(queueName, msg => {
        console.log("[X] Received:", msg.content.toString());
        
        
        var firstGet = msg.content.toString()
        var element = JSON.parse(firstGet)
        

        
        if(element.type == "picture"){

            log4js.configure({
                appenders: { cheese: { type: "file", filename: "./Logs/Picture/Picture.log", maxLogSize: 10485760, backups: 3, compress: true } },
                categories: { default: { appenders: ["cheese"], level: "trace" } }
            });

            const pictureLogger = log4js.getLogger("cheese");
    
          
            var newsIsDownloaded = false
            var pictureIsDownloaded = false 
            var imagestryCounter = 0;
            var dir = element.group_id.replace(/:/g, '_');
            var downloadId = element.id
            var idsplit = downloadId.replace(/:/g, '_');
            var groupid = element.group_id
            var CreateDirectory = '.\\Picture\\'+ dir + '\\'
            var directory = './Picture/' + dir  + '/' 
            var picturePath = directory + idsplit + '.jpg'



    
    
            if (!fs.existsSync(CreateDirectory)){
                fs.mkdirSync('./Picture/'+dir, { recursive: true });
                pictureLogger.trace('Created Directory for Picture');
                console.log('Created Directory for Picture')
 
            }


            
    
    
            // Haber resimlerini indirme bolumu baslangic


            downloadImage(newsDownload)

            
    
            function downloadImage(callback){
                

                if (fs.existsSync(picturePath)) {
                    
                    var stats = fs.statSync(picturePath)
                    var fileSizeInBytes = stats.size;
                    // Convert the file size to megabytes (optional)
                    pictureLogger.trace(fileSizeInBytes);
                    console.log(fileSizeInBytes)
                    if(fileSizeInBytes < 150){
                        fs.unlink(picturePath, function (err) {
                            if (err) throw err;
                            // if no error, file has been deleted successfully
                            pictureLogger.trace("The picture file size is less 1 KB. The picture file deleted.");
                            console.log("The picture file size is less 1 KB. The picture file deleted.");
                        });
                        setTimeout(() => {
                            downloadImage(newsDownload)
                        }, 7500);

                       
                    }else{
                        pictureLogger.trace('Image file was previously downloaeded: ' + picturePath);
                        console.log('Image file was previously downloaeded.')
                        pictureIsDownloaded = true
                        newsDownload(taskIsSuccess)

                    }
    
                    

                }else{

                    axios.get('https://api.aa.com.tr/abone/document/' + downloadId + '/print', {responseType: "stream",auth: {
                        username: aauser.aaUserName,
                        password: aauser.aaPassword
                    }} )  
                    .then(async response => {  

                            if(response.status == 200){
                                // Saving file to working directory  
                                var picture = fs.createWriteStream(CreateDirectory + idsplit + '.jpg')
                                const p = response.data.pipe(picture);  
                                p.on('finish', () => {
                                    pictureLogger.trace('Download is successful. ' + idsplit + '.jpg');
                                    console.log('Download is successful.')
                                    pictureIsDownloaded = true
        
                                    setTimeout(() => {
                                        callback(taskIsSuccess)
                                    }, 3000);
                                });
                            }else{
                                setTimeout(() => {
                                    imagestryCounter = imagestryCounter + 1
                                    if(imagestryCounter == 10){
                                        taskIsSuccess()
                                    }else{
                                        downloadImage(newsDownload)
                                    }
                                }, 7500);
                            }
                   
                        
            
                    })  
                    .catch(error => {  
                        pictureLogger.error(error);
                        console.log(error)
                        if(error){
                            setTimeout(() => {
                                imagestryCounter = imagestryCounter + 1
                                if(imagestryCounter == 10){
                                    taskIsSuccess()
                                }else{
                                    setTimeout(() => {
                                        downloadImage(newsDownload)
                                    }, 4750);
                                }
                            }, 2000);
                        }
                    
                    });
         
                        

                }


        
    
            }

    
            function newsDownload(callback){

                if (!fs.existsSync('./AA/' + dir + '.xml')){
    
                    axios.get('https://api.aa.com.tr/abone/document/'+element.group_id+'/newsml29', 
                    {responseType: "stream",
                    auth: {
                        username: aauser.aaUserName,
                        password: aauser.aaPassword
                    },
                    })  
                    .then(response => {  
        
                        response.data.pipe(fs.createWriteStream('./NewAA/' + dir + '.xml'));  
                        response.data.pipe(fs.createWriteStream('./AA/' + dir + '.xml'));  
                        pictureLogger.trace('File name for the picture news: ' + dir + '.xml');
                        console.log('File name for the picture news: ' + dir + '.xml')
                        newsIsDownloaded = true
                        callback()
            
                    })  
                    .catch(error => {  
                        pictureLogger.error(error);
                        console.log(error);
                        if(error){
                            setTimeout(() => {
                                imagestryCounter = imagestryCounter + 1
                                newsDownload(taskIsSuccess)
                            }, 2000);
                        }
                          
                    });  
                   
                }else{
                    pictureLogger.trace("News was previously downloaded. "+ dir + '.xml');
                    console.log("News was previously downloaded. "+ dir + '.xml')
                    newsIsDownloaded = true
                    callback()
                }

            }


            function taskIsSuccess(){

                
            if(newsIsDownloaded == true && pictureIsDownloaded == true){
                pictureLogger.trace('It was successfully downloaded after ' + imagestryCounter + 'attemps.');
                console.log('It was succcessfully downloaded after ' + imagestryCounter + 'attemps.')
                channel.ack(msg)
            }
            else if(imagestryCounter == 10){
                pictureLogger.warn('The process tried after ten times. The Proccess is unsuccessful.');
                pictureLogger.warn('Picture ' + pictureIsDownloaded)
                pictureLogger.warn("News XML " + newsIsDownloaded)
                
                console.log('The process tried after ten times. The Proccess is unsuccessful.')
                console.log('Picture ' + pictureIsDownloaded)
                console.log('News XML ' + newsIsDownloaded)


                channel.ack(msg)
            }
            else{
                setTimeout(() => {
                    downloadImage(newsDownload)
                }, 7500);
            }

            }
        
    

        }
        else if(element.type == "video"){


            
            log4js.configure({
                appenders: { cheese: { type: "file", filename: "./Logs/Video/Video.log", maxLogSize: 10485760, backups: 3, compress: true } },
                categories: { default: { appenders: ["cheese"], level: "trace" } }
            });

            const videoLogger = log4js.getLogger("cheese");


            var videoNewsIsDownloaded = false
            var videoeIsDownloaded = false 
            var videoTryCounter = 0;
     

            var downloadId = element.id
            var idsplit = downloadId.replace(/:/g, '_');
            var videoXmlPath = './AA/' + idsplit + '.xml'
            var videoPath = './Video/' + idsplit + '.mp4'
            var fileUrl = 'https://api.aa.com.tr/abone/document/'+downloadId+'/sd'
         


            if (fs.existsSync(videoPath)) {
                videoeIsDownloaded = true
                videoLogger.trace('Video is true. Check  XML News. ' + videoeIsDownloaded);
                console.log('Video is true. Check XML News. ' + videoeIsDownloaded)
                newsVideoXmlDownload(videoTaskIsSuccess)

            }else{
                
                newsVideoDownload(newsVideoXmlDownload)
               
            }

            function newsVideoDownload(callback){


                axios.get(fileUrl, {responseType: "stream",auth: {
                    username: aauser.aaUserName,
                    password: aauser.aaPassword
                }} )  
                .then(async response => {  
                    // Saving file to working directory  
                    var video = fs.createWriteStream('./Video/' + idsplit + '.mp4')
                    const p = response.data.pipe(video);  
                    p.on('finish', () => {
                        console.log('Video download is successful.')
                        videoLogger.trace('Video download is successful: ' + idsplit + '.mp4');
                        videoeIsDownloaded = true    
                        setTimeout(() => {
                            callback(videoTaskIsSuccess)
                        }, 2000);
                    });
                })  
                .catch(error => {  
                    videoLogger.error(error);
                    console.log(error)
                    if(error){
                        setTimeout(() => {
                            videoTryCounter = videoTryCounter + 1
                            if(videoTryCounter == 10){
                                videoTaskIsSuccess()
                            }else{
                                videoLogger.error('It was unsuccessful after' + videoTryCounter + 'attemps. Try again download video.');
                                console.log('It was unsuccessful after' + videoTryCounter + 'attemps. Try again download video.')
                                newsVideoDownload(newsVideoXmlDownload)
                            }
                        }, 2000);
                    }
                
                });
            }

            function newsVideoXmlDownload(callback){

                if (fs.existsSync(videoXmlPath)) {
                    videoNewsIsDownloaded = true
                    videoTaskIsSuccess()
                }
                else{
                // Videonun Haberi indirilir
                axios.get('https://api.aa.com.tr/abone/document/'+downloadId+'/newsml29', 
                {responseType: "stream",auth: {
                        username: aauser.aaUserName,
                        password: aauser.aaPassword
                }} )  
                .then(response => {  
                // Saving file to working directory  
                    response.data.pipe(fs.createWriteStream('./NewAA/' + idsplit + '.xml'));  
                    response.data.pipe(fs.createWriteStream('./AA/' + idsplit + '.xml'));  
                    videoLogger.trace('Video XML is successful.' + idsplit + '.xml');
                    console.log('Video XML is successful.')
                    videoNewsIsDownloaded = true
                    callback(videoTaskIsSuccess)
                })  
                    .catch(error => {  
                        console.log(error)
                });  

                }
            }

            function videoTaskIsSuccess(){
                if(videoNewsIsDownloaded == true && videoeIsDownloaded == true){
                    videoLogger.trace('It was unsuccessful after' + videoTryCounter + 'attemps. Try again download video.');
                    console.log('It was unsuccessful after' + videoTryCounter + 'attemps. Try again download video.') 
                    channel.ack(msg)
                }
                else if(videoTryCounter == 10){
                    videoLogger.warn('Video download  ');
                    videoLogger.warn('Video download attemps:  ' + videoeIsDownloaded)
                    videoLogger.warn('Video XML download attemps:  ' + videoNewsIsDownloaded)

                    console.log('Video dowlnload tried after 10 attemps.')
                    console.log('Video download attemps: ' + videoeIsDownloaded)
                    console.log('Video XML download attemps: ' + videoNewsIsDownloaded)
                    channel.ack(msg)
                }   
                else{
                    setTimeout(() => {
                        newsVideoDownload(newsVideoXmlDownload)
                    }, 2000);
                }
            }






            
        }
        else if(element.type == "text"){


                        
            log4js.configure({
                appenders: { cheese: { type: "file", filename: "./Logs/Text/Text.log", maxLogSize: 10485760, backups: 3, compress: true } },
                categories: { default: { appenders: ["cheese"], level: "trace" } }
            });

            const textLogger = log4js.getLogger("cheese");


            var newsTextIsDownloaded = false
            var newstryDownload = 0
            var downloadId = element.id
            var idsplit = downloadId.replace(/:/g, '_');
            var newsTextFile = './AA/' + idsplit + '.xml'

            try {
                if (!fs.existsSync(newsTextFile)) {
                    setTimeout(() => {
                        newsTextDownload(newsTextDownloadController)
                    }, 1500);
                }else{
                    newsTextIsDownloaded = true
                    newsTextDownloadController()
                }
              } catch(err) {
                textLogger.error(err);
                console.log(err)
            }



            function newsTextDownload(callback){
      
                axios.get('https://api.aa.com.tr/abone/document/'+downloadId+'/newsml29', {responseType: "stream",auth: {
                    username: aauser.aaUserName,
                    password: aauser.aaPassword
                }} )  
                .then(response => {  
                // Saving file to working directory  
                    response.data.pipe(fs.createWriteStream('./NewAA/' + idsplit + '.xml'));  
                    response.data.pipe(fs.createWriteStream(newsTextFile));  
                    textLogger.trace("Text download is successful: " + idsplit + '.xml');
                    newsTextIsDownloaded = true;
                    callback()
    
                })  
                    .catch(error => {  
                    textLogger.error(error);
                    console.log(error);  
                    if(error){
                        if(newstryDownload == 10){
                            newsTextDownloadController()
                        }else{
                            setTimeout(() => {
                                newsTextDownload(newsTextDownloadController)
                            }, 1500);
                        }
               
                    }
                    
                });  

            }

            function newsTextDownloadController(){
                if(newsTextIsDownloaded == true){
                    console.log('News was downloaded after' + newstryDownload + 'attemps.')
                    channel.ack(msg)
                }else{
                    if(newstryDownload == 10){
                        textLogger.warn('text XML download failed after 10 attempts. ');
                        console.log('text XML download failed after 10 attempts.')
                        channel.ack(msg)
                    }else{
                        setTimeout(() => {
                            newsTextDownload(newsTextDownloadController)
                        }, 1500);
                    }
                }
            }

    




        }
        else if(element.type == "graphic"){


                                    
            log4js.configure({
                appenders: { cheese: { type: "file", filename: "./Logs/Graphic/graphic.log", maxLogSize: 10485760, backups: 3, compress: true } },
                categories: { default: { appenders: ["cheese"], level: "trace" } }
            });

            const graphicLogger = log4js.getLogger("cheese");

   
            var graphicIsDownloaded = false
            var graphicNewsIsDownloaded = false
            var fileFormat, queryFileFormat
            var graphicTryDownload = 0
            var downloadId = element.id
            var idsplit = downloadId.replace(/:/g, '_');
            var path = './AA/' + idsplit + '.xml'
            fileFormat = "jpeg"
            queryFileFormat = "raster"
            var dir = element.group_id.replace(/:/g, '_');
            var CreateDirectory = '.\\Graphic\\'+ dir + '\\'


                
            if (!fs.existsSync(CreateDirectory)){
                fs.mkdirSync(CreateDirectory, { recursive: true });
                graphicLogger.trace("Graphic folder created." + CreateDirectory);
                console.log('Graphic folder created.' + CreateDirectory)
       
            }





            if (fs.existsSync('./Graphic/' + dir + '/' +idsplit + '.' + fileFormat)) {
                var stats = fs.statSync('./Graphic/' + dir + '/' +idsplit + '.' + fileFormat)
                var fileSizeInBytes = stats.size;
                // Convert the file size to megabytes (optional)
                graphicLogger.trace(fileSizeInBytes);
                console.log(fileSizeInBytes)
                if(fileSizeInBytes < 450){
                    fs.unlink('./Graphic/' + dir + '/' +idsplit + '.' + fileFormat, function (err) {
                        if (err) throw err;
                        // if no error, file has been deleted successfully
                        graphicLogger.trace("Graphic file is less 1 KB. Graphic deleted.");
                        console.log("Graphic file is less 1 KB. Graphic deleted.");
                    });
                    setTimeout(() => {
                        graphicDownload(graphicNewsDownload)

                    }, 7500);

                   
                }else{
                graphicIsDownloaded = true
                graphicLogger.trace('Grafik bulunmaktadir. Haberi Kontrol Et ' + graphicIsDownloaded);
                console.log('Grafik bulunmaktadir. Haberi Kontrol Et ' + graphicIsDownloaded)
                graphicNewsDownload(graphicNewsIsSuccess)
                }



            }else{
                
                graphicDownload(graphicNewsDownload)
               
            }

            function graphicDownload(callback){


                axios.get('https://api.aa.com.tr/abone/document/' + downloadId + '/' + queryFileFormat, {responseType: "stream",auth: {
                    username: aauser.aaUserName,
                    password: aauser.aaPassword
                }} )  
                .then(async response => {  
    
                    var graphic = fs.createWriteStream('./Graphic/' + dir + '/' +idsplit + '.' + fileFormat)
                    const p = response.data.pipe(graphic);  
                    p.on('finish', () => {
                        graphicLogger.trace('Grafik başarılı bir şekilde indirildi.'  +idsplit + '.' + fileFormat);
                        console.log('grafik basarili indirildi.')
                        graphicIsDownloaded = true
                        setTimeout(() => {
                            callback(graphicNewsDownload)
                        }, 2000);

                    });
                })  
                .catch(error => {  
                    graphicLogger.error(error);
                    console.log(error)
                    if(error){
                        graphicTryDownload = graphicTryDownload + 1

                        if(graphicTryDownload == 10){
                            graphicNewsIsSuccess()
                        }else{
                            setTimeout(() => {
                                graphicLogger.warn('Graphic download is unsuccessful.' + graphicTryDownload);
                                console.log('Graphic download is unsuccessful.' + graphicTryDownload)
                                graphicDownload(graphicNewsDownload)
                            }, 3000);

                        }
                
                    }
                
                });

              
    


            }



  
            function graphicNewsDownload(callback){

                if(fs.existsSync('./AA/' + idsplit + '.xml')){
                    graphicLogger.trace("Don't download again, There is graphic XML: " + idsplit + '.xml');
                    console.log("Don't download again, There is graphic XML: ")
                    graphicNewsIsDownloaded = true
                    graphicNewsIsSuccess()
                
                }else{

                    axios.get('https://api.aa.com.tr/abone/document/'+downloadId+'/newsml29', 
                    {responseType: "stream",auth: {
                            username: aauser.aaUserName,
                            password: aauser.aaPassword
                    }} )  
                    .then(response => {  
                        if(response.success == false){
                            graphicLogger.warn('Graphic news download is unsuccessful after ' + graphicTryDownload + 'attemps.');
                            console.log('Graphic news download is unsuccessful.')
                            graphicTryDownload = graphicTryDownload + 1
                            setTimeout(() => {
                                graphicNewsDownload(graphicNewsIsSuccess)
                            }, 2000);
    
                        }else{
                            // Saving file to working directory  
                            response.data.pipe(fs.createWriteStream('./NewAA/' + idsplit + '.xml'));  
                            response.data.pipe(fs.createWriteStream('./AA/' + idsplit + '.xml')); 
                            graphicLogger.trace('Graphic News XML is downloaded: ' + idsplit + '.xml');
 
                            console.log('Graphic News XML is downloaded.')
                            graphicNewsIsDownloaded = true
                            callback(graphicNewsIsSuccess)
                        }
         
                    })  
                        .catch(error => {  
                            graphicLogger.error(error);
                            console.log(error)
                            if(error){
                                graphicTryDownload = graphicTryDownload + 1
    
                                if(graphicTryDownload == 10){
                                    graphicNewsIsSuccess()
                                }else{
                                    setTimeout(() => {
                                        graphicLogger.warn('Graphics download is unsuccessful. ' + graphicTryDownload);
                                        console.log('Graphics download is unsuccessful. ' + graphicTryDownload)
                                        graphicNewsDownload(graphicNewsIsSuccess)
                                    }, 3000);
        
                                }
    
                            }
                    });  

                }

    
            }

            function graphicNewsIsSuccess(){
                if(graphicNewsIsDownloaded == true && graphicIsDownloaded == true){
                    graphicLogger.trace('Graphic and News download is successful. ' + 'graphicNewsIsDownloaded: ' + graphicIsDownloaded + ' graphicNewsIsDownloaded: ' + graphicNewsIsDownloaded);
                    console.log('Graphic and News download is successful. ' + 'graphicNewsIsDownloaded: ' + graphicIsDownloaded + ' graphicNewsIsDownloaded: ' + graphicNewsIsDownloaded )

                    channel.ack(msg)
                }else if(graphicTryDownload == 10){
                    graphicLogger.warn('The video download is unsuccessful after 10 attemps. ' + 'graphicNewsIsDownloaded: ' + graphicIsDownloaded + ' graphicNewsIsDownloaded: ' + graphicNewsIsDownloaded)
                    console.log('The video download is unsuccessful after 10 attemps. ' + 'graphicNewsIsDownloaded: ' + graphicIsDownloaded + ' graphicNewsIsDownloaded: ' + graphicNewsIsDownloaded)
                    channel.ack(msg)
                }else{
                    graphicDownload(graphicNewsDownload)
                }

            }


        }



     
    }, {noAck:false})
        
    } 
    catch (error) {
        console.log(error)
    }

}

consumeTask()


