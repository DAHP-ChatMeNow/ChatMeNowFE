"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LocalTrackPublication,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSocket } from "@/components/providers/socket-provider";
import { useAuthStore } from "@/store/use-auth-store";
import { BASE_API_URL } from "@/types/utils";
import { IncomingCallData, VideoCallType } from "@/types/video-call";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") return fallback;

  const err = error as {
    message?: string;
    response?: {
      data?: {
        message?: string;
        error?: string;
      };
    };
  };

  return (
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    fallback
  );
};

type CallPhase = "idle" | "ringing" | "outgoing" | "connecting" | "active";

interface ActiveCallState {
  roomId: string;
  peerUserId: string;
  peerName?: string;
  callType: VideoCallType;
  conversationId?: string;
  isCaller: boolean;
}

interface StartCallPayload {
  receiverId: string;
  receiverName?: string;
  conversationId?: string;
  callType?: VideoCallType;
}

interface VideoCallContextType {
  phase: CallPhase;
  incomingCall: IncomingCallData | null;
  activeCall: ActiveCallState | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isBusy: boolean;
  startCall: (payload: StartCallPayload) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: (reason?: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
}

interface LivekitTokenResponse {
  token: string;
  livekitUrl: string;
  roomId: string;
  identity?: string;
  participantName?: string;
  expiresIn?: number;
}

type CallDebugMeta = Record<string, unknown>;

const VideoCallContext = createContext<VideoCallContextType | null>(null);

const ROOM_ID_REGEX = /^[A-Za-z0-9_-]+$/;

const toId = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const source = value as { _id?: string; id?: string };
    return source._id || source.id;
  }
  return undefined;
};

const toObject = (value: unknown): Record<string, unknown> => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const normalizeSignalPayload = (
  rawPayload: unknown,
): Record<string, unknown> => {
  const root = toObject(rawPayload);
  const data = toObject(root.data);
  const result = toObject(root.result);

  return {
    ...result,
    ...data,
    ...root,
  };
};

const sanitizeRoomId = (value: string): string =>
  value
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeRoomId = (value: unknown): string | undefined => {
  const raw = toId(value)?.trim();
  if (!raw) return undefined;

  const sanitized = sanitizeRoomId(raw);
  if (!sanitized || !ROOM_ID_REGEX.test(sanitized)) return undefined;
  return sanitized;
};

const buildRoomId = (
  conversationId?: string,
  callerId?: string,
  receiverId?: string,
): string => {
  const seed = conversationId
    ? conversationId.startsWith("conversation_")
      ? conversationId
      : `conversation_${conversationId}`
    : `call_${callerId || "user"}_${receiverId || "peer"}_${Date.now()}`;

  const sanitized = sanitizeRoomId(seed);
  if (sanitized && ROOM_ID_REGEX.test(sanitized)) {
    return sanitized;
  }

  return `call_${Date.now()}`;
};

const getRoomId = (payload: Record<string, unknown>): string | undefined => {
  const callObj = toObject(payload.call);

  const directCandidates = [
    payload.roomId,
    callObj.roomId,
    payload.callId,
    payload.id,
    payload._id,
  ];

  for (const candidate of directCandidates) {
    const roomId = normalizeRoomId(candidate);
    if (roomId) return roomId;
  }

  const conversationId = normalizeRoomId(payload.conversationId);
  if (conversationId) {
    return conversationId.startsWith("conversation_")
      ? conversationId
      : `conversation_${conversationId}`;
  }

  return undefined;
};

const getPeerId = (
  payload: Record<string, unknown>,
  myUserId?: string,
): string | undefined => {
  const candidates = [
    payload.fromUserId,
    payload.from,
    payload.toUserId,
    payload.to,
    payload.senderId,
    payload.callerId,
    payload.receiverId,
    payload.userId,
    (payload.call as Record<string, unknown> | undefined)?.callerId,
    (payload.call as Record<string, unknown> | undefined)?.receiverId,
  ];

  for (const candidate of candidates) {
    const id = toId(candidate);
    if (id && id !== myUserId) return id;
  }

  return undefined;
};

