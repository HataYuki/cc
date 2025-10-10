import "../styles/destyle.css";
import "../styles/tailwind.css";
import "../styles/style.scss";
import App from '../app'
import { domReady } from './__utils'
import { UAParser } from 'ua-parser-js';

const parser = new UAParser()
const app = new App(parser)

domReady(async () => {
    await app.__setup()
})
