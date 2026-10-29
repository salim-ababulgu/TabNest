import { supabase } from '@/lib/supabase'

export type Group = { id: string; name: string; created_at: string }

export type Page = {
  id: string
  url: string
  title: string | null
  group_id: string | null
  is_interesting: boolean
  visit_count: number
  last_visited_at: string | null
  kind: string
  expires_at: string | null
  created_at: string
}

export async function fetchGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('id,name,created_at')
    .order('name')

  if (error) throw error
  return (data ?? []) as Group[]
}

export async function createGroup(name: string, userId: string): Promise<Group> {
  const { data, error } = await supabase
    .from('groups')
    .insert({ name, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data as Group
}

export async function fetchPages(): Promise<Page[]> {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Page[]
}

export async function createPage(input: {
  url: string
  title: string
  groupId: string | null
  userId: string
}): Promise<Page> {
  const { data, error } = await supabase
    .from('pages')
    .insert({
      url: input.url,
      title: input.title || null,
      group_id: input.groupId,
      user_id: input.userId,
    })
    .select()
    .single()

  if (error) throw error
  return data as Page
}

export async function toggleInteresting(id: string, value: boolean): Promise<void> {
  const { error } = await supabase.from('pages').update({ is_interesting: value }).eq('id', id)
  if (error) throw error
}
