import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { hydrateRuntimeFirebaseAppletConfig } from './app/core/firebase-config';

async function startApp(): Promise<void> {
  await hydrateRuntimeFirebaseAppletConfig().catch(() => false);
  await bootstrapApplication(App, appConfig);
}

startApp().catch((err) => console.error(err));
