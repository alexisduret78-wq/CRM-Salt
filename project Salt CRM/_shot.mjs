import { chromium } from 'playwright'
import { readFileSync } from 'fs'
const P='/tmp/claude-0/-home-user-CRM-Salt/c53d90d3-c893-553a-a5aa-87e909d1ff50/scratchpad/'
const master = JSON.parse(readFileSync(P+'decouvertes_MASTER_import.json','utf8'))
const ents = master.entreprises.map((e) => ({...e, adresse:null, pamela_valide:false, indisponible:false, date_dernier_contact:null, date_prochaine_relance:null, priorite:null }))
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport:{ width:1440, height:820 } })
await page.route('**/*', (route) => {
  const url = route.request().url()
  if (url.includes('supabase.co')) {
    if (url.includes('/rest/v1/entreprises')) return route.fulfill({ status:200, headers:{'content-type':'application/json'}, body: JSON.stringify(ents) })
    if (url.includes('/rest/v1/contacts')) return route.fulfill({ status:200, headers:{'content-type':'application/json'}, body: JSON.stringify(master.contacts) })
    if (url.includes('/auth/v1/user')) return route.fulfill({ status:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ id:'u1', email:'a@salt.ch', aud:'authenticated', role:'authenticated', app_metadata:{}, user_metadata:{} }) })
    return route.fulfill({ status:200, headers:{'content-type':'application/json'}, body:'[]' })
  }
  return route.continue()
})
await page.addInitScript(() => {
  const s = { access_token:'x', refresh_token:'r', token_type:'bearer', expires_in:3600, expires_at: Math.floor(Date.now()/1000)+3600, user:{ id:'u1', email:'a@salt.ch', app_metadata:{provider:'email'}, user_metadata:{}, aud:'authenticated', role:'authenticated' } }
  localStorage.setItem('sb-qrfzwuhmseoclpnnltfv-auth-token', JSON.stringify(s))
})
await page.goto('http://localhost:5190/', { waitUntil:'domcontentloaded' })
await page.waitForTimeout(3500)
await page.screenshot({ path:P+'premium_list.png' })
await page.click('table tbody tr:first-child')
await page.waitForTimeout(700)
await page.screenshot({ path:P+'premium_detail.png' })
await browser.close()
