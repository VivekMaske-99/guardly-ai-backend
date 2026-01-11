const app = require('./src/app');
const { PORT, MONGO_URI } = require('./src/config/env');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
