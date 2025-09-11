<template>
    <section class="preferences-panel">
        <h3>Preferences</h3>
        <label>
            <input type="checkbox" v-model="stickyEnabled" />
            Sticky Current Cue
        </label>
        <label>
            <input type="checkbox" v-model="controlsEnabled" />
            Enable Timeline Controls
        </label>
    </section>


    <section class="current-cue" :class="{ sticky: stickyEnabled }">
        <h2>Current Cue</h2>
        <div v-if="currentGroup">
            <p class="cue-name"><strong>Current:</strong> {{ currentGroup.note || currentGroup.sectionText || '-'}}</p>
            <p><strong>Next:</strong> {{ nextGroup?.note || nextGroup?.sectionText || '—' }}</p>
            <p class="elapsed"><strong>Elapsed:</strong> {{ formatTime(elapsedTime) }}</p>
            <p class="remaining" :class="remainingClass"><strong>Remaining:</strong> {{ formatTime(remainingTime) }}</p>
        </div>
        <div v-else>
            <p>No current cue</p>
        </div>
    </section>
    <section>
        <h2>Timeline Controller</h2>
        <h2>{{ projectName }}</h2>

        <div class="inputs">
            <div>
                <label for="Search">Search:</label>
                <input id="Search" type="text" v-model="search" />
            </div>
        </div>
    </section>

    <section>
        <h2 class="transport">Transports</h2>

        <div class="flexbar">
            <div class="transports">
                <button
                    v-for="t in transports"
                    :key="t.uid"
                    :class="t.enabled ? 'enabled' : 'disabled'"
                    @click="toggleTransport(t.uid)"
                >
                    {{ t.name }}
                </button>
            </div>

            <button class="filterToggle" @click="filtersOpen = !filtersOpen">
                <img src="../assets/filter.svg" alt="Filter Annotations" />
            </button>
        </div>

        <h3 class="filters" :class="{ hidden: !filtersOpen }">Filters:</h3>
        <div class="filters" :class="{ hidden: !filtersOpen }">
            <button
                v-for="f in filterDefs"
                :key="f.key"
                class="filter"
                :class="filters[f.key] ? 'enabled' : 'disabled'"
                @click="toggleFilter(f.key)"
            >
                {{ f.label }}
            </button>
        </div>

        <h2 class="transport">Sections</h2>
        <div class="tag">Current playing highlight only works with currently viewed transport in Disguise</div>
    </section>

    <section class="buttons">
        <div class="cues">
                <div
                    v-for="group in filteredAndSearched"
                    :key="groupKey(group)"
                    class="timeBtn"
                    :class="{ current: isCurrent(group) }"
                    :ref="(el) => setGroupRef(el, group)"
                    @click="controlsEnabled ? gotoTime(group) : null"
                    :aria-current="isCurrent(group) ? 'true' : 'false'"
                >
                <div class="cont">
                    <div class="top">
                        <h3 class="note">{{ group.note }}</h3>
                        <h4 class="tag">{{ group.tagText }}</h4>
                        <div class="transportName">{{ group.transportName }}</div>
                    </div>
                    <div class="bottom">
                        <h4 class="section">{{ group.sectionText }}</h4>
                        <p class="time">{{ formatTime(group.time) }}</p>
                    </div>
            </div>
            <div class="tagColor" :class="group.tagType"></div>
            </div>
        </div>

        <div class="transControl" v-if="controlsEnabled">
            <select id="transportsDropdown" v-model="selectedUid">
                <option v-for="t in transports" :key="t.uid" :value="t.uid">{{ t.name }}</option>
                <option value="allTransports">all</option>
            </select>
            
            <div class="controls">
                <div class="transButton" id="play" @click="play">
                    <img src="../assets/play.svg" alt="Play Through Sections" />
                </div>
                <div class="transButton" id="playEOS" @click="playSection">
                    <img src="../assets/play_eos.svg" alt="Play to End of Section" />
                </div>
                <div class="transButton" id="playLoop" @click="playLoopSection">
                    <img src="../assets/play_loop.svg" alt="Loop Section" />
                </div>
                <div class="transButton" id="stop" @click="stop">
                    <img src="../assets/stop.svg" alt="Stop Playing" />
                </div>
                <div class="transButton" id="prev" @click="prev">
                    <img src="../assets/prev.svg" alt="Previous Section" />
                </div>
                <div class="transButton" id="next" @click="next">
                    <img src="../assets/next.svg" alt="Next Section" />
                </div>
                <div class="transButton" id="return" @click="returnToStart">
                    <img src="../assets/return.svg" alt="Return to start of track" />
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useLiveUpdateStore } from '../stores/liveUpdateStore'

