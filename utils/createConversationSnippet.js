const createConversationSnippet = (conversation, message) => {
  if(!message[0]) {
    return null
  }
  return {
    _id: conversation._id,
    participants: [conversation.participants[0]._id, conversation.participants[1]._id],
    snippet: {
      author: message[0].author,
      recipent: message[0].recipent,
      messageText: message[0].messageText,
      createdAt: message[0].createdAt
    }
  }
}

module.exports = createConversationSnippet;
