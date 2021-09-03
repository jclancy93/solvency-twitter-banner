/* eslint-disable camelcase */
/* eslint-disable no-console */
const {Command, flags} = require('@oclif/command')
const fs = require('fs')
const { cli } = require('cli-ux')
const TwitterV1 = require('twitter')
const puppeteer = require('puppeteer')

const initBrowser = async solvencyNumber => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: [
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
    ],
  })
  const page = await browser.newPage()

  // Opens selected solvency
  await page.goto(`https://solvency.art/view/${solvencyNumber}`)

  // Finds view on arweave button
  const [a] = await page.$x("//a[contains(., 'View on Arweave')]")
  if (a) {
    await a.click()
  }

  return page
}

const sleep = durationMs => {
  return new Promise(resolve => setTimeout(resolve, durationMs))
}

async function uploadImage(client, page) {
  await page.screenshot({path: 'full.png', fullPage: true})
  try {
    const base64 = fs.readFileSync('full.png', {encoding: 'base64'})

    client.post(
      'account/update_profile_banner',
      {
        banner: base64,
      },
      (err, data, response) => {
        console.log('err', err)
        const json = response.toJSON()
        console.log(json.statusCode, json.headers, json.body)
        console.log('Twitter banner successfully updated 🎉')
      }
    )
  } catch (error) {
    console.error(error)
  }
}

class NftTwitterBannerCommand extends Command {
  async run() {
    const solvencyNumber = await cli.prompt(
      'Hey fren, what is your solvency number?'
    )

    const twitterConsumerKey = await cli.prompt(
      'Please provide your twitter consumer key',
      {type: 'mask'}
    )

    const twitterConsumerSecret = await cli.prompt(
      'Please provide your twitter consumer secret',
      {type: 'mask'}
    )

    const twitterAccessKey = await cli.prompt(
      'Please provide your twitter access token key',
      {type: 'mask'}
    )

    const twitterAccessSecret = await cli.prompt(
      'Please provide your twitter access token secret',
      {type: 'mask'}
    )

    const client = new TwitterV1({
      consumer_key: twitterConsumerKey,
      consumer_secret: twitterConsumerSecret,
      access_token_key: twitterAccessKey,
      access_token_secret: twitterAccessSecret,
    })

    const page = await initBrowser(solvencyNumber)
    // If you want to wait extra long for a specific render point you can uncomment this line (set to 6 mins)
    // await sleep(600000)
    setInterval(async () => {
      await uploadImage(client, page)
    }, 60000)
  }
}

NftTwitterBannerCommand.description = `Starts running a script to update your twitter banner based on Solvency piece
...
You will need a twitter developer account and your twitter api keys to run this CLI. They can be found here: https://developer.twitter.com/en/portal/dashboard
`

NftTwitterBannerCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({char: 'v'}),
  // add --help flag to show CLI version
  help: flags.help({char: 'h'}),
  name: flags.string({char: 'n', description: 'Main command'}),
}

module.exports = NftTwitterBannerCommand
