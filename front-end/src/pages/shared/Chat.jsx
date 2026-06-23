import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, User, Search, Loader2, Mic, Square, Play, Pause, Volume2 } from "lucide-react";
import { chatApi } from "../../api/resources";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import client from "../../api/client";
import { resolveMediaUrl } from "../../utils/format";
import { format, parseISO, isToday, isYesterday } from "date-fns";

let msgIdCounter = 0;
function nextMsgId() { return `opt-${Date.now()}-${++msgIdCounter}`; }

function formatMsgTime(iso) {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday, " + format(d, "HH:mm");
  return format(d, "dd MMM, HH:mm");
}

export default function Chat() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [socketError, setSocketError] = useState(null);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const recordingActiveConvRef = useRef(null);

  // Audio playback
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);

  // Speech-to-text
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const speechFinalRef = useRef("");

  const messagesEndRef = useRef(null);
  const requestedConvId = location.state?.conversationId;

  const initialLoadDone = useRef(false);
  const activeConvRef = useRef(null);
  const socketRef = useRef(null);
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);
  useEffect(() => { socketRef.current = socket; }, [socket]);

  // Load conversations
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    chatApi.getConversations().then(res => {
      const convs = res.data || [];
      setConversations(convs);
      setLoading(false);
      if (requestedConvId) {
        const target = convs.find(c => c.id === requestedConvId);
        if (target) {
          setActiveConv(target);
          navigate(location.pathname, { replace: true, state: {} });
        }
      } else if (convs.length > 0) {
        setActiveConv(convs[0]);
      }
    }).catch(() => {
      toast.error(t('error.generic'));
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConv) return;
    chatApi.getMessages(activeConv.id).then(res => {
      setMessages(res.data || []);
      scrollToBottom();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConv?.id, scrollToBottom]);

  // Handle incoming socket messages
  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = (data) => {
      const currentConv = activeConvRef.current;
      if (currentConv && data.conversation_id === currentConv.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          if (prev.some(m => m.id.startsWith("opt-") && m.sender_id === data.sender_id && m.content === data.content)) {
            return prev.map(m => m.id.startsWith("opt-") && m.sender_id === data.sender_id && m.content === data.content ? data : m);
          }
          return [...prev, data];
        });
        scrollToBottom();
      }
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === data.conversation_id);
        if (idx === -1) return prev;
        const newConvs = [...prev];
        newConvs[idx] = { ...newConvs[idx], updated_at: data.created_at, last_message: data.content };
        return newConvs.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
      });
    };

    const handleError = (data) => {
      const msg = data?.message || t('error.generic');
      setSocketError(msg);
      toast.error(msg);
      setTimeout(() => setSocketError(null), 4000);
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("error", handleError);
    socket.on("connect", () => setSocketError(null));
    socket.on("disconnect", () => setSocketError("Connection lost. Trying to reconnect..."));
    socket.on("connect_error", () => setSocketError("Cannot connect to chat server. Check your connection."));
    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("error", handleError);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, [socket, scrollToBottom, toast, t]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = msgInput.trim();
    if (!trimmed || !activeConv) return;
    if (!socket) {
      toast.error("Not connected to chat server. Please wait or refresh.");
      return;
    }
    const content = trimmed;

    // Optimistic UI update
    const optimisticMsg = {
      id: nextMsgId(),
      conversation_id: activeConv.id,
      sender_id: user.id,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setMsgInput("");
    scrollToBottom();

    socket.emit("send_message", { conversation_id: activeConv.id, content });
  };

  const getOtherUser = (conv) => {
    const isUserOne = conv.participant_one_id === user.id;
    return {
      id: isUserOne ? conv.participant_two_id : conv.participant_one_id,
      name: isUserOne ? conv.participant_two_name : conv.participant_one_name,
    };
  };

  // ── Voice Recording ───────────────────────────────────
  const sendAudioMessage = useCallback(async (blob, mimeType) => {
    const conv = activeConvRef.current;
    const sock = socketRef.current;
    if (!conv) return;
    if (!sock) {
      toast.error("Not connected to chat server. Please wait or refresh.");
      return;
    }
    const extByMime = {
      "audio/webm": "webm",
      "audio/mp4": "mp4",
      "audio/mpeg": "mp3",
      "audio/ogg": "ogg",
      "audio/wav": "wav",
      "audio/x-m4a": "m4a",
    };
    const baseMime = (mimeType || blob.type || "").split(";")[0].trim();
    const ext = extByMime[baseMime] || "webm";
    const formData = new FormData();
    formData.append("file", blob, `voice.${ext}`);
    try {
      const res = await client.post("/upload/audio", formData);
      const optimisticMsg = {
        id: nextMsgId(),
        conversation_id: conv.id,
        sender_id: user.id,
        content: res.data.url,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticMsg]);
      sock.emit("send_message", {
        conversation_id: conv.id,
        content: res.data.url,
      });
      scrollToBottom();
    } catch (err) {
      const serverMsg = err?.response?.data?.detail;
      toast.error(typeof serverMsg === "string" ? serverMsg : t('error.generic'));
    }
  }, [toast, t, scrollToBottom, user.id]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error(t('chat.voiceNotSupported'));
      return;
    }
    if (!activeConv) { toast.error(t('chat.selectConv')); return; }
    recordingActiveConvRef.current = activeConv;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(recordTimerRef.current);
        setRecordingTime(0);
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        if (blob.size > 0) await sendAudioMessage(blob, recorder.mimeType);
      };
      recorder.start(200);
      setRecording(true);
      let sec = 0;
      recordTimerRef.current = setInterval(() => { sec++; setRecordingTime(sec); }, 1000);
    } catch {
      toast.error(t('chat.voiceNotSupported'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── Audio Playback ────────────────────────────────────
  const toggleAudio = (url) => {
    if (playingAudio === url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingAudio(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(resolveMediaUrl(url));
      audio.onended = () => { setPlayingAudio(null); audioRef.current = null; };
      audio.play().catch(() => {});
      audioRef.current = audio;
      setPlayingAudio(url);
    }
  };

  // ── Speech-to-Text (fixed: no duplicate insertion) ───
  const LANG_MAP = { en: "en-US", te: "te-IN", hi: "hi-IN", ta: "ta-IN", kn: "kn-IN", ml: "ml-IN" };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(t('chat.speechNotSupported'));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = LANG_MAP[lang] || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    speechFinalRef.current = "";
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const isFinal = event.results[event.results.length - 1].isFinal;
      if (isFinal) {
        setMsgInput(prev => prev + transcript);
      } else {
        setMsgInput(prev => prev + transcript);
      }
    };
    recognition.onerror = () => { setListening(false); };
    recognition.onend = () => { setListening(false); };
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  };

  const isVoiceMsg = (content) => content.startsWith("/uploads/audio/");

  const filteredConvs = conversations.filter(c => {
    const other = getOtherUser(c);
    return other?.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="page-enter h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] flex flex-col -m-6 p-4 md:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-1 overflow-hidden h-full">
        
        {/* Sidebar */}
        <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-lg mb-4">{t('chat.title')}</h2>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('chat.search')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-9 bg-slate-50"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-green-500" /></div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center p-8 text-slate-500 text-sm">{t('chat.noConvs')}</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredConvs.map(conv => {
                  const other = getOtherUser(conv);
                  const isActive = activeConv?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv)}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${isActive ? 'bg-slate-50' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {other?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className={`font-semibold text-sm truncate ${isActive ? 'text-green-700' : 'text-slate-900'}`}>{other?.name || "User"}</p>
                          <span className="text-[10px] text-slate-400">{conv.updated_at ? format(parseISO(conv.updated_at), "MMM d") : ""}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{conv.last_message || t('chat.noMessages')}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-slate-50 ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 md:px-6 bg-white border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
                <button
                  className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100"
                  onClick={() => setActiveConv(null)}
                >
                  <Search size={20} />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {getOtherUser(activeConv)?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-tight">{getOtherUser(activeConv)?.name || "User"}</p>
                  <p className="text-xs text-green-600 font-medium leading-tight">{t('chat.online')}</p>
                </div>
              </div>

              {/* Connection status banner */}
              {socketError && (
                <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-red-700 text-xs font-medium text-center">
                  {socketError}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <User size={24} className="text-green-600" />
                    </div>
                    <p className="text-slate-900 font-bold mb-1">{t('chat.sayHello', { name: getOtherUser(activeConv)?.name?.split(" ")[0] })}</p>
                    <p className="text-slate-500 text-sm">{t('chat.discuss')}</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_id === user.id;
                    const showAvatar = i === messages.length - 1 || messages[i + 1].sender_id !== msg.sender_id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
                        <div className={`flex gap-2 max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          <div className={`w-6 h-6 rounded-full flex-shrink-0 mt-auto ${showAvatar ? (isMe ? 'bg-slate-200' : 'bg-green-100') : 'opacity-0'} flex items-center justify-center text-[10px] font-bold ${isMe ? 'text-slate-600' : 'text-green-600'}`}>
                            {isMe ? user.name.charAt(0) : getOtherUser(activeConv)?.name?.charAt(0)}
                          </div>
                          
                          {/* Bubble */}
                          <div className="flex flex-col gap-1">
                            <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                              isMe 
                                ? 'bg-green-600 text-white rounded-br-sm' 
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                            }`}>
                              {isVoiceMsg(msg.content) ? (
                                <button
                                  onClick={() => toggleAudio(msg.content)}
                                  className="flex items-center gap-2 py-1"
                                >
                                  {playingAudio === msg.content ? (
                                    <Pause size={18} className={isMe ? "text-white" : "text-green-600"} />
                                  ) : (
                                    <Play size={18} className={isMe ? "text-white" : "text-green-600"} />
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Volume2 size={14} className={isMe ? "text-white/70" : "text-slate-400"} />
                                    <span className={`text-xs ${isMe ? "text-white/80" : "text-slate-500"}`}>{t('chat.voiceMsg')}</span>
                                  </div>
                                </button>
                              ) : (
                                msg.content
                              )}
                            </div>
                            <span className={`text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                              {formatMsgTime(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-slate-100">
                {recording ? (
                  <div className="flex items-center gap-3 bg-red-50 rounded-full px-5 py-2.5">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-red-600">{t('chat.recording')}</span>
                    <span className="text-sm font-mono text-red-500">{formatTime(recordingTime)}</span>
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
                    >
                      <Square size={16} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={msgInput}
                      onChange={e => setMsgInput(e.target.value)}
                      placeholder={t('chat.placeholder')}
                      className="flex-1 bg-slate-50 border border-slate-200 text-sm rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={recording ? stopRecording : startRecording}
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${recording ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                      title={t('chat.voiceMsg')}
                    >
                      <Mic size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={listening ? stopListening : startListening}
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${listening ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                      title={t('chat.speechToText')}
                    >
                      {listening ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={18} />}
                    </button>
                    <button
                      type="submit"
                      disabled={!msgInput.trim()}
                      className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={18} className="ml-1" />
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 hidden md:flex">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Send size={32} className="text-slate-300 ml-1" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">{t('chat.yourMessages')}</h2>
              <p className="text-slate-500 max-w-xs">{t('chat.selectConv')}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}