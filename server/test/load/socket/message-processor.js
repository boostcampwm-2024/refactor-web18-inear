let messageCounter = 0;

module.exports = {
  generateMessageNumber: (userContext, events, done) => {
    messageCounter++;
    userContext.vars.messageNumber = messageCounter;
    return done();
  },
};
