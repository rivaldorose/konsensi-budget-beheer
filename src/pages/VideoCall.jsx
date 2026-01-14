import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User } from "@/api/entities";
import { useVideoCall, useClientVideoCalls } from "@/hooks/useVideoCall";
import { useCoachRelation } from "@/hooks/useCoachChat";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Calendar,
  MonitorUp,
  MessageSquare,
  User as UserIcon,
} from "lucide-react";

// Format date and time in Dutch
function formatCallTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Check if call can be joined (within 15 min before or 30 min after scheduled time)
function canJoinCall(scheduledFor) {
  const now = new Date();
  const callTime = new Date(scheduledFor);
  const diffMs = callTime.getTime() - now.getTime();
  const diffMins = diffMs / 1000 / 60;
  return diffMins <= 15 && diffMins >= -30;
}

// Video Room Component with new design
function VideoRoom({ roomUrl, userName, coachName, coachAvatar, onLeave }) {
  const {
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
  } = useVideoCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showPipControls, setShowPipControls] = useState(false);
  const callStartTimeRef = useRef(null);

  // Join call on mount
  useEffect(() => {
    if (roomUrl && !isJoined && !isLoading) {
      joinCall(roomUrl);
    }
  }, [roomUrl, isJoined, isLoading, joinCall]);

  // Start timer when joined
  useEffect(() => {
    if (isJoined && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
    }
  }, [isJoined]);

  // Update call duration
  useEffect(() => {
    if (!isJoined) return;

    const interval = setInterval(() => {
      if (callStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isJoined]);

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle local video track
  useEffect(() => {
    if (callObject && localVideoRef.current) {
      const localParticipant = callObject.participants().local;
      if (localParticipant?.tracks?.video?.track) {
        const stream = new MediaStream([localParticipant.tracks.video.track]);
        localVideoRef.current.srcObject = stream;
      }
    }
  }, [callObject, participants, isCamEnabled]);

  // Handle remote video track
  useEffect(() => {
    if (callObject && remoteVideoRef.current) {
      const remoteParticipants = Object.values(callObject.participants()).filter(
        (p) => !p.local
      );
      if (remoteParticipants.length > 0) {
        const remoteParticipant = remoteParticipants[0];
        if (remoteParticipant?.tracks?.video?.track) {
          const stream = new MediaStream([remoteParticipant.tracks.video.track]);
          remoteVideoRef.current.srcObject = stream;
        }
      }
    }
  }, [callObject, participants]);

  // Handle leave
  const handleLeave = async () => {
    await leaveCall();
    onLeave?.();
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!callObject) return;

    try {
      if (isScreenSharing) {
        await callObject.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        await callObject.startScreenShare();
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  // Get remote participant info
  const remoteParticipants = participants.filter((p) => !p.local);
  const remoteParticipant = remoteParticipants[0];
  const displayName = coachName || remoteParticipant?.user_name || "Coach";

  // Get coach initials
  const coachInitials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CO";

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-[#0a0a0a] rounded-2xl p-8">
        <div className="text-red-500 mb-4">
          <VideoOff className="w-16 h-16" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Fout bij verbinden
        </h2>
        <p className="text-gray-600 dark:text-[#a1a1a1] text-center mb-6">{error}</p>
        <Button
          onClick={() => joinCall(roomUrl)}
          className="bg-primary hover:bg-[#0da672] text-[#0d1b17] dark:text-black"
        >
          Opnieuw proberen
        </Button>
      </div>
    );
  }

  if (isLoading || !isJoined) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-[#0a0a0a] rounded-2xl p-8">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-600 dark:text-[#a1a1a1]">Verbinden met gesprek...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="video-call-container relative w-full h-full min-h-[500px] bg-gray-900 dark:bg-[#0a0a0a] rounded-2xl overflow-hidden"
    >
      {/* Main Video (Remote Participant) */}
      <div className="main-video absolute inset-0">
        {remoteParticipant ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 dark:bg-[#1a1a1a]">
            <Avatar className="w-32 h-32 mb-6">
              <AvatarImage src={coachAvatar} />
              <AvatarFallback className="bg-primary text-[#0d1b17] dark:text-black text-3xl font-bold">
                {coachInitials}
              </AvatarFallback>
            </Avatar>
            <p className="text-white/80 text-xl">Wachten op {displayName}...</p>
          </div>
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* Header with call info */}
      <div className="call-header absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30">
            <AvatarImage src={coachAvatar} />
            <AvatarFallback className="bg-primary text-[#0d1b17] dark:text-black text-sm sm:text-base font-bold">
              {coachInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-white font-semibold text-base sm:text-lg">{displayName}</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/70 text-xs sm:text-sm">Verbonden</span>
            </div>
          </div>
        </div>
        <div className="call-timer bg-black/30 backdrop-blur-md rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-mono text-sm sm:text-lg">{formatDuration(callDuration)}</span>
        </div>
      </div>

      {/* Self-view PIP */}
      <div
        className="pip-container absolute bottom-24 sm:bottom-28 right-4 sm:right-6 w-[120px] sm:w-[180px] h-[90px] sm:h-[135px] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 transition-all duration-300 hover:scale-105 group cursor-pointer z-10"
        onMouseEnter={() => setShowPipControls(true)}
        onMouseLeave={() => setShowPipControls(false)}
        onTouchStart={() => setShowPipControls(!showPipControls)}
      >
        {isCamEnabled ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700 dark:bg-[#2a2a2a]">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
              <AvatarFallback className="bg-primary text-[#0d1b17] dark:text-black text-sm font-bold">
                {userName?.[0]?.toUpperCase() || "JIJ"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 bg-black/50 backdrop-blur-sm rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 text-white text-[10px] sm:text-xs font-medium">
          Jij
        </div>

        {/* PIP Hover Controls */}
        <div className={`pip-controls absolute inset-0 bg-black/50 flex items-center justify-center gap-2 sm:gap-3 transition-opacity duration-200 ${showPipControls ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={toggleMic}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            {isMicEnabled ? (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            ) : (
              <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            )}
          </button>
          <button
            onClick={toggleCam}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            {isCamEnabled ? (
              <Video className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            ) : (
              <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            )}
          </button>
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className="control-bar absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] sm:w-auto">
        <div className="controls-inner bg-white/10 dark:bg-black/40 backdrop-blur-xl rounded-xl sm:rounded-2xl px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-4 border border-white/10 shadow-2xl">
          {/* Mic Button */}
          <div className="control-wrapper group relative">
            <button
              onClick={toggleMic}
              className={`control-btn w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 ${
                isMicEnabled
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {isMicEnabled ? (
                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
            <div className="tooltip hidden sm:block absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {isMicEnabled ? "Microfoon uit" : "Microfoon aan"}
            </div>
          </div>

          {/* Video Button */}
          <div className="control-wrapper group relative">
            <button
              onClick={toggleCam}
              className={`control-btn w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-200 ${
                isCamEnabled
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {isCamEnabled ? (
                <Video className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
            <div className="tooltip hidden sm:block absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {isCamEnabled ? "Camera uit" : "Camera aan"}
            </div>
          </div>

          {/* Screen Share Button - Hidden on mobile */}
          <div className="control-wrapper group relative hidden sm:block">
            <button
              onClick={toggleScreenShare}
              className={`control-btn w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isScreenSharing
                  ? "bg-primary hover:bg-[#0da672] text-[#0d1b17] dark:text-black"
                  : "bg-white/20 hover:bg-white/30 text-white"
              }`}
            >
              <MonitorUp className="w-6 h-6" />
            </button>
            <div className="tooltip absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {isScreenSharing ? "Stop delen" : "Scherm delen"}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 sm:h-10 bg-white/20 mx-1 sm:mx-2" />

          {/* End Call Button */}
          <div className="control-wrapper group relative">
            <button
              onClick={handleLeave}
              className="control-btn end-call w-12 h-11 sm:w-16 sm:h-14 rounded-lg sm:rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200"
            >
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="tooltip hidden sm:block absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Gesprek beëindigen
            </div>
          </div>

          {/* Fullscreen Button */}
          <div className="control-wrapper group relative">
            <button
              onClick={toggleFullscreen}
              className="control-btn w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
            <div className="tooltip hidden sm:block absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {isFullscreen ? "Volledig scherm uit" : "Volledig scherm"}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .video-call-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .pip-container:hover {
          border-color: rgba(255, 255, 255, 0.4);
        }

        .control-btn:active {
          transform: scale(0.95);
        }

        .end-call:hover {
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Main VideoCall Page Component
export default function VideoCallPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [activeRoomUrl, setActiveRoomUrl] = useState(null);
  const [activeCoach, setActiveCoach] = useState(null);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        if (!userData) {
          navigate("/login");
          return;
        }
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
        navigate("/login");
      }
    };
    loadUser();
  }, [navigate]);

  // Get coach relation
  const { hasCoach, coach, loading: coachLoading } = useCoachRelation(user?.id);

  // Get video calls
  const { upcomingCalls, activeCalls, loading: callsLoading } = useClientVideoCalls(
    user?.id
  );

  // Check if there's a room URL in query params (direct join link)
  useEffect(() => {
    const roomUrl = searchParams.get("room");
    if (roomUrl) {
      setActiveRoomUrl(roomUrl);
    }
  }, [searchParams]);

  // Auto-join if there's an active call
  useEffect(() => {
    if (activeCalls.length > 0 && !activeRoomUrl) {
      const call = activeCalls[0];
      if (call.room_url) {
        setActiveRoomUrl(call.room_url);
        setActiveCoach(call.coach);
      }
    }
  }, [activeCalls, activeRoomUrl]);

  // Handle joining a call
  const handleJoinCall = (call) => {
    if (call.room_url) {
      setActiveRoomUrl(call.room_url);
      setActiveCoach(call.coach);
    }
  };

  // Handle leaving a call
  const handleLeaveCall = () => {
    setActiveRoomUrl(null);
    setActiveCoach(null);
    navigate("/VideoCall");
  };

  // Get user name
  const userName = user?.voornaam || user?.full_name || "Jij";

  // Loading state
  if (coachLoading || callsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400 dark:border-[#3a3a3a] mx-auto"></div>
          <p className="text-gray-600 dark:text-[#a1a1a1] text-sm mt-4">Laden...</p>
        </div>
      </div>
    );
  }

  // No coach assigned
  if (!hasCoach || !coach) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-full p-6 mb-6">
          <Video className="w-16 h-16 text-gray-400 dark:text-[#6b7280]" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Nog geen coach toegewezen
        </h1>
        <p className="text-gray-600 dark:text-[#a1a1a1] max-w-md mb-6">
          Je hebt nog geen budgetcoach of bewindvoerder toegewezen gekregen. Zodra
          je gekoppeld bent, kun je hier video gesprekken voeren.
        </p>
        <Button
          onClick={() => navigate("/Dashboard")}
          className="bg-primary hover:bg-[#0da672] text-[#0d1b17] dark:text-black font-bold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar Dashboard
        </Button>
      </div>
    );
  }

  // Active video call
  if (activeRoomUrl) {
    const coachName = activeCoach?.name || coach?.name || "Coach";
    const coachAvatar = activeCoach?.avatar_url || coach?.avatar_url;

    return (
      <div className="h-[calc(100vh-8rem)]">
        <VideoRoom
          roomUrl={activeRoomUrl}
          userName={userName}
          coachName={coachName}
          coachAvatar={coachAvatar}
          onLeave={handleLeaveCall}
        />
      </div>
    );
  }

  // Get coach info
  const coachName = coach?.name || "Jouw Coach";
  const coachInitials = coachName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Video Gesprekken
          </h1>
          <p className="text-gray-600 dark:text-[#a1a1a1] mt-1">
            Praat face-to-face met je coach
          </p>
        </div>
      </div>

      {/* Coach Info Card */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-6">
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={coach?.avatar_url} />
            <AvatarFallback className="bg-primary text-[#0d1b17] dark:text-black text-xl font-bold">
              {coachInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {coachName}
            </h3>
            <p className="text-gray-600 dark:text-[#a1a1a1]">
              {coach?.organization || "Jouw budgetcoach"}
            </p>
          </div>
        </div>
      </div>

      {/* Active Calls */}
      {activeCalls.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  Actief gesprek
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Je coach wacht op je
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleJoinCall(activeCalls[0])}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Video className="w-4 h-4 mr-2" />
              Nu deelnemen
            </Button>
          </div>
        </div>
      )}

      {/* Upcoming Calls */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-[#2a2a2a]">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Geplande gesprekken
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
          {upcomingCalls.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 dark:text-[#6b7280] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-[#a1a1a1]">
                Geen geplande gesprekken
              </p>
              <p className="text-sm text-gray-500 dark:text-[#6b7280] mt-1">
                Je coach zal een gesprek met je plannen
              </p>
            </div>
          ) : (
            upcomingCalls.map((call) => {
              const canJoin = canJoinCall(call.scheduled_for);

              return (
                <div
                  key={call.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 dark:bg-primary/20 rounded-full p-3">
                      <Video className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Video gesprek met {call.coach?.name || coachName}
                      </p>
                      <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-[#a1a1a1]">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatCallTime(call.scheduled_for)}
                        </span>
                      </div>
                      {call.notes && (
                        <p className="text-sm text-gray-500 dark:text-[#6b7280] mt-1">
                          {call.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  {canJoin ? (
                    <Button
                      onClick={() => handleJoinCall(call)}
                      className="bg-primary hover:bg-[#0da672] text-[#0d1b17] dark:text-black"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Deelnemen
                    </Button>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-[#6b7280] px-3 py-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-full">
                      Gepland
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
