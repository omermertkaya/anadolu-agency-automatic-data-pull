# anadolu-agency-automatic-data-pull
The system is pulling automatic news, picture, video and graphic from Anadolu Ajansı API. The app is working 24 hourly. App will get all data from agency. The news format is XML. Image format is JPG. Video format is mp4. Graphic format is JPEG.

# Requirements

```
Anadolu Agency API Account
RabbitMQ
Nodejs
Pm2

```

# Installation

###  Pm2:

```
npm i pm2

```



###  RabbitMQ:

```
https://www.rabbitmq.com/install-windows.html
or
https://www.rabbitmq.com/install-debian.html

```

Port Number is 15672 for RabbitMQ Server.




###  Anadolu Agency Settings:

You could configure your account information.

###### aauser.js

```
const aaUserName = 'your agency username'
const aaPassword =   'your agency password'

module.exports = {
    aaPassword,aaUserName
}

```

###### Starting Server.js and Receive.js

The code is working in the project folder.

```
pm2 start server.js -n Agency-Main
pm2 start receive.js -n Agency-Receive

```



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.


<!-- CONTACT -->
## Contact

Ömer Mert KAYA - omermertkaya@hotmail.com.tr

Project Link: [https://github.com/omermertkaya/anadolu-agency-automatic-data-pull](https://github.com/omermertkaya/anadolu-agency-automatic-data-pull)