const parseIncomingCall = (
  payload: Record<string, unknown>,
): IncomingCallData | null => {
  const roomId = getRoomId(payload);
  const callerId =
    toId(payload.callerId) || toId(payload.fromUserId) || toId(payload.from);
  if (!roomId || !callerId) return null;

  const caller = toObject(payload.caller);

  return {
    roomId,
    callId: normalizeRoomId(payload.callId),
    callerId,
    callerName:
      (payload.callerName as string | undefined) ||
      (caller.displayName as string | undefined) ||
      "Người dùng",
    callerAvatar:
      (payload.callerAvatar as string | undefined) ||
      (caller.avatar as string | undefined) ||
      "",
    receiverId: toId(payload.receiverId) || toId(payload.toUserId),
    callType: (payload.callType as VideoCallType) || "video",
    conversationId: toId(payload.conversationId),
  };
};

const toMediaStreamTrack = (track: unknown): MediaStreamTrack | null => {
  if (!track || typeof track !== "object") return null;
  const candidate = track as { mediaStreamTrack?: MediaStreamTrack };
  return candidate.mediaStreamTrack || null;
};

function VideoElement({
  stream,
  muted,
  mirror,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  mirror?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`${className || ""} ${mirror ? "-scale-x-100" : ""}`.trim()}
    />
  );
}

