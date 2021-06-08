const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  company: {
    type: String
  },
  title: {
    type: String,
    required:[true, "Please add title"]
  },
  salary: {
    type: String
  },
  experience: {
    type: String,
    default:""
  },
  jobType: {
type: String,
default:""
  },
  address: {
    type: String
  },

  description: {
    type: String,
    required: [true, "Please add a description"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  appliers: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      cv: {
        type: String,
        required: true
      }
     
    },
  ],
  postedBy: {
    type: mongoose.Schema.ObjectId,
    ref:"User"
  }
});

module.exports = mongoose.model("Job", JobSchema);
