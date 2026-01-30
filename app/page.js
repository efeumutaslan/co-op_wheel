'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, roomDB } from '@/lib/supabase'
import Wheel from '@/components/Wheel'
import Confetti from '@/components/Confetti'

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Turnuva Bracket Komponenti
function TournamentBracket({ tournament, currentUser }) {
  if (!tournament) return null

  const { mode, rounds, currentRound, eliminated, champion, participants } = tournament

  if (mode === 'survivor') {
    const remaining = participants.filter(p => !eliminated.includes(p))
    
    return (
      <div className="glass rounded-2xl p-5 shadow-xl">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          🏆 Turnuva - Son Kalan Kazanır
          <span className="bg-orange-500/30 text-orange-300 text-xs px-2 py-1 rounded-full">
            Tur {currentRound}
          </span>
        </h3>

        {champion ? (
          <div className="text-center py-6">
            <div className="text-6xl mb-4">👑</div>
            <p className="text-yellow-400 font-bold text-2xl">ŞAMPİYON!</p>
            <p className="text-white font-bold text-3xl mt-2">{champion}</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-white/60 text-sm mb-2">Kalanlar ({remaining.length})</p>
              <div className="flex flex-wrap gap-2">
                {remaining.map((p, i) => (
                  <span 
                    key={p}
                    className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-full text-sm font-medium border border-green-500/30"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {eliminated.length > 0 && (
              <div>
                <p className="text-white/60 text-sm mb-2">Elenenler ({eliminated.length})</p>
                <div className="flex flex-wrap gap-2">
                  {eliminated.map((p, i) => (
                    <span 
                      key={p}
                      className="px-3 py-1.5 bg-red-500/20 text-red-300/60 rounded-full text-sm line-through border border-red-500/20"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // Bracket modu
  if (mode === 'bracket') {
    return (
      <div className="glass rounded-2xl p-5 shadow-xl">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          🏆 Turnuva Bracket
          <span className="bg-purple-500/30 text-purple-300 text-xs px-2 py-1 rounded-full">
            Tur {currentRound}
          </span>
        </h3>

        {champion ? (
          <div className="text-center py-6">
            <div className="text-6xl mb-4">👑</div>
            <p className="text-yellow-400 font-bold text-2xl">ŞAMPİYON!</p>
            <p className="text-white font-bold text-3xl mt-2">{champion}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rounds.map((round, roundIndex) => (
              <div key={roundIndex} className={`${roundIndex < currentRound - 1 ? 'opacity-50' : ''}`}>
                <p className="text-white/60 text-xs mb-2">
                  {roundIndex === rounds.length - 1 ? '🏆 Final' : `Tur ${roundIndex + 1}`}
                </p>
                <div className="space-y-2">
                  {round.matches.map((match, matchIndex) => (
                    <div 
                      key={matchIndex}
                      className={`p-3 rounded-xl border ${
                        roundIndex === currentRound - 1 && !match.winner
                          ? 'bg-yellow-500/20 border-yellow-500/50'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          {match.isTriple ? (
                            // 3'lü maç gösterimi
                            <>
                              <span className="text-yellow-400 text-xs mr-1">3'lü</span>
                              <span className={`font-medium ${match.winner && match.eliminated?.includes(match.player1) ? 'text-red-400/60 line-through' : match.winner ? 'text-green-400' : 'text-white'}`}>
                                {match.player1 || '?'}
                              </span>
                              <span className="text-white/40">vs</span>
                              <span className={`font-medium ${match.winner && match.eliminated?.includes(match.player2) ? 'text-red-400/60 line-through' : match.winner ? 'text-green-400' : 'text-white'}`}>
                                {match.player2 || '?'}
                              </span>
                              <span className="text-white/40">vs</span>
                              <span className={`font-medium ${match.winner && match.eliminated?.includes(match.player3) ? 'text-red-400/60 line-through' : match.winner ? 'text-green-400' : 'text-white'}`}>
                                {match.player3 || '?'}
                              </span>
                            </>
                          ) : (
                            // Normal 2'li maç
                            <>
                              <span className={`font-medium ${match.winner === match.player1 ? 'text-green-400' : match.winner ? 'text-red-400/60 line-through' : 'text-white'}`}>
                                {match.player1 || '?'}
                              </span>
                              <span className="text-white/40">vs</span>
                              <span className={`font-medium ${match.winner === match.player2 ? 'text-green-400' : match.winner ? 'text-red-400/60 line-through' : 'text-white'}`}>
                                {match.player2 || '?'}
                              </span>
                            </>
                          )}
                        </div>
                        {match.winner && (
                          <span className="text-green-400 text-xs">
                            {match.isTriple ? `❌ ${match.eliminated?.[0]}` : `✓ ${match.winner}`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {eliminated.length > 0 && !champion && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/60 text-sm mb-2">Elenenler</p>
            <div className="flex flex-wrap gap-2">
              {eliminated.map((p) => (
                <span 
                  key={p}
                  className="px-2 py-1 bg-red-500/20 text-red-300/60 rounded text-xs line-through"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
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
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [copied, setCopied] = useState(false)
  const [showTournamentModal, setShowTournamentModal] = useState(false)
  
  const channelRef = useRef(null)
  const spinTimeoutRef = useRef(null)

  const connectToRoom = useCallback((roomCode) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = roomDB.subscribeToRoom(roomCode, (event, payload) => {
      console.log('Realtime event:', event, payload)
      
      if (event === 'room_update') {
        setCurrentRoom(payload)
      } else if (event === 'spin_start' && !spinning) {
        handleRemoteSpin(payload)
      } else if (event === 'spin_result') {
        setWinner({ name: payload.winner, isEliminated: payload.isEliminated })
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }
    })

    channel.subscribe((status) => {
      console.log('Channel status:', status)
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected')
      }
    })

    channelRef.current = channel
    return channel
  }, [spinning])

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

  const createRoom = async () => {
    if (!username.trim()) {
      setError('Lütfen bir kullanıcı adı girin')
      return
    }

    setLoading(true)
    setError('')

    try {
      const code = generateCode()
      const newRoom = {
        code,
        name: `${username}'in Çarkı`,
        admin: username,
        moderators: [],
        participants: [{ name: username, joinedAt: new Date().toISOString() }],
        items: [],
        spinHistory: [],
        tournament: null
      }

      await roomDB.create(newRoom)
      
      setCurrentRoom(newRoom)
      setCurrentUser({ name: username, role: 'admin' })
      connectToRoom(code)
      setView('room')
    } catch (err) {
      console.error('Create room error:', err)
      setError('Oda oluşturulamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async () => {
    if (!username.trim()) {
      setError('Lütfen bir kullanıcı adı girin')
      return
    }
    if (!joinCode.trim()) {
      setError('Lütfen oda kodunu girin')
      return
    }

    setLoading(true)
    setError('')

    try {
      const code = joinCode.toUpperCase().trim()
      const room = await roomDB.get(code)
      
      if (!room) {
        setError('Oda bulunamadı! Kodu kontrol edin.')
        setLoading(false)
        return
      }

      const existingUser = room.participants.find(p => p.name === username)
      if (!existingUser) {
        room.participants.push({ name: username, joinedAt: new Date().toISOString() })
        await roomDB.update(code, { participants: room.participants })
      }

      let role = 'participant'
      if (room.admin === username) role = 'admin'
      else if (room.moderators?.includes(username)) role = 'moderator'

      setCurrentRoom(room)
      setCurrentUser({ name: username, role })
      connectToRoom(code)
      setView('room')
    } catch (err) {
      console.error('Join room error:', err)
      setError('Odaya katılınamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const addItem = async () => {
    if (!newItemName.trim() || !currentRoom) return
    if (!['admin', 'moderator'].includes(currentUser.role)) return

    try {
      const newItems = [...currentRoom.items, { id: Date.now(), name: newItemName.trim() }]
      await roomDB.update(currentRoom.code, { items: newItems })
      setCurrentRoom(prev => ({ ...prev, items: newItems }))
      setNewItemName('')
    } catch (err) {
      console.error('Add item error:', err)
    }
  }

  const removeItem = async (itemId) => {
    if (!['admin', 'moderator'].includes(currentUser.role)) return
    if (currentRoom.tournament && !currentRoom.tournament.champion) return

    try {
      const newItems = currentRoom.items.filter(item => item.id !== itemId)
      await roomDB.update(currentRoom.code, { items: newItems })
      setCurrentRoom(prev => ({ ...prev, items: newItems }))
    } catch (err) {
      console.error('Remove item error:', err)
    }
  }

  const clearAllItems = async () => {
    if (currentUser.role !== 'admin') return

    try {
      await roomDB.update(currentRoom.code, { items: [], spinHistory: [], tournament: null })
      setCurrentRoom(prev => ({ ...prev, items: [], spinHistory: [], tournament: null }))
    } catch (err) {
      console.error('Clear items error:', err)
    }
  }

  const toggleModerator = async (participantName) => {
    if (currentUser.role !== 'admin') return
    if (participantName === currentRoom.admin) return

    try {
      let newModerators = currentRoom.moderators || []
      if (newModerators.includes(participantName)) {
        newModerators = newModerators.filter(m => m !== participantName)
      } else {
        newModerators = [...newModerators, participantName]
      }

      await roomDB.update(currentRoom.code, { moderators: newModerators })
      setCurrentRoom(prev => ({ ...prev, moderators: newModerators }))

      if (participantName === currentUser.name) {
        setCurrentUser(prev => ({
          ...prev,
          role: newModerators.includes(participantName) ? 'moderator' : 'participant'
        }))
      }
    } catch (err) {
      console.error('Toggle moderator error:', err)
    }
  }

  // Adil bracket oluşturma - 3'lü maç sistemi
  const createFairBracket = (participants) => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const rounds = []
    let currentParticipants = [...shuffled]

    while (currentParticipants.length > 1) {
      const matches = []
      const remaining = [...currentParticipants]
      
      // Tek sayıda ise 3'lü maç yap
      if (remaining.length % 2 === 1 && remaining.length >= 3) {
        // 3'lü maç
        const tripleMatch = {
          player1: remaining.pop(),
          player2: remaining.pop(),
          player3: remaining.pop(),
          isTriple: true,
          winner: null,
          eliminated: []
        }
        matches.push(tripleMatch)
      }
      
      // Kalan 2'li maçlar
      while (remaining.length >= 2) {
        matches.push({
          player1: remaining.pop(),
          player2: remaining.pop(),
          isTriple: false,
          winner: null
        })
      }

      rounds.push({ matches })

      // Sonraki tur için kazanan sayısını hesapla
      let nextRoundCount = 0
      matches.forEach(m => {
        if (m.isTriple) {
          nextRoundCount += 2 // 3'lü maçtan 2 kişi geçer
        } else {
          nextRoundCount += 1 // 2'li maçtan 1 kişi geçer
        }
      })

      currentParticipants = Array(nextRoundCount).fill('TBD')
    }

    return rounds
  }

  // Turnuva başlat
  const startTournament = async (mode) => {
    if (currentUser.role !== 'admin') return
    if (currentRoom.items.length < 2) return

    const participants = currentRoom.items.map(item => item.name)
    
    let tournament = {
      mode,
      participants: [...participants],
      eliminated: [],
      currentRound: 1,
      champion: null,
      startedAt: new Date().toISOString()
    }

    if (mode === 'bracket') {
      tournament.rounds = createFairBracket(participants)
    }

    try {
      await roomDB.update(currentRoom.code, { tournament })
      setCurrentRoom(prev => ({ ...prev, tournament }))
      setShowTournamentModal(false)
    } catch (err) {
      console.error('Start tournament error:', err)
    }
  }

  const cancelTournament = async () => {
    if (currentUser.role !== 'admin') return

    try {
      await roomDB.update(currentRoom.code, { tournament: null })
      setCurrentRoom(prev => ({ ...prev, tournament: null }))
    } catch (err) {
      console.error('Cancel tournament error:', err)
    }
  }

  // Turnuva çarkı çevir
  const spinTournamentWheel = async () => {
    if (spinning || !currentRoom.tournament || currentRoom.tournament.champion) return

    const tournament = currentRoom.tournament
    let wheelItems = []
    let activeMatch = null
    let matchIndex = -1

    if (tournament.mode === 'survivor') {
      wheelItems = tournament.participants
        .filter(p => !tournament.eliminated.includes(p))
        .map((name, i) => ({ id: i, name }))
    } else if (tournament.mode === 'bracket') {
      const currentRoundData = tournament.rounds[tournament.currentRound - 1]
      matchIndex = currentRoundData.matches.findIndex(m => !m.winner)
      activeMatch = currentRoundData.matches[matchIndex]
      
      if (activeMatch) {
        if (activeMatch.isTriple) {
          // 3'lü maç
          wheelItems = [
            { id: 1, name: activeMatch.player1 },
            { id: 2, name: activeMatch.player2 },
            { id: 3, name: activeMatch.player3 }
          ]
        } else {
          // 2'li maç
          wheelItems = [
            { id: 1, name: activeMatch.player1 },
            { id: 2, name: activeMatch.player2 }
          ]
        }
      }
    }

    if (wheelItems.length < 2) return

    setSpinning(true)
    setWinner(null)

    const baseRotation = rotation
    const spins = 6 + Math.random() * 5
    const extraDegrees = Math.random() * 360
    const totalRotation = baseRotation + spins * 360 + extraDegrees

    const finalAngle = totalRotation % 360
    const sliceAngle = 360 / wheelItems.length
    const winnerIndex = Math.floor((360 - finalAngle + sliceAngle / 2) % 360 / sliceAngle)
    const selectedItem = wheelItems[winnerIndex % wheelItems.length]

    setRotation(totalRotation)

    if (channelRef.current) {
      await roomDB.broadcast(channelRef.current, 'spin_start', {
        rotation: totalRotation,
        spinBy: currentUser.name,
        winner: selectedItem.name
      })
    }

    spinTimeoutRef.current = setTimeout(async () => {
      const isEliminated = tournament.mode === 'survivor' || (activeMatch && activeMatch.isTriple)
      setWinner({ name: selectedItem.name, isEliminated })
      setShowConfetti(true)
      setSpinning(false)

      let updatedTournament = { ...tournament }

      if (tournament.mode === 'survivor') {
        // Çıkan elenir
        updatedTournament.eliminated = [...tournament.eliminated, selectedItem.name]
        
        const remaining = tournament.participants.filter(
          p => !updatedTournament.eliminated.includes(p)
        )

        if (remaining.length === 1) {
          updatedTournament.champion = remaining[0]
        } else {
          updatedTournament.currentRound = tournament.currentRound + 1
        }
      } else if (tournament.mode === 'bracket') {
        const rounds = JSON.parse(JSON.stringify(tournament.rounds))
        const currentRoundData = rounds[tournament.currentRound - 1]
        const match = currentRoundData.matches[matchIndex]

        if (match.isTriple) {
          // 3'lü maçta çıkan elenir, diğer 2'si geçer
          match.eliminated = [selectedItem.name]
          match.winner = 'completed'
          updatedTournament.eliminated = [...tournament.eliminated, selectedItem.name]
        } else {
          // 2'li maçta seçilen kazanır
          match.winner = selectedItem.name
          const loser = match.player1 === selectedItem.name ? match.player2 : match.player1
          updatedTournament.eliminated = [...tournament.eliminated, loser]
        }

        // Tüm maçlar bitti mi?
        const allMatchesDone = currentRoundData.matches.every(m => m.winner)

        if (allMatchesDone) {
          // Kazananları topla
          const winners = []
          currentRoundData.matches.forEach(m => {
            if (m.isTriple) {
              // 3'lü maçtan elenmeyen 2 kişi geçer
              const allPlayers = [m.player1, m.player2, m.player3]
              allPlayers.forEach(p => {
                if (!m.eliminated.includes(p)) winners.push(p)
              })
            } else {
              winners.push(m.winner)
            }
          })

          if (winners.length === 1) {
            // Şampiyon!
            updatedTournament.champion = winners[0]
          } else {
            // Sonraki tura geç
            updatedTournament.currentRound = tournament.currentRound + 1

            // Sonraki turun maçlarını güncelle
            if (rounds[tournament.currentRound]) {
              const nextRound = rounds[tournament.currentRound]
              let winnerIdx = 0
              
              nextRound.matches.forEach(match => {
                if (match.isTriple) {
                  if (!match.player1 || match.player1 === 'TBD') match.player1 = winners[winnerIdx++]
                  if (!match.player2 || match.player2 === 'TBD') match.player2 = winners[winnerIdx++]
                  if (!match.player3 || match.player3 === 'TBD') match.player3 = winners[winnerIdx++]
                } else {
                  if (!match.player1 || match.player1 === 'TBD') match.player1 = winners[winnerIdx++]
                  if (!match.player2 || match.player2 === 'TBD') match.player2 = winners[winnerIdx++]
                }
              })
            }
          }
        }

        updatedTournament.rounds = rounds
      }

      const historyEntry = {
        winner: tournament.mode === 'survivor' || (activeMatch && activeMatch.isTriple)
          ? `❌ ${selectedItem.name} elendi`
          : `✓ ${selectedItem.name} kazandı`,
        spinBy: currentUser.name,
        time: new Date().toISOString(),
        round: tournament.currentRound
      }

      const newHistory = [historyEntry, ...(currentRoom.spinHistory || []).slice(0, 49)]

      try {
        await roomDB.update(currentRoom.code, { 
          tournament: updatedTournament,
          spinHistory: newHistory
        })
        setCurrentRoom(prev => ({ 
          ...prev, 
          tournament: updatedTournament,
          spinHistory: newHistory
        }))
      } catch (err) {
        console.error('Update tournament error:', err)
      }

      if (channelRef.current) {
        await roomDB.broadcast(channelRef.current, 'spin_result', {
          winner: selectedItem.name,
          spinBy: currentUser.name,
          isEliminated: tournament.mode === 'survivor' || (activeMatch && activeMatch.isTriple)
        })
      }

      setTimeout(() => setShowConfetti(false), 4000)
    }, 6000)
  }

  // Normal çark çevir
  const spinWheel = async () => {
    if (spinning || currentRoom.items.length < 2) return

    if (currentRoom.tournament && !currentRoom.tournament.champion) {
      return spinTournamentWheel()
    }

    setSpinning(true)
    setWinner(null)

    const baseRotation = rotation
    const spins = 6 + Math.random() * 5
    const extraDegrees = Math.random() * 360
    const totalRotation = baseRotation + spins * 360 + extraDegrees

    const finalAngle = totalRotation % 360
    const sliceAngle = 360 / currentRoom.items.length
    const winnerIndex = Math.floor((360 - finalAngle + sliceAngle / 2) % 360 / sliceAngle)
    const winnerItem = currentRoom.items[winnerIndex % currentRoom.items.length]

    setRotation(totalRotation)

    if (channelRef.current) {
      await roomDB.broadcast(channelRef.current, 'spin_start', {
        rotation: totalRotation,
        spinBy: currentUser.name,
        winner: winnerItem.name
      })
    }

    spinTimeoutRef.current = setTimeout(async () => {
      setWinner(winnerItem)
      setShowConfetti(true)
      setSpinning(false)

      const historyEntry = {
        winner: winnerItem.name,
        spinBy: currentUser.name,
        time: new Date().toISOString()
      }

      const newHistory = [historyEntry, ...(currentRoom.spinHistory || []).slice(0, 49)]
      
      try {
        await roomDB.update(currentRoom.code, { spinHistory: newHistory })
        setCurrentRoom(prev => ({ ...prev, spinHistory: newHistory }))
      } catch (err) {
        console.error('Update history error:', err)
      }

      if (channelRef.current) {
        await roomDB.broadcast(channelRef.current, 'spin_result', {
          winner: winnerItem.name,
          spinBy: currentUser.name
        })
      }

      setTimeout(() => setShowConfetti(false), 4000)
    }, 6000)
  }

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

  const getUserRole = (name) => {
    if (!currentRoom) return 'participant'
    if (currentRoom.admin === name) return 'admin'
    if (currentRoom.moderators?.includes(name)) return 'moderator'
    return 'participant'
  }

  const canManage = currentUser && ['admin', 'moderator'].includes(currentUser.role)

  // Turnuva için çark öğelerini hesapla
  const getWheelItems = () => {
    if (currentRoom?.tournament && !currentRoom.tournament.champion) {
      const t = currentRoom.tournament
      if (t.mode === 'survivor') {
        return t.participants
          .filter(p => !t.eliminated.includes(p))
          .map((name, i) => ({ id: i, name }))
      } else if (t.mode === 'bracket') {
        const currentRoundData = t.rounds[t.currentRound - 1]
        const activeMatch = currentRoundData?.matches.find(m => !m.winner)
        if (activeMatch) {
          if (activeMatch.isTriple) {
            return [
              { id: 1, name: activeMatch.player1 },
              { id: 2, name: activeMatch.player2 },
              { id: 3, name: activeMatch.player3 }
            ]
          } else {
            return [
              { id: 1, name: activeMatch.player1 },
              { id: 2, name: activeMatch.player2 }
            ]
          }
        }
      }
    }
    return currentRoom?.items || []
  }

  const wheelItems = getWheelItems()

  // Aktif maç bilgisi
  const getActiveMatchInfo = () => {
    if (!currentRoom?.tournament || currentRoom.tournament.champion) return null
    const t = currentRoom.tournament
    if (t.mode !== 'bracket') return null
    
    const currentRoundData = t.rounds[t.currentRound - 1]
    const activeMatch = currentRoundData?.matches.find(m => !m.winner)
    return activeMatch
  }

  const activeMatch = getActiveMatchInfo()

  return (
    <main className="min-h-screen p-4 overflow-x-hidden">
      <Confetti active={showConfetti} />

      {/* Tournament Modal */}
      {showTournamentModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              🏆 Turnuva Başlat
            </h2>

            <div className="space-y-4">
              <button
                onClick={() => startTournament('survivor')}
                className="w-full p-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
              >
                <div className="text-xl mb-1">🎯 Son Kalan Kazanır</div>
                <div className="text-sm opacity-80">Çıkan elenir, son kalan şampiyon!</div>
              </button>

              <button
                onClick={() => startTournament('bracket')}
                className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
              >
                <div className="text-xl mb-1">🏅 Bracket Turnuvası</div>
                <div className="text-sm opacity-80">2'li ve 3'lü maçlar, kazanan/kalanlar ilerler!</div>
              </button>

              <button
                onClick={() => setShowTournamentModal(false)}
                className="w-full p-3 bg-white/10 rounded-xl text-white/70 hover:bg-white/20 transition-colors"
              >
                İptal
              </button>
            </div>

            <p className="text-white/50 text-sm text-center mt-4">
              {currentRoom?.items.length} katılımcı • Tek sayıda 3'lü maç yapılır
            </p>
          </div>
        </div>
      )}

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
              Adil Turnuva Sistemi! 🏆
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
            <p>⚡ Gerçek zamanlı senkronizasyon</p>
            <p>🏆 Adil 3'lü maç sistemi</p>
            <p>👥 Sınırsız katılımcı</p>
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
                <label className="block text-white/80 mb-2 font-medium">Kullanıcı Adın</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Adını gir..."
                  className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 focus:border-yellow-400 focus:outline-none text-lg text-white placeholder-white/40"
                  maxLength={20}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                onClick={createRoom}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
              >
                {loading ? '⏳ Oluşturuluyor...' : 'Çark Oluştur 🚀'}
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
                <label className="block text-white/80 mb-2 font-medium">Kullanıcı Adın</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Adını gir..."
                  className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 focus:border-yellow-400 focus:outline-none text-lg text-white placeholder-white/40"
                  maxLength={20}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 font-medium">Oda Kodu</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  className="w-full px-5 py-4 rounded-xl bg-white/10 border-2 border-white/20 focus:border-yellow-400 focus:outline-none text-2xl text-center tracking-[0.3em] font-mono text-white placeholder-white/40"
                  maxLength={6}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                onClick={joinRoom}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
              >
                {loading ? '⏳ Katılınıyor...' : 'Katıl 🎉'}
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
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  {currentRoom.name}
                  {currentRoom.tournament && !currentRoom.tournament.champion && (
                    <span className="bg-yellow-500/30 text-yellow-300 text-xs px-2 py-1 rounded-full">
                      🏆 Turnuva
                    </span>
                  )}
                </h2>
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
                {currentUser.role === 'admin' && currentRoom.items.length > 0 && !currentRoom.tournament && (
                  <button
                    onClick={clearAllItems}
                    className="text-xs text-red-300 hover:text-red-200 hover:bg-red-500/20 px-2 py-1 rounded transition-colors"
                  >
                    Temizle
                  </button>
                )}
              </h3>

              {canManage && !currentRoom.tournament && (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem()}
                    placeholder="Yeni öğe ekle..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-yellow-400 focus:outline-none text-white placeholder-white/40"
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

              {/* Tournament buttons */}
              {currentUser.role === 'admin' && currentRoom.items.length >= 2 && (
                <div className="mb-4">
                  {!currentRoom.tournament ? (
                    <button
                      onClick={() => setShowTournamentModal(true)}
                      className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      🏆 Turnuva Başlat
                    </button>
                  ) : !currentRoom.tournament.champion ? (
                    <button
                      onClick={cancelTournament}
                      className="w-full py-3 bg-red-500/20 text-red-300 rounded-xl font-medium hover:bg-red-500/30 transition-colors"
                    >
                      ❌ Turnuvayı İptal Et
                    </button>
                  ) : (
                    <button
                      onClick={cancelTournament}
                      className="w-full py-3 bg-green-500/20 text-green-300 rounded-xl font-medium hover:bg-green-500/30 transition-colors"
                    >
                      🔄 Yeni Turnuva Başlat
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {currentRoom.items.length === 0 ? (
                  <div className="text-white/40 text-center py-8">
                    <div className="text-4xl mb-2">📝</div>
                    <p>Henüz öğe eklenmemiş</p>
                  </div>
                ) : (
                  currentRoom.items.map((item, index) => {
                    const isEliminated = currentRoom.tournament?.eliminated?.includes(item.name)
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors group ${
                          isEliminated 
                            ? 'bg-red-500/10 border-red-500/20 opacity-50' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full shadow-lg flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className={`flex-1 font-medium truncate ${isEliminated ? 'line-through text-white/50' : 'text-white'}`}>
                          {item.name}
                        </span>
                        {isEliminated && <span className="text-red-400 text-xs">Elendi</span>}
                        {canManage && !currentRoom.tournament && (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Center - Wheel */}
            <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[520px]">
              {wheelItems.length < 2 ? (
                <div className="text-center text-white/60 p-8">
                  <div className="text-8xl mb-6 opacity-50">
                    {currentRoom.tournament?.champion ? '👑' : '🎡'}
                  </div>
                  {currentRoom.tournament?.champion ? (
                    <>
                      <p className="text-yellow-400 font-bold text-2xl mb-2">ŞAMPİYON!</p>
                      <p className="text-white font-bold text-4xl">{currentRoom.tournament.champion}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl">Çarkı çevirmek için</p>
                      <p className="text-xl">en az <span className="text-yellow-400 font-bold">2 öğe</span> ekleyin</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {currentRoom.tournament && !currentRoom.tournament.champion && (
                    <div className="mb-4 text-center">
                      <span className="bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-full font-bold">
                        {currentRoom.tournament.mode === 'survivor' 
                          ? `🎯 Tur ${currentRoom.tournament.currentRound} - Çıkan Elenir!`
                          : activeMatch?.isTriple
                            ? `🎯 Tur ${currentRoom.tournament.currentRound} - 3'lü Maç (Çıkan Elenir!)`
                            : `🏅 Tur ${currentRoom.tournament.currentRound} - Kazanan Geçer!`
                        }
                      </span>
                    </div>
                  )}

                  <Wheel
                    items={wheelItems}
                    spinning={spinning}
                    rotation={rotation}
                  />

                  <button
                    onClick={spinWheel}
                    disabled={spinning || wheelItems.length < 2}
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
                    <div className={`mt-6 p-5 rounded-2xl text-center shadow-2xl winner-announcement ${
                      winner.isEliminated
                        ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500 shadow-red-500/30'
                        : 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 shadow-orange-500/30'
                    }`}>
                      <p className="text-white font-black text-2xl">
                        {winner.isEliminated ? '❌ Elenen ❌' : '🎉 Kazanan 🎉'}
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
              {/* Tournament Bracket */}
              {currentRoom.tournament && (
                <TournamentBracket tournament={currentRoom.tournament} currentUser={currentUser} />
              )}

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
                <h3 className="font-bold text-white mb-4">📜 Geçmiş</h3>

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
                        className={`p-3 rounded-xl border ${
                          i === 0
                            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <p className={`font-bold ${i === 0 ? 'text-yellow-300' : 'text-white'}`}>
                          {entry.winner}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          {entry.spinBy} {entry.round ? `• Tur ${entry.round}` : ''} • {new Date(entry.time).toLocaleTimeString('tr-TR')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
