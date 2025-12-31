import { supabaseService } from "./supabaseService";
import { supabase } from "@/lib/supabase";

export const gamificationService = {
  async getUserLevel(userId) {
    try {
      const data = await supabaseService.filter("user_levels", { user_id: userId });
      
      if (data && data.length > 0) {
        return data[0];
      }

      // Return default if no record exists
      return {
        level: 1,
        current_xp: 0,
        xp_to_next_level: 100,
        total_xp: 0,
      };
    } catch (error) {
      console.error("Error getting user level:", error);
      return {
        level: 1,
        current_xp: 0,
        xp_to_next_level: 100,
        total_xp: 0,
      };
    }
  },

  async addXP(userId, amount, reason = "activity") {
    try {
      // Get current level
      const currentLevel = await this.getUserLevel(userId);

      const newTotalXP = (currentLevel.total_xp || 0) + amount;
      const newCurrentXP = (currentLevel.current_xp || 0) + amount;

      // Calculate if level up
      let newLevel = currentLevel.level || 1;
      let xpToNextLevel = currentLevel.xp_to_next_level || 100;
      let remainingXP = newCurrentXP;

      while (remainingXP >= xpToNextLevel) {
        remainingXP -= xpToNextLevel;
        newLevel += 1;
        xpToNextLevel = Math.floor(xpToNextLevel * 1.5); // Exponential growth
      }

      // Update or insert level
      const existing = await supabaseService.filter("user_levels", { user_id: userId });
      
      if (existing && existing.length > 0) {
        await supabaseService.update("user_levels", existing[0].id, {
          level: newLevel,
          current_xp: remainingXP,
          xp_to_next_level: xpToNextLevel,
          total_xp: newTotalXP,
          updated_at: new Date().toISOString(),
        });
      } else {
        await supabaseService.create("user_levels", {
          user_id: userId,
          level: newLevel,
          current_xp: remainingXP,
          xp_to_next_level: xpToNextLevel,
          total_xp: newTotalXP,
        });
      }

      return {
        level: newLevel,
        current_xp: remainingXP,
        xp_to_next_level: xpToNextLevel,
        total_xp: newTotalXP,
        leveledUp: newLevel > currentLevel.level,
      };
    } catch (error) {
      console.error("Error adding XP:", error);
      throw error;
    }
  },

  async getUserBadges(userId) {
    try {
      const data = await supabaseService.filter("user_badges", { user_id: userId });
      return data || [];
    } catch (error) {
      console.error("Error getting user badges:", error);
      return [];
    }
  },

  async getDailyMotivation(language = "nl") {
    try {
      const { data, error } = await supabase
        .from("daily_motivations")
        .select("*")
        .eq("language", language)
        .eq("active", true)
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data || {
        quote: "Kleine stappen leiden tot grote resultaten.",
        author: null,
      };
    } catch (error) {
      console.error("Error getting daily motivation:", error);
      return {
        quote: "Kleine stappen leiden tot grote resultaten.",
        author: null,
      };
    }
  },

  async getWeekGoal(userId) {
    try {
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      weekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("week_goals")
        .select("*")
        .eq("user_id", userId)
        .gte("week_start", weekStart.toISOString().split("T")[0])
        .order("week_start", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error("Error getting week goal:", error);
      return null;
    }
  },

  async updateWeekGoalProgress(userId, amount) {
    try {
      const goal = await this.getWeekGoal(userId);
      if (!goal) return null;

      const newProgress = (goal.current_progress || 0) + amount;
      const percentage = goal.target_amount > 0 ? (newProgress / goal.target_amount) * 100 : 0;

      const updated = await supabaseService.update("week_goals", goal.id, {
        current_progress: newProgress,
        percentage: Math.min(percentage, 100),
        updated_at: new Date().toISOString(),
      });

      return updated;
    } catch (error) {
      console.error("Error updating week goal progress:", error);
      throw error;
    }
  },
};

