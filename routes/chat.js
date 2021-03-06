const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const ConversationController = require('../controllers/conversation');

router.get('/', authenticate, ConversationController.getConversationsSnippets);


router.get('/messages', authenticate, ConversationController.getMessages);

router.get('/conversationId/:friendId', authenticate, ConversationController.getConversationId)

router.post('/:conversationId', authenticate, ConversationController.newMessage);

module.exports = router;
