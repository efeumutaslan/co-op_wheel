import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

// Oda veritabanı işlemleri
export const roomDB = {
  // Oda oluştur
  async create(room) {
    const { data, error } = await supabase
      .from('rooms')
      .insert([{
        code: room.code,
        name: room.name,
        admin: room.admin,
        moderators: room.moderators || [],
        participants: room.participants || [],
        items: room.items || [],
        spin_history: room.spinHistory || []
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Create room error:', error)
      throw error
    }
    return data
  },

  // Oda getir
  async get(code) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Get room error:', error)
      return null
    }
    
    if (!data) return null
    
    // Format dönüşümü
    return {
      code: data.code,
      name: data.name,
      admin: data.admin,
      moderators: data.moderators || [],
      participants: data.participants || [],
      items: data.items || [],
      spinHistory: data.spin_history || [],
      createdAt: data.created_at
    }
  },

  // Oda güncelle
  async update(code, updates) {
    const dbUpdates = {
      updated_at: new Date().toISOString()
    }
    
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.admin !== undefined) dbUpdates.admin = updates.admin
    if (updates.moderators !== undefined) dbUpdates.moderators = updates.moderators
    if (updates.participants !== undefined) dbUpdates.participants = updates.participants
    if (updates.items !== undefined) dbUpdates.items = updates.items
    if (updates.spinHistory !== undefined) dbUpdates.spin_history = updates.spinHistory
    
    const { data, error } = await supabase
      .from('rooms')
      .update(dbUpdates)
      .eq('code', code)
      .select()
      .single()
    
    if (error) {
      console.error('Update room error:', error)
      throw error
    }
    
    return {
      code: data.code,
      name: data.name,
      admin: data.admin,
      moderators: data.moderators || [],
      participants: data.participants || [],
      items: data.items || [],
      spinHistory: data.spin_history || [],
      createdAt: data.created_at
    }
  },

  // Realtime subscription
  subscribeToRoom(code, callback) {
    // Database changes subscription
    const channel = supabase
      .channel(`room-${code}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `code=eq.${code}`
        },
        (payload) => {
          if (payload.new) {
            const room = {
              code: payload.new.code,
              name: payload.new.name,
              admin: payload.new.admin,
              moderators: payload.new.moderators || [],
              participants: payload.new.participants || [],
              items: payload.new.items || [],
              spinHistory: payload.new.spin_history || [],
              createdAt: payload.new.created_at
            }
            callback('room_update', room)
          }
        }
      )
      .on('broadcast', { event: 'spin_start' }, ({ payload }) => {
        callback('spin_start', payload)
      })
      .on('broadcast', { event: 'spin_result' }, ({ payload }) => {
        callback('spin_result', payload)
      })
      .subscribe()

    return channel
  },

  // Broadcast gönder
  async broadcast(channel, event, payload) {
    await channel.send({
      type: 'broadcast',
      event,
      payload
    })
  }
}