function AudioElement({ stream }: { stream: MediaStream | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.srcObject = stream;
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

export function VideoCallProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useSocket();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const myUserId = user?.id || user?._id;

  const [phase, setPhase] = useState<CallPhase>("idle");
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null,
  );
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const roomRef = useRef<Room | null>(null);
  const remoteTracksRef = useRef<Map<string, RemoteTrack>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const phaseRef = useRef<CallPhase>("idle");
  const remoteEmptyTimeoutRef = useRef<number | null>(null);
  const activeCallRef = useRef<ActiveCallState | null>(null);
  const incomingCallRef = useRef<IncomingCallData | null>(null);
  const isAcceptingIncomingCallRef = useRef(false);
  const connectingRoomIdRef = useRef<string | null>(null);
  const hasLivekitConnectedRef = useRef(false);
  const stopRingtoneRef = useRef<(() => void) | null>(null);

  const isCallEnabled = process.env.NEXT_PUBLIC_ENABLE_CALL === "true";
  const isCallDebugEnabled = process.env.NEXT_PUBLIC_CALL_DEBUG === "true";
  const livekitEnvUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;

  const callDebug = useCallback(
    (event: string, meta?: CallDebugMeta) => {
      if (!isCallDebugEnabled) return;

      const now = new Date().toISOString();
      console.info(`[CallDebug ${now}] ${event}`, {
        phase: phaseRef.current,
        activeRoomId: activeCallRef.current?.roomId,
        incomingRoomId: incomingCallRef.current?.roomId,
        ...meta,
      });
    },
    [isCallDebugEnabled],
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!startedAt) {
      setDurationSeconds(0);
      return;
    }

    const timerId = window.setInterval(() => {
      setDurationSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [startedAt]);

  const cleanupRoom = useCallback(
    (source = "unknown", meta?: CallDebugMeta) => {
      const room = roomRef.current;
      hasLivekitConnectedRef.current = false;
      if (remoteEmptyTimeoutRef.current !== null) {
        window.clearTimeout(remoteEmptyTimeoutRef.current);
        remoteEmptyTimeoutRef.current = null;
      }
      if (room) {
        callDebug("cleanupRoom:disconnect", {
          source,
          roomName: room.name,
          participantIdentity: room.localParticipant.identity,
          ...meta,
        });
        room.removeAllListeners();
        room.disconnect();
        roomRef.current = null;
      }

      remoteTracksRef.current.clear();
    },
    [callDebug],
  );

  const wait = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }, []);

  const enableLocalTrackWithRetry = useCallback(
    async (
      room: Room,
      kind: "microphone" | "camera",
      enabled: boolean,
      roomId: string,
    ) => {
      const run = () =>
        kind === "microphone"
          ? room.localParticipant.setMicrophoneEnabled(enabled)
          : room.localParticipant.setCameraEnabled(enabled);

      try {
        await run();
      } catch (firstError) {
        const firstMessage = getErrorMessage(
          firstError,
          `${kind} publish failed`,
        );
        callDebug("connectToLivekitRoom:local_media_retry", {
          roomId,
          kind,
          enabled,
          message: firstMessage,
        });

        await wait(800);

        try {
          await run();
          callDebug("connectToLivekitRoom:local_media_retry_success", {
            roomId,
            kind,
            enabled,
          });
        } catch (retryError) {
          const retryMessage = getErrorMessage(
            retryError,
            `${kind} publish failed`,
          );
          callDebug("connectToLivekitRoom:local_media_retry_failed", {
            roomId,
            kind,
            enabled,
            message: retryMessage,
          });

          if (enabled) {
            toast.warning(
              kind === "microphone"
                ? "Micro chưa sẵn sàng, vẫn đang vào cuộc gọi"
                : "Camera chưa sẵn sàng, vẫn đang vào cuộc gọi",
            );
          }
        }
      }
    },
    [callDebug, wait],
  );

  const stopStreams = useCallback(() => {
    setLocalStream(null);
    setRemoteStream(null);
    setRemoteHasVideo(false);
    setIsMuted(false);
    setIsCameraOff(false);
    localStreamRef.current = null;
  }, []);

  const resetCallState = useCallback(() => {
    setPhase("idle");
    setIncomingCall(null);
    setActiveCall(null);
    setStartedAt(null);
    setDurationSeconds(0);
  }, []);

  const leaveRoomAndReset = useCallback(
    (source = "unknown", meta?: CallDebugMeta) => {
      callDebug("leaveRoomAndReset", {
        source,
        ...meta,
      });
      connectingRoomIdRef.current = null;
      hasLivekitConnectedRef.current = false;
      cleanupRoom(source, meta);
      stopStreams();
      resetCallState();
    },
    [callDebug, cleanupRoom, resetCallState, stopStreams],
  );

  const markCallStarted = useCallback(() => {
    setStartedAt((prev) => prev || Date.now());
  }, []);

  const emitSignal = useCallback(
    (event: string, payload: Record<string, unknown>) => {
      if (!socket.current) return;
      socket.current.emit(event, payload);
    },
    [socket],
  );

  const stopRingtone = useCallback(() => {
    if (!stopRingtoneRef.current) return;
    stopRingtoneRef.current();
    stopRingtoneRef.current = null;
  }, []);

  const startRingtone = useCallback(
    (mode: "incoming" | "outgoing") => {
      stopRingtone();

      if (typeof window === "undefined") return;

      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      void audioContext.resume().catch(() => {
        // Browser may block autoplay until user interacts.
      });

      let disposed = false;
      let patternTimeoutId: number | null = null;

      const beep = (
        frequency: number,
        durationMs: number,
        gainValue: number,
      ) => {
        if (disposed) return;

        const now = audioContext.currentTime;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + durationMs / 1000 + 0.04);
      };

      const playPattern = () => {
        if (mode === "incoming") {
          beep(740, 180, 0.03);
          patternTimeoutId = window.setTimeout(() => {
            beep(740, 180, 0.03);
          }, 250);
          return;
        }

        beep(520, 320, 0.025);
      };

      playPattern();
      const intervalId = window.setInterval(playPattern, 1500);

      stopRingtoneRef.current = () => {
        disposed = true;
        window.clearInterval(intervalId);
        if (patternTimeoutId !== null) {
          window.clearTimeout(patternTimeoutId);
        }
        void audioContext.close().catch(() => {
          // Ignore close errors after cleanup.
        });
      };
    },
    [stopRingtone],
  );

  useEffect(() => {
    if (phase === "outgoing") {
      startRingtone("outgoing");
      return () => {
        stopRingtone();
      };
    }

    if (phase === "ringing" && incomingCall) {
      startRingtone("incoming");
      return () => {
        stopRingtone();
      };
    }

    stopRingtone();

    return () => {
      stopRingtone();
    };
  }, [incomingCall, phase, startRingtone, stopRingtone]);

  const syncLocalStreamFromRoom = useCallback((callType: VideoCallType) => {
    const room = roomRef.current;
    if (!room) return;

    const stream = new MediaStream();

    const micPublication = room.localParticipant.getTrackPublication(
      Track.Source.Microphone,
    ) as LocalTrackPublication | undefined;
    const cameraPublication = room.localParticipant.getTrackPublication(
      Track.Source.Camera,
    ) as LocalTrackPublication | undefined;

    const micTrack = toMediaStreamTrack(micPublication?.track);
    if (micTrack) stream.addTrack(micTrack);

    const videoTrack = toMediaStreamTrack(cameraPublication?.track);
    if (callType === "video" && videoTrack) {
      stream.addTrack(videoTrack);
    }

    setLocalStream(stream.getTracks().length > 0 ? stream : null);
    setIsMuted(Boolean(micPublication?.isMuted));

    if (callType === "video") {
      setIsCameraOff(Boolean(cameraPublication?.isMuted || !videoTrack));
    } else {
      setIsCameraOff(true);
    }
  }, []);

  const syncRemoteStream = useCallback(() => {
    const stream = new MediaStream();
    let hasVideo = false;

    for (const track of remoteTracksRef.current.values()) {
      const mediaTrack = toMediaStreamTrack(track);
      if (!mediaTrack) continue;

      if (mediaTrack.kind === "video") {
        hasVideo = true;
      }

      stream.addTrack(mediaTrack);
    }

    setRemoteHasVideo(hasVideo);
    setRemoteStream(stream.getTracks().length > 0 ? stream : null);

    if (stream.getTracks().length > 0) {
      setPhase("active");
      markCallStarted();
    }
  }, [markCallStarted]);

  const getLivekitToken = useCallback(
    async (roomId: string): Promise<LivekitTokenResponse> => {
      if (!token) {
        throw new Error("Thiếu token xác thực");
      }
      if (!apiKey) {
        throw new Error("Missing NEXT_PUBLIC_API_KEY");
      }
      if (!BASE_API_URL) {
        throw new Error("Missing NEXT_PUBLIC_API_URL");
      }
      if (!ROOM_ID_REGEX.test(roomId)) {
        throw new Error("RoomId không hợp lệ");
      }

      const participantName = user?.displayName;
      const query = new URLSearchParams({ roomId });
      if (participantName) {
        query.set("participantName", participantName);
      }

      const tokenRes = await fetch(
        `${BASE_API_URL}/livekit-token?${query.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-api-key": apiKey,
          },
        },
      );

      if (!tokenRes.ok) {
        let message = "Không lấy được LiveKit token";
        try {
          const errData = (await tokenRes.json()) as {
            message?: string;
            error?: string;
          };
          message = errData.message || errData.error || message;
        } catch {
          // ignore JSON parsing errors
        }
        throw new Error(message);
      }

      return (await tokenRes.json()) as LivekitTokenResponse;
    },
    [apiKey, token, user?.displayName],
  );

  const connectToLivekitRoom = useCallback(
    async (call: ActiveCallState) => {
      if (!isCallEnabled) {
        throw new Error("Tính năng gọi đang tắt ở môi trường hiện tại");
      }

      const currentRoom = roomRef.current;
      if (
        currentRoom &&
        hasLivekitConnectedRef.current &&
        currentRoom.name === call.roomId
      ) {
        callDebug("connectToLivekitRoom:skip_already_connected", {
          roomId: call.roomId,
        });
        return;
      }

      if (connectingRoomIdRef.current === call.roomId) {
        callDebug("connectToLivekitRoom:skip_duplicate", {
          roomId: call.roomId,
        });
        return;
      }

      callDebug("connectToLivekitRoom:start", {
        roomId: call.roomId,
        callType: call.callType,
        isCaller: call.isCaller,
      });

      connectingRoomIdRef.current = call.roomId;
      hasLivekitConnectedRef.current = false;

      try {
        const tokenData = await getLivekitToken(call.roomId);
        const livekitUrl = livekitEnvUrl || tokenData.livekitUrl;

        if (!livekitUrl) {
          throw new Error("Missing NEXT_PUBLIC_LIVEKIT_URL");
        }

        cleanupRoom("connectToLivekitRoom:preconnect_cleanup", {
          roomId: call.roomId,
        });
        stopStreams();
        setPhase("connecting");

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        roomRef.current = room;
        remoteTracksRef.current.clear();

        if (remoteEmptyTimeoutRef.current !== null) {
          window.clearTimeout(remoteEmptyTimeoutRef.current);
          remoteEmptyTimeoutRef.current = null;
        }

        room.on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, publication: RemoteTrackPublication) => {
            if (
              track.kind !== Track.Kind.Audio &&
              track.kind !== Track.Kind.Video
            ) {
              return;
            }

            const trackKey =
              publication.trackSid ||
              track.sid ||
              `${track.kind}-${track.source}-${Date.now()}`;
            remoteTracksRef.current.set(trackKey, track);
            syncRemoteStream();
          },
        );

        room.on(
          RoomEvent.TrackUnsubscribed,
          (track: RemoteTrack, publication: RemoteTrackPublication) => {
            const trackKey = publication.trackSid || track.sid;
            if (!trackKey) return;
            remoteTracksRef.current.delete(trackKey);
            syncRemoteStream();
          },
        );

        room.on(RoomEvent.ParticipantConnected, () => {
          if (remoteEmptyTimeoutRef.current !== null) {
            window.clearTimeout(remoteEmptyTimeoutRef.current);
            remoteEmptyTimeoutRef.current = null;
          }
        });

        room.on(RoomEvent.ParticipantDisconnected, () => {
          if (room.remoteParticipants.size > 0) return;

          if (remoteEmptyTimeoutRef.current !== null) {
            window.clearTimeout(remoteEmptyTimeoutRef.current);
          }

          // Give the remote side a short window to reconnect before ending.
          remoteEmptyTimeoutRef.current = window.setTimeout(() => {
            remoteEmptyTimeoutRef.current = null;

            if (roomRef.current !== room) return;
            if (room.remoteParticipants.size > 0) return;

            toast.info("Cuộc gọi đã kết thúc");
            leaveRoomAndReset("room:participant_disconnected_empty", {
              roomId: call.roomId,
            });
          }, 3000);
        });

        room.on(RoomEvent.Disconnected, () => {
          callDebug("room:disconnected", {
            roomId: call.roomId,
          });
          remoteTracksRef.current.clear();
          setRemoteStream(null);
          setRemoteHasVideo(false);
        });

        await room.connect(livekitUrl, tokenData.token);
        hasLivekitConnectedRef.current = true;
        callDebug("connectToLivekitRoom:connected", {
          roomId: call.roomId,
          livekitUrl,
        });

        await enableLocalTrackWithRetry(room, "microphone", true, call.roomId);
        await enableLocalTrackWithRetry(
          room,
          "camera",
          call.callType === "video",
          call.roomId,
        );

        callDebug("connectToLivekitRoom:local_media_enabled", {
          roomId: call.roomId,
          callType: call.callType,
        });

        syncLocalStreamFromRoom(call.callType);
      } finally {
        if (connectingRoomIdRef.current === call.roomId) {
          connectingRoomIdRef.current = null;
        }
      }
    },
    [
      callDebug,
      cleanupRoom,
      getLivekitToken,
      isCallEnabled,
      leaveRoomAndReset,
      livekitEnvUrl,
      stopStreams,
      syncLocalStreamFromRoom,
      syncRemoteStream,
      enableLocalTrackWithRetry,
    ],
  );

  const startCall = useCallback(
    async ({
      receiverId,
      receiverName,
      conversationId,
      callType = "video",
    }: StartCallPayload) => {
      if (!isCallEnabled) {
        toast.info("Tính năng gọi đang tắt ở môi trường hiện tại");
        return;
      }

      if (!socket.current || !isConnected) {
        toast.error("Kết nối socket chưa sẵn sàng");
        return;
      }

      if (!myUserId) {
        toast.error("Không tìm thấy người dùng đã đăng nhập");
        return;
      }

      const roomId = buildRoomId(conversationId, myUserId, receiverId);

      try {
        const call: ActiveCallState = {
          roomId,
          peerUserId: receiverId,
          peerName: receiverName,
          callType,
          conversationId,
          isCaller: true,
        };

        setIncomingCall(null);
        setPhase("outgoing");
        setActiveCall(call);

        emitSignal("call-user", {
          toUserId: receiverId,
          roomId,
          conversationId,
          callType,
        });

        toast.success("Đang gọi...");
        callDebug("startCall:signal_sent", {
          roomId,
          receiverId,
          callType,
        });
      } catch (error) {
        console.error("startCall error:", error);
        toast.error(getErrorMessage(error, "Không thể bắt đầu cuộc gọi"));
        leaveRoomAndReset("startCall:error", {
          message: getErrorMessage(error, "Không thể bắt đầu cuộc gọi"),
        });
      }
    },
    [
      callDebug,
      emitSignal,
      isCallEnabled,
      isConnected,
      leaveRoomAndReset,
      myUserId,
      socket,
    ],
  );

  const acceptIncomingCall = useCallback(async () => {
    const callData = incomingCallRef.current;
    if (!callData || !myUserId) return;

    const call: ActiveCallState = {
      roomId: callData.roomId,
      peerUserId: callData.callerId,
      peerName: callData.callerName,
      callType: callData.callType,
      conversationId: callData.conversationId,
      isCaller: false,
    };

    try {
      isAcceptingIncomingCallRef.current = true;
      setIncomingCall(null);
      setPhase("connecting");
      setActiveCall(call);

      emitSignal("accept-call", {
        toUserId: call.peerUserId,
        roomId: call.roomId,
        conversationId: call.conversationId,
        callType: call.callType,
      });

      await connectToLivekitRoom(call);
    } catch (error) {
      console.error("acceptIncomingCall error:", error);
      toast.error(getErrorMessage(error, "Không thể chấp nhận cuộc gọi"));
      leaveRoomAndReset("acceptIncomingCall:error", {
        message: getErrorMessage(error, "Không thể chấp nhận cuộc gọi"),
      });
    } finally {
      isAcceptingIncomingCallRef.current = false;
    }
  }, [connectToLivekitRoom, emitSignal, leaveRoomAndReset, myUserId]);

  const rejectIncomingCall = useCallback(
    async (reason = "declined") => {
      const callData = incomingCallRef.current;
      if (!callData) return;

      try {
        emitSignal("reject-call", {
          toUserId: callData.callerId,
          roomId: callData.roomId,
          conversationId: callData.conversationId,
          callType: callData.callType,
          reason,
        });
      } catch (error) {
        console.error("rejectIncomingCall error:", error);
      } finally {
        leaveRoomAndReset("rejectIncomingCall:finally", {
          reason,
        });
      }
    },
    [emitSignal, leaveRoomAndReset],
  );

  const endCall = useCallback(async () => {
    const currentCall = activeCallRef.current;
    if (!currentCall) return;

    try {
      if (phase === "outgoing" || phase === "connecting") {
        emitSignal("reject-call", {
          toUserId: currentCall.peerUserId,
          roomId: currentCall.roomId,
          conversationId: currentCall.conversationId,
          callType: currentCall.callType,
          reason: "ended",
        });
      }
    } catch (error) {
      console.error("endCall error:", error);
    } finally {
      leaveRoomAndReset("endCall:finally", {
        phase,
      });
    }
  }, [emitSignal, leaveRoomAndReset, phase]);

  const toggleMute = useCallback(() => {
    const room = roomRef.current;
    const current = activeCallRef.current;
    if (!room || !current) return;

    const nextMuted = !isMuted;
    void room.localParticipant
      .setMicrophoneEnabled(!nextMuted)
      .then(() => {
        setIsMuted(nextMuted);
        syncLocalStreamFromRoom(current.callType);
      })
      .catch((error: unknown) => {
        console.error("toggleMute error:", error);
        toast.error("Không thể bật/tắt micro");
      });
  }, [isMuted, syncLocalStreamFromRoom]);

  const toggleCamera = useCallback(() => {
    const room = roomRef.current;
    const current = activeCallRef.current;
    if (!room || !current || current.callType !== "video") return;

    const nextCameraOff = !isCameraOff;
    void room.localParticipant
      .setCameraEnabled(!nextCameraOff)
      .then(() => {
        setIsCameraOff(nextCameraOff);
        syncLocalStreamFromRoom(current.callType);
      })
      .catch((error: unknown) => {
        console.error("toggleCamera error:", error);
        toast.error("Không thể bật/tắt camera");
      });
  }, [isCameraOff, syncLocalStreamFromRoom]);

  useEffect(() => {
    if (!socket.current || !isConnected) return;
    const socketInstance = socket.current;

    const onIncomingCall = (rawPayload: unknown) => {
      const payload = normalizeSignalPayload(rawPayload);
      const call = parseIncomingCall(payload);
      if (!call || call.callerId === myUserId) return;

      callDebug("socket:incoming-call", {
        roomId: call.roomId,
        callerId: call.callerId,
        conversationId: call.conversationId,
      });

      if (activeCallRef.current || incomingCallRef.current) {
        callDebug("socket:incoming-call:auto_reject_busy", {
          roomId: call.roomId,
        });
        emitSignal("reject-call", {
          toUserId: call.callerId,
          roomId: call.roomId,
          conversationId: call.conversationId,
          callType: call.callType,
          reason: "busy",
        });
        return;
      }

      setIncomingCall(call);
      setPhase("ringing");
      toast.info(`${call.callerName || "Người dùng"} đang gọi cho bạn`);
    };

    const onCallAccepted = async (rawPayload: unknown) => {
      const payload = normalizeSignalPayload(rawPayload);
      const roomId = getRoomId(payload);
      const current = activeCallRef.current;

      if (
        roomId &&
        roomRef.current &&
        hasLivekitConnectedRef.current &&
        roomRef.current.name === roomId
      ) {
        callDebug("socket:call-accepted:ignored_already_connected", {
          roomId,
        });
        return;
      }

      callDebug("socket:call-accepted", {
        roomId,
      });

      if (
        !current ||
        !current.isCaller ||
        !roomId ||
        current.roomId !== roomId
      ) {
        return;
      }

      const peerId = getPeerId(payload, myUserId) || current.peerUserId;
      const updatedCall: ActiveCallState = { ...current, peerUserId: peerId };
      setActiveCall(updatedCall);

      try {
        await connectToLivekitRoom(updatedCall);
      } catch (error) {
        console.error("onCallAccepted error:", error);
        toast.error(getErrorMessage(error, "Không thể kết nối phòng LiveKit"));
        leaveRoomAndReset("socket:call-accepted:error", {
          message: getErrorMessage(error, "Không thể kết nối phòng LiveKit"),
        });
      }
    };

    const onCallRejected = (rawPayload: unknown) => {
      const payload = normalizeSignalPayload(rawPayload);
      const roomId = getRoomId(payload);
      if (!roomId) return;

      callDebug("socket:call-rejected", {
        roomId,
        reason: payload.reason,
      });

      const activeMatches = activeCallRef.current?.roomId === roomId;
      const incomingMatches = incomingCallRef.current?.roomId === roomId;
      if (!activeMatches && !incomingMatches) return;

      const reason =
        (payload.reason as string | undefined) ||
        (payload.rejectionReason as string | undefined) ||
        "declined";

      if (hasLivekitConnectedRef.current) {
        callDebug("socket:call-rejected:ignored_after_connected", {
          reason,
          roomId,
        });
        return;
      }

      leaveRoomAndReset("socket:call-rejected", {
        reason,
      });

      if (reason === "missed") {
        toast.info("Cuộc gọi nhỡ");
      } else if (reason === "busy") {
        toast.info("Người dùng đang bận");
      } else if (reason === "ended") {
        toast.info("Cuộc gọi đã kết thúc");
      } else {
        toast.info("Cuộc gọi bị từ chối");
      }
    };

    const onCallError = (rawPayload: unknown) => {
      const payload = normalizeSignalPayload(rawPayload);
      const roomId = getRoomId(payload);
      const activeRoomId = activeCallRef.current?.roomId;
      const incomingRoomId = incomingCallRef.current?.roomId;

      callDebug("socket:call-error", {
        roomId,
        activeRoomId,
        incomingRoomId,
      });

      if (roomId && roomId !== activeRoomId && roomId !== incomingRoomId) {
        return;
      }

      const message =
        (payload.message as string | undefined) ||
        (payload.error as string | undefined) ||
        "Lỗi cuộc gọi";

      if (hasLivekitConnectedRef.current) {
        callDebug("socket:call-error:ignored_after_connected", {
          message,
          roomId,
        });
        return;
      }

      toast.error(message);
      leaveRoomAndReset("socket:call-error", {
        message,
      });
    };

    socketInstance.on("incoming-call", onIncomingCall);
    socketInstance.on("incomingCall", onIncomingCall);
    socketInstance.on("call-accepted", onCallAccepted);
    socketInstance.on("callAccepted", onCallAccepted);
    socketInstance.on("call-rejected", onCallRejected);
    socketInstance.on("callRejected", onCallRejected);
    socketInstance.on("call-error", onCallError);
    socketInstance.on("callError", onCallError);

    return () => {
      socketInstance.off("incoming-call", onIncomingCall);
      socketInstance.off("incomingCall", onIncomingCall);
      socketInstance.off("call-accepted", onCallAccepted);
      socketInstance.off("callAccepted", onCallAccepted);
      socketInstance.off("call-rejected", onCallRejected);
      socketInstance.off("callRejected", onCallRejected);
      socketInstance.off("call-error", onCallError);
      socketInstance.off("callError", onCallError);
    };
  }, [
    callDebug,
    connectToLivekitRoom,
    emitSignal,
    isConnected,
    leaveRoomAndReset,
    myUserId,
    socket,
  ]);

  useEffect(() => {
    return () => {
      stopRingtone();
      cleanupRoom("provider:unmount");
      stopStreams();
    };
  }, [cleanupRoom, stopRingtone, stopStreams]);

  const contextValue = useMemo<VideoCallContextType>(
    () => ({
      phase,
      incomingCall,
      activeCall,
      isMuted,
      isCameraOff,
      isBusy: phase !== "idle",
      startCall,
      acceptIncomingCall,
      rejectIncomingCall,
      endCall,
      toggleMute,
      toggleCamera,
    }),
    [
      acceptIncomingCall,
      activeCall,
      endCall,
      incomingCall,
      isCameraOff,
      isMuted,
      phase,
      rejectIncomingCall,
      startCall,
      toggleCamera,
      toggleMute,
    ],
  );

  return (
    <VideoCallContext.Provider value={contextValue}>
      {children}

      <Dialog
        open={!!incomingCall}
        onOpenChange={(open) => {
          if (!open) {
            if (isAcceptingIncomingCallRef.current) {
              callDebug("incomingDialog:close_ignored_while_accepting");
              return;
            }
            if (!incomingCallRef.current) {
              return;
            }
            void rejectIncomingCall("dismissed");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cuộc gọi đến</DialogTitle>
            <DialogDescription>
              {incomingCall?.callerName || "Người dùng"} đang gọi (
              {incomingCall?.callType === "video" ? "video" : "thoại"})
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void rejectIncomingCall("declined");
              }}
            >
              <PhoneOff className="w-4 h-4" /> Từ chối
            </Button>
            <Button
              onClick={() => {
                void acceptIncomingCall();
              }}
            >
              <Phone className="w-4 h-4" /> Chấp nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeCall && phase !== "idle" && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm">
          <AudioElement stream={remoteStream} />
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-slate-900">
              {activeCall.callType === "video" &&
              remoteStream &&
              remoteHasVideo ? (
                <VideoElement
                  stream={remoteStream}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-slate-300">
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      {activeCall.peerName || "Đang kết nối..."}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {phase === "outgoing"
                        ? "Đang đổ chuông..."
                        : phase === "active"
                          ? "Đang trong cuộc gọi"
                          : "Đang thiết lập cuộc gọi..."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {activeCall.callType === "video" && (
              <div className="absolute h-40 overflow-hidden border rounded-lg shadow-xl right-4 top-4 w-28 border-white/20 bg-black/40 md:h-48 md:w-36">
                <VideoElement
                  stream={localStream}
                  muted
                  mirror
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            <div className="absolute px-4 py-1 text-xs text-white -translate-x-1/2 rounded-full left-1/2 top-4 bg-black/40">
              {Math.floor(durationSeconds / 60)
                .toString()
                .padStart(2, "0")}
              :{(durationSeconds % 60).toString().padStart(2, "0")}
            </div>

            <div className="absolute flex items-center gap-3 -translate-x-1/2 bottom-8 left-1/2">
              <Button
                variant="secondary"
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff /> : <Mic />}
              </Button>

              {activeCall.callType === "video" && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={toggleCamera}
                >
                  {isCameraOff ? <VideoOff /> : <Video />}
                </Button>
              )}

              <Button
                variant="destructive"
                size="icon"
                className="w-12 h-12 rounded-full"
                onClick={() => {
                  void endCall();
                }}
              >
                <PhoneOff />
              </Button>
            </div>
          </div>
        </div>
      )}
    </VideoCallContext.Provider>
  );
}

export function useVideoCall() {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error("useVideoCall must be used within VideoCallProvider");
  }
  return context;
}
