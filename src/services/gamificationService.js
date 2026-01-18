import { supabaseService } from "./supabaseService";
import { supabase } from "@/lib/supabase";

// XP reward amounts
export const XP_REWARDS = {
  DAILY_LOGIN: 5,
  DEBT_ADDED: 10,
  SUMMARY_VIEWED: 10, // Viewing monthly summary in Cent voor Cent
  PAYMENT_ARRANGEMENT_STARTED: 20,
  PAYMENT_MADE: 25,
  EXTRA_PAYMENT_MADE: 35, // Bonus for extra payments beyond regular schedule
  FIXED_COST_PAID: 5,
  DEBT_FULLY_PAID: 100,
};

// Dutch descriptions for XP reasons
export const XP_REASON_DESCRIPTIONS = {
  daily_login: 'Dagelijkse login',
  debt_added: 'Schuld toegevoegd',
  summary_viewed: 'Maandoverzicht bekeken',
  payment_arrangement_started: 'Betalingsregeling gestart',
  payment_made: 'Betaling gedaan',
  extra_payment_made: 'Extra betaling gedaan',
  fixed_cost_paid: 'Vaste lasten betaald',
  debt_fully_paid: 'Schuld volledig afgelost',
  badge_first_debt_added: 'Badge: Eerste Stap',
  badge_first_payment: 'Badge: Betaler',
  badge_first_debt_cleared: 'Badge: Schuldenvrij',
  badge_streak_7: 'Badge: Weekstrijder',
  badge_streak_30: 'Badge: Maandheld',
  badge_streak_100: 'Badge: Consistentie Kampioen',
  badge_debt_count_3: 'Badge: Overzichthouder',
  badge_debt_count_5: 'Badge: Schuldenmeester',
  badge_payments_10: 'Badge: Trouwe Betaler',
  badge_payments_50: 'Badge: Betalingskoning',
  badge_extra_payment: 'Badge: Overachiever',
  badge_all_fixed_costs_paid: 'Badge: Vaste Lasten Held',
  badge_level_5: 'Badge: Gevorderde',
  badge_level_10: 'Badge: Expert',
  badge_level_20: 'Badge: Meester',
};

