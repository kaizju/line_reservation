// Reservation data layer, backed by Supabase.
// Every function here calls a SECURITY DEFINER Postgres function (see
// supabase/schema.sql) rather than touching the `reservations` table
// directly — the table itself has RLS on with zero policies, so this is
// the only path in or out.

import { supabase } from '../lib/supabaseClient.js'

export async function createReservation(data) {
  const { data: row, error } = await supabase.rpc('create_reservation', {
    p_full_name: data.fullName,
    p_contact_number: data.contactNumber,
    p_email: data.email || null,
    p_id_type: data.idType,
    p_purpose: data.purpose,
    p_preferred_date: data.preferredDate,
    p_preferred_time: data.preferredTime,
  })
  if (error) throw error
  return toClientShape(row)
}

export async function getReservation(id) {
  const { data: row, error } = await supabase.rpc('get_reservation', { p_id: id })
  if (error) throw error
  return row ? toClientShape(row) : null
}

export async function listReservations() {
  const { data: rows, error } = await supabase.rpc('list_today_reservations')
  if (error) throw error
  return (rows || []).map(toClientShape)
}

export async function checkInPass(id, token) {
  // check_in_reservation is a TABLE-returning function, so supabase-js
  // gives back an array (empty if the id/token pair didn't match).
  const { data: rows, error } = await supabase.rpc('check_in_reservation', {
    p_id: id,
    p_token: token,
  })
  if (error) throw error
  const row = rows && rows[0]
  if (!row) return null
  return { ...toClientShape(row), alreadyCheckedIn: row.already_checked_in }
}

export async function markDone(id) {
  const { data: row, error } = await supabase.rpc('mark_reservation_done', { p_id: id })
  if (error) throw error
  return row ? toClientShape(row) : null
}

// The RPC functions return Postgres's snake_case column names; the rest of
// the app was written against camelCase, so this is the one place that maps
// between them.
function toClientShape(row) {
  if (!row) return null
  return {
    id: row.id,
    token: row.token,
    fullName: row.full_name,
    contactNumber: row.contact_number,
    email: row.email,
    idType: row.id_type,
    purpose: row.purpose,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    status: row.status,
    createdAt: row.created_at,
    scannedAt: row.scanned_at,
  }
}
