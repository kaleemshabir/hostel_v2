const express = require('express');
const {
  getJob,
  getJobs,
  postJob,
  updateJob,
  deleteJob,
  apply,
  search
} = require('../controllers/jobs');

const router = express.Router();

const { protect } = require('../middleware/auth');

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

  router.route('/:id/apply').post(protect, apply);
  

module.exports = router;