// All available badges
export const BADGES = {
  // Milestone badges
  FIRST_DEBT_ADDED: {
    id: "first_debt_added",
    name: "Eerste Stap",
    description: "Je eerste schuld geregistreerd",
    icon: "flag",
    color: "emerald",
    xpBonus: 25,
  },
  FIRST_PAYMENT: {
    id: "first_payment",
    name: "Betaler",
    description: "Je eerste betaling gemaakt",
    icon: "payments",
    color: "blue",
    xpBonus: 25,
  },
  FIRST_DEBT_CLEARED: {
    id: "first_debt_cleared",
    name: "Schuldenvrij",
    description: "Je eerste schuld volledig afgelost",
    icon: "celebration",
    color: "amber",
    xpBonus: 100,
  },
  // Streak badges
  STREAK_7: {
    id: "streak_7",
    name: "Weekstrijder",
    description: "7 dagen op rij ingelogd",
    icon: "local_fire_department",
    color: "orange",
    xpBonus: 50,
  },
  STREAK_30: {
    id: "streak_30",
    name: "Maandheld",
    description: "30 dagen op rij ingelogd",
    icon: "whatshot",
    color: "red",
    xpBonus: 150,
  },
  STREAK_100: {
    id: "streak_100",
    name: "Consistentie Kampioen",
    description: "100 dagen op rij ingelogd",
    icon: "local_fire_department",
    color: "purple",
    xpBonus: 500,
  },
  // Progress badges
  DEBT_COUNT_3: {
    id: "debt_count_3",
    name: "Overzichthouder",
    description: "3 schulden geregistreerd",
    icon: "format_list_numbered",
    color: "cyan",
    xpBonus: 30,
  },
  DEBT_COUNT_5: {
    id: "debt_count_5",
    name: "Schuldenmeester",
    description: "5 schulden geregistreerd",
    icon: "rule",
    color: "indigo",
    xpBonus: 50,
  },
  PAYMENTS_10: {
    id: "payments_10",
    name: "Trouwe Betaler",
    description: "10 betalingen gemaakt",
    icon: "verified",
    color: "teal",
    xpBonus: 75,
  },
  PAYMENTS_50: {
    id: "payments_50",
    name: "Betalingskoning",
    description: "50 betalingen gemaakt",
    icon: "workspace_premium",
    color: "amber",
    xpBonus: 200,
  },
  // Special badges
  EXTRA_PAYMENT: {
    id: "extra_payment",
    name: "Overachiever",
    description: "Een extra betaling bovenop je regeling",
    icon: "add_task",
    color: "green",
    xpBonus: 40,
  },
  ALL_FIXED_COSTS_PAID: {
    id: "all_fixed_costs_paid",
    name: "Vaste Lasten Held",
    description: "Alle vaste lasten van de maand betaald",
    icon: "task_alt",
    color: "blue",
    xpBonus: 50,
  },
  // Level badges
  LEVEL_5: {
    id: "level_5",
    name: "Gevorderde",
    description: "Level 5 bereikt",
    icon: "trending_up",
    color: "blue",
    xpBonus: 50,
  },
  LEVEL_10: {
    id: "level_10",
    name: "Expert",
    description: "Level 10 bereikt",
    icon: "star",
    color: "amber",
    xpBonus: 100,
  },
  LEVEL_20: {
    id: "level_20",
    name: "Meester",
    description: "Level 20 bereikt",
    icon: "military_tech",
    color: "purple",
    xpBonus: 250,
  },
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

      // Create XP notification
      const reasonDescription = XP_REASON_DESCRIPTIONS[reason] || reason;
      const leveledUp = newLevel > currentLevel.level;

      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'achievement',
          title: leveledUp
            ? `🎉 Level Up! Je bent nu level ${newLevel}!`
            : `+${amount} XP verdiend!`,
          message: leveledUp
            ? `${reasonDescription} - Je hebt ${amount} XP verdiend en bent gestegen naar level ${newLevel}!`
            : `${reasonDescription}`,
          is_read: false,
        });
      } catch (notifError) {
        // Don't fail the XP award if notification fails
        console.warn('Could not create XP notification:', notifError);
      }

      return {
        level: newLevel,
        current_xp: remainingXP,
        xp_to_next_level: xpToNextLevel,
        total_xp: newTotalXP,
        leveledUp: leveledUp,
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

  async awardBadge(userId, badgeKey) {
    try {
      const badge = BADGES[badgeKey];
      if (!badge) {
        console.error("Badge not found:", badgeKey);
        return { awarded: false };
      }

      // Check if user already has this badge
      const existingBadges = await this.getUserBadges(userId);
      if (existingBadges.some(b => b.badge_type === badge.id)) {
        return { awarded: false, alreadyHas: true };
      }

      // Award the badge
      await supabaseService.create("user_badges", {
        user_id: userId,
        badge_type: badge.id,
        awarded_at: new Date().toISOString(),
      });

      // Award bonus XP if badge has xpBonus
      if (badge.xpBonus) {
        await this.addXP(userId, badge.xpBonus, `badge_${badge.id}`);
      }

      return { awarded: true, badge, xpBonus: badge.xpBonus || 0 };
    } catch (error) {
      console.error("Error awarding badge:", error);
      return { awarded: false };
    }
  },

  async checkAndAwardBadges(userId, context = {}) {
    const awardedBadges = [];

    try {
      const existingBadges = await this.getUserBadges(userId);
      const hasBadge = (badgeId) => existingBadges.some(b => b.badge_type === badgeId);

      // Check streak badges
      if (context.loginStreak) {
        if (context.loginStreak >= 7 && !hasBadge("streak_7")) {
          const result = await this.awardBadge(userId, "STREAK_7");
          if (result.awarded) awardedBadges.push(result.badge);
        }
        if (context.loginStreak >= 30 && !hasBadge("streak_30")) {
          const result = await this.awardBadge(userId, "STREAK_30");
          if (result.awarded) awardedBadges.push(result.badge);
        }
        if (context.loginStreak >= 100 && !hasBadge("streak_100")) {
          const result = await this.awardBadge(userId, "STREAK_100");
          if (result.awarded) awardedBadges.push(result.badge);
        }
      }

      // Check level badges
      if (context.level) {
        if (context.level >= 5 && !hasBadge("level_5")) {
          const result = await this.awardBadge(userId, "LEVEL_5");
          if (result.awarded) awardedBadges.push(result.badge);
        }
        if (context.level >= 10 && !hasBadge("level_10")) {
          const result = await this.awardBadge(userId, "LEVEL_10");
          if (result.awarded) awardedBadges.push(result.badge);
        }
        if (context.level >= 20 && !hasBadge("level_20")) {
          const result = await this.awardBadge(userId, "LEVEL_20");
          if (result.awarded) awardedBadges.push(result.badge);
        }
      }

      // Check debt count badges
      if (context.debtCount !== undefined) {
        if (context.debtCount >= 1 && !hasBadge("first_debt_added")) {
          const result = await this.awardBadge(userId, "FIRST_DEBT_ADDED");
          if (result.awarded) awardedBadges.push(result.badge);
        }
        if (context.debtCount >= 3 && !hasBadge("debt_count_3")) {
          const result = await this.awardBadge(userId, "DEBT_COUNT_3");
          if (result.awarded) awardedBadges.push(result.badge);
        }
        if (context.debtCount >= 5 && !hasBadge("debt_count_5")) {
          const result = await this.awardBadge(userId, "DEBT_COUNT_5");
          if (result.awarded) awardedBadges.push(result.badge);
        }
      }

      // Check payment count badges
      if (context.paymentCount !== undefined) {
        if (context.paymentCount >= 1 && !hasBadge("first_payment")) {
          const result = await this.awardBadge(userId, "FIRST_PAYMENT");
          if (result.awarded) awardedBadges.push(result.badge);
        }
        if (context.paymentCount >= 10 && !hasBadge("payments_10")) {
          const result = await this.awardBadge(userId, "PAYMENTS_10");
          if (result.awarded) awardedBadges.push(result.badge);
        }
        if (context.paymentCount >= 50 && !hasBadge("payments_50")) {
          const result = await this.awardBadge(userId, "PAYMENTS_50");
          if (result.awarded) awardedBadges.push(result.badge);
        }
      }

      // Check special badges
      if (context.debtCleared && !hasBadge("first_debt_cleared")) {
        const result = await this.awardBadge(userId, "FIRST_DEBT_CLEARED");
        if (result.awarded) awardedBadges.push(result.badge);
      }

      if (context.extraPayment && !hasBadge("extra_payment")) {
        const result = await this.awardBadge(userId, "EXTRA_PAYMENT");
        if (result.awarded) awardedBadges.push(result.badge);
      }

      if (context.allFixedCostsPaid && !hasBadge("all_fixed_costs_paid")) {
        const result = await this.awardBadge(userId, "ALL_FIXED_COSTS_PAID");
        if (result.awarded) awardedBadges.push(result.badge);
      }
    } catch (error) {
      console.error("Error checking badges:", error);
    }

    return awardedBadges;
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
      const { data: existingLogin, error: selectError } = await supabase
        .from("user_login_history")
        .select("*")
        .eq("user_id", userId)
        .eq("login_date", today)
        .maybeSingle();

      // If there's an existing login record, no XP
      if (existingLogin) {
        return { xpAwarded: false, xpAmount: 0 };
      }

      // Record today's login - use upsert to handle race conditions
      const { error: insertError } = await supabase.from("user_login_history").upsert(
        {
          user_id: userId,
          login_date: today,
        },
        { onConflict: 'user_id,login_date', ignoreDuplicates: true }
      );

      // If insert failed (e.g., duplicate or permission error), don't award XP
      if (insertError) {
        console.warn("Could not record login:", insertError.message);
        return { xpAwarded: false, xpAmount: 0 };
      }

      // Award XP for daily login
      const result = await this.addXP(userId, XP_REWARDS.DAILY_LOGIN, "daily_login");

      return { xpAwarded: true, xpAmount: XP_REWARDS.DAILY_LOGIN, ...result };
    } catch (error) {
      console.error("Error recording daily login:", error);
      return { xpAwarded: false, xpAmount: 0 };
    }
  },

  // Record summary view and award XP if first view today
  async recordSummaryView(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if already viewed today in database
      const { data: existingView } = await supabase
        .from("user_summary_views")
        .select("*")
        .eq("user_id", userId)
        .eq("view_date", today)
        .maybeSingle();

      // If already viewed today, no XP
      if (existingView) {
        return { xpAwarded: false, xpAmount: 0 };
      }

      // Record today's view - use upsert to handle race conditions
      const { error: insertError } = await supabase.from("user_summary_views").upsert(
        {
          user_id: userId,
          view_date: today,
        },
        { onConflict: 'user_id,view_date', ignoreDuplicates: true }
      );

      // If insert failed, don't award XP
      if (insertError) {
        console.warn("Could not record summary view:", insertError.message);
        return { xpAwarded: false, xpAmount: 0 };
      }

      // Award XP
      const result = await this.addXP(userId, XP_REWARDS.SUMMARY_VIEWED, "summary_viewed");

      return { xpAwarded: true, xpAmount: XP_REWARDS.SUMMARY_VIEWED, ...result };
    } catch (error) {
      console.error("Error recording summary view:", error);
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

