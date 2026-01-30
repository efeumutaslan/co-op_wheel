import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

// Oda yönetimi için yardımcı fonksiyonlar
export const roomService = {
  // Oda oluştur
  async createRoom(roomData) {
    const { data, error } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Oda getir
  async getRoom(code) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Oda güncelle
  async updateRoom(code, updates) {
    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('code', code)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Realtime kanal oluştur
  subscribeToRoom(code, callback) {
    const channel = supabase.channel(`room:${code}`, {
      config: {
        broadcast: {
          self: true
        }
      }
    })

    channel
      .on('broadcast', { event: 'room_update' }, ({ payload }) => {
        callback('room_update', payload)
      })
      .on('broadcast', { event: 'spin_start' }, ({ payload }) => {
        callback('spin_start', payload)
      })
      .on('broadcast', { event: 'spin_result' }, ({ payload }) => {
        callback('spin_result', payload)
      })
      .on('broadcast', { event: 'user_joined' }, ({ payload }) => {
        callback('user_joined', payload)
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
