import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',timeout:120000,use:{baseURL:'http://127.0.0.1:5174',channel:'chrome',headless:true,launchOptions:{args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']},permissions:['camera']},webServer:{command:'npm run dev -- --port 5174',url:'http://127.0.0.1:5174',reuseExistingServer:true}});
