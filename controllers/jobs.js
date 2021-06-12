const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const Job = require("../models/Job");

// @desc        Get all jobs
// @route       GET /api/v1/jobs
// @access      Public
exports.getJobs = asyncHandler(async (req, res, next) => {
  const jobs = await Job.find({}).sort([[("created_at", -1)]]);
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
  let job = await Job.create(data);

  res.status(200).json({
    success: true,
    message: "Job posted successfully",
    data: job,
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
  req.body.user = req.user.id;
  const cv = req.body.filename;
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
  let job = await Job.findById(req.params.id);
  if (!job) {
    return next(new ErrorResponse(`Job not found with this ${req.params.id}`));
  }
  const data = {
    cv: cv,
    user: req.body.user,
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

  if (!job) {
    return next(new ErrorResponse(`Can't apply for job`, 400));
  }
  return res.status(201).json({
    success: true,
    message: " you successfully applied  for this job ",
  });
});

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

  const jobs = await Job.find(query).select("-appliers")
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
