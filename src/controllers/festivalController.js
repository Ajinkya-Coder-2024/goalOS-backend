const Festival = require('../models/Festival');

// Get all festivals for the authenticated user
exports.getFestivals = async (req, res) => {
  try {
    const festivals = await Festival.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(festivals);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch festivals' });
  }
};

// Create a new festival
exports.createFestival = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const festival = await Festival.create({ user: req.user._id, name, description: description || '' });
    res.status(201).json(festival);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create festival' });
  }
};

// Get single festival
exports.getFestivalById = async (req, res) => {
  try {
    const festival = await Festival.findOne({ _id: req.params.id, user: req.user._id });
    if (!festival) return res.status(404).json({ success: false, message: 'Festival not found' });
    res.json(festival);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch festival' });
  }
};

// Update festival
exports.updateFestival = async (req, res) => {
  try {
    const { name, description } = req.body;
    const festival = await Festival.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { ...(name !== undefined && { name }), ...(description !== undefined && { description }) } },
      { new: true }
    );
    if (!festival) return res.status(404).json({ success: false, message: 'Festival not found' });
    res.json(festival);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update festival' });
  }
};

// Delete festival
exports.deleteFestival = async (req, res) => {
  try {
    const deleted = await Festival.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Festival not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete festival' });
  }
};

// Add bucket item
exports.addBucketItem = async (req, res) => {
  try {
    const { label, price } = req.body;
    if (!label) return res.status(400).json({ success: false, message: 'Label is required' });
    const festival = await Festival.findOne({ _id: req.params.id, user: req.user._id });
    if (!festival) return res.status(404).json({ success: false, message: 'Festival not found' });
    const item = { label, price: typeof price === 'number' ? price : 0, completed: false };
    festival.items.push(item);
    await festival.save();
    res.status(201).json(festival);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add bucket item' });
  }
};

// Update bucket item
exports.updateBucketItem = async (req, res) => {
  try {
    const { label, price, completed } = req.body;
    const festival = await Festival.findOne({ _id: req.params.id, user: req.user._id });
    if (!festival) return res.status(404).json({ success: false, message: 'Festival not found' });
    const item = festival.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (label !== undefined) item.label = label;
    if (price !== undefined) item.price = price;
    if (completed !== undefined) item.completed = completed;
    await festival.save();
    res.json(festival);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update bucket item' });
  }
};

// Delete bucket item
exports.deleteBucketItem = async (req, res) => {
  try {
    const festival = await Festival.findOne({ _id: req.params.id, user: req.user._id });
    if (!festival) return res.status(404).json({ success: false, message: 'Festival not found' });
    const item = festival.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    item.deleteOne();
    await festival.save();
    res.json(festival);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete bucket item' });
  }
};
