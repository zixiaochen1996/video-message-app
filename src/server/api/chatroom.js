/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
/* eslint-disable operator-linebreak */
const moment = require('moment');

module.exports = (app) => {
  // Create a new chatroom
  app.post('/chatroom', async (req, res) => {
    if (!req.session.user) {
      res.status(401).send({ error: 'unauthorized' });
    } else {
      try {
        const user1 = await app.models.User.findOne({
          username: req.body.user1,
        });
        const user2 = await app.models.User.findOne({
          username: req.body.user2,
        });
        const newChatroom = {
          user1Name: req.body.user1,
          user1Id: user1._id,
          user2Name: req.body.user2,
          user2Id: user2._id,
        };
        const room = new app.models.Chatroom(newChatroom);
        await room.save();
        if (user2.deactivate) {
          res.status(404).send({
            error: `User '${req.body.user2}' has been deactivated`,
          });
          return;
        }
        await app.models.User.findOneAndUpdate(
          { username: req.body.user1 },
          {
            chatrooms: user1.chatrooms.concat({
              chatroomId: room._id,
              contactName: req.body.user2,
            }),
          },
        );
        await app.models.User.findOneAndUpdate(
          { username: req.body.user2 },
          {
            chatrooms: user2.chatrooms.concat({
              chatroomId: room._id,
              contactName: req.body.user1,
            }),
          },
        );
        // Move most recent contact to the front of the user's contact array
        const { contacts } = user1;
        contacts.some(
          (item, idx) =>
            // eslint-disable-next-line implicit-arrow-linebreak
            item.contactname === req.body.user2 &&
            contacts.unshift(contacts.splice(idx, 1)[0]),
        );
        await app.models.User.findOneAndUpdate(
          { username: req.body.user1 },
          { contacts },
        );
        // eslint-disable-next-line no-underscore-dangle
        res.status(201).send({ id: room._id });
      } catch (err) {
        console.log(`Room.create save failure: ${err}`);
        res.status(400).send({ error: 'failure creating room' });
      }
    }
  });

  // Get existing chatroom ID
  app.get('/chatroom/:username/:contactname', async (req, res) => {
    const user = await app.models.User.findOne({
      username: req.params.username.toLowerCase(),
    });
    const user2 = await app.models.User.findOne({
      username: req.params.contactname.toLowerCase(),
    });
    if (user2.deactivate) {
      res.status(404).send({
        error: `User '${req.params.contactname}' has been deactivated`,
      });
      return;
    }
    if (!user) {
      res.status(404).send({ error: `unknown user: ${req.params.username}` });
    } else {
      const found = user.chatrooms.find(
        (element) => element.contactName === req.params.contactname,
      );
      if (found !== undefined) {
        // Move most recent contact to the front of the user's contact array
        const { contacts } = user;
        contacts.some(
          (item, idx) =>
            // eslint-disable-next-line implicit-arrow-linebreak
            item.contactname === req.params.contactname &&
            contacts.unshift(contacts.splice(idx, 1)[0]),
        );
        await app.models.User.findOneAndUpdate(
          { username: req.params.username },
          { contacts },
        );

        // Update Read Receipt
        const chatroom = await app.models.Chatroom.findById({
          _id: found.chatroomId,
        });
        const newMessages = chatroom.messages.slice();
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < newMessages.length; i++) {
          if (newMessages[i].receiver === req.params.username.toLowerCase()) {
            newMessages[i].read = true;
            newMessages[i].readDate = moment().format(
              'MMMM Do YYYY, h:mm:ss a',
            );
          }
        }
        await app.models.Chatroom.findOneAndUpdate(
          { _id: found.chatroomId },
          { messages: newMessages },
        );

        res.status(200).send({
          id: found.chatroomId,
        });
        return;
      }
      res.status(404).send({ error: 'unknown room' });
    }
  });

  // Get all the messages in this chatroom
  app.get('/chatroom/:id', async (req, res) => {
    try {
      const room = await app.models.Chatroom.findById(req.params.id);
      if (!room) {
        res.status(404).send({ error: `unknown room: ${req.params.id}` });
      } else {
        res.status(200).send({
          messages: room.messages,
        });
      }
    } catch (err) {
      console.log(`Room.get failure: ${err}`);
      res.status(404).send({ error: `unknown room: ${req.params.id}` });
    }
  });
};
