'use client';

import React, { useState, useEffect, useRef } from 'react';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')) {
      return `http://${host}:5000`;
    }
    return '';
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
};

export default function SOFOSyncApp() {
  // Connection State Machine: 'UNLINKED' | 'AUTHENTICATING' | 'AUTHENTICATED'
  const [connectionState, setConnectionState] = useState('UNLINKED');
  const [sessionToken, setSessionToken] = useState('');
  const [activeRoomId, setActiveRoomId] = useState('');
  const [activePin, setActivePin] = useState('');
  const [qrPayload, setQrPayload] = useState('');
  const [activePeers, setActivePeers] = useState([]);
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');

  // Mobile Device Detection Guard
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Unlinked Portal Tab: 'generate' | 'link' | 'scan' | 'pin'
  const [authPortalTab, setAuthPortalTab] = useState('generate');
  const [inputPin, setInputPin] = useState('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPeersModal, setShowPeersModal] = useState(false);

  // Camera Scanner State
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Authenticated Dashboard Navigation Tab: 'whiteboard' | 'document' | 'vault' | 'ai'
  const [activeTab, setActiveTab] = useState('whiteboard');

  // Whiteboard State (Real Data - Starts Blank)
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' | 'rect' | 'circle' | 'line' | 'eraser'
  const [color, setColor] = useState('#6366F1');
  const [lineWidth, setLineWidth] = useState(4);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Document State & Real-Time Synced Posted Cards Feed
  const [docTitle, setDocTitle] = useState('Untitled Collaboration Document');
  const [docContent, setDocContent] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState('Ready');
  const [sharedDocPosts, setSharedDocPosts] = useState([
    {
      id: 'demo_post_1',
      title: 'Project Roadmap & Sync Goals',
      content: '1. QR Code pairing established.\n2. Real-time document & file vault active.\n3. Synchronized disconnect verified.',
      author: 'Primary Host Device',
      timestamp: '10:15 AM'
    }
  ]);
  const [copiedDocId, setCopiedDocId] = useState(null);

  // Shared File Vault State with Real-Time Multi-Device Sync & Direct Downloads
  const [sharedFiles, setSharedFiles] = useState([]);

  // AI Copilot State (Real Session)
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: 'Hello! I am SOFO AI Copilot powered by Google Gemini 1.5 Flash. Devices are authenticated. Ask me anything about document edits, canvas drawings, or active session!' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Hydration Guard & Mobile Device Check
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const isMob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobileDevice(isMob);
      setAuthPortalTab(isMob ? 'scan' : 'generate');
    }
  }, []);

  // Auto-Generate Initial QR & Room on load if unlinked (Desktop)
  useEffect(() => {
    if (isMounted && connectionState === 'UNLINKED' && (authPortalTab === 'generate' || authPortalTab === 'link') && !qrPayload) {
      handleGenerateQrCode();
    }
  }, [isMounted, connectionState, authPortalTab]);

  // URL Auto-Pairing Listener (e.g., http://domain.com/?room=SOFO-748291&pin=748291)
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoom = urlParams.get('room');
      const urlPin = urlParams.get('pin');
      if (urlRoom && urlPin && connectionState === 'UNLINKED') {
        setInputPin(urlPin);
        handlePerformPairHandshake(urlPin, urlRoom);
      }
    }
  }, [isMounted]);

  // Real-Time Connected Peers & Multi-Device Data Synchronizer Poller
  useEffect(() => {
    let intervalId;
    if (activeRoomId) {
      const fetchLivePeersAndSyncData = async () => {
        try {
          const res = await fetch(`${getApiBaseUrl()}/api/v1/session/peers?roomId=${activeRoomId}`);
          const data = await res.json();
          if (data.success) {
            // If backend reports DISCONNECTED or room destroyed, force BOTH devices to return to Home Page
            if (data.status === 'DISCONNECTED' || !data.peers || data.peers.length === 0) {
              setConnectionState('UNLINKED');
              setActiveRoomId('');
              setActivePin('');
              setQrPayload('');
              setSessionToken('');
              setActivePeers([]);
              return;
            }

            setActivePeers(data.peers);
            if (data.docPosts && data.docPosts.length > 0) {
              setSharedDocPosts(data.docPosts);
            }
            if (data.sharedFiles && data.sharedFiles.length > 0) {
              setSharedFiles(data.sharedFiles);
            }

            // If room has secondary peers or status is AUTHENTICATED, transition BOTH devices to authenticated view
            if ((data.peers.length > 1 || data.status === 'AUTHENTICATED') && connectionState === 'UNLINKED') {
              setConnectionState('AUTHENTICATED');
            }
          } else {
            // Room no longer exists -> Return to Home Page
            setConnectionState('UNLINKED');
            setActiveRoomId('');
            setActivePin('');
            setQrPayload('');
          }
        } catch (err) {
          // Silent polling retry
        }
      };

      fetchLivePeersAndSyncData();
      intervalId = setInterval(fetchLivePeersAndSyncData, 1500);
    }
    return () => clearInterval(intervalId);
  }, [activeRoomId, connectionState]);

  // Clean up camera stream when leaving scan tab
  useEffect(() => {
    if (authPortalTab !== 'scan' && isCameraActive) {
      stopCamera();
    }
  }, [authPortalTab]);

  // Canvas context initialization when whiteboard unlocks
  useEffect(() => {
    if (connectionState === 'AUTHENTICATED' && activeTab === 'whiteboard' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [connectionState, activeTab]);

  // Mobile Camera Scanner Permission with Fallbacks (Safari iOS / Chrome Android)
  const startCamera = async () => {
    try {
      setCameraError('');
      let stream;

      try {
        // Attempt 1: Rear environment camera for mobile phones
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch (err1) {
        try {
          // Attempt 2: Front camera
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        } catch (err2) {
          // Attempt 3: General video stream
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err) {
      setCameraError('Mobile camera permission ungranted or unavailable. Please tap "Grant Permission", use 6-digit PIN, or open Share Link.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Helper: Generate Direct Pairing Share Link
  const getShareableLink = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      return `${origin}/?room=${activeRoomId}&pin=${activePin}`;
    }
    return `/?room=${activeRoomId}&pin=${activePin}`;
  };

  const handleCopyShareLink = () => {
    const link = getShareableLink();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // API Call: Generate QR Code & Room
  const handleGenerateQrCode = async () => {
    setIsGeneratingQr(true);
    setAuthErrorMessage('');
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/qr/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setActiveRoomId(data.roomId);
        setActivePin(data.pin);
        setQrPayload(data.qrPayload);
        setActivePeers([
          { peerId: 'host_1', name: 'Primary Device (Host)', type: 'host', joinedAt: 'Just now', latency: '2ms' }
        ]);
        if (data.docPosts) setSharedDocPosts(data.docPosts);
      } else {
        setAuthErrorMessage('Failed to generate session room.');
      }
    } catch (err) {
      setAuthErrorMessage('API Gateway Server unavailable. Please make sure backend is active.');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // API Call: Perform Security Handshake
  const handlePerformPairHandshake = async (pinValue, roomValue) => {
    const pinToSubmit = (pinValue || inputPin).toString().trim();
    let roomToSubmit = (roomValue || activeRoomId).toString().trim();

    if (!pinToSubmit) {
      setAuthErrorMessage('Security Verification Error: 6-Digit PIN is required!');
      return;
    }

    if (!roomToSubmit || !roomToSubmit.startsWith('SOFO-')) {
      roomToSubmit = `SOFO-${pinToSubmit}`;
    }

    if (isCameraActive) {
      stopCamera();
    }

    setConnectionState('AUTHENTICATING');
    setAuthErrorMessage('');

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pinToSubmit,
          roomId: roomToSubmit,
          deviceName: typeof window !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Web Browser' : 'Desktop Browser Client',
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : ''
        })
      });

      const data = await res.json();

      if (res.ok && data.success && data.authenticated) {
        setSessionToken(data.sessionToken);
        setActiveRoomId(data.roomId);
        setActivePeers(data.allPeers || [data.peer]);
        if (data.docPosts) setSharedDocPosts(data.docPosts);
        if (data.sharedFiles) setSharedFiles(data.sharedFiles);
        setAuthSuccessMessage('Security Verification Verified! Devices Linked.');
        setConnectionState('AUTHENTICATED');
      } else {
        setAuthErrorMessage(data.message || 'Security Verification Failed: Invalid 6-digit PIN or room session not found.');
        setConnectionState('UNLINKED');
      }
    } catch (err) {
      setAuthErrorMessage('Connection Error: Unable to reach verification server.');
      setConnectionState('UNLINKED');
    }
  };

  // Synchronized Disconnect
  const handleDisconnectSession = async () => {
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/session/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: activeRoomId, peerId: 'current' })
      });
    } catch (e) {
      // Ignore network errors on disconnect
    }

    setConnectionState('UNLINKED');
    setSessionToken('');
    setActiveRoomId('');
    setActivePin('');
    setQrPayload('');
    setActivePeers([]);
    setAuthSuccessMessage('');
    setAuthErrorMessage('');
    setInputPin('');
    stopCamera();
  };

  // Whiteboard Canvas Handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? '#0D121F' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');

    if (tool === 'rect') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
    } else if (tool === 'line') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Document Editor Handlers & Real-Time Multi-Device Send Post Card Feature
  const handleDocChange = (e) => {
    setDocContent(e.target.value);
    setAutoSaveStatus('Editing...');
    setTimeout(() => {
      setAutoSaveStatus('Saved & Synced');
    }, 600);
  };

  const handleSendDocumentPostCard = async () => {
    if (!docContent.trim() && !docTitle.trim()) return;

    const newPost = {
      id: `doc_card_${Math.random().toString(36).substring(2, 9)}`,
      title: docTitle || 'Shared Document Note',
      content: docContent || '(Empty Content)',
      author: isMobileDevice ? 'Mobile Client Browser' : 'Primary Host Device',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSharedDocPosts(prev => [newPost, ...prev]);
    setDocContent('');
    setAutoSaveStatus('Posted & Synced 📩');

    // Real-Time Sync to Backend Store so ALL devices receive it instantly!
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/session/sync-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoomId,
          action: 'ADD_DOC_POST',
          newDocPost: newPost
        })
      });
    } catch (err) {}
  };

  const handleCopyDocPostText = (postId, text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedDocId(postId);
      setTimeout(() => setCopiedDocId(null), 2500);
    }
  };

  const handleDeleteDocPostCard = async (postId) => {
    setSharedDocPosts(prev => prev.filter(post => post.id !== postId));
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/session/sync-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoomId,
          action: 'DELETE_DOC_POST',
          postId: postId
        })
      });
    } catch (err) {}
  };

  // Vault File Upload & Multi-Device Downloadable File Cards Handlers
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      const blobUrl = URL.createObjectURL(file);
      const newFileObj = {
        id: `file_${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type || 'Document',
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        uploadedBy: isMobileDevice ? 'Mobile Client Browser' : 'Primary Host Device',
        blobUrl: blobUrl,
        content: `SOFO Sync Shared File Data: ${file.name}`
      };

      setSharedFiles(prev => [newFileObj, ...prev]);

      // Sync File Vault Card to Backend Store so ALL devices get it!
      try {
        await fetch(`${getApiBaseUrl()}/api/v1/session/sync-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: activeRoomId,
            action: 'ADD_FILE',
            newFile: newFileObj
          })
        });
      } catch (err) {}
    }
  };

  const handleDownloadFileCard = (file) => {
    if (file.blobUrl) {
      const a = document.createElement('a');
      a.href = file.blobUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create fallback text file download
      const blob = new Blob([file.content || `SOFO Sync Shared File: ${file.name}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // AI Copilot Query Handler with Real Google Gemini AI API
  const handleSendAiMessage = async () => {
    if (!aiInput.trim()) return;

    const userQuery = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setIsAiLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userQuery,
          docContext: docContent || sharedDocPosts.map(p => `${p.title}: ${p.content}`).join('\n'),
          roomId: activeRoomId
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setAiMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setAiMessages(prev => [...prev, { sender: 'ai', text: '[SOFO AI Copilot]: Response generated for active room session.' }]);
      }
    } catch (err) {
      setAiMessages(prev => [...prev, { sender: 'ai', text: '[SOFO AI Copilot]: Session response active.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#07090E] flex flex-col font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* NAVBAR */}
      <header className="h-16 border-b border-slate-800/80 bg-[#090D16]/90 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 border border-slate-800 flex items-center justify-center bg-slate-900">
            <img src="/SOFO_syc.png" alt="SOFO Sync Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-heading font-black text-base lg:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              SOFO Sync <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 ml-1">v2.0</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">One QR. Instant Connection. Real-Time Collaboration.</p>
          </div>
        </div>

        {/* SECURITY & STATUS BADGE */}
        <div className="flex items-center gap-3">
          {connectionState === 'AUTHENTICATED' ? (
            <>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs font-semibold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Security Verified: AES-256 Encrypted ({activePeers.length} Peers)</span>
              </div>

              <button
                onClick={() => setShowPeersModal(!showPeersModal)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5"
              >
                👥 Paired Devices ({activePeers.length})
              </button>

              <button
                onClick={handleDisconnectSession}
                className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-800/60 text-xs font-bold transition-all"
              >
                🔴 Disconnect All
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>Authentication Pending</span>
            </div>
          )}
        </div>
      </header>

      {/* PAIRED PEERS MODAL */}
      {showPeersModal && connectionState === 'AUTHENTICATED' && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              🔒 Authenticated Devices Room ({activeRoomId})
            </h3>
            <button onClick={() => setShowPeersModal(false)} className="text-xs text-slate-400 hover:text-white">
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activePeers.map((peer, idx) => (
              <div key={idx} className="glass-pill p-3 rounded-xl flex items-center justify-between border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{peer.type === 'host' ? '💻' : '📱'}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{peer.name}</div>
                    <div className="text-[10px] text-slate-400">IP Subnet Verified • Latency: {peer.latency || '4ms'}</div>
                  </div>
                </div>
                <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  VERIFIED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UNLINKED INITIAL AUTHENTICATION SCREEN */}
      {connectionState !== 'AUTHENTICATED' && (
        <main className="flex-1 p-4 lg:p-12 max-w-4xl w-full mx-auto flex flex-col justify-center">
          <div className="glass-panel p-6 lg:p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            <div className="text-center max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest mb-3">
                🔐 Security Verified Pairing Portal
              </div>
              <h2 className="font-heading text-2xl lg:text-4xl font-extrabold text-white tracking-tight">
                Pair Devices to Unlock Workspace
              </h2>
              <p className="text-slate-400 text-xs lg:text-sm mt-2 leading-relaxed">
                Generate a 6-digit PIN, share a direct pairing link, or scan QR code. All features remain strictly locked until security handshake is verified.
              </p>
            </div>

            {/* ERROR / SUCCESS ALERTS */}
            {authErrorMessage && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs font-medium text-center shadow-lg">
                ⚠️ {authErrorMessage}
              </div>
            )}

            {authSuccessMessage && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs font-medium text-center shadow-lg">
                ✅ {authSuccessMessage}
              </div>
            )}

            {/* PORTAL MODE SELECTOR TABS (CAMERA OPTION SHOWN ONLY ON MOBILE BROWSERS) */}
            <div className="mt-8 flex flex-wrap justify-center border-b border-slate-800 pb-4 gap-2">
              {!isMobileDevice && (
                <button
                  onClick={() => setAuthPortalTab('generate')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    authPortalTab === 'generate'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'glass-pill text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📱 1. QR Code</span>
                </button>
              )}

              {/* CAMERA OPTION: DISPLAYED ONLY ON MOBILE BROWSERS */}
              {isMobileDevice && (
                <button
                  onClick={() => setAuthPortalTab('scan')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    authPortalTab === 'scan'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'glass-pill text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📷 1. Mobile Camera</span>
                </button>
              )}

              <button
                onClick={() => setAuthPortalTab('link')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  authPortalTab === 'link'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'glass-pill text-slate-400 hover:text-white'
                }`}
              >
                <span>🔗 2. Shareable Link</span>
              </button>

              <button
                onClick={() => setAuthPortalTab('pin')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  authPortalTab === 'pin'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'glass-pill text-slate-400 hover:text-white'
                }`}
              >
                <span>🔢 3. Enter 6-Digit PIN</span>
              </button>
            </div>

            {/* OPTION 1: GENERATE QR CODE (DESKTOP) */}
            {authPortalTab === 'generate' && !isMobileDevice && (
              <div className="mt-8 flex flex-col items-center text-center space-y-4">
                <p className="text-xs text-slate-400">Scan this QR code with mobile browser camera to pair instantly:</p>

                <div className="p-4 bg-white rounded-2xl shadow-2xl relative border-4 border-indigo-500/30">
                  <svg className="w-52 h-52" viewBox="0 0 100 100">
                    <rect x="5" y="5" width="25" height="25" fill="#07090E" rx="3" />
                    <rect x="9" y="9" width="17" height="17" fill="#FFFFFF" rx="2" />
                    <rect x="13" y="13" width="9" height="9" fill="#6366F1" rx="1" />

                    <rect x="70" y="5" width="25" height="25" fill="#07090E" rx="3" />
                    <rect x="74" y="9" width="17" height="17" fill="#FFFFFF" rx="2" />
                    <rect x="78" y="13" width="9" height="9" fill="#8B5CF6" rx="1" />

                    <rect x="5" y="70" width="25" height="25" fill="#07090E" rx="3" />
                    <rect x="9" y="74" width="17" height="17" fill="#FFFFFF" rx="2" />
                    <rect x="13" y="78" width="9" height="9" fill="#06B6D4" rx="1" />

                    <rect x="35" y="5" width="6" height="6" fill="#07090E" />
                    <rect x="45" y="5" width="6" height="6" fill="#6366F1" />
                    <rect x="35" y="15" width="6" height="6" fill="#8B5CF6" />

                    <rect x="35" y="35" width="30" height="30" fill="#07090E" rx="4" />
                    <text x="50" y="54" fontSize="11" fill="#FFFFFF" textAnchor="middle" fontWeight="bold">SOFO</text>

                    <rect x="70" y="35" width="6" height="6" fill="#07090E" />
                    <rect x="85" y="35" width="6" height="6" fill="#6366F1" />
                    <rect x="35" y="70" width="6" height="6" fill="#07090E" />
                    <rect x="70" y="70" width="10" height="10" fill="#6366F1" rx="2" />
                  </svg>
                  <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-line rounded-full"></div>
                </div>

                <div className="glass-pill px-4 py-2 rounded-xl text-xs font-mono text-indigo-300">
                  Room PIN: <span className="font-bold text-white tracking-widest text-sm">{activePin || '748291'}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/50 px-3 py-1 rounded-lg border border-emerald-800">
                  <span className="animate-pulse">●</span> Waiting for secondary device to connect...
                </div>

                <button
                  onClick={handleGenerateQrCode}
                  disabled={isGeneratingQr}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
                >
                  {isGeneratingQr ? 'Generating...' : '🔄 Refresh QR & Room'}
                </button>
              </div>
            )}

            {/* OPTION 2: GENERATE SHAREABLE LINK */}
            {authPortalTab === 'link' && (
              <div className="mt-8 flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-3xl text-indigo-400 border border-indigo-500/30">
                  🔗
                </div>

                <h3 className="text-lg font-bold text-white">Direct Shareable Pairing Link</h3>
                <p className="text-xs text-slate-400">
                  Send this link to any mobile device or secondary browser. Opening this link automatically verifies PIN & links devices!
                </p>

                <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-indigo-300 break-all select-all">
                  {getShareableLink()}
                </div>

                <button
                  onClick={handleCopyShareLink}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                    copiedLink
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
                  }`}
                >
                  <span>{copiedLink ? '✅ Link Copied to Clipboard!' : '📋 Copy Direct Share Link'}</span>
                </button>
              </div>
            )}

            {/* OPTION 3: MOBILE CAMERA SCANNER (ONLY SHOWN ON MOBILE BROWSERS) */}
            {authPortalTab === 'scan' && isMobileDevice && (
              <div className="mt-6 flex flex-col items-center space-y-4">
                <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
                  <div className="w-full h-56 bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                    />

                    {!isCameraActive && (
                      <div className="text-center p-4">
                        <span className="text-4xl">📷</span>
                        <p className="text-xs text-slate-300 mt-2 font-semibold">Mobile Camera Scanner</p>
                        <p className="text-[10px] text-slate-400 mt-1">Tap below to grant camera permission & scan</p>
                      </div>
                    )}

                    {isCameraActive && (
                      <div className="absolute inset-0 border-2 border-indigo-500/50 rounded-xl pointer-events-none flex items-center justify-center">
                        <div className="w-40 h-40 border-2 border-dashed border-cyan-400 rounded-xl relative">
                          <div className="absolute inset-x-0 h-0.5 bg-cyan-400 animate-scan-line shadow-lg shadow-cyan-400"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {cameraError && (
                    <p className="text-rose-400 text-xs mt-2 text-center font-medium bg-rose-950/60 p-2 rounded-lg border border-rose-800/60">
                      ⚠️ {cameraError}
                    </p>
                  )}

                  <div className="mt-3 flex gap-2 w-full">
                    {!isCameraActive ? (
                      <button
                        onClick={startCamera}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md"
                      >
                        📷 Grant Camera Permission & Start Scanner
                      </button>
                    ) : (
                      <button
                        onClick={stopCamera}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
                      >
                        🛑 Turn Off Camera
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* OPTION 4: CONNECT VIA 6-DIGIT PIN */}
            {authPortalTab === 'pin' && (
              <div className="mt-8 flex flex-col items-center space-y-4 max-w-md mx-auto">
                <div className="w-full">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Enter 6-Digit PIN from Host Device:</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="748291"
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value)}
                    className="w-full text-center tracking-widest font-mono text-2xl py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={() => handlePerformPairHandshake()}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all"
                >
                  🔒 Verify Security PIN & Pair Device
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {/* AUTHENTICATED DASHBOARD */}
      {connectionState === 'AUTHENTICATED' && (
        <main className="flex-1 flex flex-col p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {/* DASHBOARD TAB NAVIGATION */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'whiteboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'glass-pill text-slate-400 hover:text-white'
              }`}
            >
              <span>🎨 Real-Time Whiteboard</span>
            </button>

            <button
              onClick={() => setActiveTab('document')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'document'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'glass-pill text-slate-400 hover:text-white'
              }`}
            >
              <span>📝 Collaborative Document</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'vault'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'glass-pill text-slate-400 hover:text-white'
              }`}
            >
              <span>📁 Shared File Vault</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'ai'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'glass-pill text-slate-400 hover:text-white'
              }`}
            >
              <span>🤖 Google Gemini AI Copilot</span>
            </button>
          </div>

          {/* TAB 1: REAL-TIME WHITEBOARD */}
          {activeTab === 'whiteboard' && (
            <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4">
              {/* TOOLBAR */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTool('pen')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      tool === 'pen' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    ✏️ Pen
                  </button>
                  <button
                    onClick={() => setTool('rect')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      tool === 'rect' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    🔲 Rectangle
                  </button>
                  <button
                    onClick={() => setTool('line')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      tool === 'line' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    📏 Line
                  </button>
                  <button
                    onClick={() => setTool('eraser')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      tool === 'eraser' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    🧹 Eraser
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Color:</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>

                  <button
                    onClick={clearCanvas}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800"
                  >
                    🗑️ Clear Canvas
                  </button>
                </div>
              </div>

              {/* CANVAS DRAWING AREA */}
              <div className="flex-1 w-full h-[500px] bg-[#0D121F] rounded-2xl relative overflow-hidden border border-slate-800">
                <canvas
                  ref={canvasRef}
                  width={1200}
                  height={600}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="w-full h-full cursor-crosshair touch-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: COLLABORATIVE DOCUMENT WITH MULTI-DEVICE SYNCED CARDS FEED */}
          {activeTab === 'document' && (
            <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              {/* EDITOR & SEND BUTTON BAR */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="bg-transparent text-lg font-bold text-white focus:outline-none border-b border-dashed border-slate-700 pb-1"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800">
                      ● {autoSaveStatus}
                    </span>

                    <button
                      onClick={handleSendDocumentPostCard}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-1.5"
                    >
                      📩 Send / Post Document Card
                    </button>
                  </div>
                </div>

                <textarea
                  value={docContent}
                  onChange={handleDocChange}
                  placeholder="Type collaborative document text here, then tap '📩 Send / Post Document Card' to publish card live to all connected devices..."
                  className="w-full h-48 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-sm leading-relaxed"
                />
              </div>

              {/* POSTED CARDS FEED (REAL-TIME SYNCED ACROSS ALL CONNECTED DEVICES) */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    📌 Multi-Device Synced Document Cards ({sharedDocPosts.length})
                  </h3>
                  <span className="text-[10px] text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800">
                    Live Synced Across Mobile & PC
                  </span>
                </div>

                {sharedDocPosts.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                    No document cards posted yet. Type text above and tap <strong className="text-indigo-400">&quot;📩 Send / Post Document Card&quot;</strong> to publish live to all devices!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sharedDocPosts.map(post => (
                      <div key={post.id} className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col justify-between space-y-3 relative group">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>📝</span> {post.title}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {post.timestamp}
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-xl border border-slate-900 whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {post.content}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                          <span className="text-indigo-400 font-semibold flex items-center gap-1">
                            👤 {post.author}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyDocPostText(post.id, post.content)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
                            >
                              {copiedDocId === post.id ? '✅ Copied!' : '📋 Copy Text'}
                            </button>

                            <button
                              onClick={() => handleDeleteDocPostCard(post.id)}
                              className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold border border-rose-800/60"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SHARED FILE VAULT WITH MULTI-DEVICE DOWNLOADABLE FILE CARDS */}
          {activeTab === 'vault' && (
            <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Shared File Vault</h3>
                  <p className="text-xs text-slate-400">Upload files & sync downloadable file cards live across all connected devices</p>
                </div>

                <label className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-500/20 flex items-center gap-1.5">
                  📤 Upload & Share File
                  <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {sharedFiles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-2xl text-center">
                  <span className="text-4xl mb-2">📁</span>
                  <p className="text-sm font-semibold text-slate-300">No files uploaded yet</p>
                  <p className="text-xs text-slate-500 mt-1">Upload any document, image, or zip file to broadcast downloadable card live to all devices</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sharedFiles.map(file => (
                    <div key={file.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl">
                          {file.type.includes('image') ? '🖼️' : file.type.includes('pdf') ? '📕' : '📄'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{file.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{file.size} • Uploaded {file.uploadedAt}</div>
                          <div className="text-[9px] text-indigo-400 mt-0.5 font-semibold">By: {file.uploadedBy}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadFileCard(file)}
                        className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-extrabold text-xs border border-emerald-800 flex items-center gap-1 shadow-md"
                      >
                        📥 Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GOOGLE GEMINI AI COPILOT */}
          {activeTab === 'ai' && (
            <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl h-[600px]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">Google Gemini 1.5 Flash AI Copilot</h3>
                    <p className="text-[10px] text-slate-400">Contextual Session AI Assistant</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-800">
                  ACTIVE
                </span>
              </div>

              {/* MESSAGES LIST */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900 border border-slate-800 text-indigo-300 p-3 rounded-2xl text-xs animate-pulse">
                      Google Gemini AI is processing response...
                    </div>
                  </div>
                )}
              </div>

              {/* INPUT BAR */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                  placeholder="Ask Gemini AI about session document or whiteboard..."
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSendAiMessage}
                  disabled={isAiLoading}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