// ---- state
const store = useLiveUpdateStore()
const { currentPlayhead, ipAddress } = storeToRefs(store)
const projectName = ref('')
const transports = ref([]) // [{uid, name, enabled, track:{uid,name}}]
const dataByTime = ref([]) // [{ time, items, transportUid, transportName, ...decorations }]
const search = ref('')
const filtersOpen = ref(false)
const selectedUid = ref(null)
const filters = ref({ section: true, note: true, cue: true, tc: true, midi: true })
const groupRefs = new Map()
const groupKey = (g) => `${g.transportUid}::${g.time}`
const stickyEnabled = ref(
    JSON.parse(localStorage.getItem('stickyCurrentCue') ?? 'true')
)
const controlsEnabled = ref(
    JSON.parse(localStorage.getItem('timelineControlsEnabled') ?? 'true')
)



const filterDefs = [
  { key: 'section', label: 'Sections' },
  { key: 'note', label: 'Notes' },
  { key: 'cue', label: 'Cues' },
  { key: 'tc', label: 'TC' },
  { key: 'midi', label: 'MIDI' },
]

// ---- configuration
const envUrl = import.meta.env.VITE_DISGUISE_BASE_URL || ''
const baseUrl = ref(envUrl) // if empty, we build from store IP below

// ---- networking helpers
async function getJSON(path, opts) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const url = path.startsWith('http') ? path : `${baseUrl.value}${path}`
    const res = await fetch(url, { signal: controller.signal, ...opts })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return await res.json()
  } finally {
    clearTimeout(timeout)
  }
}

function postJSON(path, body) {
  return getJSON(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---- loading
async function load() {
  // establish baseUrl if not provided via env
    if (!baseUrl.value) {
        const ip = (store.ipAddress?.value || '172.16.16.138').split(':')[0]
        baseUrl.value = `http://${ip}`
    }

    const status = await getJSON('/api/session/status/project')
    const path = status?.result?.projectPath ?? ''
    projectName.value = path.split(/[/\\]/)[0] || ''


    const active = await getJSON('/api/session/transport/activetransport')
    transports.value = (active?.result ?? []).map((r) => ({
        uid: r.uid,
        name: r.name,
        enabled: true,
        track: {
            uid: r.currentTrack?.uid ?? 'unknown',
            name: r.currentTrack?.name ?? 'unnamed Track',
        },
    }))

  // fetch annotations per transport
  const groups = []
  for (const t of transports.value) {
    const ann = await getJSON(`/api/session/transport/annotations?uid=${t.track.uid}`)
    groups.push(...normalizeAnnotations(ann, t))
  }
  dataByTime.value = groups.sort((a, b) => a.time - b.time)

  selectedUid.value = transports.value[0]?.uid ?? 'allTransports'

  // restore filters
  try {
    const saved = localStorage.getItem('timelineFilters')
    if (saved) filters.value = { ...filters.value, ...JSON.parse(saved) }
  } catch {}
}

/* console.log(
  '🧩 first groups:',
  dataByTime.value.slice(0, 6).map(g => ({ uid: g.transportUid, time: g.time }))
)
 */

function norm(t) {
  // keep 3 decimals; adjust as needed
  return Math.round((Number(t) || 0) * 1000) / 1000
}

function normalizeAnnotations(ann, t) {
  const buckets = new Map() // key: time -> array
  const src = ann?.result?.annotations ?? {}

  for (const [kind, items] of Object.entries(src)) {
    for (const item of items) {
      const time = Number(item.time)
      const k = String(time)
      const arr = buckets.get(k) ?? [{ transportUid: t.uid, transportName: t.name }]
      const copy = { ...item, annotationType: kind }
      delete copy.time
      arr.push(copy)
      buckets.set(k, arr)
    }
  }

  return Array.from(buckets.entries()).map(([k, arr]) => {
    let note = '', tagType = 'none', tagText = '', sectionText = ''
    for (const it of arr) {
        if (it.annotationType === 'notes') note = it.text ?? ''
        if (it.annotationType === 'tags') { tagType = it.type ?? 'none'; tagText = `${it.type ?? ''} ${it.value ?? ''}`.trim() }
        if (it.annotationType === 'sections') sectionText = `Section ${it.index ?? ''}`.trim()
    }
    return {
        rawTime: Number(k),
        time: norm(Number(k)),
        transportUid: arr[0].transportUid,
        transportName: arr[0].transportName,
        tagType,
        note,
        tagText,
        sectionText,
        items: arr,
    }
  })
}

// ---- computed: filter + search
const filteredAndSearched = computed(() => {
  const active = new Set(transports.value.filter((t) => t.enabled).map((t) => t.uid))
  const term = (search.value || '').toLowerCase().trim()

  function passes(g) {
    const hasFlag = g.items.some(
      (el) =>
        (el.type === 'CUE' && filters.value.cue) ||
        (el.type === 'TC' && filters.value.tc) ||
        (el.type === 'MIDI' && filters.value.midi) ||
        (el.annotationType === 'notes' && filters.value.note) ||
        (el.annotationType === 'sections' && filters.value.section)
    )
    if (!hasFlag) return false
    if (!active.has(g.transportUid)) return false
    if (!term) return true

    if (String(Math.trunc(g.time)).includes(term)) return true
    return g.items.some((el) => Object.values(el).some((v) => String(v ?? '').toLowerCase().includes(term)))
  }

  return dataByTime.value.filter(passes)
})

// called from the template’s :ref
function setGroupRef(el, g) {
  const k = groupKey(g)
  if (el) groupRefs.set(k, el)
  else groupRefs.delete(k)
}

// pick the latest “current” group (highest time) each time anything changes
const latestCurrent = computed(() => {
  let latest = null
  for (const g of filteredAndSearched.value) {
    if (isCurrent(g)) {
      if (!latest || g.time > latest.time) latest = g
    }
  }
  return latest
})

watch(
  latestCurrent,
  async (g) => {
    if (!g) return
    await nextTick() // ensure DOM is updated
    const el = groupRefs.get(groupKey(g))
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  },
  { immediate: true }
)


// times per transport (sorted), used to find the next boundary fast and safely
const sectionsByTransport = computed(() => {
  const map = new Map()
  for (const g of dataByTime.value) {
    const uid = g.transportUid
    const t = norm(g.time)
    const arr = map.get(uid) ?? []
    if (arr.length === 0 || arr[arr.length - 1] !== t) {
      arr.push(t)
      map.set(uid, arr)
    }
  }
  return map
})

function upperBound(arr, target) {
  let lo = 0, hi = arr.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] <= target) lo = mid + 1
    else hi = mid
  }
  return lo
}

