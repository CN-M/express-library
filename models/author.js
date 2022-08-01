const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const Schema = mongoose.Schema;

const AuthorSchema = new Schema(
  {
    first_name: { type: String, required: true, maxLength: 100 },
    family_name: { type: String, required: true, maxLength: 100 },
    date_of_birth: { type: Date },
    date_of_death: { type: Date },
  },
);

// Virtual domain for author name
AuthorSchema.virtual('name').get(function() {
  let authorName = '';
  if (this.first_name && this.family_name) {
    authorName += `${this.first_name} ${this.family_name}`;
  }
  return authorName;
});

// Virtual domain for author lifespan
AuthorSchema.virtual('lifespan').get(function() {
  let lifespan = '';
  if (this.date_of_birth) {
    lifespan += DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED);
  }
  lifespan += ' - ';
  if (this.date_of_death) {
    lifespan += DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED);
  }
  return lifespan;
});

// Virtual domain for date of birth
AuthorSchema.virtual('date_of_birth_yyyy_mm_dd').get(function() {
  return DateTime.fromJSDate(this.date_of_birth).toISODate(); // Format: YYYY-MM-DD
});

// Virtual domain for date of death
AuthorSchema.virtual('date_of_death_yyyy_mm_dd').get(function() {
  return DateTime.fromJSDate(this.date_of_death).toISODate(); // Format: YYYY-MM-DD
});

// Virtual domain for author url
AuthorSchema.virtual('url').get(function() {
  return `/catalog/author/${this._id}`;
});

module.exports = mongoose.model('Author', AuthorSchema);
