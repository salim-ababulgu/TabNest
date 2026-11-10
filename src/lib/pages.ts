import { computeExpiry } from '@/lib/lifetime'
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
  favicon_url: string | null
  og_image_url: string | null
  theme_color: string | null
  reason: string | null
  pinned: boolean
  expires_at: string | null
  deleted_at: string | null
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

export async function renameGroup(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('groups').update({ name }).eq('id', id)
  if (error) throw error
}

export async function deleteGroup(id: string): Promise<void> {
  // Les pages du projet sont conservées : elles redeviennent simplement non classées.
  const detach = await supabase.from('pages').update({ group_id: null }).eq('group_id', id)
  if (detach.error) throw detach.error
  const { error } = await supabase.from('groups').delete().eq('id', id)
  if (error) throw error
}

export async function fetchPages(): Promise<Page[]> {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Page[]
}

export async function createPage(input: {
  url: string
  title: string
  groupId: string | null
  userId: string
  kind: string
}): Promise<Page> {
  const now = new Date()
  const { data, error } = await supabase
    .from('pages')
    .insert({
      url: input.url,
      title: input.title || null,
      group_id: input.groupId,
      user_id: input.userId,
      kind: input.kind,
      reason: null,
      visit_count: 0,
      last_visited_at: now.toISOString(),
      expires_at: computeExpiry(input.kind, 0, now),
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

export async function archivePage(id: string): Promise<void> {
  const { error } = await supabase
    .from('pages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function visitPage(page: Page): Promise<Page> {
  const nextVisits = page.visit_count + 1
  const now = new Date()
  const { data, error } = await supabase
    .from('pages')
    .update({
      visit_count: nextVisits,
      last_visited_at: now.toISOString(),
      expires_at: computeExpiry(page.kind, nextVisits, now, page.reason),
    })
    .eq('id', page.id)
    .select()
    .single()

  if (error) throw error
  return data as Page
}

export async function setReason(page: Page, reason: string | null): Promise<void> {
  const { error } = await supabase
    .from('pages')
    .update({
      reason,
      expires_at: computeExpiry(page.kind, page.visit_count, new Date(), reason),
    })
    .eq('id', page.id)
  if (error) throw error
}

export async function importPagesBulk(
  entries: { url: string; title: string; reason: string | null }[],
  userId: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ imported: number; skipped: number }> {
  const existing = await supabase.from('pages').select('url').is('deleted_at', null).limit(5000)
  const known = new Set((existing.data ?? []).map((row) => row.url))
  const now = new Date()

  const rows = []
  for (const entry of entries) {
    if (!/^https?:\/\//i.test(entry.url) || known.has(entry.url)) continue
    known.add(entry.url)
    rows.push({
      url: entry.url,
      title: entry.title || null,
      user_id: userId,
      kind: 'normal',
      reason: entry.reason,
      visit_count: 1,
      last_visited_at: now.toISOString(),
      expires_at: computeExpiry('normal', 0, now, entry.reason),
    })
  }

  let imported = 0
  onProgress?.(0, rows.length)
  for (let index = 0; index < rows.length; index += 50) {
    const batch = rows.slice(index, index + 50)
    const { error } = await supabase.from('pages').insert(batch)
    if (error) throw error
    imported += batch.length
    onProgress?.(imported, rows.length)
  }
  return { imported, skipped: entries.length - imported }
}

export async function restorePage(page: Page): Promise<Page> {
  const now = new Date()
  const expires_at = computeExpiry(page.kind, page.visit_count, now, page.reason)
  const { data, error } = await supabase
    .from('pages')
    .update({ expires_at })
    .eq('id', page.id)
    .select()
    .single()
  if (error) throw error
  return data as Page
}

export async function setGroupForPages(ids: string[], groupId: string | null): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('pages').update({ group_id: groupId }).in('id', ids)
  if (error) throw error
}

export async function setPinned(ids: string[], value: boolean): Promise<void> {
  if (ids.length === 0) return

  if (value) {
    // Épingler : la page est conservée sans limite (le minuteur est suspendu).
    const { error } = await supabase.from('pages').update({ pinned: true }).in('id', ids)
    if (error) throw error
    return
  }

  // Désépingler : le compte à rebours repart de maintenant, sinon la page
  // pourrait expirer immédiatement après avoir été conservée.
  const { data, error: readError } = await supabase
    .from('pages')
    .select('id, kind, reason, visit_count')
    .in('id', ids)
  if (readError) throw readError

  const now = new Date()
  for (const page of data ?? []) {
    const { error } = await supabase
      .from('pages')
      .update({
        pinned: false,
        expires_at: computeExpiry(page.kind, page.visit_count, now, page.reason),
      })
      .eq('id', page.id)
    if (error) throw error
  }
}
