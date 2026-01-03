const asyncHandler = require("express-async-handler");
const transactionModel = require("../models/transactionModel");
const challengeModel = require("../models/challengeModel");
const LifePlan = require("../models/LifePlan");
const studyMaterialModel = require("../models/studyMaterialModel");
const DailySchedule = require("../models/DailySchedule");
const diaryModel = require("../models/diaryModel");

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // Get current date and month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Monthly Progress (based on completed tasks/challenges this month)
    const completedChallengesThisMonth = await challengeModel.countDocuments({
      userId: userId,
      status: "completed",
      updatedAt: { $gte: monthStart }
    });

    const totalChallengesThisMonth = await challengeModel.countDocuments({
      userId: userId,
      createdAt: { $gte: monthStart }
    });

    const monthlyProgress = totalChallengesThisMonth > 0 
      ? Math.round((completedChallengesThisMonth / totalChallengesThisMonth) * 100)
      : 0;

    // 2. Completed Tasks (sum of completed challenges and other tasks)
    const completedTasks = await challengeModel.countDocuments({
      userId: userId,
      status: "completed"
    });

    // 3. Active Goals (active challenges + life plan goals)
    const activeChallenges = await challengeModel.countDocuments({
      userId: userId,
      status: { $in: ["active", "in_progress"] }
    });

    // LifePlan doesn't have status field, so count all life plans as goals
    const activeLifePlanGoals = await LifePlan.countDocuments({
      user: userId
    });

    const activeGoals = activeChallenges + activeLifePlanGoals;

    // 4. Module-specific stats
    // Earnings & Expenses
    const transactions = await transactionModel.find({ user: userId });
    const totalBalance = transactions.reduce((acc, transaction) => {
      return transaction.type === "earning" 
        ? acc + transaction.amount 
        : acc - transaction.amount;
    }, 0);

    // Challenges
    const challengeStats = {
      active: activeChallenges,
      completed: completedTasks,
      total: await challengeModel.countDocuments({ userId: userId })
    };

    // Life Plan
    const lifePlanStats = {
      goalsSet: await LifePlan.countDocuments({ user: userId }),
      active: activeLifePlanGoals,
      completed: 0 // LifePlan doesn't have status field
    };

    // Study Materials
    const studyStats = {
      resources: await studyMaterialModel.countDocuments({ user: userId }),
      categories: await studyMaterialModel.distinct("type", { user: userId }).length // Use type instead of category
    };

    // Projects (using daily schedule entries as project tasks)
    const projectStats = {
      activeProjects: 0, // DailySchedule doesn't have project type, set to 0 for now
      totalTasks: await DailySchedule.countDocuments({ userId: userId })
    };

    // 5. Recent activity data
    const recentChallenges = await challengeModel.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name status createdAt updatedAt");

    const recentTransactions = await transactionModel.find({ user: userId })
      .sort({ date: -1 })
      .limit(5)
      .select("description amount type date");

    res.json({
      success: true,
      data: {
        quickStats: {
          monthlyProgress,
          completedTasks,
          activeGoals
        },
        moduleStats: {
          earnings: {
            totalBalance: totalBalance.toFixed(2),
            transactionCount: transactions.length
          },
          challenges: challengeStats,
          lifePlan: lifePlanStats,
          study: studyStats,
          projects: projectStats
        },
        recentActivity: {
          challenges: recentChallenges,
          transactions: recentTransactions
        }
      }
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500);
    throw new Error("Error fetching dashboard statistics");
  }
});

// @desc    Get motivational slogans
// @route   GET /api/dashboard/slogans
// @access  Private
const getMotivationalSlogans = asyncHandler(async (req, res) => {
  // For now, return default slogans. This can be made dynamic later
  const defaultSlogans = [
    "One Life. One System. No Excuses.",
    "Designing My Life with Discipline, Not Luck.",
    "From Chaos to Control — One Day at a Time.",
    "Built for Growth. Run by Discipline.",
    "I Track. I Improve. I Win."
  ];

  res.json({
    success: true,
    data: {
      slogans: defaultSlogans
    }
  });
});

// @desc    Get user progress overview
// @route   GET /api/dashboard/progress
// @access  Private
const getProgressOverview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  try {
    // Get monthly progress data for the last 6 months
    const monthlyData = [];
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const completedInMonth = await challengeModel.countDocuments({
        userId: userId,
        status: "completed",
        updatedAt: { 
          $gte: monthDate,
          $lte: monthEnd
        }
      });

      monthlyData.push({
        month: monthDate.toLocaleString('default', { month: 'short' }),
        year: monthDate.getFullYear(),
        completedTasks: completedInMonth
      });
    }

    // Category-wise progress
    const challengeCategories = await challengeModel.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const financialProgress = await transactionModel.aggregate([
      { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        monthlyProgress: monthlyData.reverse(),
        categoryBreakdown: challengeCategories,
        financialOverview: financialProgress
      }
    });

  } catch (error) {
    console.error("Progress Overview Error:", error);
    res.status(500);
    throw new Error("Error fetching progress overview");
  }
});

module.exports = {
  getDashboardStats,
  getMotivationalSlogans,
  getProgressOverview
};