const currentKeys = computed(() => {
  const keys = new Set()
  const t = norm(currentPlayhead.value)
  for (const [uid, times] of sectionsByTransport.value.entries()) {
    if (!times.length) continue
    const idx = upperBound(times, t) - 1 // last start <= t
    if (idx >= 0) {
      const start = times[idx]
      keys.add(`${uid}-${start}`)
    }
  }

  // DEBUG: see what section it thinks is active per transport
  // console.log('currentKeys', Array.from(keys), 't=', t, sectionsByTransport.value)

  return keys
})



// ---- UI handlers
function toggleTransport(uid) {
  const t = transports.value.find((x) => x.uid === uid)
  if (t) t.enabled = !t.enabled
}

function toggleFilter(key) {
  filters.value[key] = !filters.value[key]
}

function selectedList() {
  if (selectedUid.value === 'allTransports') return transports.value.map((t) => ({ uid: t.uid, name: t.name }))
  const t = transports.value.find((x) => x.uid === selectedUid.value)
  return t ? [{ uid: t.uid, name: t.name }] : []
}

function gotoTime(g) {
  postJSON('/api/session/transport/gototime', {
    transports: [
      {
        transport: { uid: g.transportUid, name: g.transportName },
        time: g.rawTime,
        playmode: 'NotSet',
      },
    ],
  })
}

function play() { postJSON('/api/session/transport/play', { transports: selectedList() }) }
function playSection() { postJSON('/api/session/transport/playsection', { transports: selectedList() }) }
function playLoopSection() { postJSON('/api/session/transport/playloopsection', { transports: selectedList() }) }
function stop() { postJSON('/api/session/transport/stop', { transports: selectedList() }) }
function prev() {
  postJSON('/api/session/transport/gotoprevsection', {
    transports: selectedList().map((t) => ({ transport: t, playmode: 'NotSet' })),
  })
}
function next() {
  postJSON('/api/session/transport/gotonextsection', {
    transports: selectedList().map((t) => ({ transport: t, playmode: 'NotSet' })),
  })
}
function returnToStart() { postJSON('/api/session/transport/returntostart', { transports: selectedList() }) }

