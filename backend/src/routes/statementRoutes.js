const express = require('express');
const {
  uploadStatement,
  extractStatement,
  getStatements,
  getStatementAnalysis,
  deleteStatement
} = require('../controllers/statementController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/extract', protect, upload.single('statement'), extractStatement);
router.post('/upload', protect, upload.single('statement'), uploadStatement);
router.get('/', protect, getStatements);
router.get('/:id', protect, getStatementAnalysis);
router.delete('/:id', protect, deleteStatement);

module.exports = router;
