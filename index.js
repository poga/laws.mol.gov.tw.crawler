const puppeteer = require('puppeteer')
const levelup = require('levelup')
const leveldown = require('leveldown')
const GitHub = require('github-api')
const fs = require('fs')
const path = require('path')

async function main (db) {
  let gh = new GitHub({ token: process.env.TOKEN })
  let me = gh.getUser()
  let issues = gh.getIssues('g0v', 'tw-shift-schedule')

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://laws.mol.gov.tw/FINT/index-1.aspx')
  let year = new Date().getFullYear() - 1911
  let month = new Date().getMonth() + 1
  let day = new Date().getDate()
  let previousDay = (day - 1 > 0) ? day - 1 : day
  console.log(year, month, day)
  await page.type('#cph_content_txtY1', `${year}`)
  await page.type('#cph_content_txtM1', `${month}`)
  await page.type('#cph_content_txtD1', `${previousDay}`)

  await page.type('#cph_content_txtY2', `${year}`)
  await page.type('#cph_content_txtM2', `${month}`)
  await page.type('#cph_content_txtD2', `${day}`)

  await page.evaluate(() => {
    document.querySelector('#cph_content_btnSend').click()
  })

  await page.waitForNavigation({ waitUntil: 'load' })

  let list = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[id^='cph_content_rptE_hlkTitle']")).map(e => {
      return { id: e.id, text: e.text, href: e.href }
    })
  })
  console.log(list)

  for (var i = 0; i < list.length; i++) {
    var l = list[i]
    try {
      await db.get(l.text)
    } catch (e) {
      console.log('processing', l)
      await db.put(l.text, true)

      await page.evaluate((l) => {
        document.querySelector(`#${l.id}`).click()
      }, l)
      await page.waitForNavigation({ waitUntil: 'load' })

      let content = await page.evaluate(() => {
        return document.querySelectorAll('pre')[1].textContent
      })

      let rel = await page.evaluate(() => {
        return document.querySelectorAll("a[rel='TIL']")[0].textContent
      })

      await page.evaluate(() => {
        window.history.back()
      })
      await page.waitForNavigation({ waitUntil: 'load' })

      console.log(l)
      if (rel.match(/勞動基準法.*(30|30-1|31|32|33|34|35|36)/)) {
        console.log(content)
        console.log('related', rel)

        await issues.createIssue({
          title: l.text,
          body: [content, `相關法條： ${rel}`, l.href].join('\n\n')
        })
      }

      await sleep(1000)
    }
  }

  await browser.close()

  fs.writeFileSync(path.join(__dirname, 'status.json'), JSON.stringify({ lastUpdateTime: `${new Date()}` }))
}

let db = levelup(leveldown('./crawler'))
main(db)

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
