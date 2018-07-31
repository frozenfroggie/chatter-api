const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const ConversationController = require('../controllers/conversation');

router.get('/', authenticate, ConversationController.getConversations);

router.get('/:conversationId', authenticate, ConversationController.getMessages);

router.post('/:conversationId', authenticate, ConversationController.newMessage);

module.exports = router;
