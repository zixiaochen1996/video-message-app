/* eslint-disable global-require */
/* eslint-disable no-console */
/* eslint-disable indent */
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const session = require('express-session');
const mongoose = require('mongoose');
const envConfig = require('simple-env-config');
const http = require('http');
const socketio = require('socket.io');
const multer = require('multer');
const moment = require('moment');
const cors = require('cors');

const app = express();
app.use(cors()); 
const server = http.createServer(app);

const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'dev';

const setupServer = async () => {
  // Get app config
  const conf = await envConfig('./config/config.json', env);
  const port = process.env.PORT ? process.env.PORT : conf.port;

  // Setup Express pipeline
  const io = socketio(server);

  if (env !== 'test') app.use(logger('dev'));
  // eslint-disable-next-line no-underscore-dangle
  app.engine('pug', require('pug').__express);
  app.set('views', __dirname);
  app.use(express.static(path.join(__dirname, '../../public')));

  // Setup pipeline session support
  app.store = session({
    name: 'session',
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      path: '/',
    },
  });
  app.use(app.store);

  // Finish with body parser
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Connect to MongoDB
  try {
    // Prevent MongooseJS deprecation warnings
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    mongoose.set('useUnifiedTopology', true);
    // Connect to the DB server
    await mongoose.connect(conf.mongodb);
    console.log('MongoDB connected...');
  } catch (err) {
    console.log(err);
    process.exit(-1);
  }

  // Import Data Models
  app.models = {
    User: require('./models/user'),
    Chatroom: require('./models/chatroom'),
    Message: require('./models/message'),
  };

  // Import Routes
  require('./api')(app);

  // Give routes the SPA base page
  app.get('*', (req, res) => {
    const { user } = req.session;
    console.log(`Loading app for: ${user ? user.username : 'nobody!'}`);
    let preloadedState = user
      ? {
          username: user.username,
          email: user.email,
          date: user.date,
        }
      : {};
    preloadedState = JSON.stringify(preloadedState).replace(/</g, '\\u003c');
    res.render('base.pug', {
      state: preloadedState,
    });
  });

  // UPLOAD FILES
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'public');
    },
    filename(req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

  const upload = multer({ storage }).single('file');
  app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(500).json(err);
      }
      if (err) {
        return res.status(500).json(err);
      }
      return res.status(200).send(req.file);
    });
  });

  const Chatroom = mongoose.model('Chatroom');
  const Message = mongoose.model('Message');
  let onlineUsers = [];

  // SOCKET
  io.on('connection', (socket) => {
    console.log('WebSocket Connected...');

    socket.on('disconnect', () => {
      io.emit('WebSocket Disconnected...');
    });

    socket.on('joinRoom', ({ chatroomId, user }) => {
      socket.join(chatroomId);
      console.log(`${user} has joined chatroom ${chatroomId}`);
      onlineUsers.push(user);
      console.log(`Online users: ${onlineUsers}`);
    });

    socket.on('leaveRoom', ({ chatroomId, user }) => {
      socket.leave(chatroomId);
      console.log(`${user} has left chatroom ${chatroomId}`);
      onlineUsers = onlineUsers.filter((leftUser) => leftUser !== user);
      console.log(`Online users: ${onlineUsers}`);
    });

    // eslint-disable-next-line object-curly-newline
    socket.on('outgoing-call', ({ chatroomId, socketID, caller, receiver }) => {
      console.log('in og-call');
      if (socketID !== '') {
        console.log('receiver online');
        io.to(socketID).emit('incoming-call', { chatroomId, caller });
      } else if (onlineUsers.includes(receiver)) {
        console.log('receiver in chatroom');
        io.to(chatroomId).emit('incoming-call', { chatroomId, caller });
      } else {
        console.log('receiver offline');
        io.to(chatroomId).emit('receiver-offline', caller);
      }
    });

    socket.on('accept-call', ({ chatroomId, caller }) => {
      io.to(chatroomId).emit('call-accepted', { chatroomId, caller });
    });

    socket.on('decline-call', ({ chatroomId, caller }) => {
      io.to(chatroomId).emit('call-declined', caller);
    });

    socket.on('norespond-call', ({ chatroomId, caller }) => {
      io.to(chatroomId).emit('call-noresponse', caller);
    });

    // socket.on('end-call', ({ socketID }) => {
    //   // io.to(chatroomId).emit('call-ended');
    //   io.to(socketID).emit('call-ended');
    // });

    socket.on('changeRoomMessages', async ({ chatroomId, msgs }) => {
      await Chatroom.findOneAndUpdate({ _id: chatroomId }, { messages: msgs });
      io.to(chatroomId).emit('changedMessages', msgs);
    });

    socket.on('chatMessage', async (msg) => {
      const newMessage = new Message({
        sender: msg.sender,
        receiver: msg.receiver,
        senderImage: msg.senderImage,
        date: msg.date,
        chatroomId: msg.chatroomId,
        message: msg.message,
        type: msg.type,
        delivery: true,
        read: onlineUsers.includes(msg.receiver),
        deliveryDate: moment().format('MMMM Do YYYY, h:mm:ss a'),
        readDate: onlineUsers.includes(msg.receiver)
          ? moment().format('MMMM Do YYYY, h:mm:ss a')
          : null,
      });
      await newMessage.save();
      io.to(msg.chatroomId).emit('newMessage', {
        sender: msg.sender,
        receiver: msg.receiver,
        senderImage: msg.senderImage,
        date: msg.date,
        chatroomId: msg.chatroomId,
        message: msg.message,
        type: msg.type,
        delivery: true,
        read: onlineUsers.includes(msg.receiver),
        deliveryDate: moment().format('MMMM Do YYYY, h:mm:ss a'),
        readDate: onlineUsers.includes(msg.receiver)
          ? moment().format('MMMM Do YYYY, h:mm:ss a')
          : null,
      });

      const room = await Chatroom.findOne({ _id: msg.chatroomId });
      await Chatroom.findOneAndUpdate(
        { _id: msg.chatroomId },
        {
          messages: room.messages.concat({
            sender: msg.sender,
            receiver: msg.receiver,
            senderImage: msg.senderImage,
            date: msg.date,
            chatroomId: msg.chatroomId,
            message: msg.message,
            type: msg.type,
            delivery: true,
            read: onlineUsers.includes(msg.receiver),
            deliveryDate: moment().format('MMMM Do YYYY, h:mm:ss a'),
            readDate: onlineUsers.includes(msg.receiver)
              ? moment().format('MMMM Do YYYY, h:mm:ss a')
              : null,
            // eslint-disable-next-line no-underscore-dangle
            messageId: newMessage._id,
          }),
        },
      );
    });
  });

  // Run the server
  server.listen(port, () => {
    console.log(`Server listening on port ${server.address().port}...`);
  });
};

setupServer();

module.exports = server;
