import { supabaseService } from "./supabaseService";
import { supabase } from "@/lib/supabase";

// XP reward amounts
export const XP_REWARDS = {
  DAILY_LOGIN: 5,
  DEBT_ADDED: 10,
  PAYMENT_ARRANGEMENT_STARTED: 20,
  PAYMENT_MADE: 25,
  DEBT_FULLY_PAID: 100,
};

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

  // Record daily login and award XP if first login today
  async recordDailyLogin(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if already logged in today
      const { data: existingLogin } = await supabase
        .from("user_login_history")
        .select("*")
        .eq("user_id", userId)
        .eq("login_date", today)
        .single();

      if (existingLogin) {
        // Already logged in today, no XP
        return { xpAwarded: false, xpAmount: 0 };
      }

      // Record today's login
      await supabase.from("user_login_history").insert({
        user_id: userId,
        login_date: today,
      });

      // Award XP for daily login
      const result = await this.addXP(userId, XP_REWARDS.DAILY_LOGIN, "daily_login");

      return { xpAwarded: true, xpAmount: XP_REWARDS.DAILY_LOGIN, ...result };
    } catch (error) {
      console.error("Error recording daily login:", error);
      return { xpAwarded: false, xpAmount: 0 };
    }
  },

  // Calculate login streak
  async getLoginStreak(userId) {
    try {
      const { data: logins } = await supabase
        .from("user_login_history")
        .select("login_date")
        .eq("user_id", userId)
        .order("login_date", { ascending: false })
        .limit(30);

      if (!logins || logins.length === 0) return 0;

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < logins.length; i++) {
        const loginDate = new Date(logins[i].login_date);
        loginDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);

        if (loginDate.getTime() === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error("Error getting login streak:", error);
      return 0;
    }
  },
};

