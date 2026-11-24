// Offline regression: run with node scripts/test-club-open-status.mjs
import assert from 'node:assert/strict'
import { clubOpenStatus } from '../lib/clubs/open-status.ts'

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const schedule = () => Object.fromEntries(days.map(day => [day, { isOpen: true, open: '09:30', close: '22:45' }]))
const at = (hours, time, date = '2026-11-16') => clubOpenStatus(hours, new Date(`${date}T${time}+03:30`))
let count = 0
function check(name, test) { test(); count++; console.log(`PASS ${name}`) }

check('before opening minute', () => assert.equal(at(schedule(), '09:29:59').isOpen, false))
check('opening minute inclusive', () => assert.equal(at(schedule(), '09:30:00').isOpen, true))
check('before closing minute', () => assert.equal(at(schedule(), '22:44:59').isOpen, true))
check('closing minute exclusive', () => assert.equal(at(schedule(), '22:45:00').isOpen, false))
check('disabled weekday', () => {
  const hours = schedule(); hours.monday.isOpen = false
  assert.equal(at(hours, '12:00:00').isOpen, false)
})
check('missing schedule is unknown, not fabricated open or closed', () => {
  for (const hours of [null, undefined, {}, 'invalid']) assert.equal(at(hours, '12:00:00').isOpen, null)
})
check('invalid time is unknown', () => {
  for (const open of ['nope', '24:00', '25:00', '09:60']) {
    const hours = schedule(); hours.monday.open = open
    assert.equal(at(hours, '12:00:00').isOpen, null)
  }
})
check('midnight closing', () => {
  const hours = schedule(); hours.monday.close = '24:00'
  assert.equal(at(hours, '23:59:59').isOpen, true)
  assert.equal(at(hours, '00:00:00', '2026-11-17').isOpen, false)
})
check('overnight start and continuation on disabled next day', () => {
  const hours = schedule()
  hours.monday = { isOpen: true, open: '20:30', close: '02:15' }
  hours.tuesday.isOpen = false
  assert.equal(at(hours, '20:29:59').isOpen, false)
  assert.equal(at(hours, '20:30:00').isOpen, true)
  assert.equal(at(hours, '02:14:59', '2026-11-17').isOpen, true)
  assert.equal(at(hours, '02:15:00', '2026-11-17').isOpen, false)
  assert.equal(at(hours, '01:00:00', '2026-11-17').closeTime, '02:15')
})
check('disabled previous day cannot supply overnight hours', () => {
  const hours = schedule()
  hours.sunday = { isOpen: false, open: '20:00', close: '02:00' }
  assert.equal(at(hours, '01:00:00').isOpen, false)
})
check('equal times represent a full 24-hour shift, as in hours editor', () => {
  const hours = schedule()
  hours.monday = { isOpen: true, open: '09:30', close: '09:30' }
  hours.tuesday.isOpen = false
  assert.equal(at(hours, '23:00:00').isOpen, true)
  assert.equal(at(hours, '09:29:59', '2026-11-17').isOpen, true)
  assert.equal(at(hours, '09:30:00', '2026-11-17').isOpen, false)
})
check('UTC date maps to Tehran weekday and time', () => {
  const hours = schedule(); hours.monday.isOpen = false
  assert.equal(clubOpenStatus(hours, new Date('2026-11-16T08:30:00Z')).isOpen, false)
  assert.equal(clubOpenStatus(hours, new Date('2026-11-15T21:00:00Z')).todayKey, 'monday')
})
console.log(`${count} checks passed; no network or database writes`)
