import App from './app'
import { domReady } from './utill.js'
import { UAParser } from 'ua-parser-js';

const parser = new UAParser()
const app = new App(parser)

domReady(async () => {
    await app.__setup()
})