// time formatting
function formatTime(seconds) {
    const total = Math.round(Number(seconds) || 0)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`
}

function isCurrent(group) {
  const times = sectionsByTransport.value.get(group.transportUid)
  if (!times || times.length === 0) return false

  const i = upperBound(times, group.time) // index of the first time > start
  const start = group.time
  const end = i < times.length ? times[i] : Infinity

  const t = Number(currentPlayhead.value) || 0
  const EPS = 1e-6
  return t + EPS >= start && t < end - EPS
}

// find the group that is current
const currentGroup = computed(() => {
  return filteredAndSearched.value.find((g) => isCurrent(g)) || null
})

// find the next group after the current one
const nextGroup = computed(() => {
  if (!currentGroup.value) return null
  const times = sectionsByTransport.value.get(currentGroup.value.transportUid) || []
  const idx = upperBound(times, currentGroup.value.time)
  const nextTime = times[idx]
  if (nextTime == null) return null
  return dataByTime.value.find(
    (g) => g.transportUid === currentGroup.value.transportUid && g.time === nextTime
  ) || null
})

// elapsed time = playhead - current start
const elapsedTime = computed(() => {
  if (!currentGroup.value) return 0
  return Math.max(0, currentPlayhead.value - currentGroup.value.time)
})

// remaining time = next start - playhead
const remainingTime = computed(() => {
  if (!currentGroup.value || !nextGroup.value) return 0
  return Math.max(0, nextGroup.value.time - currentPlayhead.value)
})

const remainingClass = computed(() => {
  if (remainingTime.value <= 0.1) return 'danger'
  if (remainingTime.value <= 5) return 'warning'
  return 'normal'
})


// persist filters
watch(
  filters,
  (v) => {
    try { localStorage.setItem('timelineFilters', JSON.stringify(v)) } catch {}
  },
  { deep: true }
)

onMounted(() => {
  load().catch((e) => {
    // basic user-facing error; replace with a toast in real app
    console.error('Failed to load timeline:', e)
    alert('Could not connect to Disguise server. Please check the IP and try again.')
  })
})

watch(stickyEnabled, (val) => {
  try {
    localStorage.setItem('stickyCurrentCue', JSON.stringify(val))
  } catch (e) {
    console.error('Failed to save stickyCurrentCue:', e)
  }
})

watch(controlsEnabled, (val) => {
  try {
    localStorage.setItem('timelineControlsEnabled', JSON.stringify(val))
  } catch (e) {
    console.error('Failed to save timelineControlsEnabled:', e)
  }
})

</script>

<style scoped>
body {
  background-color: #111;
  color: white;
  font-family: sans-serif;
  width: 900px;
  padding: 2vw;
  margin: 0 auto;
}

div.timeBtn {
  background-color: #262626;
  width: 100%;
  margin: 16px 0;
  display: flex;
  cursor: pointer;
  position: relative;
  z-index: 20;;
}
header {
  position: sticky;
  top: 0;
  background-color: #111;
  padding: 8px 0 16px 0;
}

#refresh {
  background: #0085ff;
  border: none;
  padding: 2px 8px;
  cursor: pointer;
}


div.timeBtn h3,
div.timeBtn h4,
div.timeBtn p {
  margin: 0;
}

div.top,
div.bottom {
  display: flex;
}
.cont {
  flex-grow: 59;
}
.tagColor {
  flex-grow: 1;
  background-color: #c9c9c9;
}
.tagColor.CUE {
  background-color: #0085ff;
}
.tagColor.TC {
  background-color: #f04410;
}
.tagColor.MIDI {
  background-color: #48a81b;
}
.note {
  font-weight: 100;
  text-align: right;
  width: calc(20% - 16px);
  padding: 8px;
}
.tag {
  width: calc(70% - 16px);
  padding: 8px;
  color: #c9c9c9;
  font-weight: 400;
}
.section {
  text-align: right;
  width: calc(20% - 16px);
  padding: 8px;
}
.time {
  width: calc(80% - 16px);
  padding: 8px;
  color: #c9c9c9;
  font-weight: 400;
}

.flexbar {
  display: flex;
  justify-content: space-between;
}

.filterToggle {
  width: 30px;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
}

input {
  border-radius: 7px;
  border-style: solid;
  color: #fff;
  background-color: #262626;
  border-color: #262626;
}

.inputs {
  display: flex;
  justify-content: space-between;
}

section.buttons {
  width: 100%;
  display: flex;
}

div.cues {
  width: 85%;
}

div.transControl {
  width: calc(15% - 2em);
  align-self: flex-start;
  height: auto;
  padding: 2em;
  position: sticky;
  top: 160px;
  z-index: 5;
}

div.transControl select {
  color: #fff;
  background-color: #232323;
  border: none;
  border-radius: 5px;
  padding: 4px 8px;
  width: 100%;
  cursor: pointer;
}

div.transControl .controls .transButton {
  width: 2em;
  padding: 1em;
  margin: 1em auto;
  cursor: pointer;
}

.transports,
.filters {
  display: flex;
}

.transportName {
  width: calc(10% - 16px);
  padding: 8px;
  color: #c9c9c9;
  font-weight: 400;
}

.transports button,
.filter {
  color: #fff;
  border-radius: 7px;
  border-style: solid;
  margin: 0 1em 1em 0;
  padding: 4px 8px;
  cursor: pointer;
  background: transparent;
}

.enabled {
  border-color: #0085ff;
  background-color: #0085ff;
}

.disabled {
  border-color: #262626;
  background-color: #262626;
}

@media (max-width: 900px) {
  body {
    width: calc(100% - 4vw);
  }
  section.buttons {
    width: 100%;
  }
  .note,
  .section {
    width: calc(30% - 16px);
  }
  .time,
  .tag {
    width: calc(60% - 16px);
  }
}
@media (max-width: 606px) {
  #url {
    width: 98px;
  }
  div.inputs div {
    padding: 8px 0;
  }
  .note,
  .section {
    width: calc(40% - 16px);
  }
  .time,
  .tag {
    width: calc(45% - 16px);
  }
  .transportName {
    width: calc(25% - 16px);
  }
}
@media (max-width: 500px) {
  section.buttons {
    width: 100%;
  }
  header {
    position: relative;
  }
  .inputs {
    display: block;
  }
  .note,
  .section {
    width: calc(40% - 16px);
  }
  .time,
  .tag {
    width: calc(45% - 16px);
  }
  .tagColor {
    flex-grow: 2;
  }
  section.buttons {
    width: 100%;
    display: block;
  }
  div.cues {
    width: 100%;
    padding: 0 0 20vh 0;
  }
  div.transControl {
    width: calc(100% - 2em);
    height: auto;
    padding: 1em;
    position: fixed;
    bottom: 0;
    left: 0;
    background: #111;
    top: unset;
  }
  div.transControl .controls {
    display: flex;
  }
  div.transControl .controls .transButton {
    padding: 1em;
  }
}

.hidden {
  display: none;
}

.timeBtn.current {
  outline: 2px solid #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.25);
  background-color: #1b3b6a; /* add this */
}
.timeBtn.disabledCue {
  cursor: not-allowed;
  opacity: 0.5;
}


.current-cue {
  background: #222;
  padding: 1em;
  margin-bottom: 1em;
  border-radius: 8px;
}

.current-cue.sticky {
  position: sticky;
  top: 0;
  z-index: 50;
}

.current-cue-controls {
  margin-bottom: 0.5em;
  color: #ccc;
  font-size: 0.9em;
}
.current-cue-controls input {
  margin-right: 0.5em;
}

.current-cue h2 {
  margin-top: 0;
}
.current-cue p {
  margin: 0.25em 0;
}

.current-cue .cue-name {
  font-size: 1.5em;   /* larger for current cue */
  font-weight: bold;
  color: #fff;
}

.current-cue .elapsed {
  font-size: 0.85em;  /* smaller for elapsed time */
  color: #bbb;
}

.current-cue .remaining {
  font-size: 1.4em;
  font-weight: bold;
  transition: color 0.3s ease; /* smooth color change */
}

.current-cue .remaining.normal {
  color: #4a90e2; /* default blue */
}

.current-cue .remaining.warning {
  color: #ffcc00; /* yellow at <= 5s */
}

.current-cue .remaining.danger {
  color: #ff3333; /* red at <= 0s */
}

.preferences-panel {
  background: #1a1a1a;
  padding: 1em;
  margin-bottom: 1em;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 2em;
  color: #ccc;
}

.preferences-panel h3 {
  margin: 0;
  font-size: 1.1em;
  color: #fff;
}

.preferences-panel label {
  display: flex;
  align-items: center;
  gap: 0.5em;
  cursor: pointer;
  font-size: 0.9em;
}


</style>
