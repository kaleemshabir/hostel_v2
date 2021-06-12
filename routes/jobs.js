const express = require('express');
const multer = require("multer");
const User = require("../models/User");

const {
  getJob,
  getJobs,
  postJob,
  updateJob,
  deleteJob,
  apply,
  search,
  getJobsOwner
} = require('../controllers/jobs');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/cv");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    req.body.filename = `${req.user._id}.${ext}`;
    cb(null, req.body.filename);
  }
});
const upload = multer({
  storage,
  fileFilter: async (_req, file, cb) => {
  

    let callback;
    if (file.mimetype.split("/")[1] === "pdf") {
     
      const user = await User.findOne({
        _id: _req.user._id
      });
    
      if (!user) {
        _req.body.isUser = false;
        callback = cb(null, _req.body.isUser);
      } else {
        
        callback = cb(null, true);
      }
    } else {
      _req.body.isCv = false;
      callback = cb(null, _req.body.isCv);
    }
    return callback;
  }
});

// var storage = multer.diskStorage({
//   filename: function (req, file, callback) {
//     const ext = file.mimetype.split("/")[1];
//         req.body.filename = `${req.user._id}.${ext}`;
//        const  name = `${req.user._id}.${ext}`;
//     callback(null, name);
//   },
// });
// var imageFilter = function (req, file, cb) {
//   // accept image files only
//   if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf)$/i)) {
//     return cb(new Error('Only image files and pdf files are allowed!'), false);
//   }
//   cb(null, true);
// };
// var upload = multer({ storage: storage, fileFilter: imageFilter });

const router = express.Router();

const { protect } = require('../middleware/auth');
router.route('/my-jobs').get(protect, getJobsOwner);
router
  .route('/')
  .get(
   
    getJobs
  )
  .post(protect, postJob);
  // authorize('publisher', 'admin')
  router.route('/search').get(search);
router
  .route('/:id')
  .get(getJob)
  .put(protect, updateJob)
  .delete(protect,deleteJob);

  router.route('/:id/apply').post(protect, upload.single("file"), apply);
  
  

module.exports = router;
