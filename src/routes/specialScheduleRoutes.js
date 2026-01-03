const express = require("express");
const {
  createSpecialSchedule,
  getSpecialSchedules,
  addSpecialTask,
  updateSpecialSchedule,
  deleteSpecialSchedule,
  updateSpecialTask,
  deleteSpecialTask,
} = require("../controllers/specialScheduleController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Create new special schedule
router.post("/", createSpecialSchedule);

// Get special schedules (optionally by date range)
router.get("/", getSpecialSchedules);

// Update special schedule dates
router.patch("/:id", updateSpecialSchedule);

// Delete special schedule
router.delete("/:id", deleteSpecialSchedule);

// Add task to a special schedule
router.post("/:id/tasks", addSpecialTask);

// Update a task in a special schedule
router.patch("/:scheduleId/tasks/:taskId", updateSpecialTask);

// Delete a task from a special schedule
router.delete("/:scheduleId/tasks/:taskId", deleteSpecialTask);

module.exports = router;
