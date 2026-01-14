import { useEffect, useState, useCallback, useRef } from "react";
import DailyIframe from "@daily-co/daily-js";
import { supabase } from "@/lib/supabase";

/**
 * Hook to manage Daily.co video calls
 * @returns {Object} Video call state and controls
 */
export function useVideoCall() {
  const [callObject, setCallObject] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCamEnabled, setIsCamEnabled] = useState(true);

  // Initialize Daily call object
  const initializeCall = useCallback(() => {
    if (callObject) return callObject;

    const newCallObject = DailyIframe.createCallObject({
      subscribeToTracksAutomatically: true,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
      },
    });

    setCallObject(newCallObject);
    return newCallObject;
  }, [callObject]);

  // Join a call
  const joinCall = useCallback(
    async (roomUrl) => {
      setIsLoading(true);
      setError(null);

      try {
        const call = initializeCall();

        // Set up event listeners
        call.on("joined-meeting", () => {
          setIsJoined(true);
          setIsLoading(false);
        });

        call.on("left-meeting", () => {
          setIsJoined(false);
          setParticipants([]);
        });

        call.on("participant-joined", (event) => {
          if (event?.participant) {
            setParticipants((prev) => [...prev, event.participant]);
          }
        });

        call.on("participant-left", (event) => {
          if (event?.participant) {
            setParticipants((prev) =>
              prev.filter((p) => p.session_id !== event.participant.session_id)
            );
          }
        });

        call.on("participant-updated", (event) => {
          if (event?.participant) {
            setParticipants((prev) =>
              prev.map((p) =>
                p.session_id === event.participant.session_id
                  ? event.participant
                  : p
              )
            );
          }
        });

        call.on("error", (event) => {
          setError(event?.errorMsg || "Er is een fout opgetreden");
          setIsLoading(false);
        });

        // Join the call
        await call.join({ url: roomUrl });

        // Get initial participants
        const currentParticipants = call.participants();
        setParticipants(Object.values(currentParticipants));
      } catch (err) {
        setError(err?.message || "Kon niet deelnemen aan gesprek");
        setIsLoading(false);
      }
    },
    [initializeCall]
  );

  // Leave the call
  const leaveCall = useCallback(async () => {
    if (callObject) {
      await callObject.leave();
      await callObject.destroy();
      setCallObject(null);
      setIsJoined(false);
      setParticipants([]);
    }
  }, [callObject]);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (callObject) {
      callObject.setLocalAudio(!isMicEnabled);
      setIsMicEnabled(!isMicEnabled);
    }
  }, [callObject, isMicEnabled]);

  // Toggle camera
  const toggleCam = useCallback(() => {
    if (callObject) {
      callObject.setLocalVideo(!isCamEnabled);
      setIsCamEnabled(!isCamEnabled);
    }
  }, [callObject, isCamEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callObject) {
        callObject.destroy();
      }
    };
  }, [callObject]);

  return {
    callObject,
    participants,
    isJoined,
    isLoading,
    error,
    isMicEnabled,
    isCamEnabled,
    joinCall,
    leaveCall,
    toggleMic,
    toggleCam,
  };
}

/**
 * Hook to get scheduled video calls for a client (jongere)
 * @param {string|null} userId - The current user's ID
 * @returns {Object} Scheduled calls and loading state
 */
export function useClientVideoCalls(userId) {
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [activeCalls, setActiveCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCalls = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const now = new Date().toISOString();

      // Fetch upcoming calls for this client
      const { data: upcoming, error: upcomingError } = await supabase
        .from("coach_video_calls")
        .select("*, coach:coaches(*)")
        .eq("client_user_id", userId)
        .gte("scheduled_for", now)
        .in("status", ["gepland", "actief"])
        .order("scheduled_for", { ascending: true });

      if (upcomingError) {
        console.error("Error fetching upcoming calls:", upcomingError);
      } else {
        // Separate active from upcoming
        const active = (upcoming || []).filter((c) => c.status === "actief");
        const scheduled = (upcoming || []).filter((c) => c.status === "gepland");
        setActiveCalls(active);
        setUpcomingCalls(scheduled);
      }
    } catch (error) {
      console.error("Error in useClientVideoCalls:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchCalls();

    // Subscribe to changes in video calls for this user
    const channel = supabase
      .channel(`client-video-calls-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "coach_video_calls",
          filter: `client_user_id=eq.${userId}`,
        },
        () => {
          fetchCalls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchCalls]);

  return {
    upcomingCalls,
    activeCalls,
    loading,
    refetch: fetchCalls,
  };
}
