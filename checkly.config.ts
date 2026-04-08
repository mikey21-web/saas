
import { defineConfig } from 'checkly';
import { EmailAlertChannel, Frequency } from 'checkly/constructs';

const emailAlert = new EmailAlertChannel('diyaa-email-alert', {
  address: 'udayakirantumma@gmail.com',
  sendFailure: true,
  sendRecovery: true,
  sendDegraded: false,
});

export default defineConfig({
  projectName: 'diyaa-ai-checkly',
  logicalId: 'diyaa-ai-checkly',
  // repoUrl: 'YOUR_GITHUB_REPO_URL', // Add if available
  checks: {
    playwrightConfigPath: './playwright.config.ts',
    locations: ['eu-west-1', 'us-east-1'],
    alertChannels: [emailAlert],
    playwrightChecks: [
      {
        name: 'Competitor exploration health',
        logicalId: 'competitor-explore',
        pwProjects: ['checkly'],
        frequency: Frequency.EVERY_10M,
      },
    ],
  },
  cli: {
    runLocation: 'eu-west-1',
    retries: 0,
  },
});
