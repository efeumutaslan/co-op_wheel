'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Wheel from '@/components/Wheel'
import Confetti from '@/components/Confetti'

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

// Kısa kod oluştur
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export default function Home() {
  const [view, setView] = useState('home')
  const [currentRoom, setCurrentRoom] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [username, setUsername] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [copied, setCopied] = useState(false)
  
  const channelRef = useRef(null)
  const spinTimeoutRef = useRef(null)

  // Supabase Realtime'a bağlan
  const connectToRoom = useCallback((roomCode, roomData) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase.channel(`room:${roomCode}`, {
      config: {
        broadcast: { self: true },
        presence: { key: username }
      }
    })

    channel
      .on('broadcast', { event: 'room_update' }, ({ payload }) => {
        console.log('Room update received:', payload)
        setCurrentRoom(payload.room)
      })
      .on('broadcast', { event: 'spin_start' }, ({ payload }) => {
        console.log('Spin start received:', payload)
        if (!spinning) {
          handleRemoteSpin(payload)
        }
      })
      .on('broadcast', { event: 'spin_result' }, ({ payload }) => {
        console.log('Spin result received:', payload)
        setWinner({ name: payload.winner })
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      })
      .on('broadcast', { event: 'user_joined' }, ({ payload }) => {
        console.log('User joined:', payload)
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        console.log('Presence sync:', state)
      })
      .subscribe((status) => {
        console.log('Channel status:', status)
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
          channel.track({ username, joinedAt: new Date().toISOString() })
        }
      })

    channelRef.current = channel
    return channel
  }, [username, spinning])

  // Uzaktan gelen çevirmeyi işle
  const handleRemoteSpin = (payload) => {
    setSpinning(true)
    setWinner(null)
    setRotation(payload.rotation)

    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current)
    }

    spinTimeoutRef.current = setTimeout(() => {
      setSpinning(false)
    }, 6000)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current)
      }
    }
  }, [])

  // LocalStorage'dan oda verisi yükle/kaydet
  const saveRoomToStorage = (room) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`room:${room.code}`, JSON.stringify(room))
    }
  }

  const loadRoomFromStorage = (code) => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(`room:${code}`)
      return data ? JSON.parse(data) : null
    }
    return null
  }

  // Broadcast ile oda güncelle
  const broadcastRoomUpdate = async (room) => {
    saveRoomToStorage(room)
    setCurrentRoom(room)
    
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'room_update',
        payload: { room }
      })
    }
  }

  // Oda oluştur
  const createRoom = async () => {
    if (!username.trim()) {
      setError('Lütfen bir kullanıcı adı girin')
      return
    }

    const code = generateCode()
    const newRoom = {
      code,
      name: `${username}'in Çarkı`,
      createdAt: new Date().toISOString(),
      admin: username,
      moderators: [],
      participants: [{ name: username, joinedAt: new Date().toISOString() }],
      items: [],
      spinHistory: []
    }

    saveRoomToStorage(newRoom)
    setCurrentRoom(newRoom)
    setCurrentUser({ name: username, role: 'admin' })
    connectToRoom(code, newRoom)
    setView('room')
    setError('')
  }

  // Odaya katıl
  const joinRoom = async () => {
    if (!username.trim()) {
      setError('Lütfen bir kullanıcı adı girin')
      return
    }
    if (!joinCode.trim()) {
      setError('Lütfen oda kodunu girin')
      return
    }

    const code = joinCode.toUpperCase().trim()
    
    // Önce localStorage'dan kontrol et
    let room = loadRoomFromStorage(code)
    
    if (!room) {
      // Oda bulunamadı - Supabase Realtime ile sync olana kadar bekle
      // Şimdilik boş bir oda ile başla
      setError('Oda bulunamadı veya henüz senkronize edilmedi. Kod doğruysa tekrar deneyin.')
      return
    }

    // Kullanıcı zaten var mı?
    const existingUser = room.participants.find(p => p.name === username)
    if (!existingUser) {
      room.participants.push({ name: username, joinedAt: new Date().toISOString() })
    }

    // Rol belirle
    let role = 'participant'
    if (room.admin === username) role = 'admin'
    else if (room.moderators?.includes(username)) role = 'moderator'

    saveRoomToStorage(room)
    setCurrentRoom(room)
    setCurrentUser({ name: username, role })
    
    const channel = connectToRoom(code, room)
    
    // Katılımı bildir
    setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'user_joined',
        payload: { username, room }
      })
    }, 1000)
    
    setView('room')
    setError('')
  }

  // Çark öğesi ekle
  const addItem = async () => {
    if (!newItemName.trim() || !currentRoom) return
    if (!['admin', 'moderator'].includes(currentUser.role)) return

    const updatedRoom = {
      ...currentRoom,
      items: [...currentRoom.items, { id: Date.now(), name: newItemName.trim() }]
    }

    await broadcastRoomUpdate(updatedRoom)
    setNewItemName('')
  }

  // Çark öğesi sil
  const removeItem = async (itemId) => {
    if (!['admin', 'moderator'].includes(currentUser.role)) return

    const updatedRoom = {
      ...currentRoom,
      items: currentRoom.items.filter(item => item.id !== itemId)
    }

    await broadcastRoomUpdate(updatedRoom)
  }

  // Tüm öğeleri temizle
  const clearAllItems = async () => {
    if (currentUser.role !== 'admin') return

    const updatedRoom = {
      ...currentRoom,
      items: [],
      spinHistory: []
    }

    await broadcastRoomUpdate(updatedRoom)
  }

  // Moderatör toggle
  const toggleModerator = async (participantName) => {
    if (currentUser.role !== 'admin') return
    if (participantName === currentRoom.admin) return

    let newModerators = currentRoom.moderators || []
    if (newModerators.includes(participantName)) {
      newModerators = newModerators.filter(m => m !== participantName)
    } else {
      newModerators = [...newModerators, participantName]
    }

    const updatedRoom = { ...currentRoom, moderators: newModerators }
    await broadcastRoomUpdate(updatedRoom)

    if (participantName === currentUser.name) {
      setCurrentUser(prev => ({
        ...prev,
        role: newModerators.includes(participantName) ? 'moderator' : 'participant'
      }))
    }
  }

  // Çarkı çevir
  const spinWheel = async () => {
    if (spinning || currentRoom.items.length < 2) return

    setSpinning(true)
    setWinner(null)

    const baseRotation = rotation
    const spins = 6 + Math.random() * 5
    const extraDegrees = Math.random() * 360
    const totalRotation = baseRotation + spins * 360 + extraDegrees

    // Kazananı hesapla
    const finalAngle = totalRotation % 360
    const sliceAngle = 360 / currentRoom.items.length
    const winnerIndex = Math.floor((360 - finalAngle + sliceAngle / 2) % 360 / sliceAngle)
    const winnerItem = currentRoom.items[winnerIndex % currentRoom.items.length]

    setRotation(totalRotation)

    // Çevirmeyi broadcast et
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'spin_start',
        payload: {
          rotation: totalRotation,
          spinBy: currentUser.name,
          winner: winnerItem.name
        }
      })
    }

    // 6 saniye sonra sonucu göster
    spinTimeoutRef.current = setTimeout(async () => {
      setWinner(winnerItem)
      setShowConfetti(true)
      setSpinning(false)

      const historyEntry = {
        winner: winnerItem.name,
        spinBy: currentUser.name,
        time: new Date().toISOString()
      }

      const updatedRoom = {
        ...currentRoom,
        spinHistory: [historyEntry, ...(currentRoom.spinHistory || []).slice(0, 49)]
      }

      await broadcastRoomUpdate(updatedRoom)

      // Sonucu broadcast et
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'spin_result',
          payload: { winner: winnerItem.name, spinBy: currentUser.name }
        })
      }

      setTimeout(() => setShowConfetti(false), 4000)
    }, 6000)
  }

  // Kodu kopyala
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentRoom.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      const input = document.createElement('input')
      input.value = currentRoom.code
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Odadan çık
  const leaveRoom = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    setCurrentRoom(null)
    setCurrentUser(null)
    setView('home')
    setWinner(null)
    setRotation(0)
    setConnectionStatus('disconnected')
  }

  // Rol belirleme
  const getUserRole = (name) => {
    if (!currentRoom) return 'participant'
    if (currentRoom.admin === name) return 'admin'
    if (currentRoom.moderators?.includes(name)) return 'moderator'
    return 'participant'
  }

  const canManage = currentUser && ['admin', 'moderator'].includes(currentUser.role)

  return (
    <main className="min-h-screen p-4 overflow-x-hidden">
      <Confetti active={showConfetti} />

      {/* Home View */}
      {view === 'home' && (
        <div className="max-w-md mx-auto pt-16 animate-fadeIn">
          <div className="text-center mb-12">
            <div className="text-8xl mb-6 animate-bounce">🎡</div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 mb-4">
              Co-op Çark
            </h1>
            <p className="text-white/80 text-lg mb-6">
              Arkadaşlarınla anlık senkronize çark çevir!
            </p>
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm border border-green-500/30">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Supabase Realtime ile Anlık Senkronizasyon
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setView('create')}
              className="w-full py-5 px-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl font-bold text-xl text-gray-900 shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 transform hover:scale-105 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <span className="text-3xl">🎯</span>
              Çark Kur
            </button>

            <button
              onClick={() => setView('join')}
              className="w-full py-5 px-6 glass rounded-2xl font-bold text-xl text-white hover:bg-white/20 transform hover:scale-105 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <span className="text-3xl">🎪</span>
              Çarka Katıl
            </button>
          </div>

          <div className="mt-12 text-center text-white/60 text-sm space-y-1">
            <p>⚡ Gerçek zamanlı WebSocket bağlantısı</p>
            <p>👥 Sınırsız katılımcı</p>
            <p>🎨 Eğlenceli animasyonlar</p>
            <p>🔒 Güvenli ve adil</p>
          </div>
        </div>
      )}

      {/* Create Room View */}
      {view === 'create' && (
        <div className="max-w-md mx-auto pt-10">
          <button
            onClick={() => setView('home')}
            className="text-white/80 mb-6 flex items-center gap-2 hover:text-white transition-colors"
          >
            ← Geri
          </button>

          <div className="glass rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              🎯 Yeni Çark Oluştur
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-white/80 mb-2 font-medium">
                  Kullanıcı Adın
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Adını gir..."
                  className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 focus:border-yellow-400 focus:outline-none text-lg text-white placeholder-white/40 transition-colors"
                  maxLength={20}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                onClick={createRoom}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-yellow-500/30"
              >
                Çark Oluştur 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Room View */}
      {view === 'join' && (
        <div className="max-w-md mx-auto pt-10">
          <button
            onClick={() => setView('home')}
            className="text-white/80 mb-6 flex items-center gap-2 hover:text-white transition-colors"
          >
            ← Geri
          </button>

          <div className="glass rounded-3xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              🎪 Çarka Katıl
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-white/80 mb-2 font-medium">
                  Kullanıcı Adın
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Adını gir..."
                  className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 focus:border-yellow-400 focus:outline-none text-lg text-white placeholder-white/40 transition-colors"
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 font-medium">
                  Oda Kodu
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 focus:border-yellow-400 focus:outline-none text-2xl text-center tracking-[0.3em] font-mono text-white placeholder-white/40 transition-colors"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                onClick={joinRoom}
                className="w-full py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-green-500/30"
              >
                Katıl 🎉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room View */}
      {view === 'room' && currentRoom && (
        <div className="max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="glass rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={leaveRoom}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
              >
                ← Çık
              </button>
              <div>
                <h2 className="text-white font-bold text-lg">{currentRoom.name}</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyCode}
                    className="text-yellow-300 font-mono bg-yellow-500/20 px-3 py-1 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center gap-2"
                  >
                    <span className="tracking-widest">{currentRoom.code}</span>
                    <span className="text-xs">{copied ? '✓' : '📋'}</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                    <span className="text-white/60 text-xs">
                      {connectionStatus === 'connected' ? 'Canlı' : 'Bağlanıyor...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                currentUser.role === 'admin'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900'
                  : currentUser.role === 'moderator'
                  ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-blue-900'
                  : 'bg-white/20 text-white'
              }`}>
                {currentUser.role === 'admin' ? '👑 Admin' :
                 currentUser.role === 'moderator' ? '🛡️ Mod' : '👤 Katılımcı'}
              </span>
              <span className="text-white font-medium">{currentUser.name}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-4">
            {/* Left Panel - Items */}
            <div className="glass rounded-2xl p-5 shadow-xl">
              <h3 className="font-bold text-white mb-4 flex items-center justify-between">
                <span>🎰 Çark Öğeleri ({currentRoom.items.length})</span>
                {currentUser.role === 'admin' && currentRoom.items.length > 0 && (
                  <button
                    onClick={clearAllItems}
                    className="text-xs text-red-300 hover:text-red-200 hover:bg-red-500/20 px-2 py-1 rounded transition-colors"
                  >
                    Temizle
                  </button>
                )}
              </h3>

              {canManage && (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem()}
                    placeholder="Yeni öğe ekle..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-yellow-400 focus:outline-none text-white placeholder-white/40 transition-colors"
                    maxLength={30}
                  />
                  <button
                    onClick={addItem}
                    className="px-5 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 rounded-xl font-bold hover:opacity-90 transition-opacity"
                  >
                    +
                  </button>
                </div>
              )}

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {currentRoom.items.length === 0 ? (
                  <div className="text-white/40 text-center py-8">
                    <div className="text-4xl mb-2">📝</div>
                    <p>Henüz öğe eklenmemiş</p>
                    {canManage && <p className="text-sm mt-1">Yukarıdan ekleyebilirsin</p>}
                  </div>
                ) : (
                  currentRoom.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                    >
                      <div
                        className="w-5 h-5 rounded-full shadow-lg flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="flex-1 font-medium text-white truncate">{item.name}</span>
                      {canManage && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Center - Wheel */}
            <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[520px]">
              {currentRoom.items.length < 2 ? (
                <div className="text-center text-white/60 p-8">
                  <div className="text-8xl mb-6 opacity-50">🎡</div>
                  <p className="text-xl">Çarkı çevirmek için</p>
                  <p className="text-xl">en az <span className="text-yellow-400 font-bold">2 öğe</span> ekleyin</p>
                </div>
              ) : (
                <>
                  <Wheel
                    items={currentRoom.items}
                    spinning={spinning}
                    rotation={rotation}
                  />

                  <button
                    onClick={spinWheel}
                    disabled={spinning || currentRoom.items.length < 2}
                    className={`mt-8 px-10 py-4 rounded-full font-bold text-xl shadow-2xl transform transition-all ${
                      spinning
                        ? 'bg-gray-500 cursor-not-allowed scale-95'
                        : 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-gray-900 hover:scale-110 hover:shadow-green-500/50 active:scale-95'
                    }`}
                  >
                    {spinning ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">🎡</span> Dönüyor...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        🚀 Çarkı Çevir!
                      </span>
                    )}
                  </button>

                  {winner && !spinning && (
                    <div className="mt-6 p-5 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl text-center shadow-2xl shadow-orange-500/30 winner-announcement">
                      <p className="text-white font-black text-2xl">
                        🎉 Kazanan 🎉
                      </p>
                      <p className="text-white font-bold text-3xl mt-1">
                        {winner.name}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Panel */}
            <div className="space-y-4">
              {/* Participants */}
              <div className="glass rounded-2xl p-5 shadow-xl">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  👥 Katılımcılar
                  <span className="bg-white/20 text-white/80 text-xs px-2 py-1 rounded-full">
                    {currentRoom.participants.length}
                  </span>
                </h3>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {currentRoom.participants.map((p) => {
                    const role = getUserRole(p.name)
                    return (
                      <div
                        key={p.name}
                        className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                          p.name === currentUser.name
                            ? 'bg-purple-500/20 border border-purple-400/30'
                            : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {role === 'admin' ? '👑' : role === 'moderator' ? '🛡️' : '👤'}
                          </span>
                          <span className={`font-medium ${
                            p.name === currentUser.name ? 'text-purple-300' : 'text-white'
                          }`}>
                            {p.name}
                            {p.name === currentUser.name && (
                              <span className="text-purple-400 text-xs ml-1">(Sen)</span>
                            )}
                          </span>
                        </div>

                        {currentUser.role === 'admin' && p.name !== currentRoom.admin && (
                          <button
                            onClick={() => toggleModerator(p.name)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                              role === 'moderator'
                                ? 'bg-blue-500/30 text-blue-300 hover:bg-blue-500/40'
                                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                            }`}
                          >
                            {role === 'moderator' ? '🛡️ Mod' : 'Mod Yap'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Spin History */}
              <div className="glass rounded-2xl p-5 shadow-xl">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  📜 Çevirme Geçmişi
                </h3>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(!currentRoom.spinHistory || currentRoom.spinHistory.length === 0) ? (
                    <div className="text-white/40 text-center py-6">
                      <div className="text-3xl mb-2">🎯</div>
                      <p className="text-sm">Henüz çevirme yapılmadı</p>
                    </div>
                  ) : (
                    currentRoom.spinHistory.map((entry, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border transition-colors ${
                          i === 0
                            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <p className={`font-bold ${i === 0 ? 'text-yellow-300' : 'text-white'}`}>
                          🎯 {entry.winner}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          {entry.spinBy} • {new Date(entry.time).toLocaleTimeString('tr-TR')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-5 border border-purple-400/20">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  💡 Nasıl Çalışır?
                </h4>
                <ul className="text-white/70 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span>📤</span>
                    <span>Kodu arkadaşlarınla paylaş</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>👑</span>
                    <span>Admin moderatör atayabilir</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✏️</span>
                    <span>Admin/Mod öğe ekler/çıkarır</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🎡</span>
                    <span>Herkes çarkı çevirebilir</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>⚡</span>
                    <span>Supabase ile anlık senkron!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
