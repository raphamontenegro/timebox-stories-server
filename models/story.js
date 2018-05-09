'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const storySchema = new Schema({
  text: {
    type: String,
    required: true
  },
  length: {
    type: String,
    required: true
  },
  read: {
    type: Boolean
  },
  tags: {
    type: String
  },
  owner: {
    type: ObjectId,
    ref: 'User',
    required: true
  }
});

storySchema.index({ location: '2dsphere' });

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
