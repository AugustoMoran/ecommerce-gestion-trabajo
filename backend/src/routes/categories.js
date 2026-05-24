const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getCategories, createCategory, updateCategory, deleteCategory, removeImage,
} = require('../controllers/categoryController');

router.get('/', getCategories);
router.post('/', protect, adminOnly, createCategory);
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id/image', protect, adminOnly, removeImage);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
