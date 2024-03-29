const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const Job = require("../models/Job");
const cloudinary = require("cloudinary");
const admin = require("firebase-admin");
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc        Get all jobs
// @route       GET /api/v1/jobs
// @access      Public
exports.getJobs = asyncHandler(async (req, res, next) => {
 let  d = new Date();
  d = d.setDate(d.getDate()-30);
  const jobs = await Job.find({createdAt:{$gte:d}}).sort([[("created_at", -1)]]);
  if (!jobs) {
    return next(new ErrorResponse("No job found", 404));
  }

  res.status(200).json({
    success: true,
    data: jobs,
  });
});
exports.getJobsOwner = asyncHandler(async (req, res, next) => {
  const jobs = await Job.find({postedBy:req.user.id}).populate({
    path: "postedBy",
    select: "name email",
  }).sort([[("created_at", -1)]]);
  if (!jobs) {
    return next(new ErrorResponse("No job found", 404));
  }

  res.status(200).json({
    success: true,
    data: jobs,
  });
});

// @desc        Get single job
// @route       GET /api/v1/jobs/:id
// @access      Public
exports.getJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate({
    path: "postedBy",
    select: "name email",
  });
  

  if (!job) {
    return next(
      new ErrorResponse(`No job found with the id of ${req.params.id}`, 404)
    );
  }
  job.appliers= undefined;
  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc       Add JOB
// @route      POST /api/v1/jobs
// @access     Private
exports.postJob = asyncHandler(async (req, res, next) => {
  req.body.postedBy = req.user.id;
  const data = {
    title: req.body.title,
    description: req.body.description,
    experience: req.body.experience,
    salary: req.body.salary,
    jobType: req.body.jobType,
    address: req.body.address,
    postedBy: req.body.postedBy,
    company: req.body.company,
    employmentType: req.body.employmentType,
  };
await Job.create(data);

  res.status(200).json({
    success: true,
    message: "Job posted successfully",
    data: {},
  });
});

// @desc       Update job
// @route      PUT /api/v1/jobs/:id
// @access     Private
exports.updateJob = asyncHandler(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(
      new ErrorResponse(`No job with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is job owner
  if (job.postedBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update job`,
        400
      )
    );
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc       Delete job
// @route      DELETE /api/v1/jobs/:id
// @access     Private
exports.deleteJob = asyncHandler(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(
      new ErrorResponse(`No job with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is job owner
  if (job.postedBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete job`,
        400
      )
    );
  }

  await Job.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
});

//@desc   Apply for job
//@route  POST /api/v1/jobs/:id/apply
//@access Public
exports.apply = asyncHandler(async (req, res, next) => {
  let job = await Job.findById(req.params.id);
  if (!job) {
    return next(new ErrorResponse(`Job not found with this ${req.params.id}`));
  }
  const owner =  await User.findById(job.postedBy);
  const token  = owner.fcmToken;
  const userToken = req.user.fcmToken;
  req.body.user = req.user.id;
  const photo = req.user.photo;
  const cv = req.body.filename;
  // let cv;
  const name = req.user.name;
  const email = req.user.email;
  if (req.body.isUser === false) {
    return {
      message: " User not found ",
      error: "ResourceNotFound"
    };
  }
  if (req.body.isCv === false) {
    return {
      message: " Upload only pdf file",
      error: "ResourceNotFound"
    };
  }
  
    if (!cv) {
      return {
        message: "CV file not found ",
        error: "ResourceNotFound"
      };
    }
// const lo = `./public/cv/S{req.user.id}`;
// var pdfImage = new PDFImage(lo);
// console.log(pdfImage);
// const path = await pdfImage.convertPage(0);
// console.log(path)
  // cloudinary.uploader.upload(req.file.path, async function (result) {
  //   // add cloudinary url for the image to the campground object under image property
  //   cv = result.secure_url;
  var payload = {
    notification: {
      title: "Job Application",
      body: `User ${req.user.email} has applied for  ${job.title} job`,
    },
  };
  var payload1 = {
    notification: {
      title: "Job Application",
      body: `Your application submitted to ${job.company} for ${job.title}`,
    },
  };
  
    const data = {
      cv,
      user: req.body.user,
      photo,
      email,
      name
    };
    if (job.postedBy.toString() == req.user.id) {
      return next(new ErrorResponse(`Owner cannot apply for job`, 400));
    }
    const found = job.appliers.find((x) => x.user.toString() == req.user.id);
    if (found && found.user == req.user.id) {
      return next(new ErrorResponse(`Already applied for this job`, 400));
      
    }
  
    job.appliers.push(data);
    await job.save();
    await admin.messaging().sendToDevice(token, payload);
  await admin.messaging().sendToDevice(userToken, payload1);
    return res.status(201).json({
      success: true,
      message: " you successfully applied  for this job ",
    });
   
  });
  

 
// });

//@desc   search jobs
//@route  POST /api/v1/jobs/search
//@access Public
exports.search = asyncHandler(async (req, res, next) => {
  const query = {
    $or: [
      { title: { $regex: req.query.search, $options: "i" } },
      {
        description: { $regex: req.query.search, $options: "i" },
      },
      {
        address: { $regex: req.query.search, $options: "i" },
      },
      {
        salary: { $regex: req.query.search, $options: "i" },
      },
      {
        jobType: { $regex: req.query.search, $options: "i" },
      },
      {
        employmentType: { $regex: req.query.search, $options: "i" },
      },
      {
        company: { $regex: req.query.search, $options: "i" },
      },
    ],
  };

  const jobs = await Job.find(query)
    .sort([["created_at", -1]])
    .lean();

  if (!jobs.length) {
    return next(new ErrorResponse("No job found with this search", 404));
  }

  return res.status(201).json({
    success: true,
    message: "Jobs found successfully",
    data: jobs,
  });
});
